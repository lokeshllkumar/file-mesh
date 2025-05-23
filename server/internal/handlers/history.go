package handlers

import (
	"context"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/lokeshllkumar/file-mesh/internal/models"
	"github.com/lokeshllkumar/file-mesh/internal/utils"
	"go.mongodb.org/mongo-driver/bson"
)

func FileHistory(c *gin.Context) {
	filesCollection := utils.GetMongoCollection("file_history")
	userId := c.Query("userId")

	if userId == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Missing userId parameter"})
		return
	}

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	cursor, err := filesCollection.Find(ctx, bson.M{"userId": userId})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch file history"})
	}
	defer cursor.Close(ctx)

	var history []models.FileMetadata
	for cursor.Next(ctx) {
		var file models.FileMetadata
		if err := cursor.Decode(&file); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to decode file record"})
			return
		}
		history = append(history, file)
	}

	c.JSON(http.StatusOK, history)
}
