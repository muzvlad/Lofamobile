package db

import (
	"database/sql"
	"testing"
)

func getTestDB(t *testing.T) (*sql.DB, func()) {
	database, err := Connect()
	if err != nil {
		t.Fatalf("Failed to connect: %v", err)
	}

	cleanup := func() {
		database.Exec("DELETE FROM progress WHERE user_id IN (333, 444, 555, 666, 777, 888, 999)")
		database.Exec("DELETE FROM achievements WHERE user_id IN (333, 444)")
		database.Exec("DELETE FROM leaderboard WHERE user_id IN (555, 556, 777, 778, 888)")
		database.Close()
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

func TestGetLevels(t *testing.T) {
	levels := GetLevelsWithGender("girl")
	if len(levels) != 20 {
		t.Errorf("Expected 20 levels, got %d", len(levels))
	}

	if levels[0].Name == "" {
		t.Error("Level name should not be empty")
	}

	if levels[0].Grid == nil {
		t.Error("Level grid should not be nil")
	}
}

func TestGetLevelByID(t *testing.T) {
	level, err := GetLevelByIDWithGender(1, "girl")
	if err != nil {
		t.Fatalf("Failed to get level: %v", err)
	}

	if level.ID != 1 {
		t.Errorf("Expected level ID 1, got %d", level.ID)
	}

	level2, err := GetLevelByIDWithGender(5, "girl")
	if err != nil {
		t.Fatalf("Failed to get level: %v", err)
	}

	if len(level2.AvailableCommands) == 0 {
		t.Error("Level 5 should have available commands")
	}
}

func TestGetLevelByID_Invalid(t *testing.T) {
	_, err := GetLevelByIDWithGender(0, "girl")
	if err == nil {
		t.Error("Should return error for invalid ID")
	}

	_, err = GetLevelByIDWithGender(21, "girl")
	if err == nil {
		t.Error("Should return error for ID > 20")
	}
}

func TestCompleteLevel_Insert(t *testing.T) {
	db, cleanup := getTestDB(t)
	defer cleanup()

	result := CompleteLevel(db, 999, 1, 1, "forward", 0, "girl")
	if result.Par == 0 {
		t.Error("Par should not be 0")
	}
	if result.Par != 3 {
		t.Errorf("Expected par 3, got %d", result.Par)
	}
}

func TestCompleteLevel_InvalidLevel(t *testing.T) {
	db, cleanup := getTestDB(t)
	defer cleanup()

	result := CompleteLevel(db, 1, 999, 5, "code", 0, "girl")
	if result.Par != 0 {
		t.Error("Invalid level should have par 0")
	}
}

func TestUpdateScore(t *testing.T) {
	db, cleanup := getTestDB(t)
	defer cleanup()

	db.Exec("INSERT OR REPLACE INTO leaderboard (user_id, username, gender, total_score) VALUES (888, 'testuser', 'm', 0)")

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

	db.Exec("INSERT OR REPLACE INTO leaderboard (user_id, username, gender, total_score) VALUES (777, 'player1', 'm', 500)")
	db.Exec("INSERT OR REPLACE INTO leaderboard (user_id, username, gender, total_score) VALUES (778, 'player2', 'f', 300)")

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

	db.Exec("INSERT OR REPLACE INTO leaderboard (user_id, username, gender, total_score) VALUES (555, 'boy1', 'm', 100)")
	db.Exec("INSERT OR REPLACE INTO leaderboard (user_id, username, gender, total_score) VALUES (556, 'girl1', 'f', 200)")

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

	AddAchievement(db, 333, "first_login")

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

	AddAchievement(db, 444, "first_level")
	AddAchievement(db, 444, "level_5")

	achievements, err := GetAchievements(db, 444)
	if err != nil {
		t.Fatalf("Failed to get achievements: %v", err)
	}

	if len(achievements) < 2 {
		t.Errorf("Expected at least 2 achievements, got %d", len(achievements))
	}
}

func TestGetAchievements_Empty(t *testing.T) {
	db, cleanup := getTestDB(t)
	defer cleanup()

	achievements, err := GetAchievements(db, 999999)
	if err != nil {
		t.Fatalf("Failed to get achievements: %v", err)
	}

	if len(achievements) != 0 {
		t.Errorf("Expected 0 achievements for non-existent user, got %d", len(achievements))
	}
}
