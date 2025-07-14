#!/bin/bash

# GameHub Mesh Initialization Script
# This script initializes the Docker Compose mesh configuration
# It is idempotent and safe to run multiple times
#
# Features:
# - Generates secure random secrets for environment variables
# - Creates synchronized client secrets for service-ip and player-ip
# - Generates provider configuration files with shared authentication keys
# - Creates necessary directory structure for secrets and authentication

set -euo pipefail

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
MESH_DIR="mesh"
ENV_FILE="$MESH_DIR/.env"
SECRETS_DIR="$MESH_DIR/secrets"
SERVICE_IP_CLIENT_SECRET_FILE="$SECRETS_DIR/service-ip/clients/player-ip"
PLAYER_IP_CLIENT_SECRET_FILE="$SECRETS_DIR/player-ip/player-ip-client-secret"
PROVIDER_DIR="$MESH_DIR/replicator/authentication"
PLAYER_PROVIDER_FILE="$PROVIDER_DIR/player.provider"
SERVICE_PROVIDER_FILE="$PROVIDER_DIR/service.provider"

# Example values that need to be replaced
POSTGRES_PASSWORD_EXAMPLE="secure_password_change_in_production"
JWT_SECRET_EXAMPLE="production-secret-key-change-me-in-production"
PLAYER_JWT_SECRET_EXAMPLE="production-player-secret-key-change-me-in-production"
SERVICE_IP_CLIENT_SECRET_EXAMPLE="sample-player-ip-client-secret-change-me-in-production"
PLAYER_IP_CLIENT_SECRET_EXAMPLE="sample-client-secret-change-me-in-production"

# Function to print colored output
print_status() {
    local color=$1
    local message=$2
    echo -e "${color}${message}${NC}"
}

print_info() {
    print_status "$BLUE" "ℹ️  $1"
}

print_success() {
    print_status "$GREEN" "✅ $1"
}

print_warning() {
    print_status "$YELLOW" "⚠️  $1"
}

print_error() {
    print_status "$RED" "❌ $1"
}

# Function to generate a secure random secret
generate_secret() {
    openssl rand -base64 32 | tr -d "=+/" | cut -c1-32
}

# Function to check if a value is an example value that needs replacement
is_example_value() {
    local value=$1
    local example_values=("$POSTGRES_PASSWORD_EXAMPLE" "$JWT_SECRET_EXAMPLE" "$PLAYER_JWT_SECRET_EXAMPLE")
    
    for example in "${example_values[@]}"; do
        if [[ "$value" == "$example" ]]; then
            return 0
        fi
    done
    return 1
}

# Function to update environment variable in .env file
update_env_var() {
    local var_name=$1
    local new_value=$2
    local file=$3
    
    # Check if the variable already exists in the file
    if grep -q "^${var_name}=" "$file" 2>/dev/null; then
        # Variable exists, update it
        if [[ "$OSTYPE" == "darwin"* ]]; then
            # macOS
            sed -i '' "s|^${var_name}=.*|${var_name}=${new_value}|" "$file"
        else
            # Linux
            sed -i "s|^${var_name}=.*|${var_name}=${new_value}|" "$file"
        fi
    else
        # Variable doesn't exist, append it
        echo "${var_name}=${new_value}" >> "$file"
    fi
}

# Function to get environment variable value from .env file
get_env_var() {
    local var_name=$1
    local file=$2
    grep "^${var_name}=" "$file" | cut -d'=' -f2- || echo ""
}

# Function to write provider configuration file with shared secret
write_provider_file() {
    local provider_file=$1
    local provider_name=$2
    local issuer=$3
    local audience=$4
    local key_id=$5
    local shared_secret=$6
    
    # Check if file exists and already has the correct key
    if [[ -f "$provider_file" ]]; then
        # Check if the file already contains the shared secret
        if grep -q "\"key\": \"$shared_secret\"" "$provider_file" 2>/dev/null; then
            print_success "Provider file already configured with correct key: $provider_file"
            return 0
        fi
    fi
    
    # Write the provider configuration file
    cat > "$provider_file" << EOF
{
  "provider": "$provider_name",
  "issuer": "$issuer",
  "audience": "$audience",
  "key_id": "$key_id",
  "key": "$shared_secret"
}
EOF
    
    print_warning "Updated provider file: $provider_file"
}

# Main initialization function
main() {
    print_info "Starting GameHub Mesh initialization..."
    echo
    
    # Check if we're in the right directory
    if [[ ! -f "$ENV_FILE" ]]; then
        print_error "Could not find $ENV_FILE. Please run this script from the project root directory."
        exit 1
    fi
    
    # Step 1: Create .env file for secrets if it doesn't exist
    if [[ ! -f "$ENV_FILE" ]]; then
        print_warning "Creating .env file for secrets"
        touch "$ENV_FILE"
        print_success ".env file created"
    else
        print_success ".env file already exists"
    fi
    
    # Step 2: Generate random secrets for environment variables and write to .env
    print_info "Checking environment variables for secrets in .env..."
    
    # Check POSTGRES_PASSWORD
    current_postgres_password=$(get_env_var "POSTGRES_PASSWORD" "$ENV_FILE")
    if [[ -z "$current_postgres_password" ]] || is_example_value "$current_postgres_password"; then
        new_postgres_password=$(generate_secret)
        update_env_var "POSTGRES_PASSWORD" "$new_postgres_password" "$ENV_FILE"
        print_warning "Generated new POSTGRES_PASSWORD in .env"
    else
        print_success "POSTGRES_PASSWORD already configured in .env"
    fi
    
    # Check JWT_SECRET
    current_jwt_secret=$(get_env_var "JWT_SECRET" "$ENV_FILE")
    if [[ -z "$current_jwt_secret" ]] || is_example_value "$current_jwt_secret"; then
        new_jwt_secret=$(generate_secret)
        update_env_var "JWT_SECRET" "$new_jwt_secret" "$ENV_FILE"
        print_warning "Generated new JWT_SECRET in .env"
    else
        print_success "JWT_SECRET already configured in .env"
    fi
    
    # Check PLAYER_JWT_SECRET
    current_player_jwt_secret=$(get_env_var "PLAYER_JWT_SECRET" "$ENV_FILE")
    if [[ -z "$current_player_jwt_secret" ]] || is_example_value "$current_player_jwt_secret"; then
        new_player_jwt_secret=$(generate_secret)
        update_env_var "PLAYER_JWT_SECRET" "$new_player_jwt_secret" "$ENV_FILE"
        print_warning "Generated new PLAYER_JWT_SECRET in .env"
    else
        print_success "PLAYER_JWT_SECRET already configured in .env"
    fi
    
    # Step 3: Create necessary directories
    print_info "Checking required directories..."
    
    directories=(
        "$SECRETS_DIR"
        "$SECRETS_DIR/service-ip"
        "$SECRETS_DIR/service-ip/clients"
        "$SECRETS_DIR/player-ip"
        "$SECRETS_DIR/content-store"
        "$SECRETS_DIR/fusionauth"
        "$SECRETS_DIR/fusionauth/application-config"
        "$PROVIDER_DIR"
    )
    
    for dir in "${directories[@]}"; do
        if [[ ! -d "$dir" ]]; then
            mkdir -p "$dir"
            print_warning "Created directory: $dir"
        else
            print_success "Directory already exists: $dir"
        fi
    done
    
    # Step 4: Generate client secrets if they contain example values
    print_info "Checking client secret files..."
    
    # Check service-ip client secret
    if [[ -f "$SERVICE_IP_CLIENT_SECRET_FILE" ]]; then
        current_service_secret=$(cat "$SERVICE_IP_CLIENT_SECRET_FILE")
        if [[ "$current_service_secret" == "$SERVICE_IP_CLIENT_SECRET_EXAMPLE" ]]; then
            new_client_secret=$(generate_secret)
            echo "$new_client_secret" > "$SERVICE_IP_CLIENT_SECRET_FILE"
            print_warning "Generated new service-ip client secret"
        else
            print_success "Service-ip client secret already configured"
        fi
    else
        new_client_secret=$(generate_secret)
        echo "$new_client_secret" > "$SERVICE_IP_CLIENT_SECRET_FILE"
        print_warning "Created service-ip client secret file"
    fi
    
    # Check player-ip client secret
    if [[ -f "$PLAYER_IP_CLIENT_SECRET_FILE" ]]; then
        current_player_secret=$(cat "$PLAYER_IP_CLIENT_SECRET_FILE")
        if [[ "$current_player_secret" == "$PLAYER_IP_CLIENT_SECRET_EXAMPLE" ]]; then
            # Use the same secret as service-ip for consistency
            service_secret=$(cat "$SERVICE_IP_CLIENT_SECRET_FILE")
            echo "$service_secret" > "$PLAYER_IP_CLIENT_SECRET_FILE"
            print_warning "Updated player-ip client secret to match service-ip"
        else
            print_success "Player-ip client secret already configured"
        fi
    else
        # Use the same secret as service-ip for consistency
        service_secret=$(cat "$SERVICE_IP_CLIENT_SECRET_FILE")
        echo "$service_secret" > "$PLAYER_IP_CLIENT_SECRET_FILE"
        print_warning "Created player-ip client secret file"
    fi
    
    # Step 5: Verify secrets match
    service_secret=$(cat "$SERVICE_IP_CLIENT_SECRET_FILE")
    player_secret=$(cat "$PLAYER_IP_CLIENT_SECRET_FILE")
    
    if [[ "$service_secret" != "$player_secret" ]]; then
        print_warning "Client secrets don't match, synchronizing..."
        echo "$service_secret" > "$PLAYER_IP_CLIENT_SECRET_FILE"
        print_success "Client secrets synchronized"
    else
        print_success "Client secrets are synchronized"
    fi
    
    # Step 6: Generate provider configuration files with shared secret
    print_info "Checking provider configuration files..."
    
    # Get the synchronized shared secret
    shared_secret=$(cat "$SERVICE_IP_CLIENT_SECRET_FILE")
    
    # Write player provider file
    write_provider_file "$PLAYER_PROVIDER_FILE" "Player" "player-ip" "gamehub-players" "player-ip-key" "$shared_secret"
    
    # Write service provider file
    write_provider_file "$SERVICE_PROVIDER_FILE" "Service" "service-ip" "service-clients" "service-ip-key" "$shared_secret"
    
    echo
    print_success "GameHub Mesh initialization completed successfully!"
    print_info "You can now run 'docker-compose up' in the mesh directory to start the services."
    
    # Summary of what was configured
    echo
    print_info "Configuration Summary:"
    echo "  📁 Environment secrets file: $ENV_FILE"
    echo "  🔐 Secrets directory: $SECRETS_DIR"
    echo "  🔑 Service-IP client secret: $SERVICE_IP_CLIENT_SECRET_FILE"
    echo "  🔑 Player-IP client secret: $PLAYER_IP_CLIENT_SECRET_FILE"
    echo "  🔧 Provider configuration directory: $PROVIDER_DIR"
    echo "  🔧 Player provider file: $PLAYER_PROVIDER_FILE"
    echo "  🔧 Service provider file: $SERVICE_PROVIDER_FILE"
}

# Error handling
trap 'print_error "Script failed on line $LINENO"' ERR

# Check dependencies
if ! command -v openssl &> /dev/null; then
    print_error "openssl is required but not installed. Please install openssl and try again."
    exit 1
fi

# Run main function
main "$@"