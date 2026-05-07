package api

import (
	"net/http"
	"sync"

	"golang.org/x/time/rate"
)

type IPRateLimiter struct {
	limiters map[string]*rate.Limiter
	mu      sync.RWMutex
	rps     rate.Limit
	burst  int
}

func NewIPRateLimiter(rps rate.Limit, burst int) *IPRateLimiter {
	limiters := make(map[string]*rate.Limiter)
	return &IPRateLimiter{
		limiters: limiters,
		rps:      rps,
		burst:   burst,
	}
}

func (r *IPRateLimiter) getLimiter(ip string) *rate.Limiter {
	r.mu.Lock()
	defer r.mu.Unlock()

	limiter, exists := r.limiters[ip]
	if exists {
		return limiter
	}

	limiter = rate.NewLimiter(r.rps, r.burst)
	r.limiters[ip] = limiter

	return limiter
}

func (r *IPRateLimiter) Limit(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, req *http.Request) {
		ip := req.RemoteAddr

		limiter := r.getLimiter(ip)
		if !limiter.Allow() {
			http.Error(w, "Слишком много запросов", http.StatusTooManyRequests)
			return
		}

		next.ServeHTTP(w, req)
	})
}