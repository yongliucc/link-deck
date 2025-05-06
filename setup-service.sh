#!/bin/bash
set -e

# Load configuration from environment file
if [ -f ".env.deploy" ]; then
  source .env.deploy
else
  echo "Error: .env.deploy file not found!"
  exit 1
fi

echo "Setting up link-deck service on $REMOTE_HOST..."

# Generate service file content
SERVICE_CONTENT="[Unit]
Description=Link Deck Application
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=${REMOTE_PATH}
ExecStart=${REMOTE_PATH}/${BINARY_NAME} -config ${CONFIG_PATH}
Restart=on-failure
RestartSec=5
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target"

# Create config directory if it doesn't exist
echo "Creating config directory..."
ssh -p $REMOTE_PORT $REMOTE_HOST "mkdir -p /etc/link-deck"

# Create a default config file if it doesn't exist
echo "Checking for config file..."
ssh -p $REMOTE_PORT $REMOTE_HOST "if [ ! -f ${CONFIG_PATH} ]; then
    echo 'Creating default config file...'
    echo '{
        \"server\": {
            \"port\": 8080,
            \"cors\": {
                \"allowed_origins\": [\"*\"],
                \"allowed_methods\": [\"GET\", \"POST\", \"PUT\", \"DELETE\", \"OPTIONS\"],
                \"allowed_headers\": [\"Content-Type\", \"Authorization\"]
            }
        },
        \"database\": {
            \"path\": \"/opt/apps/link-deck/data/link-deck.db\"
        },
        \"auth\": {
            \"jwt_secret\": \"CHANGE_THIS_TO_A_SECURE_SECRET\"
        }
    }' > ${CONFIG_PATH}
    echo 'Please update the JWT secret in ${CONFIG_PATH} to a secure value!'
fi"

# Create data directory
echo "Creating data directory..."
ssh -p $REMOTE_PORT $REMOTE_HOST "mkdir -p ${REMOTE_PATH}/data"

# Create service file
echo "Creating systemd service file..."
echo "$SERVICE_CONTENT" | ssh -p $REMOTE_PORT $REMOTE_HOST "cat > /etc/systemd/system/${SERVICE_NAME}.service"

# Reload systemd, enable and start service
echo "Configuring systemd service..."
ssh -p $REMOTE_PORT $REMOTE_HOST "systemctl daemon-reload && systemctl enable ${SERVICE_NAME}.service"

echo "Service setup completed successfully!"
echo "You can now use: systemctl start|stop|restart|status ${SERVICE_NAME}"
echo "Don't forget to update your JWT secret in ${CONFIG_PATH}!" 