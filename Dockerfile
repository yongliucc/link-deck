# Build stage for frontend
FROM node:22.14.0-alpine AS frontend-builder
WORKDIR /app/ui

# Install pnpm
RUN npm install -g pnpm

# Copy frontend files
COPY ui/package.json ui/pnpm-lock.yaml ./
RUN pnpm install

COPY ui/ ./
RUN pnpm run build

# Build stage for backend
FROM golang:1.23.6-alpine AS backend-builder
WORKDIR /app

# Install build dependencies for SQLite
RUN apk add --no-cache gcc musl-dev

# Copy Go module files
COPY go.mod go.sum ./
RUN go mod download

# Copy the rest of the backend code
COPY . .

# Copy the built frontend from the frontend-builder stage
COPY --from=frontend-builder /app/ui/dist ./ui/dist

# Build the Go application with CGO enabled
ENV CGO_ENABLED=1
RUN go build -o bin/link-deck

# Final stage
FROM alpine:latest
WORKDIR /app

# Install necessary runtime dependencies
RUN apk --no-cache add ca-certificates

# Copy the binary from the backend-builder stage
COPY --from=backend-builder /app/bin/link-deck ./bin/link-deck

# Copy the .env file
COPY .env ./

# Create data directory for SQLite database
RUN mkdir -p ./data

# Expose the port
EXPOSE 8080

# Run the application
CMD ["./bin/link-deck"] 