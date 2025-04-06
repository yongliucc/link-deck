#!/bin/bash
set -e

# Load configuration from environment file
if [ -f ".env.deploy" ]; then
  source .env.deploy
else
  echo "Error: .env.deploy file not found!"
  exit 1
fi

# Ensure required variables are set
if [ -z "$REMOTE_HOST" ] || [ -z "$REMOTE_PATH" ] || [ -z "$BINARY_NAME" ] || [ -z "$SERVICE_NAME" ]; then
  echo "Error: Missing required configuration in .env.deploy"
  exit 1
fi

echo "Starting deployment process..."

# Step 1: Build the application
echo "Building application..."
bash build.sh

LOCAL_BINARY_PATH="./bin/${BINARY_NAME}"

# Check if build was successful
if [ ! -f "$LOCAL_BINARY_PATH" ]; then
    echo "Error: Build failed, binary not found at $LOCAL_BINARY_PATH"
    exit 1
fi

echo "Build completed successfully."

# Step 2: Deploy to remote server
echo "Deploying to $REMOTE_HOST..."

# Check if the binary exists on remote and stop the service if it does
ssh $REMOTE_HOST "if [ -f ${REMOTE_PATH}/${BINARY_NAME} ]; then 
    echo 'Stopping existing application...'
    systemctl stop link-deck || true
    echo 'Backing up existing binary...'
    mv ${REMOTE_PATH}/${BINARY_NAME} ${REMOTE_PATH}/${BINARY_NAME}.bak
fi"

# Create directory if it doesn't exist
ssh $REMOTE_HOST "mkdir -p ${REMOTE_PATH}"

# Copy the binary to the remote server
echo "Copying binary to remote server..."
scp $LOCAL_BINARY_PATH $REMOTE_HOST:$REMOTE_PATH/

# Set proper permissions
ssh $REMOTE_HOST "chmod +x ${REMOTE_PATH}/${BINARY_NAME}"

# Start the service
echo "Starting application on remote server..."
ssh $REMOTE_HOST "systemctl start link-deck || echo 'Warning: Failed to start service, may need manual intervention'"

# Reload nginx
echo "Reloading nginx..."
ssh $REMOTE_HOST "systemctl reload nginx"

echo "Deployment completed successfully!" 