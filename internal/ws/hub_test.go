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

func TestHub_Run(t *testing.T) {
	hub := NewHub(nil)
	go hub.Run()
	_ = hub
}

func TestHub_Shutdown(t *testing.T) {
	hub := NewHub(nil)
	hub.Shutdown()
	if hub.clients == nil {
		t.Error("Hub clients should be reinitialized after shutdown")
	}
}

func TestScoreUpdateMessageJSON(t *testing.T) {
	msg := ScoreUpdateMessage{
		Type:     "score_update",
		UserID:   1,
		Username: "testuser",
		Score:    100,
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
	if decoded.Username != msg.Username {
		t.Errorf("Expected username %s, got %s", msg.Username, decoded.Username)
	}
	if decoded.Score != msg.Score {
		t.Errorf("Expected score %d, got %d", msg.Score, decoded.Score)
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
	if Upgrader.ReadBufferSize != 1024 {
		t.Errorf("Expected ReadBufferSize 1024, got %d", Upgrader.ReadBufferSize)
	}

	if Upgrader.WriteBufferSize != 1024 {
		t.Errorf("Expected WriteBufferSize 1024, got %d", Upgrader.WriteBufferSize)
	}
}