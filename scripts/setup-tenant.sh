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
    echo "  --no-restart            Skip Docker service restart"
    echo "  --help                  Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 \"-----BEGIN PUBLIC KEY-----\nMIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA...\n-----END PUBLIC KEY-----\""
    echo "  $0 \"<TENANT_PUBLIC_KEY>\" --verbose --force"
    echo "  $0 \"<TENANT_PUBLIC_KEY>\" --no-restart"
    echo ""
    echo "Script Functionality:"
    echo "  - Validates tenant public key format"
    echo "  - Updates mesh/.env.local with TENANT_PUBLIC_KEY"
    echo "  - Updates app/gamehub-admin/.env.container.local with VITE_TENANT_PUBLIC_KEY"
    echo "  - Restarts necessary Docker services to apply changes"
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

# Function to check Docker services
check_docker_services() {
    print_info "Checking Docker services..."
    
    if ! command -v docker &> /dev/null; then
        print_error "Docker is not installed or not in PATH"
        return 1
    fi
    
    if ! docker info &> /dev/null; then
        print_error "Docker daemon is not running"
        return 1
    fi
    
    # Check if we're in a directory with docker-compose.yml
    if [[ ! -f "mesh/docker-compose.yml" ]]; then
        print_error "docker-compose.yml not found in mesh/ directory"
        return 1
    fi
    
    return 0
}

# Function to restart Docker services
restart_docker_services() {
    print_info "Restarting Docker services to apply tenant configuration..."
    
    cd mesh
    
    # Stop services that need the tenant key
    print_info "Stopping services that require tenant configuration..."
    if docker compose stop gamehub-admin player-ip service-ip; then
        print_success "Services stopped successfully"
    else
        print_warning "Some services may not have stopped cleanly"
    fi
    
    # Start services back up
    print_info "Starting services with new tenant configuration..."
    if docker compose up -d gamehub-admin player-ip service-ip; then
        print_success "Services restarted successfully"
    else
        print_error "Failed to restart services"
        return 1
    fi
    
    cd ..
    return 0
}

# Function to validate configuration
validate_configuration() {
    print_info "Validating tenant configuration..."
    
    # Check if .env.local was updated
    if [[ -f "mesh/.env.local" ]]; then
        if grep -q "TENANT_PUBLIC_KEY=" "mesh/.env.local"; then
            print_success "TENANT_PUBLIC_KEY found in mesh/.env.local"
        else
            print_error "TENANT_PUBLIC_KEY not found in mesh/.env.local"
            return 1
        fi
    else
        print_error "mesh/.env.local not found"
        return 1
    fi
    
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
NO_RESTART=false

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
        --no-restart)
            NO_RESTART=true
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

# Navigate back to project root for Docker operations
cd "$PROJECT_ROOT"

# Check Docker services and restart if not disabled
if [[ "$NO_RESTART" == false ]]; then
    if check_docker_services; then
        if restart_docker_services; then
            print_success "Docker services restarted successfully"
        else
            print_error "Failed to restart Docker services"
            exit 1
        fi
    else
        print_warning "Docker services check failed. Skipping restart."
        print_info "You may need to manually restart the services with:"
        print_info "cd mesh && docker compose down && docker compose up -d"
    fi
else
    print_info "Skipping Docker service restart (--no-restart flag specified)"
    print_info "Remember to restart services manually with:"
    print_info "cd mesh && docker compose down && docker compose up -d"
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
print_info "1. Verify services are running: docker compose ps"
print_info "2. Check service logs if needed: docker compose logs <service-name>"
print_info "3. Navigate to http://localhost/portal/service-principals to complete Step 3"
print_info "4. Create a service principal for Player-IP service"
echo ""
print_success "Tenant setup process completed!"