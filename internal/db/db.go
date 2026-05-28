package db

import (
	"codequest/internal/levels"
	"codequest/internal/types"
	"database/sql"
	"fmt"
	"log"
	"os"

	_ "modernc.org/sqlite"
)

func Connect() (*sql.DB, error) {
	dbPath := getEnv("DB_PATH", "./codequest.db")

	log.Printf("[DB] Connecting to: %s", dbPath)

	database, err := sql.Open("sqlite", dbPath)
	if err != nil {
		log.Printf("[DB] Open error: %v", err)
		return nil, err
	}

	database.SetMaxOpenConns(1)
	database.SetMaxIdleConns(1)

	if _, err := database.Exec("PRAGMA journal_mode=WAL"); err != nil {
		log.Printf("[DB] WARNING: failed to set WAL mode: %v", err)
	}
	if _, err := database.Exec("PRAGMA synchronous=FULL"); err != nil {
		log.Printf("[DB] WARNING: failed to set synchronous=FULL: %v", err)
	}
	if _, err := database.Exec("PRAGMA busy_timeout=5000"); err != nil {
		log.Printf("[DB] WARNING: failed to set busy_timeout: %v", err)
	}

	if err := database.Ping(); err != nil {
		log.Printf("[DB] Ping error: %v", err)
		return nil, err
	}

	log.Printf("[DB] Connected successfully")
	return database, nil
}

func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}

func Migrate(database *sql.DB) error {
	log.Printf("[DB] Running migrations...")

	if _, err := database.Exec("PRAGMA foreign_keys = ON"); err != nil {
		log.Printf("[DB] WARNING: failed to enable foreign keys: %v", err)
	}

	schema := `
	CREATE TABLE IF NOT EXISTS users (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		phone VARCHAR(20) UNIQUE NOT NULL,
		nickname VARCHAR(50) NOT NULL,
		name VARCHAR(100),
		password_hash VARCHAR(255) NOT NULL,
		gender VARCHAR(10) NOT NULL,
		performer VARCHAR(20),
		age INTEGER,
		language VARCHAR(10),
		created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
		updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
	);

	CREATE TABLE IF NOT EXISTS progress (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		user_id INTEGER REFERENCES users(id),
		level_id INTEGER NOT NULL,
		stars INTEGER DEFAULT 0,
		moves INTEGER DEFAULT 0,
		attempts INTEGER DEFAULT 0,
		code TEXT,
		completed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
		UNIQUE(user_id, level_id)
	);

	CREATE TABLE IF NOT EXISTS achievements (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		user_id INTEGER REFERENCES users(id),
		achievement_type VARCHAR(50) NOT NULL,
		earned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
	);

	CREATE TABLE IF NOT EXISTS leaderboard (
		user_id INTEGER PRIMARY KEY REFERENCES users(id),
		total_score INTEGER DEFAULT 0,
		username VARCHAR(50),
		gender VARCHAR(10),
		updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
	);
	`

	_, err := database.Exec(schema)
	if err != nil {
		log.Printf("[DB] Schema error: %v", err)
		return err
	}

	log.Printf("[DB] Migrations complete")
	return nil
}

func GetLevelsWithGender(gender string) []types.Level {
	levels := make([]types.Level, 20)

	for i := 1; i <= 20; i++ {
		levels[i-1] = generateLevel(i, gender)
	}

	return levels
}

func GetLevelByIDWithGender(id int, gender string) (types.Level, error) {
	if id < 1 || id > 20 {
		return types.Level{}, fmt.Errorf("level not found")
	}
	return generateLevel(id, gender), nil
}

func generateLevel(id int, gender string) types.Level {
	chapter := (id-1)/10 + 1
	levelIndex := (id - 1) % 10

	chapterLevels := levels.GetChapterLevels(chapter, gender)

	var tpl levels.LevelTemplate
	if levelIndex < len(chapterLevels) {
		tpl = chapterLevels[levelIndex]
	} else {
		tpl = levels.LevelTemplate{
			Name:       "Уровень " + fmt.Sprint(id),
			Desc:       "Стандартное испытание",
			Grid:       [][]int{{0, 0}, {2, 3}},
			Player:     types.Player{X: 0, Y: 0, Direction: 1},
			Goal:       "Достигни цели",
			Items:      nil,
			Par:        1,
			Optimal:    1,
			Difficulty: 1,
		}
	}

	difficulty := tpl.Difficulty
	if difficulty == 0 {
		difficulty = levelIndex/3 + 1
	}

	optimal := tpl.Optimal
	if optimal == 0 {
		optimal = tpl.Par
	}

	level := types.Level{
		ID:         id,
		Name:       tpl.Name,
		Grid:       tpl.Grid,
		Player:     tpl.Player,
		Goal:       tpl.Goal,
		Items:      tpl.Items,
		Par:        tpl.Par,
		Optimal:   optimal,
		Difficulty: difficulty,
		Background: tpl.Background,
	}

	level.Commands = map[string]types.Command{
		"up":      {Name: "Вверх", Icon: "⬆️"},
		"down":    {Name: "Вниз", Icon: "⬇️"},
		"left":    {Name: "Влево", Icon: "⬅️"},
		"right":   {Name: "Вправо", Icon: "➡️"},
		"jump":    {Name: "Прыжок", Icon: "🦘"},
		"turn":    {Name: "Разворот", Icon: "🔄"},
		"collect": {Name: "Взять", Icon: "✋"},
		"drop":    {Name: "Положить", Icon: "📦"},
	}

	switch difficulty {
	case 1:
		level.AvailableCommands = []string{"up", "down", "left", "right"}
	case 2:
		level.AvailableCommands = []string{"up", "down", "left", "right", "jump"}
	case 3:
		level.AvailableCommands = []string{"up", "down", "left", "right", "jump", "turn"}
	default:
		level.AvailableCommands = []string{"up", "down", "left", "right"}
	}

if len(tpl.Items) > 0 {
		hasCollect := false
		hasDrop := false
		for _, cmd := range level.AvailableCommands {
			if cmd == "collect" {
				hasCollect = true
			}
			if cmd == "drop" {
				hasDrop = true
			}
		}
		if !hasCollect {
			level.AvailableCommands = append(level.AvailableCommands, "collect")
		}
		dropInTemplate := false
		if tpl.AvailableCommands != nil {
			for _, cmd := range tpl.AvailableCommands {
				if cmd == "drop" {
					dropInTemplate = true
					break
				}
			}
		}
		if !hasDrop && dropInTemplate {
			level.AvailableCommands = append(level.AvailableCommands, "drop")
		}
	}

	level.Description = tpl.Desc

	return level
}

type LevelResult struct {
	Success   bool
	Par       int
	Stars     int
	Improved  bool
}

func CompleteLevel(database *sql.DB, userID, levelID, moves int, code string, hasItem, requiredItems int, gender string) LevelResult {
	level, err := GetLevelByIDWithGender(levelID, gender)
	if err != nil {
		log.Printf("[COMPLETE] Level %d not found: %v", levelID, err)
		return LevelResult{Success: false, Par: 0, Stars: 0, Improved: false}
	}
	par := level.Par
	optimal := level.Optimal
	hasCollectedItem := hasItem

	levelHasItems := len(level.Items) > 0

	var stars int
	var success bool
	var improved bool

	if levelHasItems && requiredItems > 0 && hasCollectedItem < requiredItems {
		success = false
		stars = 0
		improved = false
		log.Printf("[COMPLETE] Level requires %d items but player collected only %d!", requiredItems, hasCollectedItem)
	} else {
		success = true
		if moves <= optimal {
			stars = 3
		} else if moves <= par {
			stars = 2
		} else {
			stars = 1
		}

		improved = false

		_, err := database.Exec(
			`INSERT INTO progress (user_id, level_id, stars, moves, code, attempts) 
			 VALUES (?, ?, ?, ?, ?, 1)
			 ON CONFLICT(user_id, level_id) DO UPDATE SET
			   stars = MAX(progress.stars, ?),
			   moves = CASE WHEN ? > progress.stars THEN ? WHEN ? = progress.stars AND ? < progress.moves THEN ? ELSE progress.moves END,
			   code = ?,
			   attempts = progress.attempts + 1,
			   completed_at = CURRENT_TIMESTAMP`,
			userID, levelID, stars, moves, code,
			stars, stars, moves, stars, moves, moves, code,
		)
		if err != nil {
			log.Printf("[DB] UPSERT ERROR: %v", err)
			return LevelResult{Success: false, Par: par, Stars: 0, Improved: false}
		}

		var dbStars int
		_ = database.QueryRow(
			"SELECT stars FROM progress WHERE user_id = ? AND level_id = ?",
			userID, levelID,
		).Scan(&dbStars)
		_ = dbStars
		improved = stars > dbStars

		log.Printf("[COMPLETE] Level %d: stars=%d, moves=%d, par=%d, optimal=%d", levelID, stars, moves, par, optimal)

		log.Printf("[COMPLETE] Level %d: moves=%d, par=%d, optimal=%d, hasItem=%v, levelHasItems=%v", levelID, moves, par, optimal, hasCollectedItem, levelHasItems)
	}

	return LevelResult{
		Success:  success,
		Par:      par,
		Stars:    stars,
		Improved: improved,
	}
}

func UpdateScore(database *sql.DB, userID, score int) bool {
	result, err := database.Exec(
		"UPDATE leaderboard SET total_score = total_score + ?, updated_at = CURRENT_TIMESTAMP WHERE user_id = ?",
		score, userID,
	)
	if err != nil {
		log.Printf("Error updating score: %v", err)
		return false
	}
	rowsAffected, _ := result.RowsAffected()
	if rowsAffected == 0 {
		_, err = database.Exec(
			"INSERT INTO leaderboard (user_id, total_score) VALUES (?, ?)",
			userID, score,
		)
		if err != nil {
			log.Printf("Error inserting score for user %d: %v", userID, err)
			return false
		}
	}
	return true
}

func GetLeaderboard(database *sql.DB, gender string) ([]types.LeaderboardEntry, error) {
	var rows *sql.Rows
	var err error

	if gender == "all" || gender == "" {
		rows, err = database.Query(
			"SELECT user_id, username, total_score, gender FROM leaderboard ORDER BY total_score DESC LIMIT 100",
		)
	} else {
		rows, err = database.Query(
			"SELECT user_id, username, total_score, gender FROM leaderboard WHERE gender = ? ORDER BY total_score DESC LIMIT 100",
			gender,
		)
	}

	if err != nil {
		return nil, err
	}
	defer rows.Close()

	entries := make([]types.LeaderboardEntry, 0)
	rank := 1

	for rows.Next() {
		var entry types.LeaderboardEntry
		if err := rows.Scan(&entry.UserID, &entry.Username, &entry.Score, &entry.Gender); err != nil {
			continue
		}
		entry.Rank = rank
		entries = append(entries, entry)
		rank++
	}

	return entries, nil
}

func GetUserScore(database *sql.DB, userID int) int {
	var score int
	err := database.QueryRow(
		"SELECT COALESCE(total_score, 0) FROM leaderboard WHERE user_id = ?",
		userID,
	).Scan(&score)
	if err != nil {
		return 0
	}
	return score
}
