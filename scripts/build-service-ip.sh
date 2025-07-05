#!/bin/bash

# Build script for service-ip
set -e

echo "Building service-ip..."

# Get the script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

# Change to service-ip directory
cd "$PROJECT_ROOT/app/service-ip"

echo "Installing dependencies..."
npm ci

echo "Building TypeScript..."
npm run build

echo "service-ip build completed successfully!"

# Optional: Build Docker image
if [ "$1" = "--docker" ]; then
    echo "Building Docker image..."
    docker build -t gamehub/service-ip:latest .
    echo "Docker image built successfully!"
fi