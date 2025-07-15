# Player-IP Service Testing and Deployment Guide

This document provides comprehensive information about the testing infrastructure and deployment pipeline for the Player-IP service.

## Table of Contents

- [Testing Infrastructure](#testing-infrastructure)
- [Deployment Pipeline](#deployment-pipeline)
- [Quality Gates](#quality-gates)
- [Monitoring and Health Checks](#monitoring-and-health-checks)
- [Security Considerations](#security-considerations)
- [Performance Testing](#performance-testing)
- [CI/CD Integration](#cicd-integration)
- [Troubleshooting](#troubleshooting)

## Testing Infrastructure

### Test Categories

The Player-IP service includes comprehensive testing coverage across multiple categories:

#### 1. Unit Tests
- **Location**: `tests/unit/`
- **Purpose**: Test individual components in isolation
- **Coverage**: Utils, Repository functions, JWT operations, OAuth utilities
- **Command**: `npm run test:unit`

**Key Test Files**:
- `tests/unit/utils/jwt.test.js` - JWT token generation and validation
- `tests/unit/utils/oauth.test.js` - OAuth PKCE verification
- `tests/unit/utils/cookie.test.js` - Cookie utilities and security
- `tests/unit/repository/user.test.js` - User management operations
- `tests/unit/repository/auth.test.js` - Authentication operations

#### 2. Integration Tests
- **Location**: `test-integration.ts`
- **Purpose**: Test complete workflows and service integration
- **Coverage**: End-to-end OAuth flows, database operations, API endpoints
- **Command**: `npm run test:integration`

#### 3. Component Tests
- **Location**: `test-components.js`
- **Purpose**: Test components without full server setup
- **Coverage**: Repository functions, utilities, GAP integration
- **Command**: `npm run test:component`

#### 4. API Contract Tests
- **Location**: `tests/contract/api-contract.test.js`
- **Purpose**: Verify API endpoint contracts and specifications
- **Coverage**: Request/response formats, HTTP status codes, CORS, error patterns
- **Command**: `npm run test:contract`

#### 5. Performance Tests
- **Location**: `tests/performance/load.test.js`
- **Purpose**: Validate service performance under load
- **Coverage**: Response times, concurrent requests, memory usage, sustained load
- **Command**: `npm run test:performance`

#### 6. Security Tests
- **Location**: `tests/security/security.test.js`
- **Purpose**: Validate security posture and vulnerability prevention
- **Coverage**: Input validation, XSS/SQL injection prevention, JWT security, CORS
- **Command**: `npm run test:security`

### Test Configuration

#### Environment Variables
```bash
NODE_ENV=test
SQLITE_DB_PATH=./test-data/test.db
JWT_SECRET=test-secret-key
SKIP_JINAGA_SUBSCRIPTION=true
```

#### Test Data Management
- Test databases are created in `test-data/` directory
- Automatic cleanup after test completion
- Isolated test environments for each test suite

### Running Tests

```bash
# Run all tests
npm test

# Run specific test categories
npm run test:unit
npm run test:integration
npm run test:component
npm run test:contract
npm run test:performance
npm run test:security

# Run tests with coverage
npm run test:coverage

# Watch mode for development
npm run test:watch
```

## Deployment Pipeline

### Build Process

The enhanced build script (`scripts/build-player-ip.sh`) provides comprehensive build capabilities:

```bash
# Basic build
./scripts/build-player-ip.sh

# Build with validation and health checks
./scripts/build-player-ip.sh --validate --health-check

# Build for production with push to registry
./scripts/build-player-ip.sh --env production --push --tag v1.0.0

# Clean build with all validations
./scripts/build-player-ip.sh --clean --validate --push
```

#### Build Features
- **Code Quality**: Linting, type checking, security audits
- **Testing**: Unit, component, integration, and security tests
- **Docker**: Multi-platform image building with proper tagging
- **Validation**: Comprehensive pre-deployment validation
- **Health Checks**: Post-build container health verification

### Deployment Process

The deployment script (`scripts/deploy-player-ip.sh`) handles production deployments:

```bash
# Deploy to staging
./scripts/deploy-player-ip.sh --env staging --tag v1.0.0

# Deploy to production with force flag
./scripts/deploy-player-ip.sh --env production --tag v1.0.0 --force

# Dry run deployment
./scripts/deploy-player-ip.sh --env staging --tag v1.0.0 --dry-run

# Rollback deployment
./scripts/deploy-player-ip.sh --rollback --env staging
```

#### Deployment Features
- **Environment Management**: Staging and production environments
- **Health Checks**: Post-deployment health verification
- **Rollback**: Automatic rollback on failure
- **Database Migration**: Automated schema updates
- **Backup**: Automatic backup before deployment
- **Monitoring**: Deployment status and logging

## Quality Gates

### Code Coverage Requirements
- **Minimum Coverage**: 80%
- **Unit Tests**: 90%+ coverage for utilities and core functions
- **Integration Tests**: Complete workflow coverage
- **Security Tests**: All security scenarios covered

### Performance Thresholds
- **Health Check Response**: < 100ms average
- **Token Generation**: < 50ms average
- **Database Operations**: < 20ms average
- **Concurrent Requests**: < 1000ms max response time
- **Memory Usage**: < 100MB increase under load

### Security Requirements
- **Input Validation**: All inputs sanitized and validated
- **SQL Injection**: Prevention verified through testing
- **XSS Prevention**: Output encoding and CSP headers
- **JWT Security**: Proper algorithm, expiration, and validation
- **CORS Configuration**: Secure origin and credential handling

## Monitoring and Health Checks

### Enhanced Health Endpoints

The Player-IP service provides comprehensive health monitoring through multiple endpoints designed for different monitoring scenarios:

#### General Health Endpoint (`/health`)
- **Purpose**: Overall service health status including subscription monitoring
- **Response**: Always returns HTTP 200 (service operational) with detailed status
- **Use Case**: Load balancer health checks, general service monitoring

```bash
# Basic health check
curl http://localhost:8082/health

# Expected response format:
{
  "status": "ok",
  "timestamp": "2025-07-15T02:36:20.625Z",
  "services": {
    "http": "healthy",
    "subscription": {
      "status": "connected|connecting|retrying|failed|disconnected",
      "healthy": true|false,
      "degraded": true|false
    }
  }
}
```

#### Subscription Health Endpoint (`/health/subscription`)
- **Purpose**: Detailed subscription diagnostics and troubleshooting
- **Response**: HTTP 200 (healthy) or 503 (unhealthy) based on subscription state
- **Use Case**: Subscription-specific monitoring, alerting, and diagnostics

```bash
# Subscription health check
curl http://localhost:8082/health/subscription

# Healthy response (HTTP 200):
{
  "status": "connected",
  "healthy": true,
  "retryCount": 0,
  "connectedAt": "2025-07-15T02:35:45.123Z",
  "timestamp": "2025-07-15T02:36:27.823Z"
}

# Unhealthy response (HTTP 503):
{
  "status": "failed",
  "healthy": false,
  "retryCount": 3,
  "lastError": "Failed to get service token",
  "lastRetryAt": "2025-07-15T02:36:01.836Z",
  "timestamp": "2025-07-15T02:36:27.823Z"
}
```

### Health Check Script
The health check script (`scripts/health-check.js`) provides comprehensive service monitoring:

```bash
# Basic health check
node scripts/health-check.js

# Health check with custom URL
node scripts/health-check.js --url=https://player-ip.example.com

# Health check with custom thresholds
MAX_RESPONSE_TIME=500 node scripts/health-check.js

# Check both endpoints
node scripts/health-check.js --check-subscription
```

#### Health Check Features
- **Service Availability**: Basic connectivity and response
- **Health Endpoint**: Structured health response validation
- **Subscription Monitoring**: Detailed subscription status checking
- **Database Connectivity**: Indirect database health verification
- **JWT Functionality**: Authentication system validation
- **Response Times**: Performance monitoring
- **Resource Usage**: Memory and CPU monitoring

### Monitoring Integration

#### Automated Monitoring
```javascript
import { getHealthMetrics } from './scripts/health-check.js';

const metrics = await getHealthMetrics('https://player-ip.example.com');
// Send metrics to monitoring system

// Example monitoring integration
const healthResponse = await fetch('/health');
const health = await healthResponse.json();

if (health.services.subscription.degraded) {
    // Alert: Service running in degraded mode
    // HTTP functionality available, subscription unavailable
    await sendAlert('Player-IP subscription degraded', health);
}
```

#### Monitoring Strategies

**Load Balancer Health Checks**
- Use `/health` endpoint (always returns 200 for HTTP availability)
- Configure appropriate timeout and retry settings
- Monitor for consistent response format

**Application Monitoring**
- Use `/health/subscription` for detailed subscription monitoring
- Set up alerts for subscription failures (HTTP 503 responses)
- Monitor retry patterns and error frequencies

**Container Orchestration**
```yaml
# Kubernetes example
livenessProbe:
  httpGet:
    path: /health
    port: 8082
  initialDelaySeconds: 30
  periodSeconds: 10

readinessProbe:
  httpGet:
    path: /health/subscription
    port: 8082
  initialDelaySeconds: 5
  periodSeconds: 5
  failureThreshold: 3
```

#### Monitoring Metrics

**Service-Level Metrics**
- HTTP endpoint availability (from `/health`)
- Response time trends
- Error rate monitoring
- Resource utilization

**Subscription-Level Metrics**
- Connection state transitions
- Retry attempt frequency
- Error pattern analysis
- Recovery time measurement

```bash
# Example monitoring queries
# Check service degradation frequency
curl -s http://localhost:8082/health | jq '.services.subscription.degraded' | grep -c true

# Monitor subscription retry patterns
curl -s http://localhost:8082/health/subscription | jq '.retryCount, .lastError'

# Track connection stability
watch -n 10 'curl -s http://localhost:8082/health/subscription | jq ".status, .connectedAt"'
```

## Security Considerations

### Security Testing
- **Input Validation**: SQL injection, XSS, parameter pollution
- **Authentication**: JWT security, token expiration, bypass prevention
- **CORS**: Configuration validation and bypass prevention
- **Information Disclosure**: Error message sanitization
- **PKCE Security**: OAuth 2.0 PKCE implementation validation

### Security Headers
Recommended security headers for production:
```
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
Strict-Transport-Security: max-age=31536000; includeSubDomains
Content-Security-Policy: default-src 'self'
```

### Environment Security
- **Secrets Management**: Use environment variables for sensitive data
- **Database Security**: Enable foreign key constraints, use prepared statements
- **Network Security**: Implement proper firewall rules and network segmentation

## Performance Testing

### Load Testing Scenarios
1. **Concurrent Health Checks**: 100 simultaneous requests
2. **Authentication Load**: 50 concurrent authentication attempts
3. **Sustained Load**: 30-second continuous load testing
4. **Memory Stress**: 1000 user creation operations
5. **Token Generation**: High-frequency JWT generation

### Performance Metrics
- **Response Time**: Average, minimum, maximum response times
- **Throughput**: Requests per second capacity
- **Memory Usage**: Heap usage and garbage collection
- **Error Rate**: Percentage of failed requests under load
- **Resource Utilization**: CPU and memory consumption

## CI/CD Integration

### GitHub Actions Workflow
The CI/CD pipeline (`.github/workflows/ci-cd.yml`) includes:

1. **Quality Checks**: Linting, type checking, security audit
2. **Unit Tests**: Comprehensive unit test execution
3. **Integration Tests**: End-to-end workflow testing
4. **Performance Tests**: Load and performance validation
5. **Security Tests**: Security vulnerability scanning
6. **Container Building**: Multi-platform Docker image creation
7. **Container Security**: Vulnerability scanning with Trivy
8. **Deployment**: Automated deployment to staging/production
9. **Quality Gates**: Comprehensive validation before deployment

### Pipeline Triggers
- **Push to main**: Production deployment
- **Push to develop**: Staging deployment
- **Pull Requests**: Full test suite execution
- **Manual Dispatch**: Custom environment deployment

## Troubleshooting

### Common Issues

#### Test Failures
```bash
# Check test environment
npm run type-check
npm run lint

# Run tests with verbose output
DEBUG=true npm run test:unit

# Check database connectivity
ls -la test-data/
```

#### Build Issues
```bash
# Clean build
./scripts/build-player-ip.sh --clean

# Check Docker
docker --version
docker images | grep gamehub-player-ip

# Validate environment
./scripts/build-player-ip.sh --help
```

#### Deployment Issues
```bash
# Check deployment status
./scripts/deploy-player-ip.sh --status --env staging

# View deployment logs
./scripts/deploy-player-ip.sh --logs --env staging

# Rollback if needed
./scripts/deploy-player-ip.sh --rollback --env staging
```

#### Health Check Failures

**General Health Check Issues**
```bash
# Manual health check
curl -f http://localhost:8082/health

# Check detailed response
curl -v http://localhost:8082/health | jq '.'

# Expected healthy response:
# HTTP/1.1 200 OK
# {"status":"ok","services":{"http":"healthy","subscription":{"status":"connected","healthy":true}}}
```

**Subscription Health Check Issues**
```bash
# Check subscription-specific health
curl -f http://localhost:8082/health/subscription

# Detailed subscription diagnostics
curl -v http://localhost:8082/health/subscription | jq '.'

# Healthy subscription (HTTP 200):
# {"status":"connected","healthy":true,"retryCount":0}

# Unhealthy subscription (HTTP 503):
# {"status":"failed","healthy":false,"retryCount":3,"lastError":"..."}
```

**Troubleshooting Subscription Health**
```bash
# Monitor subscription state changes
watch -n 5 'curl -s http://localhost:8082/health/subscription | jq ".status, .healthy, .retryCount"'

# Check for specific error patterns
curl -s http://localhost:8082/health/subscription | jq '.lastError'

# Verify service dependencies
curl http://service-ip:8083/health

# Check environment configuration
echo $TENANT_PUBLIC_KEY | head -1
```

**Service Logs Analysis**
```bash
# Check service logs
docker compose logs player-ip

# Filter subscription-related logs
docker compose logs player-ip | grep "SUBSCRIPTION"

# Monitor retry attempts
docker compose logs -f player-ip | grep "RETRY"

# Check for error patterns
docker compose logs player-ip | grep "ERROR\|FAILED"
```

**Database Verification**
```bash
# Verify database
sqlite3 data/player-ip.db ".tables"

# Check database permissions
ls -la data/player-ip.db

# Test database connectivity
sqlite3 data/player-ip.db "SELECT COUNT(*) FROM users;"
```

### Debug Mode
Enable debug output for detailed troubleshooting:
```bash
DEBUG=true npm run test
DEBUG=true ./scripts/build-player-ip.sh
DEBUG=true ./scripts/deploy-player-ip.sh
```

### Log Analysis
- **Application Logs**: Check service logs for errors
- **Test Logs**: Review test output for failure details
- **Build Logs**: Examine build process for issues
- **Deployment Logs**: Monitor deployment progress and errors

## Best Practices

### Development
1. **Run tests locally** before committing code
2. **Use linting** to maintain code quality
3. **Write tests** for new features and bug fixes
4. **Follow security guidelines** for sensitive operations

### Testing
1. **Maintain high coverage** (>80% overall, >90% for critical paths)
2. **Test edge cases** and error conditions
3. **Use realistic test data** and scenarios
4. **Keep tests fast** and reliable

### Deployment
1. **Use staging environment** for validation
2. **Run health checks** after deployment
3. **Monitor performance** and error rates
4. **Have rollback plan** ready

### Security
1. **Regular security testing** and vulnerability scanning
2. **Keep dependencies updated** and audit regularly
3. **Use secure defaults** for configuration
4. **Implement proper logging** for security events

## Conclusion

This comprehensive testing and deployment infrastructure ensures the Player-IP service meets production-ready standards with:

- **Complete test coverage** across all functionality
- **Automated testing** in CI/CD pipeline
- **Robust deployment** and rollback procedures
- **Comprehensive monitoring** and alerting
- **Performance and security** validation

The infrastructure supports reliable development, testing, and deployment workflows while maintaining high quality and security standards.