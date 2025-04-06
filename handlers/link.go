package handlers

import (
	"database/sql"
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
	Icon      string `json:"icon"`
	SortOrder int    `json:"sort_order"`
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

	id, err := models.CreateLink(req.GroupID, req.Name, req.URL, req.Icon, req.SortOrder)
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

	err = models.UpdateLink(id, req.GroupID, req.Name, req.URL, req.Icon, req.SortOrder)
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
