package utils

import (
	"errors"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/lokeshllkumar/file-mesh/config"
)

type JWTClaims struct {
	UserID string `json:"userId"`
	jwt.RegisteredClaims
}

var cfg = config.LoadConfig()

func GenerateJWT(userID string) (string, error) {
	secret := cfg.JWTSecret
	if secret == "" {
		return "", errors.New("JWT secret not set")
	}

	claims := JWTClaims{
		UserID: userID,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(72 * time.Hour)),
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString([]byte(secret))
}

func VerifyJWT(tokenStr string) (*JWTClaims, error) {
	secret := cfg.JWTSecret
	if secret == "" {
		return nil, errors.New("JWT secret not set")
	}

	token, err := jwt.ParseWithClaims(tokenStr, &JWTClaims{}, func(t *jwt.Token) (interface{}, error) {
		return []byte(secret), nil
	})
	if err != nil {
		return nil, err
	}

	claims, ok := token.Claims.(*JWTClaims)
	if !ok || !token.Valid {
		return nil, errors.New("invalid token")
	}

	return claims, nil
}
