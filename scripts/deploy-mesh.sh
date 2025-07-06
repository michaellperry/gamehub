#!/bin/bash

# Deployment script for GameHub mesh services
set -e

echo "Deploying GameHub mesh services..."

# Get the script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

# Change to mesh directory
cd "$PROJECT_ROOT/mesh"

# Check if .env file exists, if not copy from example
if [ ! -f .env ]; then
    echo "Creating .env file from .env.example..."
    cp .env.example .env
    echo "Please review and update the .env file with your production values!"
fi

# Build and start services
echo "Building and starting services..."
docker compose up --build -d

# Wait for services to be healthy
echo "Waiting for services to be healthy..."
sleep 10

# Check service health
echo "Checking service health..."
docker compose ps

# Test service-ip health endpoint
echo "Testing service-ip health..."
if curl -f http://localhost:8083/health > /dev/null 2>&1; then
    echo "✅ service-ip is healthy"
else
    echo "❌ service-ip health check failed"
    echo "Checking logs..."
    docker compose logs service-ip
    exit 1
fi

# Test player-ip health endpoint
echo "Testing player-ip health..."
if curl -f http://localhost:8082/health > /dev/null 2>&1; then
    echo "✅ player-ip is healthy"
else
    echo "❌ player-ip health check failed"
    echo "Checking logs..."
    docker compose logs player-ip
    exit 1
fi

echo "🎉 Deployment completed successfully!"
echo ""
echo "Services available at:"
echo "  - service-ip: http://localhost:8083"
echo "  - player-ip: http://localhost:8082"
echo ""
echo "To view logs: docker compose logs -f"
echo "To stop services: docker compose down"