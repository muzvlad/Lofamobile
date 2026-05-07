package auth

import (
	"log"
	"os"
	"time"

	"github.com/golang-jwt/jwt/v5"
)

var jwtSecret []byte

func Init() {
	secret := os.Getenv("JWT_SECRET")
	if secret == "" {
		log.Printf("[WARNING] JWT_SECRET not set, using DEFAULT secret!")
		secret = "codequest_secret_key_2026_default"
	}
	jwtSecret = []byte(secret)
	log.Printf("[AUTH] JWT secret initialized, len=%d", len(jwtSecret))
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
		return jwtSecret, nil
	})

	if err != nil || !token.Valid {
		return nil, err
	}

	claims, ok := token.Claims.(jwt.MapClaims)
	if !ok {
		return nil, jwt.ErrSignatureInvalid
	}

	return &claims, nil
}
