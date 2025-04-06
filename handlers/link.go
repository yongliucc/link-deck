package handlers

import (
	"database/sql"
	"encoding/json"
	"io"
	"log"
	"net/http"
	"strconv"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/yongliucc/link-deck/models"
)

// LinkGroupRequest represents the link group request body
type LinkGroupRequest struct {
	Name      string `json:"name" binding:"required"`
	SortOrder int    `json:"sort_order"`
}

// LinkRequest represents the link request body
type LinkRequest struct {
	GroupID   int64  `json:"group_id" binding:"required"`
	Name      string `json:"name" binding:"required"`
	URL       string `json:"url" binding:"required"`
	SortOrder int    `json:"sort_order"`
}

// ExportLinkGroup represents a link group for export/import without timestamps
type ExportLinkGroup struct {
	ID        int64        `json:"id"`
	Name      string       `json:"name"`
	SortOrder int          `json:"sort_order"`
	Links     []ExportLink `json:"links,omitempty"`
}

// ExportLink represents a link for export/import without timestamps
type ExportLink struct {
	ID        int64  `json:"id"`
	GroupID   int64  `json:"group_id"`
	Name      string `json:"name"`
	URL       string `json:"url"`
	SortOrder int    `json:"sort_order"`
}

// ExportData represents the data structure for export/import operations
type ExportData struct {
	LinkGroups []ExportLinkGroup `json:"link_groups"`
}

// GetAllLinkGroups handles getting all link groups with their links
func GetAllLinkGroups(c *gin.Context) {
	// Check if this is an admin route
	path := c.Request.URL.Path
	isAdminRoute := strings.Contains(path, "/admin/")

	// Log the request details
	log.Printf("GetAllLinkGroups: Processing request for %s (Admin Route: %v)", path, isAdminRoute)

	// If this is an admin route, check for authentication
	if isAdminRoute {
		// Check if user is authenticated (AuthMiddleware should have aborted if not authenticated)
		_, exists := c.Get("userID")
		if !exists {
			log.Printf("GetAllLinkGroups: User not authenticated for admin route %s", path)
			// Just return an empty array instead of error
			c.JSON(http.StatusOK, []models.LinkGroup{})
			return
		}
		log.Printf("GetAllLinkGroups: User authenticated, proceeding with data retrieval")
	}

	groups, err := models.GetAllLinkGroups()
	if err != nil {
		log.Printf("GetAllLinkGroups: Error retrieving link groups: %v", err)
		if isAdminRoute {
			// For admin route, return empty array instead of error
			c.JSON(http.StatusOK, []models.LinkGroup{})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get link groups"})
		return
	}

	// Ensure links is never null/nil for any group
	for i := range groups {
		if groups[i].Links == nil {
			groups[i].Links = []models.Link{}
		}
	}

	log.Printf("GetAllLinkGroups: Successfully retrieved %d link groups", len(groups))
	c.JSON(http.StatusOK, groups)
}

// GetLinksByGroupID handles getting all links for a specific group
func GetLinksByGroupID(c *gin.Context) {
	groupID, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid group ID"})
		return
	}

	links, err := models.GetLinksByGroupID(groupID)
	if err != nil {
		if err == sql.ErrNoRows {
			c.JSON(http.StatusNotFound, gin.H{"error": "Group not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get links"})
		return
	}

	c.JSON(http.StatusOK, links)
}

// CreateLinkGroup handles creating a new link group
func CreateLinkGroup(c *gin.Context) {
	var req LinkGroupRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request body"})
		return
	}

	id, err := models.CreateLinkGroup(req.Name, req.SortOrder)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create link group"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"id": id, "message": "Link group created successfully"})
}

// UpdateLinkGroup handles updating an existing link group
func UpdateLinkGroup(c *gin.Context) {
	id, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid group ID"})
		return
	}

	var req LinkGroupRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request body"})
		return
	}

	err = models.UpdateLinkGroup(id, req.Name, req.SortOrder)
	if err != nil {
		if err == sql.ErrNoRows {
			c.JSON(http.StatusNotFound, gin.H{"error": "Group not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update link group"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Link group updated successfully"})
}

// DeleteLinkGroup handles deleting a link group
func DeleteLinkGroup(c *gin.Context) {
	id, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid group ID"})
		return
	}

	err = models.DeleteLinkGroup(id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete link group"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Link group deleted successfully"})
}

// CreateLink handles creating a new link
func CreateLink(c *gin.Context) {
	var req LinkRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request body"})
		return
	}

	id, err := models.CreateLink(req.GroupID, req.Name, req.URL, req.SortOrder)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create link"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"id": id, "message": "Link created successfully"})
}

// UpdateLink handles updating an existing link
func UpdateLink(c *gin.Context) {
	id, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid link ID"})
		return
	}

	var req LinkRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request body"})
		return
	}

	err = models.UpdateLink(id, req.GroupID, req.Name, req.URL, req.SortOrder)
	if err != nil {
		if err == sql.ErrNoRows {
			c.JSON(http.StatusNotFound, gin.H{"error": "Link not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update link"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Link updated successfully"})
}

// DeleteLink handles deleting a link
func DeleteLink(c *gin.Context) {
	id, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid link ID"})
		return
	}

	err = models.DeleteLink(id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete link"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Link deleted successfully"})
}

// ExportLinkGroups handles exporting all link groups and their links to a JSON file
func ExportLinkGroups(c *gin.Context) {
	// Get all link groups with their links
	groups, err := models.GetAllLinkGroups()
	if err != nil {
		log.Printf("ExportLinkGroups: Error retrieving link groups: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to export data"})
		return
	}

	// Convert to export format (without timestamps)
	exportGroups := make([]ExportLinkGroup, 0, len(groups))
	for _, group := range groups {
		exportGroup := ExportLinkGroup{
			ID:        group.ID,
			Name:      group.Name,
			SortOrder: group.SortOrder,
			Links:     make([]ExportLink, 0, len(group.Links)),
		}

		for _, link := range group.Links {
			exportLink := ExportLink{
				ID:        link.ID,
				GroupID:   link.GroupID,
				Name:      link.Name,
				URL:       link.URL,
				SortOrder: link.SortOrder,
			}
			exportGroup.Links = append(exportGroup.Links, exportLink)
		}

		exportGroups = append(exportGroups, exportGroup)
	}

	// Create export data structure
	exportData := ExportData{
		LinkGroups: exportGroups,
	}

	// Set the response headers for file download
	c.Header("Content-Disposition", "attachment; filename=link-deck-export.json")
	c.Header("Content-Type", "application/json")

	// Write the export data as JSON to the response
	c.JSON(http.StatusOK, exportData)
}

// ImportLinkGroups handles importing link groups and links from a JSON file
func ImportLinkGroups(c *gin.Context) {
	// Parse the multipart form
	if err := c.Request.ParseMultipartForm(10 << 20); err != nil { // 10 MB max
		c.JSON(http.StatusBadRequest, gin.H{"error": "Failed to parse form"})
		return
	}

	// Get the file from the request
	file, _, err := c.Request.FormFile("file")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "No file provided"})
		return
	}
	defer file.Close()

	// Read the file content
	fileBytes, err := io.ReadAll(file)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to read file"})
		return
	}

	// Parse the JSON data
	var importData ExportData
	if err := json.Unmarshal(fileBytes, &importData); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid JSON format"})
		return
	}

	// Get existing groups to check for duplicates
	existingGroups, err := models.GetAllLinkGroups()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve existing groups"})
		return
	}

	// Create a map of existing groups by name for quick lookup
	existingGroupsByName := make(map[string]models.LinkGroup)
	for _, group := range existingGroups {
		existingGroupsByName[group.Name] = group
	}

	// Process the import data - use a transaction for atomicity
	tx, err := models.DB.Begin()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to start transaction"})
		return
	}

	// Track the mapping between old and new IDs
	groupIDMap := make(map[int64]int64)

	// Import groups first
	for _, group := range importData.LinkGroups {
		var newGroupID int64

		// Check if a group with this name already exists
		if existingGroup, exists := existingGroupsByName[group.Name]; exists {
			// Use the existing group ID
			newGroupID = existingGroup.ID

			// Update the existing group's sort order
			err := models.UpdateLinkGroupTx(tx, newGroupID, group.Name, group.SortOrder)
			if err != nil {
				tx.Rollback()
				c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update existing group"})
				return
			}

			// Delete existing links for this group to avoid duplicates
			err = models.DeleteLinksByGroupIDTx(tx, newGroupID)
			if err != nil {
				tx.Rollback()
				c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to remove existing links"})
				return
			}
		} else {
			// Create a new group
			newGroupID, err = models.CreateLinkGroupTx(tx, group.Name, group.SortOrder)
			if err != nil {
				tx.Rollback()
				c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to import groups"})
				return
			}
		}

		// Map old ID to new ID
		groupIDMap[group.ID] = newGroupID

		// Import links for this group
		for _, link := range group.Links {
			// Use the new group ID
			_, err := models.CreateLinkTx(tx, newGroupID, link.Name, link.URL, link.SortOrder)
			if err != nil {
				tx.Rollback()
				c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to import links"})
				return
			}
		}
	}

	// Commit the transaction
	if err := tx.Commit(); err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to commit transaction"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Data imported successfully"})
}
