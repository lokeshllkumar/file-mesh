package handlers

import (
	"context"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/lokeshllkumar/file-mesh/internal/middleware"
	"github.com/lokeshllkumar/file-mesh/internal/models"
	"github.com/lokeshllkumar/file-mesh/internal/utils"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

func GetUser(c *gin.Context) {
	userIDStr, exists := c.Get(middleware.UserIDContextKey)
	if !exists {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Context failure"})
		return
	}

	userID, _ := primitive.ObjectIDFromHex(userIDStr.(string))
	var user models.User
	err := utils.GetMongoCollection("users").FindOne(context.TODO(), bson.M{"_id": userID}).Decode(&user)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"id": user.ID.Hex(),
		"email": user.Email,
	})
}

func GetUserFromEmail(c *gin.Context) {
	email := c.Query("email")
	if email == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Email is required"})
		return
	}

	var user models.User
	err := utils.GetMongoCollection("users").FindOne(context.TODO(), bson.M{"email": email}).Decode(&user)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"id": user.ID.Hex(),
	})
}