# Link Deck

A simple web application for organizing and managing links.

## Project Structure

- **Backend**: Go with Gin framework
- **Frontend**: React with TypeScript and Vite

## Setup for Development

### Prerequisites

- Go 1.19 or later
- Node.js 16 or later
- npm 7 or later
- Make (optional, for using Makefile commands)

### Running the Application

#### Combined Development Environment

Run both backend and frontend in development mode with hot reloading:

```bash
# Using Make
make dev

# OR using the script directly
./scripts/run_dev.sh
```

This will start:
- Backend on http://localhost:8080
- Frontend on http://localhost:5173

The frontend will automatically proxy API requests to the backend.

#### Separate Development

Run only the backend:

```bash
# Using Make
make dev-backend

# OR using npm from the ui directory
npm run dev:backend

# OR using the script directly
./scripts/run_dev.sh backend
```

Run only the frontend:

```bash
# Using Make
make dev-ui

# OR using npm from the ui directory
cd ui && npm run dev

# OR using the script directly
./scripts/run_dev.sh frontend
```

### Debugging

#### Backend Debugging

Debug the Go backend using Delve:

```bash
# Using Make
make debug-backend

# OR using the script directly
./scripts/debug_backend.sh
```

You can also use VS Code or GoLand for a better debugging experience.

#### Frontend Debugging

Use browser DevTools for frontend debugging. When running in development mode, React Developer Tools and other browser extensions can be used.

## Building for Production

Build the complete application:

```bash
# Using Make
make build

# OR using the script directly
./scripts/build.sh
```

This will:
1. Build the React frontend
2. Compile the Go backend
3. Configure the backend to serve the frontend

Run the built application:

```bash
# Using Make
make run

# OR directly
./bin/link-deck
```

## Configuration

### Development Configuration

The application uses `config.dev.json` for development settings. You can modify this file to change:

- Port numbers
- CORS settings
- Database path
- JWT secrets

### Command Line Options

The backend supports these command-line options:

- `-dev`: Run in development mode
- `-config <path>`: Specify a custom config file path

Example:
```bash
./bin/link-deck -dev -config ./my-config.json
```

## License

[MIT License](LICENSE) 