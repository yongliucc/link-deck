package models

import (
	"database/sql"
	"log"
	"os"
	"path/filepath"

	_ "github.com/mattn/go-sqlite3"
)

var DB *sql.DB

// InitDB initializes the database connection
func InitDB() {
	// Create data directory if it doesn't exist
	dataDir := "./data"
	if _, err := os.Stat(dataDir); os.IsNotExist(err) {
		if err := os.MkdirAll(dataDir, 0755); err != nil {
			log.Fatalf("Failed to create data directory: %v", err)
		}
	}

	dbPath := filepath.Join(dataDir, "linkdesk.db")
	db, err := sql.Open("sqlite3", dbPath)
	if err != nil {
		log.Fatalf("Failed to open database: %v", err)
	}

	// Test the connection
	if err = db.Ping(); err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}

	DB = db
	log.Println("Database connection established")

	// Create tables if they don't exist
	createTables()
}

// createTables creates the necessary tables if they don't exist
func createTables() {
	// Create users table
	_, err := DB.Exec(`
	CREATE TABLE IF NOT EXISTS users (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		username TEXT NOT NULL UNIQUE,
		password TEXT NOT NULL,
		created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
		updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
	)`)
	if err != nil {
		log.Fatalf("Failed to create users table: %v", err)
	}

	// Create link_groups table
	_, err = DB.Exec(`
	CREATE TABLE IF NOT EXISTS link_groups (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		name TEXT NOT NULL,
		sort_order INTEGER NOT NULL DEFAULT 0,
		created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
		updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
	)`)
	if err != nil {
		log.Fatalf("Failed to create link_groups table: %v", err)
	}

	// Create links table
	_, err = DB.Exec(`
	CREATE TABLE IF NOT EXISTS links (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		group_id INTEGER NOT NULL,
		name TEXT NOT NULL,
		url TEXT NOT NULL,
		icon TEXT,
		sort_order INTEGER NOT NULL DEFAULT 0,
		created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
		updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
		FOREIGN KEY (group_id) REFERENCES link_groups(id) ON DELETE CASCADE
	)`)
	if err != nil {
		log.Fatalf("Failed to create links table: %v", err)
	}

	// Check if admin user exists, create if not
	var count int
	err = DB.QueryRow("SELECT COUNT(*) FROM users WHERE username = 'admin'").Scan(&count)
	if err != nil {
		log.Fatalf("Failed to check admin user: %v", err)
	}

	if count == 0 {
		// Create default admin user with password 'admin'
		// In production, you should use a more secure password
		hashedPassword, err := HashPassword("admin")
		if err != nil {
			log.Fatalf("Failed to hash password: %v", err)
		}

		_, err = DB.Exec("INSERT INTO users (username, password) VALUES (?, ?)", "admin", hashedPassword)
		if err != nil {
			log.Fatalf("Failed to create admin user: %v", err)
		}
		log.Println("Default admin user created")
	}
}

// CloseDB closes the database connection
func CloseDB() {
	if DB != nil {
		DB.Close()
		log.Println("Database connection closed")
	}
}
