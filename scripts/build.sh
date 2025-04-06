#!/bin/bash
set -e

# Define directories
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"
UI_DIR="$ROOT_DIR/ui"
BIN_DIR="$ROOT_DIR/bin"
DIST_DIR="$ROOT_DIR/dist"

# Create output directories if they don't exist
mkdir -p "$BIN_DIR"

echo "Building Link Deck..."

# Check if node and npm are installed
if ! command -v npm &> /dev/null; then
    echo "Error: npm is not installed."
    exit 1
fi

# Build UI
echo "Building UI..."
cd "$UI_DIR"
npm install
npm run build

# Build Go backend
echo "Building Go backend..."
cd "$ROOT_DIR"

# Detect operating system
if [[ "$OSTYPE" == "linux-gnu"* ]]; then
    echo "Building for Linux..."
    GOOS=linux GOARCH=amd64 go build -o "$BIN_DIR/link-deck" .
elif [[ "$OSTYPE" == "darwin"* ]]; then
    echo "Building for macOS..."
    GOOS=darwin GOARCH=amd64 go build -o "$BIN_DIR/link-deck" .
elif [[ "$OSTYPE" == "msys"* || "$OSTYPE" == "win32" ]]; then
    echo "Building for Windows..."
    GOOS=windows GOARCH=amd64 go build -o "$BIN_DIR/link-deck.exe" .
else
    echo "Unknown OS type: $OSTYPE. Building for current OS..."
    go build -o "$BIN_DIR/link-deck" .
fi

echo "Build complete!"
echo "The executable is available at: $BIN_DIR/link-deck"
echo ""
echo "To run Link Deck:"
echo "  $BIN_DIR/link-deck"
echo ""
echo "For additional options:"
echo "  $BIN_DIR/link-deck -help" 