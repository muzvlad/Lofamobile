package scoring

import (
	"codequest/internal/db"
	"codequest/internal/types"
	"database/sql"
	"os"
	"testing"
)

func getTestDB(t *testing.T) (*sql.DB, func()) {
	t.Helper()

	f, err := os.CreateTemp("", "codequest_test_*.db")
	if err != nil {
		t.Fatalf("Failed to create temp file: %v", err)
	}
	f.Close()

	database, err := db.ConnectPath(f.Name())
	if err != nil {
		os.Remove(f.Name())
		t.Fatalf("Failed to connect: %v", err)
	}

	if err := db.Migrate(database); err != nil {
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

func TestCompleteLevel_Insert(t *testing.T) {
	database, cleanup := getTestDB(t)
	defer cleanup()

	database.Exec("INSERT INTO users (id, phone, nickname, password_hash, gender) VALUES (999, '+7000999', 'user999', 'hash', 'f')")
	req := types.CompleteRequest{
		Code:    "right\nright\nright",
		Moves:   3,
		PlayerX: 3,
		PlayerY: 0,
	}
	result := CompleteLevel(database, 999, 1, req, "girl")
	if result.Par == 0 {
		t.Error("Par should not be 0")
	}
	if !result.Success {
		t.Error("Level 1 should be completed successfully")
	}
}

func TestCompleteLevel_GenderSeparation(t *testing.T) {
	database, cleanup := getTestDB(t)
	defer cleanup()

	database.Exec("INSERT INTO users (id, phone, nickname, password_hash, gender) VALUES (1, '+7000001', 'boyuser', 'hash', 'm')")
	database.Exec("INSERT INTO users (id, phone, nickname, password_hash, gender) VALUES (2, '+7000002', 'girluser', 'hash', 'f')")

	req := types.CompleteRequest{
		Code:    "right\nright\nright",
		Moves:   3,
		PlayerX: 3,
		PlayerY: 0,
	}

	result := CompleteLevel(database, 1, 1, req, "boy")
	if !result.Success {
		t.Error("Boy should complete level 1")
	}

	var boyStars int
	err := database.QueryRow("SELECT stars FROM progress WHERE user_id = ? AND level_id = ? AND gender = ?", 1, 1, "boy").Scan(&boyStars)
	if err != nil {
		t.Errorf("Boy progress row should exist: %v", err)
	}
	if boyStars == 0 {
		t.Error("Boy stars should be > 0")
	}

	var girlCount int
	err = database.QueryRow("SELECT COUNT(*) FROM progress WHERE user_id = ? AND level_id = ? AND gender = ?", 2, 1, "girl").Scan(&girlCount)
	if err != nil {
		t.Fatal(err)
	}
	if girlCount > 0 {
		t.Error("Girl should have no progress before playing")
	}

	result2 := CompleteLevel(database, 2, 1, req, "girl")
	if !result2.Success {
		t.Error("Girl should complete level 1")
	}

	var girlStars int
	err = database.QueryRow("SELECT stars FROM progress WHERE user_id = ? AND level_id = ? AND gender = ?", 2, 1, "girl").Scan(&girlStars)
	if err != nil {
		t.Errorf("Girl progress row should exist: %v", err)
	}
	if girlStars == 0 {
		t.Error("Girl stars should be > 0")
	}

	var boyStarsAgain int
	database.QueryRow("SELECT stars FROM progress WHERE user_id = ? AND level_id = ? AND gender = ?", 1, 1, "boy").Scan(&boyStarsAgain)
	if boyStarsAgain != boyStars {
		t.Error("Boy stars should not change when girl completes the same level")
	}

	var totalRows int
	database.QueryRow("SELECT COUNT(*) FROM progress WHERE level_id = 1").Scan(&totalRows)
	if totalRows != 2 {
		t.Errorf("Expected 2 progress rows (boy+girl) for level 1, got %d", totalRows)
	}
}

func TestCompleteLevel_LevelUnlockProgress(t *testing.T) {
	database, cleanup := getTestDB(t)
	defer cleanup()

	database.Exec("INSERT INTO users (id, phone, nickname, password_hash, gender) VALUES (1, '+7000001', 'user1', 'hash', 'm')")

	req1 := types.CompleteRequest{
		Code:    "right\nright\nright",
		Moves:   3,
		PlayerX: 3,
		PlayerY: 0,
	}
	result := CompleteLevel(database, 1, 1, req1, "boy")
	if !result.Success {
		t.Fatal("Level 1 should complete")
	}

	var level1Stars int
	database.QueryRow("SELECT stars FROM progress WHERE user_id = ? AND level_id = ? AND gender = ?", 1, 1, "boy").Scan(&level1Stars)
	if level1Stars == 0 {
		t.Error("Level 1 should have stars > 0")
	}

	var level2Stars sql.NullInt64
	database.QueryRow("SELECT stars FROM progress WHERE user_id = ? AND level_id = ? AND gender = ?", 1, 2, "boy").Scan(&level2Stars)
	if level2Stars.Valid {
		t.Error("Level 2 should not have progress yet")
	}
}

func TestCompleteLevel_InvalidLevel(t *testing.T) {
	database, cleanup := getTestDB(t)
	defer cleanup()

	req := types.CompleteRequest{
		Code:    "code",
		Moves:   5,
		PlayerX: 0,
		PlayerY: 0,
	}
	result := CompleteLevel(database, 1, 999, req, "girl")
	if result.Par != 0 {
		t.Error("Invalid level should have par 0")
	}
}
