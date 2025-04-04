.PHONY: setup build run dev clean test docker-build docker-run docker-stop

# Default target
all: setup build

# Setup the project
setup:
	@echo "Setting up the project..."
	@chmod +x setup.sh
	@chmod +x .cursorrc
	@source ./.cursorrc 2>/dev/null || true
	@./setup.sh

# Build the project
build:
	@echo "Building the project..."
	@source ./.cursorrc 2>/dev/null || true
	@cd ui && pnpm run build
	@CGO_ENABLED=1 go build -o bin/link-deck

# Run the project in production mode
run:
	@echo "Running the server in production mode..."
	@source ./.cursorrc 2>/dev/null || true
	@./bin/link-deck

# Run the project in development mode
dev:
	@echo "Running the server in development mode..."
	@source ./.cursorrc 2>/dev/null || true
	@GIN_MODE=debug ./bin/link-deck

# Run the frontend in development mode
dev-ui:
	@echo "Running the frontend in development mode..."
	@source ./.cursorrc 2>/dev/null || true
	@cd ui && pnpm run dev

# Clean build artifacts
clean:
	@echo "Cleaning build artifacts..."
	@rm -rf bin/
	@rm -rf ui/dist/
	@rm -rf ui/node_modules/

# Run tests
test:
	@echo "Running tests..."
	@source ./.cursorrc 2>/dev/null || true
	@CGO_ENABLED=1 go test ./...
	@cd ui && pnpm test

# Docker commands
docker-build:
	@echo "Building Docker image..."
	@docker-compose build

docker-run:
	@echo "Running Docker container..."
	@docker-compose up -d

docker-stop:
	@echo "Stopping Docker container..."
	@docker-compose down

# Help
help:
	@echo "Available targets:"
	@echo "  setup        - Set up the project"
	@echo "  build        - Build the project"
	@echo "  run          - Run the server in production mode"
	@echo "  dev          - Run the server in development mode"
	@echo "  dev-ui       - Run the frontend in development mode"
	@echo "  clean        - Clean build artifacts"
	@echo "  test         - Run tests"
	@echo "  docker-build - Build Docker image"
	@echo "  docker-run   - Run Docker container"
	@echo "  docker-stop  - Stop Docker container"
	@echo "  help         - Show this help message" 