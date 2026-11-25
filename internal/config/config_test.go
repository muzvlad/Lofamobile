package config

import (
	"os"
	"testing"
)

func TestLoad(t *testing.T) {
	cfg := Load()

	if cfg == nil {
		t.Fatal("Config should not be nil")
	}

	if cfg.DBPath == "" {
		t.Error("DBPath should not be empty")
	}

	if cfg.Port == "" {
		t.Error("Port should not be empty")
	}

	if cfg.Env == "" {
		t.Error("Env should not be empty")
	}
}

func TestLoad_DefaultValues(t *testing.T) {
	os.Unsetenv("DB_PATH")
	os.Unsetenv("JWT_SECRET")
	os.Unsetenv("PORT")
	os.Unsetenv("ENV")

	cfg := Load()

	if cfg.DBPath != "./codequest.db" {
		t.Errorf("Expected default DB_PATH ./codequest.db, got %s", cfg.DBPath)
	}

	if cfg.Port != "8080" {
		t.Errorf("Expected default PORT 8080, got %s", cfg.Port)
	}

	if cfg.Env != "development" {
		t.Errorf("Expected default ENV development, got %s", cfg.Env)
	}
}

func TestLoad_CustomValues(t *testing.T) {
	os.Setenv("DB_PATH", "/custom/path.db")
	os.Setenv("JWT_SECRET", "test_secret")
	os.Setenv("PORT", "9090")
	os.Setenv("ENV", "production")
	defer func() {
		os.Unsetenv("DB_PATH")
		os.Unsetenv("JWT_SECRET")
		os.Unsetenv("PORT")
		os.Unsetenv("ENV")
	}()

	cfg := Load()

	if cfg.DBPath != "/custom/path.db" {
		t.Errorf("Expected DB_PATH /custom/path.db, got %s", cfg.DBPath)
	}

	if cfg.JWTSecret != "test_secret" {
		t.Errorf("Expected JWT_SECRET test_secret, got %s", cfg.JWTSecret)
	}

	if cfg.Port != "9090" {
		t.Errorf("Expected PORT 9090, got %s", cfg.Port)
	}

	if cfg.Env != "production" {
		t.Errorf("Expected ENV production, got %s", cfg.Env)
	}
}

func TestConfig_Timeouts(t *testing.T) {
	cfg := Load()

	if cfg.ReadTimeout == 0 {
		t.Error("ReadTimeout should not be 0")
	}

	if cfg.WriteTimeout == 0 {
		t.Error("WriteTimeout should not be 0")
	}

	if cfg.IdleTimeout == 0 {
		t.Error("IdleTimeout should not be 0")
	}
}
