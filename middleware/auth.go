package middleware

import (
	"net/http"
	"os"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
	"log"
)

// JWTClaims represents the claims in the JWT
type JWTClaims struct {
	UserID   int64  `json:"user_id"`
	Username string `json:"username"`
	jwt.RegisteredClaims
}

// GenerateToken generates a new JWT token
func GenerateToken(userID int64, username string) (string, error) {
	// Get JWT secret from environment variable or use default
	jwtSecret := os.Getenv("JWT_SECRET")
	if jwtSecret == "" {
		jwtSecret = "your-secret-key" // Default secret key (change in production)
	}

	// Create the claims
	claims := JWTClaims{
		UserID:   userID,
		Username: username,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(100 * 24 * time.Hour)), // Token expires in 1000 days
			IssuedAt:  jwt.NewNumericDate(time.Now()),
			NotBefore: jwt.NewNumericDate(time.Now()),
		},
	}

	// Create token with claims
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)

	// Generate encoded token
	return token.SignedString([]byte(jwtSecret))
}

// AuthMiddleware is a middleware to check if the user is authenticated
func AuthMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		// Get the Authorization header
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			log.Printf("AuthMiddleware: Authorization header is missing for %s %s", c.Request.Method, c.Request.URL.Path)
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Authorization header is required"})
			c.Abort()
			return
		}

		// Check if the Authorization header has the correct format
		parts := strings.Split(authHeader, " ")
		if len(parts) != 2 || parts[0] != "Bearer" {
			log.Printf("AuthMiddleware: Invalid Authorization header format: %s for %s %s", authHeader, c.Request.Method, c.Request.URL.Path)
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Authorization header format must be Bearer {token}"})
			c.Abort()
			return
		}

		// Get the token
		tokenString := parts[1]
		log.Printf("AuthMiddleware: Received token: %s... for %s %s", tokenString[:10]+"...", c.Request.Method, c.Request.URL.Path)

		// Parse the token
		token, err := jwt.ParseWithClaims(tokenString, &JWTClaims{}, func(token *jwt.Token) (interface{}, error) {
			// Get JWT secret from environment variable or use default
			jwtSecret := os.Getenv("JWT_SECRET")
			if jwtSecret == "" {
				jwtSecret = "your-secret-key" // Default secret key (change in production)
			}
			return []byte(jwtSecret), nil
		})

		if err != nil {
			log.Printf("AuthMiddleware: Invalid token error: %v for %s %s", err, c.Request.Method, c.Request.URL.Path)
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid token: " + err.Error()})
			c.Abort()
			return
		}

		// Check if the token is valid
		if !token.Valid {
			log.Printf("AuthMiddleware: Token validation failed for %s %s", c.Request.Method, c.Request.URL.Path)
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid token"})
			c.Abort()
			return
		}

		// Get the claims
		claims, ok := token.Claims.(*JWTClaims)
		if !ok {
			log.Printf("AuthMiddleware: Invalid token claims for %s %s", c.Request.Method, c.Request.URL.Path)
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid token claims"})
			c.Abort()
			return
		}

		// Set the user ID and username in the context
		c.Set("userID", claims.UserID)
		c.Set("username", claims.Username)
		log.Printf("AuthMiddleware: Authentication successful for user %s (ID: %d) for %s %s", 
			claims.Username, claims.UserID, c.Request.Method, c.Request.URL.Path)

		c.Next()
	}
}
