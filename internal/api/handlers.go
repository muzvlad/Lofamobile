package api

import (
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
	if authHeader == "" {
		log.Printf("[AUTH] No Authorization header")
		return nil, http.ErrNoCookie
	}
	
	log.Printf("[AUTH] Parsing token...")

	token, err := jwt.Parse(authHeader[7:], func(token *jwt.Token) (interface{}, error) {
		return auth.GetSecret(), nil
	})

	if err != nil || !token.Valid {
		return nil, http.ErrNoCookie
	}

	claims, ok := token.Claims.(jwt.MapClaims)
	if !ok {
		return nil, http.ErrNoCookie
	}

	return &claims, nil
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
		id := 0
		if lid := r.Context().Value("level_id"); lid != nil {
			id = lid.(int)
		}

		if id == 0 {
			http.Error(w, "Level not found", http.StatusNotFound)
			return
		}

		gender := r.URL.Query().Get("gender")
		if gender == "" {
			gender = "boy"
		}

		level, err := db.GetLevelByIDWithGender(id, gender)
		if err != nil {
			http.Error(w, "Level not found", http.StatusNotFound)
			return
		}

		RespondJSON(w, http.StatusOK, level)
	}
}

func CompleteLevel(database *sql.DB, hub *ws.Hub) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		userID, err := GetUserIDFromToken(r)
		if err != nil {
			RespondError(w, "Требуется авторизация", http.StatusUnauthorized)
			return
		}

		var levelID int
		if lid := r.Context().Value("level_id"); lid != nil {
			levelID = lid.(int)
		}

		if levelID < 1 || levelID > 20 {
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
		if result.Success {
			score = stars * 100
			db.UpdateScore(database, userID, score)
		}

		var totalScore int
		if err := database.QueryRow(
			"SELECT COALESCE(total_score, 0) FROM leaderboard WHERE user_id = ?", userID,
		).Scan(&totalScore); err != nil {
			totalScore = 0
		}
		hub.BroadcastScoreUpdate(userID, totalScore)

		RespondJSON(w, http.StatusOK, types.CompleteResponse{
			Success: result.Success,
			Stars:   stars,
			Moves:   req.Moves,
			Score:   score,
		})
	}
}

func GetLeaderboard(database *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
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

		db.AddAchievement(database, userID, req.AchievementType)
		RespondJSON(w, http.StatusOK, types.SuccessResponse{Success: "true"})
	}
}

func GetAchievements(database *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		userID, err := GetUserIDFromToken(r)
		if err != nil {
			RespondError(w, "Требуется авторизация", http.StatusUnauthorized)
			return
		}

		dbAchievements, err := db.GetAchievements(database, userID)
		if err != nil {
			RespondError(w, "Не удалось получить достижения", http.StatusInternalServerError)
			return
		}

		achievements := make([]types.Achievement, len(dbAchievements))
		for i, a := range dbAchievements {
			achievements[i] = types.Achievement{
				Type:     a.Type,
				EarnedAt: a.EarnedAt.Format("2006-01-02T15:04:05Z"),
			}
		}

		RespondJSON(w, http.StatusOK, types.AchievementsResponse{Achievements: achievements})
	}
}

func GetProgress(database *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
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

func HandleWebSocket(hub *ws.Hub) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		log.Printf("[WS] Connection attempt from %s, URL: %s", r.RemoteAddr, r.URL.String())

		token := r.URL.Query().Get("token")
		if token == "" {
			log.Printf("[WS] No token provided")
			http.Error(w, "Unauthorized", http.StatusUnauthorized)
			return
		}

		claims, err := auth.ValidateToken(token)
		if err != nil {
			log.Printf("[WS] Invalid token: %v", err)
			http.Error(w, "Invalid token", http.StatusUnauthorized)
			return
		}

		userIDFloat, ok := (*claims)["user_id"].(float64)
		if !ok {
			log.Printf("[WS] Invalid user ID")
			http.Error(w, "Invalid user ID", http.StatusUnauthorized)
			return
		}
		userID := int(userIDFloat)

		nickname, ok := (*claims)["nickname"].(string)
		if !ok {
			log.Printf("[WS] Invalid nickname")
			http.Error(w, "Invalid nickname", http.StatusUnauthorized)
			return
		}

		log.Printf("[WS] Accepting connection for user %d (%s)", userID, nickname)
		ws.ServeWs(hub, w, r, userID, nickname)
	}
}
