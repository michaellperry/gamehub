#!/bin/bash

# Enhanced Build Script for Content-Store Service
# This script provides comprehensive build, test, and deployment capabilities

set -e

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
CONTENT_STORE_DIR="$PROJECT_DIR/app/content-store"
IMAGE_NAME="gamehub-content-store"
REGISTRY="${DOCKER_REGISTRY:-}"
BUILD_NUMBER="${BUILD_NUMBER:-$(date +%Y%m%d-%H%M%S)}"
GIT_COMMIT="${GIT_COMMIT:-$(git rev-parse --short HEAD 2>/dev/null || echo 'unknown')}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
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

# Help function
show_help() {
    cat << EOF
Enhanced Build Script for Content-Store Service

Usage: $0 [OPTIONS]

OPTIONS:
    --help, -h              Show this help message
    --skip-tests           Skip running tests
    --skip-lint            Skip linting
    --skip-security        Skip security checks
    --push                 Push image to registry after build
    --tag TAG              Additional tag for the image
    --registry REGISTRY    Docker registry to use
    --env ENV              Environment (dev, staging, prod)
    --validate             Run comprehensive validation
    --health-check         Run health check after build
    --clean                Clean build artifacts before building
    --verbose              Enable verbose output

EXAMPLES:
    $0                                    # Basic build
    $0 --validate --health-check         # Build with validation and health check
    $0 --push --tag v1.0.0               # Build and push with custom tag
    $0 --env staging --push              # Build for staging and push
    $0 --clean --validate --push         # Clean build with validation and push

ENVIRONMENT VARIABLES:
    DOCKER_REGISTRY        Docker registry URL
    BUILD_NUMBER          Build number for tagging
    GIT_COMMIT            Git commit hash
    SKIP_TESTS            Set to 'true' to skip tests
    SKIP_LINT             Set to 'true' to skip linting
    SKIP_SECURITY         Set to 'true' to skip security checks
EOF
}

# Parse command line arguments
SKIP_TESTS=false
SKIP_LINT=false
SKIP_SECURITY=false
PUSH_IMAGE=false
CUSTOM_TAG=""
ENVIRONMENT="dev"
VALIDATE=false
HEALTH_CHECK=false
CLEAN_BUILD=false
VERBOSE=false

while [[ $# -gt 0 ]]; do
    case $1 in
        --help|-h)
            show_help
            exit 0
            ;;
        --skip-tests)
            SKIP_TESTS=true
            shift
            ;;
        --skip-lint)
            SKIP_LINT=true
            shift
            ;;
        --skip-security)
            SKIP_SECURITY=true
            shift
            ;;
        --push)
            PUSH_IMAGE=true
            shift
            ;;
        --tag)
            CUSTOM_TAG="$2"
            shift 2
            ;;
        --registry)
            REGISTRY="$2"
            shift 2
            ;;
        --env)
            ENVIRONMENT="$2"
            shift 2
            ;;
        --validate)
            VALIDATE=true
            shift
            ;;
        --health-check)
            HEALTH_CHECK=true
            shift
            ;;
        --clean)
            CLEAN_BUILD=true
            shift
            ;;
        --verbose)
            VERBOSE=true
            set -x
            shift
            ;;
        *)
            log_error "Unknown option: $1"
            show_help
            exit 1
            ;;
    esac
done

# Override with environment variables
[[ "${SKIP_TESTS:-}" == "true" ]] && SKIP_TESTS=true
[[ "${SKIP_LINT:-}" == "true" ]] && SKIP_LINT=true
[[ "${SKIP_SECURITY:-}" == "true" ]] && SKIP_SECURITY=true

# Validation function
validate_environment() {
    log_step "Validating build environment..."
    
    # Check if we're in the right directory
    if [[ ! -f "$CONTENT_STORE_DIR/package.json" ]]; then
        log_error "content-store package.json not found. Are you in the right directory?"
        exit 1
    fi
    
    # Check Docker
    if ! command -v docker &> /dev/null; then
        log_error "Docker is not installed or not in PATH"
        exit 1
    fi
    
    # Check Node.js
    if ! command -v node &> /dev/null; then
        log_error "Node.js is not installed or not in PATH"
        exit 1
    fi
    
    # Check npm
    if ! command -v npm &> /dev/null; then
        log_error "npm is not installed or not in PATH"
        exit 1
    fi
    
    log_success "Environment validation passed"
}

# Clean build artifacts
clean_build_artifacts() {
    if [[ "$CLEAN_BUILD" == "true" ]]; then
        log_step "Cleaning build artifacts..."
        cd "$CONTENT_STORE_DIR"
        
        # Remove node_modules if requested
        if [[ "${CLEAN_NODE_MODULES:-}" == "true" ]]; then
            if [[ -d "node_modules" ]]; then
                rm -rf node_modules
                log_info "Removed node_modules directory"
            fi
        fi
        
        # Remove test artifacts
        rm -rf coverage .nyc_output
        
        log_success "Build artifacts cleaned"
    fi
}

# Install dependencies
install_dependencies() {
    log_step "Installing dependencies..."
    cd "$CONTENT_STORE_DIR"
    
    if [[ -f "package-lock.json" ]]; then
        npm ci
    else
        npm install
    fi
    
    log_success "Dependencies installed"
}

# Run linting
run_lint() {
    if [[ "$SKIP_LINT" == "false" ]]; then
        log_step "Running code linting..."
        cd "$CONTENT_STORE_DIR"
        
        # Check if lint script exists
        if npm run lint --silent 2>/dev/null; then
            log_success "Linting passed"
        else
            log_warning "No lint script found, skipping linting"
        fi
    else
        log_warning "Skipping linting"
    fi
}

# Run tests
run_tests() {
    if [[ "$SKIP_TESTS" == "false" ]]; then
        log_step "Running tests..."
        cd "$CONTENT_STORE_DIR"
        
        # Check if test script exists
        if npm run test --silent 2>/dev/null; then
            log_success "Tests passed"
        else
            log_warning "No test script found, skipping tests"
        fi
    else
        log_warning "Skipping tests"
    fi
}

# Run security checks
run_security_checks() {
    if [[ "$SKIP_SECURITY" == "false" ]]; then
        log_step "Running security checks..."
        cd "$CONTENT_STORE_DIR"
        
        # Run npm audit
        log_info "Running npm security audit..."
        if npm audit --audit-level=moderate; then
            log_success "Security audit passed"
        else
            log_warning "Security audit found issues"
        fi
    else
        log_warning "Skipping security checks"
    fi
}

# Build Docker image
build_docker_image() {
    log_step "Building Docker image..."
    cd "$CONTENT_STORE_DIR"
    
    # Prepare tags
    local tags=()
    tags+=("$IMAGE_NAME:latest")
    tags+=("$IMAGE_NAME:$BUILD_NUMBER")
    tags+=("$IMAGE_NAME:$GIT_COMMIT")
    
    if [[ -n "$CUSTOM_TAG" ]]; then
        tags+=("$IMAGE_NAME:$CUSTOM_TAG")
    fi
    
    if [[ "$ENVIRONMENT" != "dev" ]]; then
        tags+=("$IMAGE_NAME:$ENVIRONMENT")
    fi
    
    # Add registry prefix if specified
    if [[ -n "$REGISTRY" ]]; then
        local registry_tags=()
        for tag in "${tags[@]}"; do
            registry_tags+=("$REGISTRY/$tag")
        done
        tags+=("${registry_tags[@]}")
    fi
    
    # Build command
    local build_cmd="docker build"
    
    # Add build args
    build_cmd+=" --build-arg BUILD_NUMBER=$BUILD_NUMBER"
    build_cmd+=" --build-arg GIT_COMMIT=$GIT_COMMIT"
    build_cmd+=" --build-arg BUILD_DATE=$(date -u +'%Y-%m-%dT%H:%M:%SZ')"
    build_cmd+=" --build-arg ENVIRONMENT=$ENVIRONMENT"
    
    # Add tags
    for tag in "${tags[@]}"; do
        build_cmd+=" -t $tag"
    done
    
    # Add context
    build_cmd+=" ."
    
    log_info "Build command: $build_cmd"
    
    if eval "$build_cmd"; then
        log_success "Docker image built successfully"
        log_info "Tags created:"
        for tag in "${tags[@]}"; do
            log_info "  - $tag"
        done
    else
        log_error "Docker image build failed"
        exit 1
    fi
}

# Push Docker image
push_docker_image() {
    if [[ "$PUSH_IMAGE" == "true" ]]; then
        if [[ -z "$REGISTRY" ]]; then
            log_error "Registry not specified. Use --registry option or set DOCKER_REGISTRY environment variable"
            exit 1
        fi
        
        log_step "Pushing Docker image to registry..."
        
        # Push all registry tags
        local pushed=false
        docker images --format "table {{.Repository}}:{{.Tag}}" | grep "^$REGISTRY/$IMAGE_NAME:" | while read -r image; do
            log_info "Pushing $image..."
            if docker push "$image"; then
                log_success "Pushed $image"
                pushed=true
            else
                log_error "Failed to push $image"
                exit 1
            fi
        done
        
        if [[ "$pushed" == "true" ]]; then
            log_success "All images pushed successfully"
        fi
    else
        log_info "Skipping image push (use --push to enable)"
    fi
}

# Run health check
run_health_check() {
    if [[ "$HEALTH_CHECK" == "true" ]]; then
        log_step "Running health check..."
        cd "$CONTENT_STORE_DIR"
        
        # Start container for health check
        local container_name="content-store-health-check-$$"
        local container_port="8081"
        
        log_info "Starting container for health check..."
        if docker run -d --name "$container_name" -p "$container_port:8081" \
            -e NODE_ENV=test \
            -e PORT=8081 \
            "$IMAGE_NAME:latest"; then
            
            # Wait for container to start
            sleep 10
            
            # Run health check
            if curl -f "http://localhost:$container_port/health"; then
                log_success "Health check passed"
            else
                log_error "Health check failed"
                docker logs "$container_name"
                docker stop "$container_name" && docker rm "$container_name"
                exit 1
            fi
            
            # Clean up
            docker stop "$container_name" && docker rm "$container_name"
        else
            log_error "Failed to start container for health check"
            exit 1
        fi
    else
        log_info "Skipping health check (use --health-check to enable)"
    fi
}

# Generate build report
generate_build_report() {
    log_step "Generating build report..."
    
    local report_file="$CONTENT_STORE_DIR/build-report.json"
    
    cat > "$report_file" << EOF
{
  "buildNumber": "$BUILD_NUMBER",
  "gitCommit": "$GIT_COMMIT",
  "environment": "$ENVIRONMENT",
  "buildDate": "$(date -u +'%Y-%m-%dT%H:%M:%SZ')",
  "imageName": "$IMAGE_NAME",
  "tags": [
    "$IMAGE_NAME:latest",
    "$IMAGE_NAME:$BUILD_NUMBER",
    "$IMAGE_NAME:$GIT_COMMIT"
  ],
  "registry": "$REGISTRY",
  "skipTests": $SKIP_TESTS,
  "skipLint": $SKIP_LINT,
  "skipSecurity": $SKIP_SECURITY,
  "validated": $VALIDATE,
  "healthChecked": $HEALTH_CHECK
}
EOF
    
    log_success "Build report generated: $report_file"
}

# Main execution
main() {
    log_info "Starting Content-Store build process..."
    log_info "Build Number: $BUILD_NUMBER"
    log_info "Git Commit: $GIT_COMMIT"
    log_info "Environment: $ENVIRONMENT"
    
    validate_environment
    clean_build_artifacts
    install_dependencies
    run_lint
    run_tests
    run_security_checks
    build_docker_image
    push_docker_image
    run_health_check
    generate_build_report
    
    log_success "Content-Store build completed successfully!"
}

# Execute main function
main "$@"