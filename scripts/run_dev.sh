#!/bin/bash

# Define directories
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"
UI_DIR="$ROOT_DIR/ui"

# Function to kill background processes on exit
cleanup() {
  echo "Stopping all processes..."
  if [ -n "$BACKEND_PID" ]; then
    kill $BACKEND_PID 2>/dev/null || true
  fi
  if [ -n "$FRONTEND_PID" ]; then
    kill $FRONTEND_PID 2>/dev/null || true
  fi
  exit 0
}

# Set up trap to kill processes on SIGINT (Ctrl+C)
trap cleanup SIGINT SIGTERM

# Export proxy for Go if needed
if [ -n "$HTTPS_PROXY" ]; then
  echo "Using proxy: $HTTPS_PROXY"
fi

echo "Starting development environment..."

# Check if user wants to run only backend or frontend
if [ "$1" = "backend" ]; then
  echo "Starting only backend..."
  cd "$ROOT_DIR"
  go run . -dev
  exit 0
elif [ "$1" = "frontend" ]; then
  echo "Starting only frontend..."
  cd "$UI_DIR"
  npm run dev
  exit 0
fi

# Start backend in background
echo "Starting Go backend..."
cd "$ROOT_DIR"
go run . -dev &
BACKEND_PID=$!

# Wait for backend to start
echo "Waiting for backend to start..."
sleep 2

# Start frontend in background
echo "Starting UI development server..."
cd "$UI_DIR"
npm run dev &
FRONTEND_PID=$!

# Keep script running until user hits Ctrl+C
echo "Development environment started!"
echo "Backend running on http://localhost:8080"
echo "Frontend running on http://localhost:5173"
echo "Press Ctrl+C to stop all services"

# Wait for a child process to exit
wait

# Call cleanup to make sure all processes are killed
cleanup 