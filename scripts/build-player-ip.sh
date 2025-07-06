#!/bin/bash

# Build script for player-ip service
# This script builds the player-ip Docker image

set -e

echo "Building player-ip service..."

# Change to the player-ip directory
cd "$(dirname "$0")/../app/player-ip"

# Build the Docker image
docker build -t gamehub-player-ip:latest .

echo "player-ip service built successfully!"
echo "Image: gamehub-player-ip:latest"