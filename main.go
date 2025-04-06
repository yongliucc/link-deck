package main

import (
	"encoding/json"
	"flag"
	"fmt"
	"log"
	"net/http"
	"os"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/yongliucc/link-deck/handlers"
	"github.com/yongliucc/link-deck/middleware"
	"github.com/yongliucc/link-deck/models"
)

type Config struct {
	Server struct {
		Port int `json:"port"`
		CORS struct {
			AllowedOrigins []string `json:"allowed_origins"`
			AllowedMethods []string `json:"allowed_methods"`
			AllowedHeaders []string `json:"allowed_headers"`
		} `json:"cors"`
	} `json:"server"`
	Database struct {
		Path string `json:"path"`
	} `json:"database"`
	Auth struct {
		JWTSecret string `json:"jwt_secret"`
	} `json:"auth"`
}

func loadConfig(configPath string) (*Config, error) {
	var config Config

	// Default values
	config.Server.Port = 8080
	config.Server.CORS.AllowedOrigins = []string{"*"}
	config.Server.CORS.AllowedMethods = []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"}
	config.Server.CORS.AllowedHeaders = []string{"Content-Type", "Authorization"}

	// If config path is provided, load from file
	if configPath != "" {
		file, err := os.Open(configPath)
		if err != nil {
			return nil, err
		}
		defer file.Close()

		decoder := json.NewDecoder(file)
		if err := decoder.Decode(&config); err != nil {
			return nil, err
		}
	}

	return &config, nil
}

func main() {
	// Parse command line flags
	configPath := flag.String("config", "", "Path to config file")
	devMode := flag.Bool("dev", false, "Run in development mode")
	flag.Parse()

	// If in dev mode and no config specified, use the dev config
	if *devMode && *configPath == "" {
		*configPath = "config.dev.json"
		log.Printf("Running in development mode with config: %s", *configPath)
	}

	// Load configuration
	config, err := loadConfig(*configPath)
	if err != nil {
		log.Fatalf("Failed to load config: %v", err)
	}

	// Set JWT secret from config
	if config.Auth.JWTSecret != "" {
		os.Setenv("JWT_SECRET", config.Auth.JWTSecret)
	}

	// Initialize database
	if config.Database.Path != "" {
		os.Setenv("DB_PATH", config.Database.Path)
	}
	models.InitDB()
	defer models.CloseDB()

	// Set the server mode based on environment variable or dev flag
	if *devMode {
		gin.SetMode(gin.DebugMode)
	} else {
		mode := strings.ToLower(os.Getenv("GIN_MODE"))
		if mode == "debug" {
			gin.SetMode(gin.DebugMode)
		} else {
			gin.SetMode(gin.ReleaseMode)
		}
	}

	// Create a default gin router
	router := gin.Default()

	// Log middleware (only in debug mode)
	if gin.Mode() == gin.DebugMode {
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
		// Get origin
		origin := c.Request.Header.Get("Origin")

		// Check if origin is allowed
		allowedOrigin := "*"
		if len(config.Server.CORS.AllowedOrigins) > 0 {
			if origin != "" {
				allowed := false
				for _, allowedOrigin := range config.Server.CORS.AllowedOrigins {
					if allowedOrigin == "*" || allowedOrigin == origin {
						allowed = true
						break
					}
				}

				if allowed {
					allowedOrigin = origin
				} else {
					allowedOrigin = config.Server.CORS.AllowedOrigins[0]
				}
			}
		}

		c.Writer.Header().Set("Access-Control-Allow-Origin", allowedOrigin)
		c.Writer.Header().Set("Access-Control-Allow-Methods", strings.Join(config.Server.CORS.AllowedMethods, ", "))
		c.Writer.Header().Set("Access-Control-Allow-Headers", strings.Join(config.Server.CORS.AllowedHeaders, ", "))
		c.Writer.Header().Set("Access-Control-Allow-Credentials", "true")

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

	// In production or combined mode, serve static files from the UI build directory
	if !*devMode {
		// Serve static files from the UI build directory
		router.StaticFS("/assets", http.Dir("./ui/dist/assets"))
		router.StaticFile("/favicon.ico", "./ui/dist/favicon.ico")

		// Handle any routes that don't match static files
		router.NoRoute(func(c *gin.Context) {
			if gin.Mode() == gin.DebugMode {
				log.Printf("No route found for %s, serving index.html", c.Request.URL.Path)
			}
			// Serve the index.html for any unmatched routes (for SPA routing)
			c.File("./ui/dist/index.html")
		})
	}

	// Get port from config, environment variable, or use default
	port := ""
	if config.Server.Port > 0 {
		port = fmt.Sprintf("%d", config.Server.Port)
	} else {
		port = os.Getenv("PORT")
		if port == "" {
			port = "8080"
		}
	}

	// Start the server
	log.Printf("Server starting on port %s in %s mode...\n", port, gin.Mode())
	if err := router.Run(":" + port); err != nil {
		log.Fatalf("Failed to start server: %v", err)
	}
}
