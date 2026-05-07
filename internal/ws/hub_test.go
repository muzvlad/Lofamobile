package ws

import (
	"encoding/json"
	"testing"
)

func TestNewHub(t *testing.T) {
	hub := NewHub(nil)
	if hub == nil {
		t.Fatal("Hub should not be nil")
	}

	if hub.clients == nil {
		t.Error("Hub clients map should be initialized")
	}

	if hub.register == nil {
		t.Error("Hub register channel should be initialized")
	}

	if hub.unregister == nil {
		t.Error("Hub unregister channel should be initialized")
	}

	if hub.broadcast == nil {
		t.Error("Hub broadcast channel should be initialized")
	}
}

func TestNewHub_WithDatabase(t *testing.T) {
	hub := NewHub(nil)
	if hub.database != nil {
		t.Error("Database should be nil when not provided")
	}
}

func TestScoreUpdateMessageJSON(t *testing.T) {
	msg := ScoreUpdateMessage{
		Type:   "score_update",
		UserID: 1,
		Score:  100,
	}

	data, err := json.Marshal(msg)
	if err != nil {
		t.Fatalf("Failed to marshal: %v", err)
	}

	var decoded ScoreUpdateMessage
	if err := json.Unmarshal(data, &decoded); err != nil {
		t.Fatalf("Failed to unmarshal: %v", err)
	}

	if decoded.Type != msg.Type {
		t.Errorf("Expected type %s, got %s", msg.Type, decoded.Type)
	}
	if decoded.UserID != msg.UserID {
		t.Errorf("Expected user ID %d, got %d", msg.UserID, decoded.UserID)
	}
	if decoded.Score != msg.Score {
		t.Errorf("Expected score %d, got %d", msg.Score, decoded.Score)
	}
}

func TestAchievementMessageJSON(t *testing.T) {
	msg := AchievementMessage{
		Type:    "new_achievement",
		UserID:  1,
		Details: "first_level",
	}

	data, err := json.Marshal(msg)
	if err != nil {
		t.Fatalf("Failed to marshal: %v", err)
	}

	var decoded AchievementMessage
	if err := json.Unmarshal(data, &decoded); err != nil {
		t.Fatalf("Failed to unmarshal: %v", err)
	}

	if decoded.Type != msg.Type {
		t.Errorf("Expected type %s, got %s", msg.Type, decoded.Type)
	}
	if decoded.UserID != msg.UserID {
		t.Errorf("Expected user ID %d, got %d", msg.UserID, decoded.UserID)
	}
	if decoded.Details != msg.Details {
		t.Errorf("Expected details %s, got %s", msg.Details, decoded.Details)
	}
}

func TestAchievementMessageJSON_AllTypes(t *testing.T) {
	types := []string{"first_login", "first_level", "level_5", "chapter_1_complete", "all_levels", "perfect_level"}

	for _, at := range types {
		msg := AchievementMessage{
			Type:    "new_achievement",
			UserID:  1,
			Details: at,
		}

		data, _ := json.Marshal(msg)
		var decoded AchievementMessage
		json.Unmarshal(data, &decoded)

		if decoded.Details != at {
			t.Errorf("Expected details %s, got %s", at, decoded.Details)
		}
	}
}

func TestScoreUpdateMessageJSON_AllScores(t *testing.T) {
	scores := []int{0, 100, 300, 500, 1000}

	for _, s := range scores {
		msg := ScoreUpdateMessage{
			Type:   "score_update",
			UserID: 1,
			Score:  s,
		}

		data, _ := json.Marshal(msg)
		var decoded ScoreUpdateMessage
		json.Unmarshal(data, &decoded)

		if decoded.Score != s {
			t.Errorf("Expected score %d, got %d", s, decoded.Score)
		}
	}
}

func TestUpgraderCheckOrigin(t *testing.T) {
	if upgrader.CheckOrigin == nil {
		t.Error("CheckOrigin should be set")
	}

	if upgrader.ReadBufferSize != 1024 {
		t.Errorf("Expected ReadBufferSize 1024, got %d", upgrader.ReadBufferSize)
	}

	if upgrader.WriteBufferSize != 1024 {
		t.Errorf("Expected WriteBufferSize 1024, got %d", upgrader.WriteBufferSize)
	}
}
