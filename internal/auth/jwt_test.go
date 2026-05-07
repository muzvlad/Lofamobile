package auth

import (
	"testing"
	"time"
)

func TestInit(t *testing.T) {
	Init()

	secret := GetSecret()
	if secret == nil {
		t.Fatal("JWT secret should not be nil")
	}

	if len(secret) == 0 {
		t.Error("JWT secret should have length > 0")
	}
}

func TestGenerateToken(t *testing.T) {
	Init()

	token, err := GenerateToken(1, "+79001234567", "testuser", "boy", "builder")
	if err != nil {
		t.Fatalf("Failed to generate token: %v", err)
	}

	if token == "" {
		t.Error("Token should not be empty")
	}
}

func TestValidateToken_Valid(t *testing.T) {
	Init()

	token, err := GenerateToken(1, "+79001234567", "testuser", "boy", "builder")
	if err != nil {
		t.Fatalf("Failed to generate token: %v", err)
	}

	claims, err := ValidateToken(token)
	if err != nil {
		t.Fatalf("Failed to validate token: %v", err)
	}

	if claims == nil {
		t.Fatal("Claims should not be nil")
	}

	userID := int((*claims)["user_id"].(float64))
	if userID != 1 {
		t.Errorf("Expected user_id 1, got %d", userID)
	}

	nickname := (*claims)["nickname"].(string)
	if nickname != "testuser" {
		t.Errorf("Expected nickname testuser, got %s", nickname)
	}
}

func TestValidateToken_Invalid(t *testing.T) {
	Init()

	_, err := ValidateToken("invalid.token.here")
	if err == nil {
		t.Error("Should return error for invalid token")
	}
}

func TestValidateToken_Empty(t *testing.T) {
	Init()

	_, err := ValidateToken("")
	if err == nil {
		t.Error("Should return error for empty token")
	}
}

func TestGenerateToken_DifferentUsers(t *testing.T) {
	Init()

	token1, _ := GenerateToken(1, "+79001234567", "user1", "boy", "builder")
	token2, _ := GenerateToken(2, "+79009876543", "user2", "girl", "performer")

	if token1 == token2 {
		t.Error("Tokens for different users should be different")
	}
}

func TestTokenExpiration(t *testing.T) {
	Init()

	token, _ := GenerateToken(1, "+79001234567", "testuser", "boy", "builder")

	claims, err := ValidateToken(token)
	if err != nil {
		t.Fatalf("Failed to validate token: %v", err)
	}

	exp := (*claims)["exp"].(float64)
	expTime := time.Unix(int64(exp), 0)

	now := time.Now()
	if expTime.Before(now) {
		t.Error("Token expiration should be in the future")
	}

	duration := expTime.Sub(now)
	if duration < time.Hour*23 || duration > time.Hour*25 {
		t.Errorf("Token expiration should be ~24 hours, got %v", duration)
	}
}
