#!/bin/bash

# GameHub Tenant Setup Script
# This script configures the tenant public key across the GameHub mesh services

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
    echo "Usage: $0 \"<TENANT_PUBLIC_KEY>\" [OPTIONS]"
    echo ""
    echo "This script configures the tenant public key across GameHub mesh services."
    echo ""
    echo "Arguments:"
    echo "  TENANT_PUBLIC_KEY       Tenant public key in PEM format (required, must be quoted)"
    echo ""
    echo "Options:"
    echo "  --force                 Force update even if configuration files don't exist"
    echo "  --verbose               Enable verbose logging"
    echo "  --no-rebuild            Skip admin application rebuild"
    echo "  --help                  Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 \"-----BEGIN PUBLIC KEY-----\nMIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA...\n-----END PUBLIC KEY-----\""
    echo "  $0 \"<TENANT_PUBLIC_KEY>\" --verbose --force"
    echo "  $0 \"<TENANT_PUBLIC_KEY>\" --no-rebuild"
    echo ""
    echo "Script Functionality:"
    echo "  - Validates tenant public key format"
    echo "  - Updates mesh/.env with TENANT_PUBLIC_KEY"
    echo "  - Updates app/gamehub-admin/.env.container.local with VITE_TENANT_PUBLIC_KEY"
    echo "  - Rebuilds the Docker Compose stack to apply tenant key to services"
    echo "  - Rebuilds the admin application container to apply changes"
    echo "  - Validates tenant configuration"
}

# Function to validate tenant public key format
validate_tenant_key() {
    local key="$1"
    
    # Check if key contains BEGIN and END markers
    if [[ ! "$key" =~ "-----BEGIN PUBLIC KEY-----" ]] || [[ ! "$key" =~ "-----END PUBLIC KEY-----" ]]; then
        print_error "Invalid tenant public key format. Key must be in PEM format with BEGIN/END markers."
        return 1
    fi
    
    # Check if key has reasonable length (basic sanity check)
    if [[ ${#key} -lt 200 ]]; then
        print_warning "Tenant public key seems unusually short. Please verify the key is complete."
    fi
    
    return 0
}

# Function to check npm build requirements
check_build_requirements() {
    print_info "Checking build requirements..."
    
    # Check if we're in the correct directory structure
    if [[ ! -d "app" ]]; then
        print_error "app/ directory not found"
        return 1
    fi
    
    if [[ ! -f "app/package.json" ]]; then
        print_error "package.json not found in app/ directory"
        return 1
    fi
    
    # Check if npm is available
    if ! command -v npm &> /dev/null; then
        print_error "npm is not installed or not in PATH"
        return 1
    fi
    
    return 0
}

# Function to rebuild Docker Compose stack
rebuild_docker_compose() {
    print_info "Rebuilding Docker Compose stack to apply tenant configuration..."
    
    # Store current directory
    local original_dir=$(pwd)
    
    # Navigate to mesh directory
    if ! cd "$PROJECT_ROOT/mesh"; then
        print_error "Failed to navigate to mesh directory: $PROJECT_ROOT/mesh"
        return 1
    fi
    
    # Check if docker-compose.yml exists
    if [[ ! -f "docker-compose.yml" ]]; then
        print_error "docker-compose.yml not found in mesh directory"
        cd "$original_dir"
        return 1
    fi
    
    # Check if Docker Compose is available
    if ! command -v docker &> /dev/null; then
        print_error "Docker is not installed or not in PATH"
        cd "$original_dir"
        return 1
    fi
    
    if ! docker compose version &> /dev/null; then
        print_error "Docker Compose is not available"
        cd "$original_dir"
        return 1
    fi
    
    # Stop the current stack
    print_info "Stopping Docker Compose stack..."
    if docker compose down; then
        print_success "Docker Compose stack stopped successfully"
    else
        print_error "Failed to stop Docker Compose stack"
        cd "$original_dir"
        return 1
    fi
    
    # Rebuild and restart the stack
    print_info "Rebuilding and starting Docker Compose stack..."
    if docker compose up -d --build; then
        print_success "Docker Compose stack rebuilt and started successfully"
    else
        print_error "Failed to rebuild and start Docker Compose stack"
        cd "$original_dir"
        return 1
    fi
    
    # Return to original directory
    cd "$original_dir"
    return 0
}

# Function to rebuild admin container
rebuild_admin_container() {
    print_info "Rebuilding admin application container to apply tenant configuration..."
    
    # Navigate to app directory
    cd app
    
    # Check if node_modules exists, if not install dependencies
    if [[ ! -d "node_modules" ]]; then
        print_info "Installing dependencies in app directory..."
        if npm install; then
            print_success "Dependencies installed successfully"
        else
            print_error "Failed to install dependencies"
            cd ..
            return 1
        fi
    fi
    
    # Run the build command
    print_info "Running npm run build:admin:container..."
    if npm run build:admin:container; then
        print_success "Admin application container rebuilt successfully"
    else
        print_error "Failed to rebuild admin application container"
        cd ..
        return 1
    fi
    
    cd ..
    return 0
}

# Function to validate configuration
validate_configuration() {
    print_info "Validating tenant configuration..."
    
    # Check if admin app env was updated
    if [[ -f "app/gamehub-admin/.env.container.local" ]]; then
        if grep -q "VITE_TENANT_PUBLIC_KEY=" "app/gamehub-admin/.env.container.local"; then
            print_success "VITE_TENANT_PUBLIC_KEY found in app/gamehub-admin/.env.container.local"
        else
            print_error "VITE_TENANT_PUBLIC_KEY not found in app/gamehub-admin/.env.container.local"
            return 1
        fi
    else
        print_error "app/gamehub-admin/.env.container.local not found"
        return 1
    fi
    
    # Check if mesh env was updated
    if [[ -f "mesh/.env" ]]; then
        if grep -q "TENANT_PUBLIC_KEY=" "mesh/.env"; then
            print_success "TENANT_PUBLIC_KEY found in mesh/.env"
        else
            print_error "TENANT_PUBLIC_KEY not found in mesh/.env"
            return 1
        fi
    else
        print_error "mesh/.env not found"
        return 1
    fi
    
    return 0
}

# Check if help is requested
if [[ "$1" == "--help" || "$1" == "-h" ]]; then
    show_usage
    exit 0
fi

# Check if tenant public key is provided
if [[ -z "$1" ]]; then
    print_error "Tenant public key is required!"
    echo ""
    show_usage
    exit 1
fi

TENANT_PUBLIC_KEY="$1"
shift  # Remove the tenant key from arguments

# Parse additional options
FORCE_FLAG=""
VERBOSE_FLAG=""
NO_REBUILD=false

while [[ $# -gt 0 ]]; do
    case $1 in
        --force)
            FORCE_FLAG="--force"
            shift
            ;;
        --verbose)
            VERBOSE_FLAG="--verbose"
            shift
            ;;
        --no-rebuild)
            NO_REBUILD=true
            shift
            ;;
        *)
            print_warning "Unknown option: $1"
            shift
            ;;
    esac
done

# Get the script directory and project root
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
SETUP_DIR="$PROJECT_ROOT/setup"

print_info "GameHub Tenant Setup Script"
print_info "==========================="
print_info "Project root: $PROJECT_ROOT"
print_info "Setup directory: $SETUP_DIR"

# Validate tenant public key format
print_info "Validating tenant public key format..."
if ! validate_tenant_key "$TENANT_PUBLIC_KEY"; then
    exit 1
fi
print_success "Tenant public key format is valid"

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

# Prepare arguments for the update-tenant-key script
UPDATE_ARGS="--tenant-key \"$TENANT_PUBLIC_KEY\""

if [[ -n "$FORCE_FLAG" ]]; then
    UPDATE_ARGS="$UPDATE_ARGS $FORCE_FLAG"
fi

if [[ -n "$VERBOSE_FLAG" ]]; then
    UPDATE_ARGS="$UPDATE_ARGS $VERBOSE_FLAG"
fi

print_info "Updating tenant public key in configuration files..."
print_info "Update arguments: $UPDATE_ARGS"

# Run the update-tenant-key script
if eval "npm run update-tenant-key -- $UPDATE_ARGS"; then
    print_success "Tenant public key updated successfully in configuration files!"
else
    print_error "Failed to update tenant public key in configuration files!"
    exit 1
fi

# Navigate back to project root for build operations
cd "$PROJECT_ROOT"

# Check build requirements and rebuild admin container if not disabled
if [[ "$NO_REBUILD" == false ]]; then
    if check_build_requirements; then
        if rebuild_admin_container; then
            print_success "Admin application container rebuilt successfully"
        else
            print_error "Failed to rebuild admin application container"
            exit 1
        fi
    else
        print_warning "Build requirements check failed. Skipping rebuild."
        print_info "You may need to manually rebuild the admin container with:"
        print_info "cd app && npm run build:admin:container"
    fi
else
    print_info "Skipping admin application rebuild (--no-rebuild flag specified)"
    print_info "Remember to rebuild the admin container manually with:"
    print_info "cd app && npm run build:admin:container"
fi

# Rebuild Docker Compose stack to apply the new tenant key
print_info "Rebuilding Docker Compose stack to apply tenant configuration..."
if rebuild_docker_compose; then
    print_success "Docker Compose stack rebuilt successfully"
else
    print_error "Failed to rebuild Docker Compose stack"
    exit 1
fi

# Validate the configuration
print_info "Validating tenant configuration..."
if validate_configuration; then
    print_success "Tenant configuration validation passed!"
else
    print_error "Tenant configuration validation failed!"
    exit 1
fi

print_success "GameHub tenant setup completed successfully!"
echo ""
print_info "Next steps:"
print_info "Return to http://localhost/setup and refresh to complete the setup process"
echo ""
print_success "Tenant setup process completed!"