package api

import (
	"bytes"
	"context"
	"database/sql"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"os"
	"strings"
	"testing"
	"time"

	"github.com/gorilla/websocket"

	"codequest/internal/auth"
	"codequest/internal/db"
	"codequest/internal/types"
	"codequest/internal/ws"
)

func init() {
	auth.Init("test_secret_for_tests")
}

func setupTestDB(t *testing.T) (*sql.DB, func()) {
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

func TestRegister(t *testing.T) {
	database, cleanup := setupTestDB(t)
	defer cleanup()

	handler := Register(database)

	body := types.RegisterRequest{
		Phone:    "+79001234567",
		Nickname: "testuser",
		Name:     "Test",
		Password: "password123",
		Gender:   "m",
	}

	jsonBody, _ := json.Marshal(body)
	req := httptest.NewRequest("POST", "/register", bytes.NewBuffer(jsonBody))
	req.Header.Set("Content-Type", "application/json")

	w := httptest.NewRecorder()
	handler(w, req)

	if w.Code != http.StatusCreated {
		t.Errorf("Expected status 201, got %d", w.Code)
	}

	var user types.User
	json.Unmarshal(w.Body.Bytes(), &user)

	if user.Phone != "+79001234567" {
		t.Errorf("Expected phone +79001234567, got %s", user.Phone)
	}

	if user.Token == "" {
		t.Error("Token should not be empty")
	}
}

func TestRegister_DuplicatePhone(t *testing.T) {
	database, cleanup := setupTestDB(t)
	defer cleanup()

	handler := Register(database)

	body := types.RegisterRequest{
		Phone:    "+79001234567",
		Nickname: "testuser",
		Password: "password123",
		Gender:   "m",
	}

	jsonBody, _ := json.Marshal(body)
	req := httptest.NewRequest("POST", "/register", bytes.NewBuffer(jsonBody))
	req.Header.Set("Content-Type", "application/json")

	w := httptest.NewRecorder()
	handler(w, req)

	body2 := types.RegisterRequest{
		Phone:    "+79001234567",
		Nickname: "testuser2",
		Password: "password123",
		Gender:   "m",
	}

	jsonBody2, _ := json.Marshal(body2)
	req2 := httptest.NewRequest("POST", "/register", bytes.NewBuffer(jsonBody2))
	req2.Header.Set("Content-Type", "application/json")

	w2 := httptest.NewRecorder()
	handler(w2, req2)

	if w2.Code != http.StatusBadRequest {
		t.Errorf("Expected status 400, got %d", w2.Code)
	}
}

func TestLogin(t *testing.T) {
	database, cleanup := setupTestDB(t)
	defer cleanup()

	registerHandler := Register(database)
	body := types.RegisterRequest{
		Phone:    "+79001234567",
		Nickname: "testuser",
		Password: "password123",
		Gender:   "m",
	}

	jsonBody, _ := json.Marshal(body)
	req := httptest.NewRequest("POST", "/register", bytes.NewBuffer(jsonBody))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	registerHandler(w, req)

	loginHandler := Login(database)
	loginBody := types.LoginRequest{
		Phone:    "+79001234567",
		Password: "password123",
	}

	jsonLoginBody, _ := json.Marshal(loginBody)
	loginReq := httptest.NewRequest("POST", "/login", bytes.NewBuffer(jsonLoginBody))
	loginReq.Header.Set("Content-Type", "application/json")

	loginW := httptest.NewRecorder()
	loginHandler(loginW, loginReq)

	if loginW.Code != http.StatusOK {
		t.Errorf("Expected status 200, got %d", loginW.Code)
	}

	var user types.User
	json.Unmarshal(loginW.Body.Bytes(), &user)

	if user.Token == "" {
		t.Error("Token should not be empty")
	}
}

func TestLogin_InvalidPassword(t *testing.T) {
	database, cleanup := setupTestDB(t)
	defer cleanup()

	registerHandler := Register(database)
	body := types.RegisterRequest{
		Phone:    "+79001234567",
		Nickname: "testuser",
		Password: "password123",
		Gender:   "m",
	}

	jsonBody, _ := json.Marshal(body)
	req := httptest.NewRequest("POST", "/register", bytes.NewBuffer(jsonBody))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	registerHandler(w, req)

	loginHandler := Login(database)
	loginBody := types.LoginRequest{
		Phone:    "+79001234567",
		Password: "wrongpassword",
	}

	jsonLoginBody, _ := json.Marshal(loginBody)
	loginReq := httptest.NewRequest("POST", "/login", bytes.NewBuffer(jsonLoginBody))
	loginReq.Header.Set("Content-Type", "application/json")

	loginW := httptest.NewRecorder()
	loginHandler(loginW, loginReq)

	if loginW.Code != http.StatusUnauthorized {
		t.Errorf("Expected status 401, got %d, Body: %s", loginW.Code, loginW.Body.String())
	}

	var resp map[string]string
	json.Unmarshal(loginW.Body.Bytes(), &resp)
	if resp["error"] == "" {
		t.Error("Should return error message")
	}
}

func TestGetLevels(t *testing.T) {
	database, cleanup := setupTestDB(t)
	defer cleanup()

	handler := GetLevels(database)
	req := httptest.NewRequest("GET", "/levels", nil)

	w := httptest.NewRecorder()
	handler(w, req)

	if w.Code != http.StatusOK {
		t.Errorf("Expected status 200, got %d", w.Code)
	}

	var response map[string]interface{}
	json.Unmarshal(w.Body.Bytes(), &response)

	levels := response["levels"].([]interface{})
	if len(levels) != 20 {
		t.Errorf("Expected 20 levels, got %d", len(levels))
	}
}

func TestGetLevel(t *testing.T) {
	database, cleanup := setupTestDB(t)
	defer cleanup()

	handler := GetLevel(database)
	req := httptest.NewRequest("GET", "/levels/1", nil)

	w := httptest.NewRecorder()

	ctx := req.Context()
	ctx = context.WithValue(ctx, types.CtxLevelID, 1)
	r := req.WithContext(ctx)
	handler(w, r)

	if w.Code != http.StatusOK {
		t.Errorf("Expected status 200, got %d, body: %s", w.Code, w.Body.String())
	}

	var level types.Level
	json.Unmarshal(w.Body.Bytes(), &level)

	if level.ID != 1 {
		t.Errorf("Expected level ID 1, got %d", level.ID)
	}
}

func TestGetLevel_NotFound(t *testing.T) {
	database, cleanup := setupTestDB(t)
	defer cleanup()

	handler := GetLevel(database)
	req := httptest.NewRequest("GET", "/levels/999", nil)

	w := httptest.NewRecorder()
	handler(w, req)

	if w.Code != http.StatusNotFound {
		t.Errorf("Expected status 404, got %d", w.Code)
	}
}

func TestGetLeaderboard(t *testing.T) {
	database, cleanup := setupTestDB(t)
	defer cleanup()

	handler := GetLeaderboard(database)
	req := httptest.NewRequest("GET", "/leaderboard", nil)

	w := httptest.NewRecorder()
	handler(w, req)

	if w.Code != http.StatusOK {
		t.Errorf("Expected status 200, got %d", w.Code)
	}

	var response map[string]interface{}
	json.Unmarshal(w.Body.Bytes(), &response)

	if response["leaderboard"] == nil {
		t.Error("Leaderboard should not be nil")
	}
}

func TestGetAchievements_Unauthorized(t *testing.T) {
	database, cleanup := setupTestDB(t)
	defer cleanup()

	handler := GetAchievements(database)
	req := httptest.NewRequest("GET", "/achievements", nil)

	w := httptest.NewRecorder()
	handler(w, req)

	if w.Code != http.StatusUnauthorized {
		t.Errorf("Expected status 401, got %d", w.Code)
	}
}

func TestHandleWebSocket_InvalidAuth(t *testing.T) {
	hub := ws.NewHub(nil)
	go hub.Run()
	defer hub.Shutdown()

	handler := HandleWebSocket(hub)
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		handler(w, r)
	}))
	defer server.Close()

	wsURL := "ws" + strings.TrimPrefix(server.URL, "http")
	conn, _, err := websocket.DefaultDialer.Dial(wsURL, nil)
	if err != nil {
		t.Fatalf("Failed to connect: %v", err)
	}
	defer conn.Close()

	err = conn.WriteMessage(websocket.TextMessage, []byte(`{"type":"auth","token":""}`))
	if err != nil {
		t.Fatalf("Failed to write auth message: %v", err)
	}

	conn.SetReadDeadline(time.Now().Add(500 * time.Millisecond))
	_, _, err = conn.ReadMessage()
	if err == nil {
		t.Error("Expected connection to close after invalid auth")
	}
}

func TestGetMe(t *testing.T) {
	database, cleanup := setupTestDB(t)
	defer cleanup()

	registerHandler := Register(database)
	body := types.RegisterRequest{
		Phone:    "+79001112233",
		Nickname: "meuser",
		Password: "pass123",
		Gender:   "m",
	}

	jsonBody, _ := json.Marshal(body)
	req := httptest.NewRequest("POST", "/register", bytes.NewBuffer(jsonBody))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	registerHandler(w, req)

	var user types.User
	json.Unmarshal(w.Body.Bytes(), &user)

	getMeHandler := GetMe(database)
	getMeReq := httptest.NewRequest("GET", "/me", nil)
	getMeReq.Header.Set("Authorization", "Bearer "+user.Token)

	getMeW := httptest.NewRecorder()
	getMeHandler(getMeW, getMeReq)

	if getMeW.Code != http.StatusOK {
		t.Errorf("Expected status 200, got %d", getMeW.Code)
	}

	var me types.User
	json.Unmarshal(getMeW.Body.Bytes(), &me)
	if me.Nickname != "meuser" {
		t.Errorf("Expected nickname meuser, got %s", me.Nickname)
	}
}

func TestGetMe_Unauthorized(t *testing.T) {
	database, cleanup := setupTestDB(t)
	defer cleanup()

	handler := GetMe(database)
	req := httptest.NewRequest("GET", "/me", nil)

	w := httptest.NewRecorder()
	handler(w, req)

	if w.Code != http.StatusUnauthorized {
		t.Errorf("Expected status 401, got %d. Body: %s", w.Code, w.Body.String())
	}
}

func TestGetMe_InvalidToken(t *testing.T) {
	database, cleanup := setupTestDB(t)
	defer cleanup()

	handler := GetMe(database)
	req := httptest.NewRequest("GET", "/me", nil)
	req.Header.Set("Authorization", "Bearer invalidtoken")

	w := httptest.NewRecorder()
	handler(w, req)

	if w.Code != http.StatusUnauthorized {
		t.Errorf("Expected status 401, got %d. Body: %s", w.Code, w.Body.String())
	}
}

func TestCompleteLevel_API(t *testing.T) {
	database, cleanup := setupTestDB(t)
	defer cleanup()

	registerHandler := Register(database)
	body := types.RegisterRequest{
		Phone:    "+79003334455",
		Nickname: "leveluser",
		Password: "pass123",
		Gender:   "m",
	}

	jsonBody, _ := json.Marshal(body)
	req := httptest.NewRequest("POST", "/register", bytes.NewBuffer(jsonBody))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	registerHandler(w, req)

	var user types.User
	json.Unmarshal(w.Body.Bytes(), &user)

	hub := ws.NewHub(database)
	go hub.Run()

	handler := CompleteLevel(database, hub)

	completeReq := types.CompleteRequest{
		Code:  "forward",
		Moves: 1,
	}
	jsonComplete, _ := json.Marshal(completeReq)

	httpReq := httptest.NewRequest("POST", "/levels/1/complete", bytes.NewBuffer(jsonComplete))
	httpReq.Header.Set("Content-Type", "application/json")
	httpReq.Header.Set("Authorization", "Bearer "+user.Token)

	ctx := httpReq.Context()
	ctx = context.WithValue(ctx, types.CtxLevelID, 1)
	r := httpReq.WithContext(ctx)

	httpW := httptest.NewRecorder()
	handler(httpW, r)

	if httpW.Code != http.StatusOK {
		t.Errorf("Expected status 200, got %d, body: %s", httpW.Code, httpW.Body.String())
	}
}

func TestCompleteLevel_Unauthorized(t *testing.T) {
	database, cleanup := setupTestDB(t)
	defer cleanup()

	hub := ws.NewHub(database)
	handler := CompleteLevel(database, hub)

	req := httptest.NewRequest("POST", "/levels/1/complete", nil)
	ctx := req.Context()
	ctx = context.WithValue(ctx, types.CtxLevelID, 1)
	r := req.WithContext(ctx)

	w := httptest.NewRecorder()
	handler(w, r)

	if w.Code != http.StatusUnauthorized {
		t.Errorf("Expected status 401, got %d", w.Code)
	}
}

func TestSaveAchievement(t *testing.T) {
	database, cleanup := setupTestDB(t)
	defer cleanup()

	registerHandler := Register(database)
	body := types.RegisterRequest{
		Phone:    "+79005556677",
		Nickname: "achuser",
		Password: "pass123",
		Gender:   "f",
	}

	jsonBody, _ := json.Marshal(body)
	req := httptest.NewRequest("POST", "/register", bytes.NewBuffer(jsonBody))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	registerHandler(w, req)

	var user types.User
	json.Unmarshal(w.Body.Bytes(), &user)

	handler := SaveAchievement(database)
	achReq := map[string]interface{}{
		"level_id":         1,
		"achievement_type": "first_level",
	}
	jsonAch, _ := json.Marshal(achReq)

	achHttpReq := httptest.NewRequest("POST", "/achievements", bytes.NewBuffer(jsonAch))
	achHttpReq.Header.Set("Content-Type", "application/json")
	achHttpReq.Header.Set("Authorization", "Bearer "+user.Token)

	achW := httptest.NewRecorder()
	handler(achW, achHttpReq)

	if achW.Code != http.StatusOK {
		t.Errorf("Expected status 200, got %d", achW.Code)
	}
}

func TestSaveAchievement_Unauthorized(t *testing.T) {
	database, cleanup := setupTestDB(t)
	defer cleanup()

	handler := SaveAchievement(database)
	req := httptest.NewRequest("POST", "/achievements", nil)

	w := httptest.NewRecorder()
	handler(w, req)

	if w.Code != http.StatusUnauthorized {
		t.Errorf("Expected status 401, got %d", w.Code)
	}
}

func TestGetProgress(t *testing.T) {
	database, cleanup := setupTestDB(t)
	defer cleanup()

	registerHandler := Register(database)
	body := types.RegisterRequest{
		Phone:    "+79007778899",
		Nickname: "proguser",
		Password: "pass123",
		Gender:   "m",
	}

	jsonBody, _ := json.Marshal(body)
	req := httptest.NewRequest("POST", "/register", bytes.NewBuffer(jsonBody))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	registerHandler(w, req)

	var user types.User
	json.Unmarshal(w.Body.Bytes(), &user)

	handler := GetProgress(database)
	progReq := httptest.NewRequest("GET", "/progress", nil)
	progReq.Header.Set("Authorization", "Bearer "+user.Token)

	progW := httptest.NewRecorder()
	handler(progW, progReq)

	if progW.Code != http.StatusOK {
		t.Errorf("Expected status 200, got %d", progW.Code)
	}

	var resp map[string]interface{}
	json.Unmarshal(progW.Body.Bytes(), &resp)

	progress := resp["progress"]
	if progress == nil {
		t.Error("Progress should not be nil")
	}
}

func TestGetProgress_GenderFilter(t *testing.T) {
	database, cleanup := setupTestDB(t)
	defer cleanup()

	registerHandler := Register(database)
	body := types.RegisterRequest{
		Phone:    "+79008889900",
		Nickname: "gendertest",
		Password: "pass123",
		Gender:   "m",
	}

	jsonBody, _ := json.Marshal(body)
	req := httptest.NewRequest("POST", "/register", bytes.NewBuffer(jsonBody))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	registerHandler(w, req)

	var user types.User
	json.Unmarshal(w.Body.Bytes(), &user)

	hub := ws.NewHub(database)
	go hub.Run()

	completeHandler := CompleteLevel(database, hub)
	completeReq := types.CompleteRequest{
		Code:    "right\nright\nright",
		Moves:   3,
		PlayerX: 3,
		PlayerY: 0,
	}
	jsonComplete, _ := json.Marshal(completeReq)
	httpReq := httptest.NewRequest("POST", "/levels/1/complete", bytes.NewBuffer(jsonComplete))
	httpReq.Header.Set("Content-Type", "application/json")
	httpReq.Header.Set("Authorization", "Bearer "+user.Token)
	ctx := httpReq.Context()
	ctx = context.WithValue(ctx, types.CtxLevelID, 1)
	r := httpReq.WithContext(ctx)
	httpW := httptest.NewRecorder()
	completeHandler(httpW, r)

	if httpW.Code != http.StatusOK {
		t.Fatalf("Complete level 1 failed: %d, body: %s", httpW.Code, httpW.Body.String())
	}

	progressHandler := GetProgress(database)
	progReq := httptest.NewRequest("GET", "/progress", nil)
	progReq.Header.Set("Authorization", "Bearer "+user.Token)
	progW := httptest.NewRecorder()
	progressHandler(progW, progReq)

	if progW.Code != http.StatusOK {
		t.Fatalf("GetProgress failed: %d", progW.Code)
	}

	var resp types.ProgressResponse
	if err := json.Unmarshal(progW.Body.Bytes(), &resp); err != nil {
		t.Fatalf("Failed to parse progress: %v", err)
	}

	if len(resp.Progress) == 0 {
		t.Fatal("Progress should not be empty after completing level 1")
	}

	found := false
	for _, p := range resp.Progress {
		if p.LevelID == 1 {
			found = true
			if p.Stars == 0 {
				t.Error("Level 1 should have stars > 0")
			}
		}
	}
	if !found {
		t.Error("Level 1 should be in progress response")
	}
}

func TestGetProgress_Unauthorized(t *testing.T) {
	database, cleanup := setupTestDB(t)
	defer cleanup()

	handler := GetProgress(database)
	req := httptest.NewRequest("GET", "/progress", nil)

	w := httptest.NewRecorder()
	handler(w, req)

	if w.Code != http.StatusUnauthorized {
		t.Errorf("Expected status 401, got %d", w.Code)
	}
}

func TestHandleWebSocket_ValidToken(t *testing.T) {
	database, cleanup := setupTestDB(t)
	defer cleanup()

	registerHandler := Register(database)
	body := types.RegisterRequest{
		Phone:    "+79009999001",
		Nickname: "wsuser",
		Password: "pass123",
		Gender:   "m",
	}

	jsonBody, _ := json.Marshal(body)
	req := httptest.NewRequest("POST", "/register", bytes.NewBuffer(jsonBody))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	registerHandler(w, req)

	var user types.User
	json.Unmarshal(w.Body.Bytes(), &user)

	hub := ws.NewHub(database)
	go hub.Run()
	defer hub.Shutdown()

	handler := HandleWebSocket(hub)
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		handler(w, r)
	}))
	defer server.Close()

	wsURL := "ws" + strings.TrimPrefix(server.URL, "http")
	conn, _, err := websocket.DefaultDialer.Dial(wsURL, nil)
	if err != nil {
		t.Fatalf("Failed to connect: %v", err)
	}
	defer conn.Close()

	authMsg := wsAuthMessage{Type: "auth", Token: user.Token}
	authJSON, _ := json.Marshal(authMsg)
	if err := conn.WriteMessage(websocket.TextMessage, authJSON); err != nil {
		t.Fatalf("Failed to send auth: %v", err)
	}

	conn.SetReadDeadline(time.Now().Add(200 * time.Millisecond))
	_, _, err = conn.ReadMessage()
	if err == nil {
		t.Log("Connection established successfully after auth")
	}
}
