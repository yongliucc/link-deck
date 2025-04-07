#!/bin/bash

# Script to update admin password in database
# Usage: ./update_admin_password.sh <DB_FILE> [NEW_PASSWORD]

set -e

# Check arguments
if [ $# -lt 1 ]; then
  echo "Usage: $0 <DB_FILE> [NEW_PASSWORD]"
  echo "  DB_FILE: Path to the SQLite database file"
  echo "  NEW_PASSWORD: (Optional) New admin password. If not provided, a random one will be generated."
  exit 1
fi

DB_FILE=$1
NEW_PASSWORD=$2

# Check if DB file exists
if [ ! -f "$DB_FILE" ]; then
  echo "Error: Database file '$DB_FILE' not found."
  exit 1
fi

# Generate password if not provided
if [ -z "$NEW_PASSWORD" ]; then
  NEW_PASSWORD=$(openssl rand -base64 12)
  echo "Generated random password: $NEW_PASSWORD"
fi

# Create a temporary Python script to hash the password using bcrypt with cost 14
# This exactly matches the Go application's HashPassword function
TMP_SCRIPT=$(mktemp)
cat > "$TMP_SCRIPT" <<EOF
import bcrypt
import sys

password = sys.argv[1]
# Use cost 14 to match the Go application's HashPassword function
hashed = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt(14))
print(hashed.decode('utf-8'))
EOF

# Check if Python and bcrypt are available
if ! command -v python3 &> /dev/null; then
  echo "Error: Python 3 is required but not installed."
  rm "$TMP_SCRIPT"
  exit 1
fi

# Install bcrypt if needed
python3 -c "import bcrypt" 2>/dev/null || {
  echo "Installing bcrypt Python package..."
  pip3 install bcrypt >/dev/null 2>&1 || {
    echo "Error: Failed to install bcrypt. Please install it manually with 'pip3 install bcrypt'"
    rm "$TMP_SCRIPT"
    exit 1
  }
}

# Hash the password using bcrypt with cost 14 (same as in Go code)
HASHED_PASSWORD=$(python3 "$TMP_SCRIPT" "$NEW_PASSWORD")
rm "$TMP_SCRIPT"

# Update admin password in database
sqlite3 "$DB_FILE" <<EOF
UPDATE users SET password='$HASHED_PASSWORD', updated_at=CURRENT_TIMESTAMP WHERE username='admin';
EOF

# Check if the update was successful
if [ $? -eq 0 ]; then
  NUM_UPDATED=$(sqlite3 "$DB_FILE" "SELECT COUNT(*) FROM users WHERE username='admin';")
  if [ "$NUM_UPDATED" -gt 0 ]; then
    echo "Successfully updated password for admin user."
    echo "New password: $NEW_PASSWORD"
  else
    echo "Warning: No admin user was found to update."
  fi
else
  echo "Error: Failed to update admin password."
  exit 1
fi

echo "Done."
