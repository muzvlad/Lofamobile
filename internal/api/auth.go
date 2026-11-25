package api

import (
	"codequest/internal/auth"
	"codequest/internal/types"
	"database/sql"
	"encoding/json"
	"log"
	"net/http"
	"regexp"
	"strings"
	"unicode/utf8"

	"golang.org/x/crypto/bcrypt"
)

func isDuplicatePhone(err error) bool {
	return strings.Contains(err.Error(), "UNIQUE constraint")
}

func Register(database *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if r.Method != "POST" {
			RespondError(w, "Метод не поддерживается", http.StatusMethodNotAllowed)
			return
		}

		var req types.RegisterRequest
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			log.Printf("[REGISTER] JSON decode error: %v", err)
			RespondError(w, "Неверные данные", http.StatusBadRequest)
			return
		}

		if req.Phone == "" || req.Password == "" || req.Gender == "" || req.Nickname == "" {
			RespondError(w, "Заполните обязательные поля", http.StatusBadRequest)
			return
		}

		if utf8.RuneCountInString(req.Password) < 6 {
			RespondError(w, "Пароль должен содержать минимум 6 символов", http.StatusBadRequest)
			return
		}

		phoneRe := regexp.MustCompile(`^\+?[0-9]{7,15}$`)
		if !phoneRe.MatchString(req.Phone) {
			RespondError(w, "Неверный формат номера телефона", http.StatusBadRequest)
			return
		}

		hash, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
		if err != nil {
			log.Printf("[REGISTER] bcrypt error: %v", err)
			RespondError(w, "Ошибка сервера", http.StatusInternalServerError)
			return
		}

		result, err := database.Exec(
			"INSERT INTO users (phone, nickname, name, password_hash, gender, performer, age, language) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
			req.Phone, req.Nickname, req.Name, string(hash), req.Gender, req.Performer, req.Age, req.Language,
		)
		if err != nil {
			log.Printf("[REGISTER] Insert error: %v", err)
			if isDuplicatePhone(err) {
				RespondError(w, "Номер телефона уже зарегистрирован", http.StatusBadRequest)
			} else {
				RespondError(w, "Ошибка сервера", http.StatusInternalServerError)
			}
			return
		}

		userID, err := result.LastInsertId()
		if err != nil {
			log.Printf("[REGISTER] Get lastID error: %v", err)
			RespondError(w, "Ошибка сервера", http.StatusInternalServerError)
			return
		}

		tokenString, err := auth.GenerateToken(int(userID), req.Phone, req.Nickname, req.Gender, req.Performer)
		if err != nil {
			log.Printf("[REGISTER] Token error: %v", err)
			RespondError(w, "Ошибка сервера", http.StatusInternalServerError)
			return
		}

		_, err = database.Exec(
			"INSERT INTO leaderboard (user_id, username, gender, total_score) VALUES (?, ?, ?, 0)",
			userID, req.Nickname, req.Gender,
		)
		if err != nil {
			log.Printf("Error inserting leaderboard entry: %v", err)
		}

		RespondJSON(w, http.StatusCreated, types.User{
			ID:        int(userID),
			Phone:     req.Phone,
			Nickname:  req.Nickname,
			Name:      req.Name,
			Gender:    req.Gender,
			Performer: req.Performer,
			Age:       req.Age,
			Token:     tokenString,
		})
	}
}

func Login(database *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if r.Method != "POST" {
			RespondError(w, "Метод не поддерживается", http.StatusMethodNotAllowed)
			return
		}

		var req types.LoginRequest
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			log.Printf("[LOGIN] JSON decode error: %v", err)
			RespondError(w, "Неверные данные", http.StatusBadRequest)
			return
		}

		var id int
		var hash, nickname, name, gender, performer string
		var age sql.NullInt64

		err := database.QueryRow(
			"SELECT id, nickname, name, password_hash, gender, COALESCE(performer, 'builder'), age FROM users WHERE phone = ?",
			req.Phone,
		).Scan(&id, &nickname, &name, &hash, &gender, &performer, &age)

		if err != nil {
			log.Printf("[LOGIN] User not found: %s, error: %v", req.Phone, err)
			RespondError(w, "Неверный номер телефона или пароль", http.StatusUnauthorized)
			return
		}

		if err := bcrypt.CompareHashAndPassword([]byte(hash), []byte(req.Password)); err != nil {
			log.Printf("[LOGIN] Password mismatch for user %d, error: %v", id, err)
			RespondError(w, "Неверный номер телефона или пароль", http.StatusUnauthorized)
			return
		}

		var agePtr *int
		if age.Valid {
			ageVal := int(age.Int64)
			agePtr = &ageVal
		}

		tokenString, err := auth.GenerateToken(id, req.Phone, nickname, gender, performer)
		if err != nil {
			log.Printf("[LOGIN] Token error: %v", err)
			RespondError(w, "Ошибка сервера", http.StatusInternalServerError)
			return
		}

		RespondJSON(w, http.StatusOK, types.User{
			ID:        id,
			Phone:     req.Phone,
			Nickname:  nickname,
			Name:      name,
			Gender:    gender,
			Performer: performer,
			Age:       agePtr,
			Token:     tokenString,
		})
	}
}

func GetMe(database *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if r.Method != "GET" {
			RespondError(w, "Метод не поддерживается", http.StatusMethodNotAllowed)
			return
		}

		userID, err := GetUserIDFromToken(r)
		if err != nil {
			RespondError(w, "Требуется авторизация", http.StatusUnauthorized)
			return
		}

		var user types.User
		var age sql.NullInt64
		err = database.QueryRow(
			"SELECT id, phone, nickname, name, gender, COALESCE(performer, 'builder'), age FROM users WHERE id = ?",
			userID,
		).Scan(&user.ID, &user.Phone, &user.Nickname, &user.Name, &user.Gender, &user.Performer, &age)

		if err != nil {
			RespondError(w, "Пользователь не найден", http.StatusNotFound)
			return
		}

		if age.Valid {
			ageVal := int(age.Int64)
			user.Age = &ageVal
		}

		RespondJSON(w, http.StatusOK, user)
	}
}

func UpdateProfile(database *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if r.Method != "POST" {
			RespondError(w, "Метод не поддерживается", http.StatusMethodNotAllowed)
			return
		}

		userID, err := GetUserIDFromToken(r)
		if err != nil {
			RespondError(w, "Требуется авторизация", http.StatusUnauthorized)
			return
		}

		var req types.UpdateProfileRequest
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			RespondError(w, "Неверные данные", http.StatusBadRequest)
			return
		}

		if req.Nickname == "" {
			RespondError(w, "Псевдоним не может быть пустым", http.StatusBadRequest)
			return
		}

		var age interface{}
		if req.Age != nil {
			age = *req.Age
		} else {
			age = nil
		}

		tx, err := database.Begin()
		if err != nil {
			log.Printf("[UPDATE_PROFILE] TX error: %v", err)
			RespondError(w, "Ошибка сохранения", http.StatusInternalServerError)
			return
		}
		defer tx.Rollback()

		_, err = tx.Exec(
			"UPDATE users SET nickname = ?, name = ?, age = ?, gender = ?, performer = ? WHERE id = ?",
			req.Nickname, req.Name, age, req.Gender, req.Performer, userID,
		)
		if err != nil {
			log.Printf("[UPDATE_PROFILE] Error: %v", err)
			RespondError(w, "Ошибка сохранения", http.StatusInternalServerError)
			return
		}

		_, err = tx.Exec(
			"UPDATE leaderboard SET username = ? WHERE user_id = ?",
			req.Nickname, userID,
		)
		if err != nil {
			log.Printf("[UPDATE_PROFILE] Leaderboard sync error: %v", err)
			RespondError(w, "Ошибка сохранения", http.StatusInternalServerError)
			return
		}

	if err := tx.Commit(); err != nil {
		log.Printf("[UPDATE_PROFILE] TX commit error: %v", err)
		RespondError(w, "Ошибка сохранения", http.StatusInternalServerError)
		return
	}

	claims, err := GetUserFromToken(r)
	if err != nil || claims == nil {
		RespondError(w, "Ошибка авторизации", http.StatusUnauthorized)
		return
	}
	phone, _ := (*claims)["phone"].(string)

	newToken, err := auth.GenerateToken(userID, phone, req.Nickname, req.Gender, req.Performer)
	if err != nil {
		log.Printf("[UPDATE_PROFILE] Token generation error: %v", err)
		RespondError(w, "Ошибка сохранения", http.StatusInternalServerError)
		return
	}

	RespondJSON(w, http.StatusOK, map[string]interface{}{"success": true, "token": newToken})
}
}
