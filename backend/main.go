package main

import (
	"log"
	"github.com/gin-gonic/gin"
	"github.com/lokeshllkumar/file-mesh/internal/middleware"
	"github.com/lokeshllkumar/file-mesh/config"
)

func main() {
	cfg := config.LoadConfig()
	router := gin.Default()

	router.Use(middleware.CORS())

	api := router.Group("/api")
	{
		api.POST("signup", handlers.SignUp)
		api.POST("login", handlers.Login)
		api.GET("/user", middleware.Auth(), handlers.GetUser)
	}
}