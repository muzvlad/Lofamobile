package api

import (
	"net/http"
	"strings"
	"sync"
	"time"

	"golang.org/x/time/rate"
)

type ipEntry struct {
	limiter   *rate.Limiter
	lastSeen  time.Time
}

type IPRateLimiter struct {
	entries map[string]*ipEntry
	mu      sync.RWMutex
	rps     rate.Limit
	burst   int
	stopCh  chan struct{}
}

func NewIPRateLimiter(rps rate.Limit, burst int) *IPRateLimiter {
	limiter := &IPRateLimiter{
		entries: make(map[string]*ipEntry),
		rps:     rps,
		burst:   burst,
		stopCh:  make(chan struct{}),
	}
	go limiter.cleanup()
	return limiter
}

func (r *IPRateLimiter) Stop() {
	close(r.stopCh)
}

func (r *IPRateLimiter) cleanup() {
	ticker := time.NewTicker(10 * time.Minute)
	defer ticker.Stop()
	for {
		select {
		case <-r.stopCh:
			return
		case <-ticker.C:
			r.mu.Lock()
			threshold := time.Now().Add(-30 * time.Minute)
			for ip, entry := range r.entries {
				if entry.lastSeen.Before(threshold) {
					delete(r.entries, ip)
				}
			}
			r.mu.Unlock()
		}
	}
}

func (r *IPRateLimiter) getLimiter(ip string) *rate.Limiter {
	r.mu.Lock()
	defer r.mu.Unlock()

	entry, exists := r.entries[ip]
	if exists {
		entry.lastSeen = time.Now()
		return entry.limiter
	}

	limiter := rate.NewLimiter(r.rps, r.burst)
	r.entries[ip] = &ipEntry{limiter: limiter, lastSeen: time.Now()}

	return limiter
}

func getClientIP(req *http.Request) string {
	if fwd := req.Header.Get("X-Forwarded-For"); fwd != "" {
		if idx := strings.IndexByte(fwd, ','); idx > 0 {
			return strings.TrimSpace(fwd[:idx])
		}
		return strings.TrimSpace(fwd)
	}
	if real := req.Header.Get("X-Real-IP"); real != "" {
		return strings.TrimSpace(real)
	}
	if idx := strings.LastIndexByte(req.RemoteAddr, ':'); idx > 0 {
		return req.RemoteAddr[:idx]
	}
	return req.RemoteAddr
}

func (r *IPRateLimiter) Limit(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, req *http.Request) {
		path := req.URL.Path

		staticPrefixes := []string{"/static/", "/scripts/", "/styles/", "/flags/", "/assets/", "/frontend/", "/favicon.ico"}
		for _, prefix := range staticPrefixes {
			if strings.HasPrefix(path, prefix) {
				next.ServeHTTP(w, req)
				return
			}
		}

		ip := getClientIP(req)

		limiter := r.getLimiter(ip)
		if !limiter.Allow() {
			http.Error(w, "Слишком много запросов", http.StatusTooManyRequests)
			return
		}

		next.ServeHTTP(w, req)
	})
}