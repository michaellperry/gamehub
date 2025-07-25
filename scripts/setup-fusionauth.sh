#!/bin/bash

# GameHub FusionAuth Setup Script
# This script builds and runs the GameHub FusionAuth setup application

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to show usage
show_usage() {
    echo "Usage: $0 <API_KEY> [OPTIONS]"
    echo ""
    echo "This script builds and runs the GameHub FusionAuth setup application."
    echo ""
    echo "Arguments:"
    echo "  API_KEY                 FusionAuth API key (required)"
    echo ""
    echo "Options:"
    echo "  --fusion-auth-url URL   FusionAuth URL (default: http://localhost/auth)"
    echo "  --app-name NAME         Application name (default: GameHub)"
    echo "  --force                 Force overwrite existing files"
    echo "  --verbose               Enable verbose logging"
    echo "  --help                  Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 your-api-key-here"
    echo "  $0 your-api-key-here --verbose --force"
    echo "  $0 your-api-key-here --fusion-auth-url http://localhost:9011"
}

# Check if help is requested
if [[ "$1" == "--help" || "$1" == "-h" ]]; then
    show_usage
    exit 0
fi

# Check if API key is provided
if [[ -z "$1" ]]; then
    print_error "API key is required!"
    echo ""
    show_usage
    exit 1
fi

API_KEY="$1"
shift  # Remove the API key from arguments

# Get the script directory and project root
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
SETUP_DIR="$PROJECT_ROOT/setup"

print_info "GameHub Setup Script"
print_info "===================="
print_info "Project root: $PROJECT_ROOT"
print_info "Setup directory: $SETUP_DIR"

# Check if setup directory exists
if [[ ! -d "$SETUP_DIR" ]]; then
    print_error "Setup directory not found: $SETUP_DIR"
    exit 1
fi

# Navigate to setup directory
cd "$SETUP_DIR"

# Check if package.json exists
if [[ ! -f "package.json" ]]; then
    print_error "package.json not found in setup directory"
    exit 1
fi

print_info "Checking Node.js and npm..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    print_error "Node.js is not installed. Please install Node.js >= 18.0.0"
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    print_error "npm is not installed. Please install npm"
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node --version | sed 's/v//')
REQUIRED_VERSION="18.0.0"

if ! node -e "
const current = '$NODE_VERSION'.split('.').map(Number);
const required = '$REQUIRED_VERSION'.split('.').map(Number);
const isValid = current[0] > required[0] || 
                (current[0] === required[0] && current[1] > required[1]) ||
                (current[0] === required[0] && current[1] === required[1] && current[2] >= required[2]);
process.exit(isValid ? 0 : 1);
" 2>/dev/null; then
    print_error "Node.js version $NODE_VERSION is not supported. Please install Node.js >= $REQUIRED_VERSION"
    exit 1
fi

print_success "Node.js version $NODE_VERSION is supported"

# Check if node_modules exists, if not install dependencies
if [[ ! -d "node_modules" ]]; then
    print_info "Installing dependencies..."
    if npm install; then
        print_success "Dependencies installed successfully"
    else
        print_error "Failed to install dependencies"
        exit 1
    fi
else
    print_info "Dependencies already installed"
fi

# Check if TypeScript build is needed
if [[ ! -d "dist" ]] || [[ ! -f "dist/index.js" ]]; then
    print_info "Building TypeScript application..."
    if npm run build; then
        print_success "Build completed successfully"
    else
        print_error "Build failed"
        exit 1
    fi
elif [[ "src" -nt "dist" ]]; then
    print_info "Source files newer than build, rebuilding..."
    if npm run build; then
        print_success "Build completed successfully"
    else
        print_error "Build failed"
        exit 1
    fi
else
    print_info "Application already built"
fi

# Prepare arguments for the setup application
SETUP_ARGS="--api-key $API_KEY"

# Process additional arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --fusion-auth-url)
            SETUP_ARGS="$SETUP_ARGS --fusion-auth-url $2"
            shift 2
            ;;
        --app-name)
            SETUP_ARGS="$SETUP_ARGS --app-name $2"
            shift 2
            ;;
        --force)
            SETUP_ARGS="$SETUP_ARGS --force"
            shift
            ;;
        --verbose)
            SETUP_ARGS="$SETUP_ARGS --verbose"
            shift
            ;;
        *)
            print_warning "Unknown option: $1"
            shift
            ;;
    esac
done

print_info "Running GameHub FusionAuth setup..."
print_info "Setup arguments: $SETUP_ARGS"

# Run the setup application
if npm start -- $SETUP_ARGS; then
    # Build admin and player containers before restarting Docker Compose
    print_info "Building admin and player containers..."
    APP_DIR="$PROJECT_ROOT/app"
    if [[ -d "$APP_DIR" && -f "$APP_DIR/package.json" ]]; then
        print_info "Navigating to app directory: $APP_DIR"
        
        # Build admin container
        if (cd "$APP_DIR" && npm run build:admin:container); then
            print_success "Admin container build completed successfully"
        else
            print_warning "Failed to build admin container, but continuing setup process"
            print_info "You may need to manually build with: cd $APP_DIR && npm run build:admin:container"
        fi
        
        # Build player container
        if (cd "$APP_DIR" && npm run build:player:container); then
            print_success "Player container build completed successfully"
        else
            print_warning "Failed to build player container, but continuing setup process"
            print_info "You may need to manually build with: cd $APP_DIR && npm run build:player:container"
        fi
    else
        print_warning "App directory or package.json not found at $APP_DIR"
        print_info "Skipping container builds"
    fi
    
    # Stop and recreate the Docker Compose stack to pick up new environment variables
    print_info "Stopping and recreating Docker Compose stack..."
    # Navigate to mesh directory and recreate Docker Compose stack
    MESH_DIR="$PROJECT_ROOT/mesh"
    if [[ -d "$MESH_DIR" && -f "$MESH_DIR/docker-compose.yml" ]]; then
        print_info "Navigating to mesh directory: $MESH_DIR"
        if (cd "$MESH_DIR" && docker compose down && docker compose up -d); then
            print_success "Docker Compose stack stopped and started successfully"
        else
            print_warning "Failed to stop and start Docker Compose stack, but continuing setup process"
            print_info "You may need to manually restart the stack with: cd $MESH_DIR && docker compose down && docker compose up -d"
        fi
    else
        print_warning "Docker Compose file not found at $MESH_DIR/docker-compose.yml"
        print_info "Skipping Docker Compose restart"
    fi
    print_success "GameHub FusionAuth setup completed successfully!"
    echo ""
    print_info "Return to http://localhost/setup/ and refresh to continue the setup process."
    echo ""
    print_success "FusionAuth setup process completed!"
else
    print_error "FusionAuth setup failed!"
    echo ""
    print_info "Troubleshooting tips:"
    print_info "1. Verify your FusionAuth API key has the necessary permissions"
    print_info "2. Ensure FusionAuth is running and accessible"
    print_info "3. Check the setup logs above for specific error messages"
    print_info "4. Run with --verbose flag for more detailed output"
    exit 1
fi