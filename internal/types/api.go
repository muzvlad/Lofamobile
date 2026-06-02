package types

type RegisterRequest struct {
	Phone     string `json:"phone"`
	Nickname  string `json:"nickname"`
	Name      string `json:"name"`
	Password  string `json:"password"`
	Gender    string `json:"gender"`
	Performer string `json:"performer"`
	Age       *int   `json:"age"`
	Language  string `json:"language"`
}

type LoginRequest struct {
	Phone    string `json:"phone"`
	Password string `json:"password"`
}

type UpdateProfileRequest struct {
	Nickname  string `json:"nickname"`
	Name      string `json:"name"`
	Age       *int   `json:"age"`
	Gender    string `json:"gender"`
	Performer string `json:"performer"`
}

type CompleteRequest struct {
	Code             string `json:"code"`
	Moves            int    `json:"moves"`
	PlayerX         int    `json:"playerX"`
	PlayerY         int    `json:"playerY"`
	ItemsCollected  int    `json:"itemsCollected"`
	ItemsOnWarehouse int   `json:"itemsOnWarehouse"`
}

type CompleteResponse struct {
	Success bool   `json:"success"`
	Stars   int    `json:"stars"`
	Moves   int    `json:"moves"`
	Score   int    `json:"score"`
	Message string `json:"message,omitempty"`
}

type LeaderboardEntry struct {
	Rank     int    `json:"rank"`
	UserID   int    `json:"userId"`
	Username string `json:"username"`
	Score    int    `json:"score"`
	Gender   string `json:"gender"`
}

type Achievement struct {
	Type     string `json:"type"`
	EarnedAt string `json:"earnedAt"`
}

type SaveAchievementRequest struct {
	LevelID         int    `json:"level_id"`
	AchievementType string `json:"achievement_type"`
}

type ProgressEntry struct {
	LevelID int `json:"level_id"`
	Stars   int `json:"stars"`
	Moves   int `json:"moves"`
}

type ErrorResponse struct {
	Error string `json:"error"`
}

type SuccessResponse struct {
	Success bool `json:"success"`
}

type LevelsResponse struct {
	Levels []Level `json:"levels"`
}

type LeaderboardResponse struct {
	Leaderboard []LeaderboardEntry `json:"leaderboard"`
}

type AchievementsResponse struct {
	Achievements []Achievement `json:"achievements"`
}

type ProgressResponse struct {
	Progress []ProgressEntry `json:"progress"`
}


