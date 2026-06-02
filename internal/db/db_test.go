package db

import (
	"codequest/internal/achievements"
	"database/sql"
	"os"
	"testing"
)

func getTestDB(t *testing.T) (*sql.DB, func()) {
	f, err := os.CreateTemp("", "codequest_test_*.db")
	if err != nil {
		t.Fatalf("Failed to create temp file: %v", err)
	}
	f.Close()

	database, err := ConnectPath(f.Name())
	if err != nil {
		os.Remove(f.Name())
		t.Fatalf("Failed to connect: %v", err)
	}

	if err := Migrate(database); err != nil {
		database.Close()
		os.Remove(f.Name())
		t.Fatalf("Failed to migrate: %v", err)
	}

	cleanup := func() {
		database.Close()
		os.Remove(f.Name())
	}

	return database, cleanup
}

func TestConnect(t *testing.T) {
	db, err := Connect()
	if err != nil {
		t.Fatalf("Failed to connect: %v", err)
	}
	defer db.Close()

	if err := db.Ping(); err != nil {
		t.Fatalf("Failed to ping: %v", err)
	}
}

func TestMigrate(t *testing.T) {
	db, err := Connect()
	if err != nil {
		t.Fatalf("Failed to connect: %v", err)
	}
	defer db.Close()

	if err := Migrate(db); err != nil {
		t.Fatalf("Failed to migrate: %v", err)
	}
}

func TestUpdateScore(t *testing.T) {
	db, cleanup := getTestDB(t)
	defer cleanup()

	db.Exec("INSERT INTO users (id, phone, nickname, password_hash, gender) VALUES (888, '+7000888', 'testuser', 'hash', 'm')")
	db.Exec("INSERT INTO leaderboard (user_id, username, gender, total_score) VALUES (888, 'testuser', 'm', 0)")

	UpdateScore(db, 888, 100)

	var score int
	err := db.QueryRow("SELECT total_score FROM leaderboard WHERE user_id = 888").Scan(&score)
	if err != nil {
		t.Fatalf("Failed to get score: %v", err)
	}

	if score != 100 {
		t.Errorf("Expected score 100, got %d", score)
	}
}

func TestGetLeaderboard_All(t *testing.T) {
	db, cleanup := getTestDB(t)
	defer cleanup()

	db.Exec("INSERT INTO users (id, phone, nickname, password_hash, gender) VALUES (777, '+7000777', 'player1', 'hash', 'm')")
	db.Exec("INSERT INTO users (id, phone, nickname, password_hash, gender) VALUES (778, '+7000778', 'player2', 'hash', 'f')")
	db.Exec("INSERT INTO leaderboard (user_id, username, gender, total_score) VALUES (777, 'player1', 'm', 500)")
	db.Exec("INSERT INTO leaderboard (user_id, username, gender, total_score) VALUES (778, 'player2', 'f', 300)")

	entries, err := GetLeaderboard(db, "")
	if err != nil {
		t.Fatalf("Failed to get leaderboard: %v", err)
	}

	if len(entries) == 0 {
		t.Error("Should return entries")
	}

	if entries[0].Score < entries[len(entries)-1].Score {
		t.Error("First entry should have higher or equal score than last")
	}
}

func TestGetLeaderboard_Filtered(t *testing.T) {
	db, cleanup := getTestDB(t)
	defer cleanup()

	db.Exec("INSERT INTO users (id, phone, nickname, password_hash, gender) VALUES (555, '+7000555', 'boy1', 'hash', 'm')")
	db.Exec("INSERT INTO users (id, phone, nickname, password_hash, gender) VALUES (556, '+7000556', 'girl1', 'hash', 'f')")
	db.Exec("INSERT INTO leaderboard (user_id, username, gender, total_score) VALUES (555, 'boy1', 'm', 100)")
	db.Exec("INSERT INTO leaderboard (user_id, username, gender, total_score) VALUES (556, 'girl1', 'f', 200)")

	entries, err := GetLeaderboard(db, "m")
	if err != nil {
		t.Fatalf("Failed to get leaderboard: %v", err)
	}

	for _, e := range entries {
		if e.Gender != "m" {
			t.Errorf("Expected only males, got %s", e.Gender)
		}
	}
}

func TestAddAchievement(t *testing.T) {
	db, cleanup := getTestDB(t)
	defer cleanup()

	db.Exec("INSERT INTO users (id, phone, nickname, password_hash, gender) VALUES (333, '+7000333', 'user333', 'hash', 'm')")
	achievements.AddEarned(db, 333, "first_login")

	var count int
	err := db.QueryRow("SELECT COUNT(*) FROM achievements WHERE user_id = 333 AND achievement_type = 'first_login'").Scan(&count)
	if err != nil {
		t.Fatalf("Failed to query: %v", err)
	}

	if count < 1 {
		t.Errorf("Expected at least 1 achievement, got %d", count)
	}
}

func TestGetAchievements(t *testing.T) {
	db, cleanup := getTestDB(t)
	defer cleanup()

	db.Exec("INSERT INTO users (id, phone, nickname, password_hash, gender) VALUES (444, '+7000444', 'user444', 'hash', 'f')")
	achievements.AddEarned(db, 444, "first_level")
	achievements.AddEarned(db, 444, "level_5")

	achievementList, err := achievements.GetEarned(db, 444)
	if err != nil {
		t.Fatalf("Failed to get achievements: %v", err)
	}

	if len(achievementList) < 2 {
		t.Errorf("Expected at least 2 achievements, got %d", len(achievementList))
	}
}

func TestGetAchievements_Empty(t *testing.T) {
	db, cleanup := getTestDB(t)
	defer cleanup()

	achievementList, err := achievements.GetEarned(db, 999999)
	if err != nil {
		t.Fatalf("Failed to get achievements: %v", err)
	}

	if len(achievementList) != 0 {
		t.Errorf("Expected 0 achievements for non-existent user, got %d", len(achievementList))
	}
}
