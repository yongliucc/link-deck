package models

import (
	"database/sql"
	"time"
)

// LinkGroup represents a group of links
type LinkGroup struct {
	ID        int64     `json:"id"`
	Name      string    `json:"name"`
	SortOrder int       `json:"sort_order"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
	Links     []Link    `json:"links,omitempty"`
}

// Link represents a link in the system
type Link struct {
	ID        int64     `json:"id"`
	GroupID   int64     `json:"group_id"`
	Name      string    `json:"name"`
	URL       string    `json:"url"`
	SortOrder int       `json:"sort_order"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

// GetAllLinkGroups retrieves all link groups with their links
func GetAllLinkGroups() ([]LinkGroup, error) {
	rows, err := DB.Query(`
		SELECT id, name, sort_order, created_at, updated_at 
		FROM link_groups 
		ORDER BY sort_order ASC
	`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	// Initialize as empty slice instead of nil
	groups := []LinkGroup{}

	for rows.Next() {
		var group LinkGroup
		err := rows.Scan(
			&group.ID,
			&group.Name,
			&group.SortOrder,
			&group.CreatedAt,
			&group.UpdatedAt,
		)
		if err != nil {
			return nil, err
		}

		// Get links for this group
		links, err := GetLinksByGroupID(group.ID)
		if err != nil {
			return nil, err
		}
		group.Links = links

		groups = append(groups, group)
	}

	return groups, nil
}

// GetLinksByGroupID retrieves all links for a specific group
func GetLinksByGroupID(groupID int64) ([]Link, error) {
	rows, err := DB.Query(`
		SELECT id, group_id, name, url, sort_order, created_at, updated_at 
		FROM links 
		WHERE group_id = ? 
		ORDER BY sort_order ASC
	`, groupID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	// Initialize as empty slice instead of nil
	links := []Link{}

	for rows.Next() {
		var link Link
		err := rows.Scan(
			&link.ID,
			&link.GroupID,
			&link.Name,
			&link.URL,
			&link.SortOrder,
			&link.CreatedAt,
			&link.UpdatedAt,
		)
		if err != nil {
			return nil, err
		}

		links = append(links, link)
	}

	return links, nil
}

// CreateLinkGroup creates a new link group
func CreateLinkGroup(name string, sortOrder int) (int64, error) {
	result, err := DB.Exec(`
		INSERT INTO link_groups (name, sort_order) 
		VALUES (?, ?)
	`, name, sortOrder)
	if err != nil {
		return 0, err
	}

	return result.LastInsertId()
}

// UpdateLinkGroup updates an existing link group
func UpdateLinkGroup(id int64, name string, sortOrder int) error {
	_, err := DB.Exec(`
		UPDATE link_groups 
		SET name = ?, sort_order = ?, updated_at = CURRENT_TIMESTAMP 
		WHERE id = ?
	`, name, sortOrder, id)

	return err
}

// DeleteLinkGroup deletes a link group and all its links
func DeleteLinkGroup(id int64) error {
	_, err := DB.Exec("DELETE FROM link_groups WHERE id = ?", id)
	return err
}

// CreateLink creates a new link
func CreateLink(groupID int64, name, url string, sortOrder int) (int64, error) {
	result, err := DB.Exec(`
		INSERT INTO links (group_id, name, url, sort_order) 
		VALUES (?, ?, ?, ?)
	`, groupID, name, url, sortOrder)
	if err != nil {
		return 0, err
	}

	return result.LastInsertId()
}

// UpdateLink updates an existing link
func UpdateLink(id int64, groupID int64, name, url string, sortOrder int) error {
	_, err := DB.Exec(`
		UPDATE links 
		SET group_id = ?, name = ?, url = ?, sort_order = ?, updated_at = CURRENT_TIMESTAMP 
		WHERE id = ?
	`, groupID, name, url, sortOrder, id)

	return err
}

// DeleteLink deletes a link
func DeleteLink(id int64) error {
	_, err := DB.Exec("DELETE FROM links WHERE id = ?", id)
	return err
}

// CreateLinkGroupTx creates a new link group within a transaction
func CreateLinkGroupTx(tx *sql.Tx, name string, sortOrder int) (int64, error) {
	result, err := tx.Exec(`
		INSERT INTO link_groups (name, sort_order) 
		VALUES (?, ?)
	`, name, sortOrder)
	if err != nil {
		return 0, err
	}

	return result.LastInsertId()
}

// CreateLinkTx creates a new link within a transaction
func CreateLinkTx(tx *sql.Tx, groupID int64, name, url string, sortOrder int) (int64, error) {
	result, err := tx.Exec(`
		INSERT INTO links (group_id, name, url, sort_order) 
		VALUES (?, ?, ?, ?)
	`, groupID, name, url, sortOrder)
	if err != nil {
		return 0, err
	}

	return result.LastInsertId()
}

// UpdateLinkGroupTx updates an existing link group within a transaction
func UpdateLinkGroupTx(tx *sql.Tx, id int64, name string, sortOrder int) error {
	_, err := tx.Exec(`
		UPDATE link_groups 
		SET name = ?, sort_order = ?, updated_at = CURRENT_TIMESTAMP 
		WHERE id = ?
	`, name, sortOrder, id)

	return err
}

// DeleteLinksByGroupIDTx deletes all links for a specific group within a transaction
func DeleteLinksByGroupIDTx(tx *sql.Tx, groupID int64) error {
	_, err := tx.Exec("DELETE FROM links WHERE group_id = ?", groupID)
	return err
}
