package config

import (
	"crypto/rand"
	"log"
	"os"
	"time"
)

type Config struct {
	DBPath       string
	JWTSecret    string
	Port         string
	Env          string
	StaticDir    string
	FrontendDir  string
	ReadTimeout  time.Duration
	WriteTimeout time.Duration
	IdleTimeout  time.Duration
}

func Load() *Config {
	cfg := &Config{
		DBPath:       getEnv("DB_PATH", "./codequest.db"),
		JWTSecret:    getJWTSecret(),
		Port:         getEnv("PORT", "8080"),
		Env:          getEnv("ENV", "development"),
		StaticDir:    getEnv("STATIC_DIR", "./static"),
		FrontendDir:  getEnv("FRONTEND_DIR", "./frontend"),
		ReadTimeout:  15 * time.Second,
		WriteTimeout: 15 * time.Second,
		IdleTimeout:  60 * time.Second,
	}

	if cfg.Env == "production" && os.Getenv("JWT_SECRET") == "" {
		log.Printf("[CONFIG] JWT_SECRET required in production mode")
		return nil
	}

	log.Printf("[CONFIG] Loaded: env=%s, port=%s, db=%s", cfg.Env, cfg.Port, cfg.DBPath)
	return cfg
}

func getJWTSecret() string {
	secret := os.Getenv("JWT_SECRET")
	if secret != "" {
		return secret
	}

	randomSecret := make([]byte, 32)
	if _, err := rand.Read(randomSecret); err != nil {
		log.Fatalf("[CONFIG] Cannot generate JWT secret: %v", err)
	}
	log.Printf("[WARN] JWT_SECRET not set, using random secret for this run")
	return string(randomSecret)
}

func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}
