#!/bin/bash

# Enhanced Deployment Script for Player-IP Service
# This script provides comprehensive deployment capabilities with health checks,
# rollback support, and monitoring integration

set -e

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
PLAYER_IP_DIR="$PROJECT_DIR/app/player-ip"
MESH_DIR="$PROJECT_DIR/mesh"

# Default values
ENVIRONMENT="staging"
IMAGE_TAG="latest"
REGISTRY="${DOCKER_REGISTRY:-}"
NAMESPACE="${KUBERNETES_NAMESPACE:-gamehub}"
DEPLOYMENT_TIMEOUT=300
HEALTH_CHECK_RETRIES=10
ROLLBACK_ON_FAILURE=true
DRY_RUN=false
FORCE_DEPLOY=false
SKIP_HEALTH_CHECK=false
SKIP_MIGRATION=false

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
MAGENTA='\033[0;35m'
NC='\033[0m' # No Color

# Logging functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

log_step() {
    echo -e "${CYAN}[STEP]${NC} $1"
}

log_debug() {
    if [[ "${DEBUG:-}" == "true" ]]; then
        echo -e "${MAGENTA}[DEBUG]${NC} $1"
    fi
}

# Help function
show_help() {
    cat << EOF
Enhanced Deployment Script for Player-IP Service

Usage: $0 [OPTIONS]

OPTIONS:
    --help, -h              Show this help message
    --env ENV               Environment to deploy to (staging, production)
    --tag TAG               Docker image tag to deploy
    --registry REGISTRY     Docker registry URL
    --namespace NS          Kubernetes namespace
    --timeout SECONDS       Deployment timeout in seconds (default: 300)
    --retries COUNT         Health check retry count (default: 10)
    --dry-run               Show what would be deployed without executing
    --force                 Force deployment even if validation fails
    --skip-health-check     Skip post-deployment health checks
    --skip-migration        Skip database migration
    --no-rollback           Disable automatic rollback on failure
    --rollback              Rollback to previous deployment
    --status                Show current deployment status
    --logs                  Show deployment logs
    --debug                 Enable debug output

EXAMPLES:
    $0 --env staging --tag v1.0.0                    # Deploy specific tag to staging
    $0 --env production --tag latest --force         # Force deploy to production
    $0 --rollback --env staging                      # Rollback staging deployment
    $0 --status --env production                     # Check production status
    $0 --dry-run --env staging --tag v1.0.0          # Dry run deployment

ENVIRONMENT VARIABLES:
    DOCKER_REGISTRY        Docker registry URL
    KUBERNETES_NAMESPACE   Kubernetes namespace
    KUBECONFIG            Kubernetes config file path
    DEBUG                 Enable debug output (true/false)
EOF
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --help|-h)
            show_help
            exit 0
            ;;
        --env)
            ENVIRONMENT="$2"
            shift 2
            ;;
        --tag)
            IMAGE_TAG="$2"
            shift 2
            ;;
        --registry)
            REGISTRY="$2"
            shift 2
            ;;
        --namespace)
            NAMESPACE="$2"
            shift 2
            ;;
        --timeout)
            DEPLOYMENT_TIMEOUT="$2"
            shift 2
            ;;
        --retries)
            HEALTH_CHECK_RETRIES="$2"
            shift 2
            ;;
        --dry-run)
            DRY_RUN=true
            shift
            ;;
        --force)
            FORCE_DEPLOY=true
            shift
            ;;
        --skip-health-check)
            SKIP_HEALTH_CHECK=true
            shift
            ;;
        --skip-migration)
            SKIP_MIGRATION=true
            shift
            ;;
        --no-rollback)
            ROLLBACK_ON_FAILURE=false
            shift
            ;;
        --rollback)
            ACTION="rollback"
            shift
            ;;
        --status)
            ACTION="status"
            shift
            ;;
        --logs)
            ACTION="logs"
            shift
            ;;
        --debug)
            DEBUG=true
            shift
            ;;
        *)
            log_error "Unknown option: $1"
            show_help
            exit 1
            ;;
    esac
done

# Validate environment
validate_environment() {
    log_step "Validating deployment environment..."
    
    # Check required tools
    local required_tools=("docker" "docker-compose")
    
    # Add kubectl if using Kubernetes
    if [[ -n "${KUBECONFIG:-}" ]] || command -v kubectl &> /dev/null; then
        required_tools+=("kubectl")
    fi
    
    for tool in "${required_tools[@]}"; do
        if ! command -v "$tool" &> /dev/null; then
            log_error "$tool is not installed or not in PATH"
            exit 1
        fi
    done
    
    # Validate environment
    if [[ "$ENVIRONMENT" != "staging" && "$ENVIRONMENT" != "production" ]]; then
        log_error "Invalid environment: $ENVIRONMENT. Must be 'staging' or 'production'"
        exit 1
    fi
    
    # Check if mesh directory exists
    if [[ ! -d "$MESH_DIR" ]]; then
        log_error "Mesh directory not found: $MESH_DIR"
        exit 1
    fi
    
    # Check if docker-compose.yml exists
    if [[ ! -f "$MESH_DIR/docker-compose.yml" ]]; then
        log_error "docker-compose.yml not found in mesh directory"
        exit 1
    fi
    
    log_success "Environment validation passed"
}

# Get current deployment status
get_deployment_status() {
    log_step "Getting current deployment status..."
    
    cd "$MESH_DIR"
    
    # Check if services are running
    local running_services
    running_services=$(docker-compose ps --services --filter "status=running" 2>/dev/null || echo "")
    
    if [[ -n "$running_services" ]]; then
        log_info "Currently running services:"
        echo "$running_services" | while read -r service; do
            if [[ -n "$service" ]]; then
                local container_info
                container_info=$(docker-compose ps "$service" 2>/dev/null || echo "")
                log_info "  - $service: $container_info"
            fi
        done
    else
        log_info "No services currently running"
    fi
    
    # Get image information
    if docker-compose ps player-ip &> /dev/null; then
        local image_info
        image_info=$(docker inspect "$(docker-compose ps -q player-ip)" --format '{{.Config.Image}}' 2>/dev/null || echo "unknown")
        log_info "Current player-ip image: $image_info"
    fi
}

# Show deployment logs
show_deployment_logs() {
    log_step "Showing deployment logs..."
    
    cd "$MESH_DIR"
    
    if docker-compose ps player-ip &> /dev/null; then
        log_info "Player-IP service logs:"
        docker-compose logs --tail=50 player-ip
    else
        log_warning "Player-IP service is not running"
    fi
}

# Backup current deployment
backup_current_deployment() {
    log_step "Backing up current deployment..."
    
    local backup_dir="$MESH_DIR/backups/$(date +%Y%m%d-%H%M%S)"
    mkdir -p "$backup_dir"
    
    # Backup docker-compose configuration
    cp "$MESH_DIR/docker-compose.yml" "$backup_dir/"
    
    # Backup environment files
    if [[ -f "$MESH_DIR/.env" ]]; then
        cp "$MESH_DIR/.env" "$backup_dir/"
    fi
    
    # Export current container information
    cd "$MESH_DIR"
    docker-compose config > "$backup_dir/resolved-compose.yml" 2>/dev/null || true
    
    # Save current image tags
    docker-compose images > "$backup_dir/current-images.txt" 2>/dev/null || true
    
    log_success "Backup created: $backup_dir"
    echo "$backup_dir" > "$MESH_DIR/.last-backup"
}

# Run database migration
run_database_migration() {
    if [[ "$SKIP_MIGRATION" == "false" ]]; then
        log_step "Running database migration..."
        
        if [[ "$DRY_RUN" == "true" ]]; then
            log_info "[DRY RUN] Would run database migration"
            return
        fi
        
        cd "$PLAYER_IP_DIR"
        
        # Run migration with appropriate environment
        local migration_env="production"
        if [[ "$ENVIRONMENT" == "staging" ]]; then
            migration_env="staging"
        fi
        
        # Set environment variables for migration
        export NODE_ENV="$migration_env"
        export SQLITE_DB_PATH="/app/data/player-ip.db"
        
        if node scripts/migrate.js; then
            log_success "Database migration completed"
        else
            log_error "Database migration failed"
            exit 1
        fi
    else
        log_warning "Skipping database migration"
    fi
}

# Update docker-compose configuration
update_compose_configuration() {
    log_step "Updating docker-compose configuration..."
    
    cd "$MESH_DIR"
    
    # Prepare image name
    local full_image_name="$IMAGE_TAG"
    if [[ -n "$REGISTRY" ]]; then
        full_image_name="$REGISTRY/gamehub-player-ip:$IMAGE_TAG"
    else
        full_image_name="gamehub-player-ip:$IMAGE_TAG"
    fi
    
    if [[ "$DRY_RUN" == "true" ]]; then
        log_info "[DRY RUN] Would update player-ip image to: $full_image_name"
        return
    fi
    
    # Create temporary compose file with updated image
    local temp_compose="docker-compose.deploy.yml"
    
    # Use yq if available, otherwise use sed
    if command -v yq &> /dev/null; then
        yq eval ".services.player-ip.image = \"$full_image_name\"" docker-compose.yml > "$temp_compose"
    else
        # Fallback to sed (less reliable but works)
        sed "s|gamehub-player-ip:.*|$full_image_name|g" docker-compose.yml > "$temp_compose"
    fi
    
    log_success "Configuration updated with image: $full_image_name"
}

# Deploy services
deploy_services() {
    log_step "Deploying services..."
    
    cd "$MESH_DIR"
    
    if [[ "$DRY_RUN" == "true" ]]; then
        log_info "[DRY RUN] Would deploy services with docker-compose"
        docker-compose -f docker-compose.deploy.yml config
        return
    fi
    
    # Pull latest images
    log_info "Pulling latest images..."
    if ! docker-compose -f docker-compose.deploy.yml pull player-ip; then
        log_error "Failed to pull player-ip image"
        exit 1
    fi
    
    # Deploy with rolling update
    log_info "Starting deployment..."
    
    # Stop old container gracefully
    docker-compose stop player-ip || true
    
    # Start new container
    if docker-compose -f docker-compose.deploy.yml up -d player-ip; then
        log_success "Player-IP service deployed"
    else
        log_error "Failed to deploy player-ip service"
        exit 1
    fi
    
    # Wait for service to be ready
    log_info "Waiting for service to be ready..."
    sleep 10
}

# Run health checks
run_health_checks() {
    if [[ "$SKIP_HEALTH_CHECK" == "false" ]]; then
        log_step "Running post-deployment health checks..."
        
        if [[ "$DRY_RUN" == "true" ]]; then
            log_info "[DRY RUN] Would run health checks"
            return
        fi
        
        local service_url="http://localhost:8082"
        local retry_count=0
        local max_retries=$HEALTH_CHECK_RETRIES
        
        while [[ $retry_count -lt $max_retries ]]; do
            log_info "Health check attempt $((retry_count + 1))/$max_retries..."
            
            if curl -f -s "$service_url/health" > /dev/null; then
                log_success "Health check passed"
                return 0
            fi
            
            retry_count=$((retry_count + 1))
            if [[ $retry_count -lt $max_retries ]]; then
                log_warning "Health check failed, retrying in 10 seconds..."
                sleep 10
            fi
        done
        
        log_error "Health checks failed after $max_retries attempts"
        return 1
    else
        log_warning "Skipping health checks"
        return 0
    fi
}

# Rollback deployment
rollback_deployment() {
    log_step "Rolling back deployment..."
    
    cd "$MESH_DIR"
    
    if [[ ! -f ".last-backup" ]]; then
        log_error "No backup information found for rollback"
        exit 1
    fi
    
    local backup_dir
    backup_dir=$(cat .last-backup)
    
    if [[ ! -d "$backup_dir" ]]; then
        log_error "Backup directory not found: $backup_dir"
        exit 1
    fi
    
    if [[ "$DRY_RUN" == "true" ]]; then
        log_info "[DRY RUN] Would rollback to backup: $backup_dir"
        return
    fi
    
    log_info "Rolling back to: $backup_dir"
    
    # Restore configuration
    cp "$backup_dir/docker-compose.yml" ./
    if [[ -f "$backup_dir/.env" ]]; then
        cp "$backup_dir/.env" ./
    fi
    
    # Redeploy with old configuration
    docker-compose up -d player-ip
    
    log_success "Rollback completed"
}

# Cleanup deployment artifacts
cleanup_deployment() {
    log_step "Cleaning up deployment artifacts..."
    
    cd "$MESH_DIR"
    
    # Remove temporary files
    rm -f docker-compose.deploy.yml
    
    # Clean up old images (keep last 3)
    log_info "Cleaning up old Docker images..."
    docker images "gamehub-player-ip" --format "table {{.Repository}}:{{.Tag}}\t{{.CreatedAt}}" | \
        tail -n +2 | sort -k2 -r | tail -n +4 | awk '{print $1}' | \
        xargs -r docker rmi || true
    
    log_success "Cleanup completed"
}

# Generate deployment report
generate_deployment_report() {
    log_step "Generating deployment report..."
    
    local report_file="$MESH_DIR/deployment-report-$(date +%Y%m%d-%H%M%S).json"
    
    cat > "$report_file" << EOF
{
  "deploymentDate": "$(date -u +'%Y-%m-%dT%H:%M:%SZ')",
  "environment": "$ENVIRONMENT",
  "imageTag": "$IMAGE_TAG",
  "registry": "$REGISTRY",
  "namespace": "$NAMESPACE",
  "dryRun": $DRY_RUN,
  "skipHealthCheck": $SKIP_HEALTH_CHECK,
  "skipMigration": $SKIP_MIGRATION,
  "rollbackOnFailure": $ROLLBACK_ON_FAILURE,
  "deploymentTimeout": $DEPLOYMENT_TIMEOUT,
  "healthCheckRetries": $HEALTH_CHECK_RETRIES
}
EOF
    
    log_success "Deployment report generated: $report_file"
}

# Main deployment function
deploy() {
    log_info "Starting deployment of player-ip service"
    log_info "Environment: $ENVIRONMENT"
    log_info "Image Tag: $IMAGE_TAG"
    log_info "Registry: ${REGISTRY:-'local'}"
    log_info "Dry Run: $DRY_RUN"
    echo
    
    validate_environment
    backup_current_deployment
    run_database_migration
    update_compose_configuration
    deploy_services
    
    if run_health_checks; then
        cleanup_deployment
        generate_deployment_report
        log_success "🎉 Deployment completed successfully!"
    else
        if [[ "$ROLLBACK_ON_FAILURE" == "true" && "$DRY_RUN" == "false" ]]; then
            log_warning "Health checks failed, initiating rollback..."
            rollback_deployment
            log_error "Deployment failed and was rolled back"
            exit 1
        else
            log_error "Deployment failed"
            exit 1
        fi
    fi
}

# Main execution
main() {
    case "${ACTION:-deploy}" in
        deploy)
            deploy
            ;;
        rollback)
            validate_environment
            rollback_deployment
            log_success "Rollback completed"
            ;;
        status)
            validate_environment
            get_deployment_status
            ;;
        logs)
            validate_environment
            show_deployment_logs
            ;;
        *)
            log_error "Unknown action: ${ACTION:-deploy}"
            exit 1
            ;;
    esac
}

# Execute main function
main "$@"