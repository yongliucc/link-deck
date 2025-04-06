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
			// Log request details
			log.Printf("Request: %s %s", c.Request.Method, c.Request.URL.Path)
			
			// Log headers in debug mode
			log.Printf("Headers:")
			for key, values := range c.Request.Header {
				log.Printf("  %s: %v", key, values)
			}
			
			// Proceed with request
			c.Next()
			
			// Log response status
			log.Printf("Response: %d", c.Writer.Status())
			
			// Log response headers
			log.Printf("Response Headers:")
			for key, values := range c.Writer.Header() {
				log.Printf("  %s: %v", key, values)
			}
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
		protected.Use(func(c *gin.Context) {
			log.Printf("Admin request: %s %s", c.Request.Method, c.Request.URL.Path)
			// Special case for link-groups
			if c.Request.URL.Path == "/api/admin/link-groups" && c.Request.Method == "GET" {
				// Try normal auth first
				authHeader := c.GetHeader("Authorization")
				if authHeader == "" {
					log.Printf("Missing Authorization header for link-groups. Will return empty array instead of 401.")
					// Continue processing but mark as unauthorized
					c.Set("auth_failed", true)
					c.Next()
					return
				}
			}
			// Regular flow - apply auth middleware
			middleware.AuthMiddleware()(c)
		})
		{
			// Special handler for link-groups that can handle unauthorized requests
			protected.GET("/link-groups", func(c *gin.Context) {
				// Check if auth failed but we're letting it through
				if authFailed, exists := c.Get("auth_failed"); exists && authFailed.(bool) {
					log.Printf("Returning empty array for unauthorized link-groups request")
					c.JSON(http.StatusOK, []struct{}{})
					return
				}
				
				// Normal flow - pass to the regular handler
				handlers.GetAllLinkGroups(c)
			})
			
			// User routes
			protected.POST("/change-password", handlers.ChangePassword)

			// Link group routes (except GET which is handled above)
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
