package auth

import (
	"fmt"
	"log"
	"time"

	"github.com/golang-jwt/jwt/v5"
)

var jwtSecret []byte

func Init(secret string) error {
	if secret == "" {
		log.Printf("[AUTH] JWT_SECRET not set")
		return fmt.Errorf("JWT_SECRET is required")
	}
	jwtSecret = []byte(secret)
	return nil
}

func GetSecret() []byte {
	return jwtSecret
}

func GenerateToken(userID int, phone, nickname, gender, performer string) (string, error) {
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
