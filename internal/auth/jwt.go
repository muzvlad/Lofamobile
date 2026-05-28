package auth

import (
	"fmt"
	"log"
	"os"
	"time"

	"github.com/golang-jwt/jwt/v5"
)

var jwtSecret []byte

func Init() error {
	secret := os.Getenv("JWT_SECRET")
	if secret == "" {
		return fmt.Errorf("[AUTH] JWT_SECRET environment variable is required")
	}
	jwtSecret = []byte(secret)
	log.Printf("[AUTH] JWT secret initialized, len=%d", len(jwtSecret))
	return nil
}

func GetSecret() []byte {
	return jwtSecret
}

func GenerateToken(userID int, phone, nickname, gender, performer string) (string, error) {
	log.Printf("[JWT] Generating token with secret len=%d", len(jwtSecret))
	claims := jwt.MapClaims{
		"user_id":   userID,
		"phone":     phone,
		"nickname":  nickname,
		"gender":    gender,
		"performer": performer,
		"exp":       time.Now().Add(time.Hour * 24).Unix(),
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString(jwtSecret)
}

func ValidateToken(tokenString string) (*jwt.MapClaims, error) {
	token, err := jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("unexpected signing method: %v", token.Header["alg"])
		}
		return jwtSecret, nil
	})

	if err != nil {
		return nil, err
	}

	if !token.Valid {
		return nil, fmt.Errorf("invalid token")
	}

	claims, ok := token.Claims.(jwt.MapClaims)
	if !ok {
		return nil, fmt.Errorf("invalid token claims")
	}

	return &claims, nil
}
