package api

import (
	"codequest/internal/achievements"
	"codequest/internal/auth"
	"codequest/internal/db"
	"codequest/internal/types"
	"codequest/internal/ws"
	"database/sql"
	"encoding/json"
	"log"
	"net/http"

	"github.com/golang-jwt/jwt/v5"
)

func GetUserFromToken(r *http.Request) (*jwt.MapClaims, error) {
	authHeader := r.Header.Get("Authorization")
	if authHeader == "" || len(authHeader) < 7 || authHeader[:7] != "Bearer " {
		return nil, http.ErrNoCookie
	}

	return auth.ValidateToken(authHeader[7:])
}

func GetGenderFromToken(r *http.Request) string {
	claims, err := GetUserFromToken(r)
	if err != nil || claims == nil {
		return "boy"
	}
	if gender, ok := (*claims)["gender"].(string); ok && gender != "" {
		return gender
	}
	return "boy"
}

func GetLevels(database *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if r.Method != "GET" {
			RespondError(w, "Метод не поддерживается", http.StatusMethodNotAllowed)
			return
		}
		gender := r.URL.Query().Get("gender")
		if gender == "" {
			gender = "boy"
		}
		levels := db.GetLevelsWithGender(gender)
		RespondJSON(w, http.StatusOK, types.LevelsResponse{Levels: levels})
	}
}

func GetLevel(database *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if r.Method != "GET" {
			RespondError(w, "Метод не поддерживается", http.StatusMethodNotAllowed)
			return
		}
		id := 0
		if lid := r.Context().Value("level_id"); lid != nil {
			id = lid.(int)
		}

		if id == 0 {
			http.Error(w, "Уровень не найден", http.StatusNotFound)
			return
		}

		gender := r.URL.Query().Get("gender")
		if gender == "" {
			gender = "boy"
		}

		level, err := db.GetLevelByIDWithGender(id, gender)
		if err != nil {
			http.Error(w, "Уровень не найден", http.StatusNotFound)
			return
		}

		RespondJSON(w, http.StatusOK, level)
	}
}

func CompleteLevel(database *sql.DB, hub *ws.Hub) http.HandlerFunc {
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

		var levelID int
		if lid := r.Context().Value("level_id"); lid != nil {
			levelID = lid.(int)
		}

		if levelID < 1 || levelID > types.MaxLevels {
			RespondError(w, "Неверный уровень", http.StatusBadRequest)
			return
		}

		var req types.CompleteRequest
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			RespondError(w, "Неверные данные", http.StatusBadRequest)
			return
		}

		gender := GetGenderFromToken(r)
		result := db.CompleteLevel(database, userID, levelID, req.Moves, req.Code, req.HasItem, req.RequiredItems, gender)

		stars := result.Stars
		score := 0
		updated := false
		if result.Success && result.Improved {
			score = stars * 100
			updated = db.UpdateScore(database, userID, score)
		}

		totalScore := 0
		if updated {
			totalScore = db.GetUserScore(database, userID)
		}
		hub.BroadcastScoreUpdate(userID, totalScore)

		RespondJSON(w, http.StatusOK, types.CompleteResponse{
			Success: result.Success,
			Stars:   stars,
			Moves:   result.Moves,
			Score:   score,
		})
	}
}

func GetLeaderboard(database *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if r.Method != "GET" {
			RespondError(w, "Метод не поддерживается", http.StatusMethodNotAllowed)
			return
		}
		gender := r.URL.Query().Get("gender")

		entries, err := db.GetLeaderboard(database, gender)
		if err != nil {
			RespondError(w, "Не удалось получить таблицу лидеров", http.StatusInternalServerError)
			return
		}

		RespondJSON(w, http.StatusOK, types.LeaderboardResponse{Leaderboard: entries})
	}
}

func SaveAchievement(database *sql.DB) http.HandlerFunc {
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

		var req types.SaveAchievementRequest
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			RespondError(w, "Неверные данные", http.StatusBadRequest)
			return
		}

		if req.AchievementType == "level_completed" {
			levelID := req.LevelID
			progress := achievements.GetUserProgress(database, userID)

			if progress.LevelsCompleted == 1 {
				achievements.AddEarned(database, userID, "first_level")
			}

			chapter := (levelID-1)/10 + 1
			if chapter == 1 && progress.Chapters[0] >= 10 {
				achievements.AddEarned(database, userID, "chapter_1_complete")
			}
		}

		RespondJSON(w, http.StatusOK, types.SuccessResponse{Success: "true"})
	}
}

func GetAchievements(database *sql.DB) http.HandlerFunc {
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

		statusList := achievements.GetAllWithProgress(database, userID)
		RespondJSON(w, http.StatusOK, map[string]interface{}{"achievements": statusList})
	}
}

func GetProgress(database *sql.DB) http.HandlerFunc {
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

		rows, err := database.Query(
			"SELECT level_id, stars, moves FROM progress WHERE user_id = ?",
			userID,
		)
		if err != nil {
			RespondJSON(w, http.StatusOK, types.ProgressResponse{Progress: make([]types.ProgressEntry, 0)})
			return
		}
		defer rows.Close()

		progress := []types.ProgressEntry{}
		for rows.Next() {
			var p types.ProgressEntry
			if err := rows.Scan(&p.LevelID, &p.Stars, &p.Moves); err == nil {
				progress = append(progress, p)
			}
		}

		RespondJSON(w, http.StatusOK, types.ProgressResponse{Progress: progress})
	}
}

func GetUserScore(database *sql.DB) http.HandlerFunc {
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

		score := db.GetUserScore(database, userID)
		RespondJSON(w, http.StatusOK, map[string]int{"score": score})
	}
}

func HandleWebSocket(hub *ws.Hub) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		log.Printf("[WS] Connection attempt from %s, URL: %s", r.RemoteAddr, r.URL.String())

		token := r.URL.Query().Get("token")
		if token == "" {
			log.Printf("[WS] No token provided")
			http.Error(w, "Неавторизован", http.StatusUnauthorized)
			return
		}

		claims, err := auth.ValidateToken(token)
		if err != nil {
			log.Printf("[WS] Invalid token: %v", err)
			http.Error(w, "Неверный токен", http.StatusUnauthorized)
			return
		}

		userIDFloat, ok := (*claims)["user_id"].(float64)
		if !ok {
			log.Printf("[WS] Invalid user ID")
			http.Error(w, "Неверный ID пользователя", http.StatusUnauthorized)
			return
		}
		userID := int(userIDFloat)

		nickname, ok := (*claims)["nickname"].(string)
		if !ok {
			log.Printf("[WS] Invalid nickname")
			http.Error(w, "Неверный псевдоним", http.StatusUnauthorized)
			return
		}

		log.Printf("[WS] Accepting connection for user %d (%s)", userID, nickname)
		ws.ServeWs(hub, w, r, userID, nickname)
	}
}
