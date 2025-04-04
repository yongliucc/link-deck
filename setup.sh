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


# Check versions
print_step "Checking versions..."
go version
node -v
pnpm -v || npm install -g pnpm

# Install frontend dependencies
print_step "Installing frontend dependencies..."
cd ui
pnpm install
cd ..

# Build frontend
print_step "Building frontend..."
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
export CGO_ENABLED=1  # Enable CGO for SQLite

# Build backend
print_step "Building Go server..."
go mod tidy
go build -ldflags="-s -w" -o bin/link-deck main.go
if [ $? -ne 0 ]; then
  print_error "Go build failed!"
  exit 1
fi
print_success "Server built successfully! Binary located at bin/link-deck"

print_step "Setup completed!"
echo -e "Run the server with: \033[1m./bin/link-deck\033[0m"
echo -e "For production mode: \033[1mGIN_MODE=release ./bin/link-deck\033[0m"
echo -e "For debug mode: \033[1mGIN_MODE=debug ./bin/link-deck\033[0m" 