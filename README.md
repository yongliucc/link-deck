# Link Desk

A simple, elegant link management system that allows you to organize and access your favorite links through a clean interface.

## Features

- **Link Organization**: Group your links into categories for easy access
- **Admin Panel**: Manage your links and groups through a user-friendly admin interface
- **Responsive Design**: Works on desktop and mobile devices
- **JWT Authentication**: Secure admin access with JWT tokens
- **SQLite Database**: Lightweight database for storing links and user data

## Tech Stack

- **Backend**: Go 1.23.6 with Gin framework
- **Frontend**: React 19 with TypeScript
- **UI**: TailwindCSS 3.4.1 with shadcn/ui components
- **Database**: SQLite
- **Authentication**: JWT

## Getting Started

### Prerequisites

- Go 1.23.6
- Node.js 22.14.0
- pnpm (recommended) or npm
- GCC and development tools (for CGO/SQLite support)

### Installation

1. Clone the repository:

```bash
git clone hhttps://github.com/yongliucc/link-deck.git
cd link-desk
```

2. Configure the development environment:

```bash
npm install -g pnpm
```

4. Install required system dependencies for SQLite:

```bash
# For Ubuntu/Debian
sudo apt-get install gcc libc6-dev

# For Alpine Linux
apk add --no-cache gcc musl-dev

# For macOS
xcode-select --install

# For Windows
# Install MinGW or MSYS2
```

5. Run the setup script:

```bash
./setup.sh
```

This script will:
- Set up the required environment variables
- Install frontend dependencies
- Build the frontend
- Build the backend

Alternatively, you can use the Makefile:

```bash
make setup
```

### Running the Application

Run the server:

```bash
./bin/link-deck
```

Or use the Makefile:

```bash
make run
```

The application will be available at http://localhost:8080

### Using Docker

The project includes Docker configuration for easy deployment:

1. Build and run using Docker Compose:

```bash
docker-compose up -d
```

Or use the Makefile:

```bash
make docker-build
make docker-run
```

2. Stop the Docker container:

```bash
docker-compose down
```

Or use the Makefile:

```bash
make docker-stop
```

### Default Login

- Username: `admin`
- Password: `admin`

**Important**: Change the default password after first login.

## Development

### Cursor/VSCode Configuration

The project includes configuration files for Cursor and VSCode:

- `.cursorrc`: Sets up the environment variables for the terminal
- `.vscode/settings.json`: Configures the integrated terminal to use the correct Node.js version
- `.vscode/launch.json`: Provides debug configurations for both frontend and backend
- `.vscode/tasks.json`: Defines common tasks that can be run from the Command Palette

To use these configurations:

1. Open the Command Palette (Ctrl+Shift+P or Cmd+Shift+P)
2. Type "Tasks: Run Task" and select it
3. Choose one of the available tasks:
   - Configure Cursor Terminal
   - Run Setup Script
   - Build Frontend
   - Build Backend
   - Start Frontend Dev Server

For debugging:

1. Open the Run and Debug view (Ctrl+Shift+D or Cmd+Shift+D)
2. Select a debug configuration from the dropdown:
   - Debug Go Server
   - Debug Frontend
   - Full Stack: Backend + Frontend


### Using the Makefile

The project includes a Makefile with several useful commands:

```bash
make setup        # Set up the project
make build        # Build the project
make run          # Run the server in production mode
make dev          # Run the server in development mode
make dev-ui       # Run the frontend in development mode
make clean        # Clean build artifacts
make test         # Run tests
make docker-build # Build Docker image
make docker-run   # Run Docker container
make docker-stop  # Stop Docker container
make help         # Show help message
```

### Package Management

This project uses pnpm for package management. If you encounter issues with npm, use pnpm instead:

```bash
# Install dependencies
pnpm install

# Add a new package
pnpm add package-name

# Run scripts
pnpm run dev
pnpm run build
```

### Build Requirements

This project uses SQLite as its database, which requires CGO to be enabled during the Go build process. All build scripts have been configured to set `CGO_ENABLED=1` automatically.

If you encounter the error `Binary was compiled with 'CGO_ENABLED=0', go-sqlite3 requires cgo to work`, make sure to rebuild the application with CGO enabled:

```bash
CGO_ENABLED=1 go build -o bin/link-deck
```

## Environment Variables

The application uses the following environment variables, which can be set in the `.env` file:

| Variable | Description | Default |
|----------|-------------|---------|
| PORT | Server port | 8080 |
| GIN_MODE | Gin framework mode (debug/release) | release |
| JWT_SECRET | Secret key for JWT tokens | change_this_to_a_secure_secret_in_production |
| JWT_EXPIRATION | JWT token expiration time | 24h |
| DB_PATH | Path to SQLite database | ./data/linkdesk.db |
| ADMIN_USERNAME | Default admin username | admin |
| ADMIN_PASSWORD | Default admin password | admin |
| ALLOWED_ORIGINS | CORS allowed origins | http://localhost:8080,http://localhost:5173 |

## Environment Requirements

- Go version: go1.23.6 linux/amd64
- Node.js: v22.14.0
- React: v19.0.0
- TailwindCSS: v3.4.1
- GCC and development tools for CGO/SQLite support

## License

MIT 