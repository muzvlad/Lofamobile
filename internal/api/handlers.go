package api

import (
	"database/sql"
	"encoding/json"
	"log"
	"net/http"

	"github.com/golang-jwt/jwt/v5"
	"github.com/gorilla/websocket"

	"codequest/internal/achievements"
	"codequest/internal/auth"
	"codequest/internal/db"
	"codequest/internal/levels"
	"codequest/internal/scoring"
	"codequest/internal/types"
	"codequest/internal/ws"
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
			gender = GetGenderFromToken(r)
		}
		levelList := levels.GetLevelsWithGender(gender)
		RespondJSON(w, http.StatusOK, types.LevelsResponse{Levels: levelList})
	}
}

func GetLevel(database *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if r.Method != "GET" {
			RespondError(w, "Метод не поддерживается", http.StatusMethodNotAllowed)
			return
		}
		id := 0
		if lid := r.Context().Value(types.CtxLevelID); lid != nil {
			id = lid.(int)
		}

		if id == 0 {
			http.Error(w, "Уровень не найден", http.StatusNotFound)
			return
		}

		gender := r.URL.Query().Get("gender")
		if gender == "" {
			gender = GetGenderFromToken(r)
		}

		level, err := levels.GetLevelByIDWithGender(id, gender)
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
		if lid := r.Context().Value(types.CtxLevelID); lid != nil {
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
		result := scoring.CompleteLevel(database, userID, levelID, req, gender)
		stars := result.Stars
		score := 0
		if result.Success && result.Improved {
			score = stars * 100
			if db.UpdateScore(database, userID, score) {
				username := ""
				if claims, err := GetUserFromToken(r); err == nil {
					if n, ok := (*claims)["nickname"].(string); ok {
						username = n
					}
				}
				hub.BroadcastScoreUpdate(userID, username, db.GetUserScore(database, userID))
			}
		}

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

		RespondJSON(w, http.StatusOK, types.SuccessResponse{Success: true})
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

		gender := r.URL.Query().Get("gender")
		if gender == "" {
			gender = GetGenderFromToken(r)
		}
		rows, err := database.Query(
			"SELECT level_id, stars, moves FROM progress WHERE user_id = ? AND gender = ?",
			userID, gender,
		)
		if err != nil {
			log.Printf("[PROGRESS] Query error: %v", err)
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

		if err := rows.Err(); err != nil {
			RespondJSON(w, http.StatusOK, types.ProgressResponse{Progress: make([]types.ProgressEntry, 0)})
			return
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

type wsAuthMessage struct {
	Type  string `json:"type"`
	Token string `json:"token"`
}

func HandleWebSocket(hub *ws.Hub) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		log.Printf("[WS] Connection attempt from %s", r.RemoteAddr)

		conn, err := ws.Upgrader.Upgrade(w, r, nil)
		if err != nil {
			log.Printf("[WS] Upgrade error: %v", err)
			return
		}

		_, message, err := conn.ReadMessage()
		if err != nil {
			log.Printf("[WS] Auth read error: %v", err)
			conn.Close()
			return
		}

		var authMsg wsAuthMessage
		if err := json.Unmarshal(message, &authMsg); err != nil || authMsg.Type != "auth" || authMsg.Token == "" {
			log.Printf("[WS] Invalid auth message")
			conn.WriteMessage(websocket.CloseMessage, websocket.FormatCloseMessage(4001, "auth required"))
			conn.Close()
			return
		}

		claims, err := auth.ValidateToken(authMsg.Token)
		if err != nil {
			log.Printf("[WS] Invalid token: %v", err)
			conn.WriteMessage(websocket.CloseMessage, websocket.FormatCloseMessage(4001, "invalid token"))
			conn.Close()
			return
		}

		userIDFloat, ok := (*claims)["user_id"].(float64)
		if !ok {
			log.Printf("[WS] Invalid user ID in token")
			conn.Close()
			return
		}
		userID := int(userIDFloat)

		nickname, ok := (*claims)["nickname"].(string)
		if !ok {
			log.Printf("[WS] Invalid nickname in token")
			conn.Close()
			return
		}

		log.Printf("[WS] Accepting connection for user %d (%s)", userID, nickname)
		ws.ServeWsFromConn(hub, conn, userID, nickname)
	}
}
