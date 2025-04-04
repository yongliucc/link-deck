#!/bin/bash

set -e

# Print colored output
print_step() {
  echo -e "\033[1;34m==>\033[0m \033[1m$1\033[0m"
}

print_success() {
  echo -e "\033[1;32m==>\033[0m \033[1m$1\033[0m"
}

print_error() {
  echo -e "\033[1;31m==>\033[0m \033[1m$1\033[0m"
}

# Check if output directory exists, create if not
if [ ! -d "bin" ]; then
  mkdir -p bin
fi

# Build frontend
print_step "Building React frontend..."
cd ui
pnpm run build
if [ $? -ne 0 ]; then
  print_error "Frontend build failed!"
  exit 1
fi
cd ..
print_success "Frontend built successfully!"

# Set Go environment variables
export GOPROXY=https://goproxy.io,direct
export CGO_ENABLED=1  # Enable CGO for SQLite support

# Build for current platform
print_step "Building Go server for current platform..."
go build -ldflags="-s -w" -o bin/link-deck main.go
if [ $? -ne 0 ]; then
  print_error "Go build failed!"
  exit 1
fi
print_success "Server built successfully! Binary located at bin/link-deck"

# Optional: Build for multiple platforms
if [ "$1" == "--all" ]; then
  print_step "Building for multiple platforms..."
  
  # Linux (amd64)
  print_step "Building for Linux (amd64)..."
  CGO_ENABLED=1 GOOS=linux GOARCH=amd64 go build -ldflags="-s -w" -o bin/link-deck-linux-amd64 main.go
  
  # Windows (amd64)
  print_step "Building for Windows (amd64)..."
  CGO_ENABLED=1 GOOS=windows GOARCH=amd64 go build -ldflags="-s -w" -o bin/link-deck-windows-amd64.exe main.go
  
  # macOS (amd64)
  print_step "Building for macOS (amd64)..."
  CGO_ENABLED=1 GOOS=darwin GOARCH=amd64 go build -ldflags="-s -w" -o bin/link-deck-darwin-amd64 main.go
  
  # macOS (arm64)
  print_step "Building for macOS (arm64)..."
  CGO_ENABLED=1 GOOS=darwin GOARCH=arm64 go build -ldflags="-s -w" -o bin/link-deck-darwin-arm64 main.go
  
  print_success "All platforms built successfully!"
fi

print_step "Build process completed!"
echo -e "Run the server with: \033[1m./bin/link-deck\033[0m"
echo -e "For production mode: \033[1mGIN_MODE=release ./bin/link-deck\033[0m"
echo -e "For debug mode: \033[1mGIN_MODE=debug ./bin/link-deck\033[0m" 