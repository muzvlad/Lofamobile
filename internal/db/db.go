package db

import (
	"codequest/internal/types"
	"database/sql"
	"log"
	"os"

	_ "modernc.org/sqlite"
)

func Connect() (*sql.DB, error) {
	dbPath := os.Getenv("DB_PATH")
	if dbPath == "" {
		dbPath = "./codequest.db"
	}

	return ConnectPath(dbPath)
}

func ConnectPath(dbPath string) (*sql.DB, error) {
	database, err := sql.Open("sqlite", dbPath+"?_journal_mode=WAL&_busy_timeout=5000&_synchronous=NORMAL&_foreign_keys=on&_cache_size=-8000&_mmap_size=0")
	if err != nil {
		log.Printf("[DB] Open error: %v", err)
		return nil, err
	}

	database.SetMaxOpenConns(1)
	database.SetMaxIdleConns(1)

	if _, err := database.Exec("PRAGMA journal_mode=WAL"); err != nil {
		log.Printf("[DB] WARNING: failed to set WAL mode: %v", err)
	}
	if _, err := database.Exec("PRAGMA synchronous=NORMAL"); err != nil {
		log.Printf("[DB] WARNING: failed to set synchronous=NORMAL: %v", err)
	}
	if _, err := database.Exec("PRAGMA busy_timeout=5000"); err != nil {
		log.Printf("[DB] WARNING: failed to set busy_timeout: %v", err)
	}

	if err := database.Ping(); err != nil {
		log.Printf("[DB] Ping error: %v", err)
		return nil, err
	}

	return database, nil
}

func Migrate(database *sql.DB) error {
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

	var colCount int
	database.QueryRow("SELECT COUNT(*) FROM pragma_table_info('progress') WHERE name='attempts'").Scan(&colCount)
	if colCount == 0 {
		database.Exec("ALTER TABLE progress ADD COLUMN attempts INTEGER DEFAULT 0")
	}

	database.QueryRow("SELECT COUNT(*) FROM pragma_table_info('progress') WHERE name='gender'").Scan(&colCount)
	if colCount == 0 {
		database.Exec("ALTER TABLE progress ADD COLUMN gender VARCHAR(10) DEFAULT ''")
		database.Exec("CREATE TABLE IF NOT EXISTS progress_v2 (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER REFERENCES users(id), level_id INTEGER NOT NULL, stars INTEGER DEFAULT 0, moves INTEGER DEFAULT 0, attempts INTEGER DEFAULT 0, code TEXT, gender VARCHAR(10) DEFAULT '', completed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, UNIQUE(user_id, level_id, gender))")
		database.Exec("INSERT OR IGNORE INTO progress_v2 SELECT id, user_id, level_id, COALESCE(stars,0), COALESCE(moves,0), COALESCE(attempts,0), code, COALESCE(gender,''), completed_at FROM progress")
		database.Exec("DROP TABLE progress")
		database.Exec("ALTER TABLE progress_v2 RENAME TO progress")
	}

	return nil
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
	rowsAffected, err := result.RowsAffected()
	if err != nil {
		log.Printf("Error getting rows affected: %v", err)
		return false
	}
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
			log.Printf("[DB] Leaderboard scan error: %v", err)
			continue
		}
		entry.Rank = rank
		entries = append(entries, entry)
		rank++
	}

	if err := rows.Err(); err != nil {
		return nil, err
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
		log.Printf("[DB] GetUserScore error for user %d: %v", userID, err)
		return 0
	}
	return score
}
