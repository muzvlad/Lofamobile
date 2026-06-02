package config

import (
	"log"
	"os"
	"time"
)

const defaultJWTSecret = "codequest_dev_secret"

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
		JWTSecret:    getEnv("JWT_SECRET", defaultJWTSecret),
		Port:         getEnv("PORT", "8080"),
		Env:          getEnv("ENV", "development"),
		StaticDir:    getEnv("STATIC_DIR", "./static"),
		FrontendDir:  getEnv("FRONTEND_DIR", "./frontend"),
		ReadTimeout:  15 * time.Second,
		WriteTimeout: 15 * time.Second,
		IdleTimeout:  60 * time.Second,
	}

	if cfg.JWTSecret == "" {
		log.Printf("[CONFIG] JWT_SECRET cannot be empty")
		return nil
	}

	if cfg.Env == "production" && cfg.JWTSecret == defaultJWTSecret {
		log.Printf("[WARN] JWT_SECRET is using default dev value in production!")
	}

	log.Printf("[CONFIG] Loaded: env=%s, port=%s, db=%s", cfg.Env, cfg.Port, cfg.DBPath)
	return cfg
}

func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}
