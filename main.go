package main

import (
	"log"
	"net/http"
	"os"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/yongliucc/link-deck/handlers"
	"github.com/yongliucc/link-deck/middleware"
	"github.com/yongliucc/link-deck/models"
)

func main() {
	// Initialize database
	models.InitDB()
	defer models.CloseDB()

	// Set the server mode based on environment variable or default to release mode
	mode := strings.ToLower(os.Getenv("GIN_MODE"))
	if mode == "debug" {
		gin.SetMode(gin.DebugMode)
	} else {
		gin.SetMode(gin.ReleaseMode)
	}

	// Create a default gin router
	router := gin.Default()

	// Log middleware (only in debug mode)
	if mode == "debug" {
		router.Use(func(c *gin.Context) {
			log.Printf("Request: %s %s", c.Request.Method, c.Request.URL.Path)
			c.Next()
			log.Printf("Response: %d", c.Writer.Status())
		})
	}

	// Enable CORS
	router.Use(func(c *gin.Context) {
		c.Writer.Header().Set("Access-Control-Allow-Origin", "*")
		c.Writer.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		c.Writer.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")

		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(http.StatusNoContent)
			return
		}

		c.Next()
	})

	// API routes
	api := router.Group("/api")
	{
		// Public routes
		api.POST("/login", handlers.Login)
		api.GET("/links", handlers.GetAllLinkGroups)

		// Protected routes
		protected := api.Group("/admin")
		protected.Use(middleware.AuthMiddleware())
		{
			// User routes
			protected.POST("/change-password", handlers.ChangePassword)

			// Link group routes
			protected.GET("/link-groups", handlers.GetAllLinkGroups)
			protected.POST("/link-groups", handlers.CreateLinkGroup)
			protected.PUT("/link-groups/:id", handlers.UpdateLinkGroup)
			protected.DELETE("/link-groups/:id", handlers.DeleteLinkGroup)

			// Link routes
			protected.GET("/link-groups/:id/links", handlers.GetLinksByGroupID)
			protected.POST("/links", handlers.CreateLink)
			protected.PUT("/links/:id", handlers.UpdateLink)
			protected.DELETE("/links/:id", handlers.DeleteLink)
		}
	}

	// Serve static files from the UI build directory
	router.StaticFS("/assets", http.Dir("./ui/dist/assets"))
	router.StaticFile("/favicon.ico", "./ui/dist/favicon.ico")

	// Handle any routes that don't match static files
	router.NoRoute(func(c *gin.Context) {
		if mode == "debug" {
			log.Printf("No route found for %s, serving index.html", c.Request.URL.Path)
		}
		// Serve the index.html for any unmatched routes (for SPA routing)
		c.File("./ui/dist/index.html")
	})

	// Get port from environment variable or use default
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	// Start the server
	log.Printf("Server starting on port %s in %s mode...\n", port, gin.Mode())
	if err := router.Run(":" + port); err != nil {
		log.Fatalf("Failed to start server: %v", err)
	}
}
