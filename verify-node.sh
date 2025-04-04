#!/bin/bash

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

print_step "Verifying Node.js configuration..."

# Check if .cursorrc exists
if [ -f ".cursorrc" ]; then
  print_success "Found .cursorrc file"
  source .cursorrc
else
  print_error ".cursorrc file not found"
  print_step "Running cursor-config.sh to create it..."
  ./cursor-config.sh
fi

# Check Node.js path
NODE_PATH=$(which node)
print_step "Current Node.js path: $NODE_PATH"

# Check Node.js version
NODE_VERSION=$(node -v)
print_step "Current Node.js version: $NODE_VERSION"

# Check if it matches the expected path
if [[ "$NODE_PATH" == "/home/willow/.nvm/versions/node/v22.14.0/bin/node" ]]; then
  print_success "Node.js path is correctly configured"
else
  print_error "Node.js path is not correctly configured"
  print_step "Expected: /home/willow/.nvm/versions/node/v22.14.0/bin/node"
  print_step "Actual: $NODE_PATH"
  
  print_step "Attempting to fix the configuration..."
  ./cursor-config.sh
fi

# Check if Node.js version is correct
if [[ "$NODE_VERSION" == "v22.14.0" ]]; then
  print_success "Node.js version is correct: v22.14.0"
else
  print_error "Node.js version is incorrect: $NODE_VERSION"
  print_step "Expected: v22.14.0"
  
  print_step "Attempting to fix the configuration..."
  ./cursor-config.sh
fi

print_step "Verification complete!" 