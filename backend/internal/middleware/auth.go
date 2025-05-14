package middleware

import (
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
)

const userIDContextKey = "userID"

func Auth() gin.HandlerFunc {
	return func(c *gin.Context) {
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "Missing authroization header"})
			return
		}

		token := strings.TrimPrefix(authHeader, "Bearer")
		claims, err := utils.VerifyJWT(token)
	}
}
