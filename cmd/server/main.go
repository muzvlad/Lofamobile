package main

import (
	"codequest/internal/api"
	"codequest/internal/auth"
	"codequest/internal/config"
	"codequest/internal/db"
	"codequest/internal/types"
	"codequest/internal/ws"
	"context"
	"log"
	"net"
	"net/http"
	"os"
	"os/signal"
	"strconv"
	"strings"
	"syscall"
	"time"
)

type contextKey string

const (
	ctxLevelID contextKey = "level_id"
)

func main() {
	cfg := config.Load()
	if cfg == nil {
		os.Exit(1)
	}

	staticDir := cfg.StaticDir
	frontendDir := cfg.FrontendDir

	log.SetFlags(log.Lshortfile)
	log.Printf("[START] Static: %s, Frontend: %s", staticDir, frontendDir)

	if err := auth.Init(); err != nil {
		log.Printf("[ERROR] Auth: %v", err)
		os.Exit(1)
	}

	database, err := db.Connect()
	if err != nil {
		log.Printf("[ERROR] DB: %v", err)
		os.Exit(1)
	}
	defer database.Close()

	if err := db.Migrate(database); err != nil {
		log.Printf("[ERROR] Migrate: %v", err)
		os.Exit(1)
	}

	hub := ws.NewHub(database)
	go hub.Run()

	staticHandler := http.FileServer(http.Dir(staticDir))
	frontendHandler := http.FileServer(http.Dir(frontendDir))

	mux := http.NewServeMux()

	mux.HandleFunc("/api/auth/register", api.Register(database))
	mux.HandleFunc("/api/auth/login", api.Login(database))
	mux.HandleFunc("/api/auth/me", api.GetMe(database))
	mux.HandleFunc("/api/auth/profile", api.UpdateProfile(database))
	mux.HandleFunc("/api/levels/", func(w http.ResponseWriter, r *http.Request) {
		path := r.URL.Path[len("/api/levels/"):]

		if path == "" {
			api.GetLevels(database)(w, r)
			return
		}

		if strings.HasSuffix(path, "/complete") {
			levelIDStr := path[:len(path)-9]
			id, err := strconv.Atoi(levelIDStr)
			if err != nil || id < 1 || id > types.MaxLevels {
				http.Error(w, "Неверный уровень", http.StatusBadRequest)
				return
			}
			ctx := r.Context()
			ctx = context.WithValue(ctx, ctxLevelID, id)
			r = r.WithContext(ctx)
			api.CompleteLevel(database, hub)(w, r)
			return
		}

		id, err := strconv.Atoi(path)
		if err != nil || id < 1 || id > types.MaxLevels {
			http.Error(w, "Неверный уровень", http.StatusBadRequest)
			return
		}

		ctx := r.Context()
		ctx = context.WithValue(ctx, ctxLevelID, id)
		r = r.WithContext(ctx)
		api.GetLevel(database)(w, r)
	})
	mux.HandleFunc("/api/leaderboard", api.GetLeaderboard(database))
	mux.HandleFunc("/api/achievements", func(w http.ResponseWriter, r *http.Request) {
		if r.Method == "GET" {
			api.GetAchievements(database)(w, r)
		} else {
			api.SaveAchievement(database)(w, r)
		}
	})
	mux.HandleFunc("/api/progress", api.GetProgress(database))
	mux.HandleFunc("/api/score", api.GetUserScore(database))
	mux.HandleFunc("/ws", func(w http.ResponseWriter, r *http.Request) {
		log.Printf("[MAIN] /ws request received, method: %s", r.Method)
		api.HandleWebSocket(hub)(w, r)
	})

	handler := api.CorsMiddleware(mux)
	handler = api.LoggingMiddleware(handler)
	handler = api.RecoverMiddleware(handler)

	rateLimiter := api.NewIPRateLimiter(30, 50)
	handler = rateLimiter.Limit(handler)

	mux.Handle("/static/", http.StripPrefix("/static/", staticHandler))
	mux.Handle("/scripts/", http.StripPrefix("/scripts/", staticHandler))
	mux.Handle("/styles/", http.StripPrefix("/styles/", staticHandler))
	mux.Handle("/flags/", http.StripPrefix("/flags/", http.FileServer(http.Dir(staticDir+"/flags"))))
	mux.Handle("/favicon.ico", staticHandler)
	mux.Handle("/assets/", staticHandler)
	mux.Handle("/frontend/", http.StripPrefix("/frontend/", frontendHandler))
	mux.Handle("/", staticHandler)

	addr := ":" + cfg.Port
	srv := &http.Server{
		Addr:         addr,
		Handler:      handler,
		ReadTimeout:  cfg.ReadTimeout,
		WriteTimeout: cfg.WriteTimeout,
		IdleTimeout:  cfg.IdleTimeout,
	}

	go func() {
		log.Printf("[OK] Ready")
		log.Printf("[INFO] http://localhost:%s", cfg.Port)
		log.Printf("[INFO] http://%s:%s", getLocalIP(), cfg.Port)

		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatalf("[ERROR] ListenAndServe: %v", err)
		}
	}()

	quit := make(chan os.Signal, 1)
	signal.Notify(quit, os.Interrupt, syscall.SIGTERM)
	<-quit

	log.Printf("[SHUTDOWN] Starting graceful shutdown...")

	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()

	if err := srv.Shutdown(ctx); err != nil {
		log.Printf("[SHUTDOWN] Server shutdown error: %v", err)
	}

	hub.Shutdown()
	
	log.Printf("[SHUTDOWN] Server stopped")
}

func getLocalIP() string {
	addrs, _ := net.InterfaceAddrs()
	for _, addr := range addrs {
		if ipNet, ok := addr.(*net.IPNet); ok && ipNet.IP.To4() != nil && !ipNet.IP.IsLoopback() {
			return ipNet.IP.String()
		}
	}
	return "localhost"
}
