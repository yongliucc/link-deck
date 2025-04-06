#!/bin/bash

# Define directories
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"

# Export proxy for Go if needed
if [ -n "$HTTPS_PROXY" ]; then
  echo "Using proxy: $HTTPS_PROXY"
fi

echo "Starting Go backend in debug mode..."

# Check if delve is installed
if ! command -v dlv &> /dev/null; then
    echo "Error: Delve debugger is not installed."
    echo "Install it with: go install github.com/go-delve/delve/cmd/dlv@latest"
    exit 1
fi

# Run with delve
cd "$ROOT_DIR"
dlv debug . -- -dev 