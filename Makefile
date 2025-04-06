.PHONY: build run dev dev-backend dev-ui clean test

# Default target
all: build

# Build the entire application (backend and frontend)
build:
	./scripts/build.sh

# Run the application in production mode
run: build
	./bin/link-deck

# Run the application in development mode (both backend and frontend)
dev:
	./scripts/run_dev.sh

# Run only the backend in development mode
dev-backend:
	./scripts/run_dev.sh backend

# Run only the UI in development mode
dev-ui:
	./scripts/run_dev.sh frontend

# Debug the backend with delve
debug-backend:
	./scripts/debug_backend.sh

# Clean build artifacts
clean:
	rm -rf bin/* ui/dist

# Run tests
test:
	go test ./...

help:
	@echo "Available targets:"
	@echo "  build         - Build the entire application"
	@echo "  run           - Build and run the application in production mode"
	@echo "  dev           - Run both backend and frontend in development mode"
	@echo "  dev-backend   - Run only the backend in development mode"
	@echo "  dev-ui        - Run only the frontend in development mode"
	@echo "  debug-backend - Debug the backend with delve"
	@echo "  clean         - Remove build artifacts"
	@echo "  test          - Run tests" 