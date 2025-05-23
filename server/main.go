package main

import (
	"github.com/gin-gonic/gin"
	"github.com/lokeshllkumar/file-mesh/config"
	"github.com/lokeshllkumar/file-mesh/internal/handlers"
	"github.com/lokeshllkumar/file-mesh/internal/middleware"
	"github.com/lokeshllkumar/file-mesh/internal/signalling"
	"github.com/lokeshllkumar/file-mesh/internal/utils"
)

func main() {
	utils.InitMongo()

	cfg := config.LoadConfig()

	router := gin.Default()

	router.Use(gin.Recovery())
	router.Use(middleware.CORS())
	router.Use(middleware.Logger())

	public := router.Group("/api")
	{
		public.POST("/signup", handlers.SignUp)
		public.POST("/login", handlers.Login)
		public.GET("/user", middleware.Auth(), handlers.GetUser)
		public.GET("/user/email", middleware.Auth(), handlers.GetUserFromEmail)		
	}

	private := router.Group("/api")
	private.Use(middleware.Auth())
	{
		private.GET("/me", handlers.GetUser)
	}

	router.GET("/ws", signalling.ServerWS)

	router.Run(":" + cfg.ServerPort)
}
