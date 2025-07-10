# GameHub Status and Setup Pages - Deployment and Testing Guide

## Overview

This guide provides comprehensive instructions for deploying, testing, and maintaining the GameHub Status and Setup Pages system. The system consists of four integrated components that enhance the GameHub platform with observability and configuration management capabilities.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Deployment Instructions](#deployment-instructions)
- [Component Testing](#component-testing)
- [Integration Testing](#integration-testing)
- [Performance Validation](#performance-validation)
- [Troubleshooting](#troubleshooting)
- [Monitoring and Maintenance](#monitoring-and-maintenance)

## Prerequisites

### System Requirements

**Hardware Requirements:**
- CPU: 2+ cores recommended
- RAM: 4GB minimum, 8GB recommended
- Storage: 10GB available space
- Network: Internet connection for Docker image pulls

**Software Requirements:**
- Docker 20.10+ and Docker Compose 2.0+
- Node.js 18+ (for development/testing)
- Git 2.30+
- Modern web browser (Chrome 90+, Firefox 88+, Safari 14+)

**Port Requirements:**
Ensure the following ports are available:
- `80` - NGINX reverse proxy
- `8081` - Content Store
- `8082` - Player IP Service
- `8083` - Service IP Provider
- `8084` - Relay Service
- `9011` - FusionAuth

### Environment Verification

Run the following commands to verify your environment:

```bash
# Check Docker
docker --version
docker-compose --version

# Check Node.js
node --version
npm --version

# Check Git
git --version

# Check port availability
netstat -tuln | grep -E ':(80|8081|8082|8083|8084|9011)\s'
```

## Deployment Instructions

### Step 1: Repository Setup

1. **Clone the Repository** (if not already done):
   ```bash
   git clone <repository-url>
   cd gamehub
   ```

2. **Install Dependencies**:
   ```bash
   # Install root dependencies
   npm install
   
   # Build shared model
   cd app/gamehub-model
   npm install
   npm run build
   cd ../..
   ```

3. **Verify File Structure**:
   ```bash
   # Verify key files exist
   ls -la app/relay-service/
   ls -la mesh/nginx/html/status/
   ls -la mesh/nginx/html/setup/
   ```

### Step 2: Environment Configuration

1. **Copy Environment Template**:
   ```bash
   cd mesh
   cp .env.example .env
   ```

2. **Configure Relay Service** (in `mesh/.env`):
   ```bash
   # Relay Service Configuration
   RELAY_CORS_ORIGIN=*
   RELAY_CACHE_TIMEOUT=30000
   RELAY_CONFIG={"services":{"service-ip":{"name":"Service IP","healthEndpoint":"http://service-ip:8083/health","configuredEndpoint":"http://service-ip:8083/configured","readyEndpoint":"http://service-ip:8083/ready"},"player-ip":{"name":"Player IP","healthEndpoint":"http://player-ip:8082/health","configuredEndpoint":"http://player-ip:8082/configured","readyEndpoint":"http://player-ip:8082/ready"},"content-store":{"name":"Content Store","healthEndpoint":"http://content-store:8081/health","configuredEndpoint":"http://content-store:8081/configured","readyEndpoint":"http://content-store:8081/ready"}},"polling":{"interval":10000,"timeout":30000}}
   ```

3. **Verify Configuration**:
   ```bash
   # Check environment file
   cat .env | grep RELAY
   ```

### Step 3: Build and Deploy Services

1. **Build Relay Service**:
   ```bash
   cd ../app/relay-service
   npm install
   npm run build
   cd ../../mesh
   ```

2. **Start Core Services**:
   ```bash
   # Start infrastructure services first
   docker-compose up -d fusionauth postgres
   
   # Wait for services to be ready (30-60 seconds)
   sleep 60
   
   # Start GameHub services
   docker-compose up -d content-store service-ip player-ip
   
   # Start Relay Service
   docker-compose up -d relay-service
   
   # Start NGINX (serves status and setup pages)
   docker-compose up -d nginx
   ```

3. **Verify Deployment**:
   ```bash
   # Check all containers are running
   docker-compose ps
   
   # Check logs for any errors
   docker-compose logs relay-service
   docker-compose logs nginx
   ```

### Step 4: Verify Access Points

1. **Test Core Endpoints**:
   ```bash
   # Test Relay Service
   curl -s http://localhost/relay/health | jq
   
   # Test Status Page
   curl -s -I http://localhost/status
   
   # Test Setup Page
   curl -s -I http://localhost/setup
   ```

2. **Browser Verification**:
   - Navigate to [`http://localhost/status`](http://localhost/status)
   - Navigate to [`http://localhost/setup`](http://localhost/setup)
   - Verify pages load without errors

## Component Testing

### Phase 1: Observability Endpoints Testing

**Test Player IP Service Endpoints:**
```bash
# Health check
curl -s http://localhost:8082/health | jq

# Configuration status
curl -s http://localhost:8082/configured | jq

# Readiness check
curl -s http://localhost:8082/ready | jq
```

**Expected Response Format:**
```json
{
  "service": "player-ip",
  "status": "healthy",
  "timestamp": "2025-01-09T15:39:03.383Z",
  "configured": false,
  "configuredGroups": {
    "jwt": false,
    "service-ip": false
  },
  "ready": false
}
```

**Test Service IP Provider Endpoints:**
```bash
# Health check
curl -s http://localhost:8083/health | jq

# Configuration status
curl -s http://localhost:8083/configured | jq

# Readiness check
curl -s http://localhost:8083/ready | jq
```

**Test Content Store Endpoints:**
```bash
# Health check
curl -s http://localhost:8081/health | jq

# Configuration status
curl -s http://localhost:8081/configured | jq

# Readiness check
curl -s http://localhost:8081/ready | jq
```

### Phase 2: Relay Service Testing

**Test Relay Service API:**
```bash
# Health check
curl -s http://localhost/relay/health | jq

# Aggregated status
curl -s http://localhost/relay | jq

# Cache statistics
curl -s http://localhost/relay/cache/stats | jq

# Force refresh
curl -s -X POST http://localhost/relay/refresh | jq
```

**HTTP Polling Test:**
```javascript
// Test in browser console
async function testPolling() {
  try {
    const response = await fetch('http://localhost/relay');
    const data = await response.json();
    console.log('HTTP polling response:', data);
  } catch (error) {
    console.error('HTTP polling error:', error);
  }
}
testPolling();
```

**Expected Aggregated Response:**
```json
{
  "timestamp": "2025-01-09T15:30:15.123Z",
  "services": {
    "service-ip": {
      "health": true,
      "configured": true,
      "configuredGroups": {
        "jwt": true,
        "clients": ["player-ip"]
      },
      "ready": true,
      "lastChecked": "2025-01-09T15:30:14.890Z",
      "responseTime": 45
    }
  },
  "summary": {
    "totalServices": 3,
    "healthyServices": 3,
    "configuredServices": 2,
    "readyServices": 2,
    "overallStatus": "healthy"
  }
}
```

### Phase 3: Status Page Testing

**Functional Testing:**
1. **Load Test**: Navigate to [`http://localhost/status`](http://localhost/status)
2. **HTTP Connection**: Verify connection indicator shows green
3. **Service Cards**: Confirm all services display with status indicators
4. **Manual Refresh**: Click refresh button and verify loading animation
5. **Auto-refresh Toggle**: Test enable/disable functionality
6. **Tooltips**: Hover over configuration status for detailed information

**Responsive Design Testing:**
```bash
# Test different viewport sizes
# Mobile: 375x667
# Tablet: 768x1024
# Desktop: 1920x1080
```

**Accessibility Testing:**
```bash
# Install accessibility testing tools
npm install -g @axe-core/cli

# Run accessibility audit
axe http://localhost/status
```

**Performance Testing:**
```javascript
// Test in browser console
console.time('Page Load');
window.addEventListener('load', () => {
  console.timeEnd('Page Load');
  console.log('Performance:', performance.getEntriesByType('navigation')[0]);
});
```

### Phase 4: Setup Page Testing

**Workflow Testing:**
1. **Load Test**: Navigate to [`http://localhost/setup`](http://localhost/setup)
2. **Step Navigation**: Verify step-by-step progression
3. **Form Validation**: Test input validation and error handling
4. **Command Generation**: Verify commands generate correctly
5. **Copy Functionality**: Test copy-to-clipboard features
6. **Progress Persistence**: Refresh page and verify progress saved

**Step-by-Step Validation:**
```bash
# Test each setup step
# Step 1: Prerequisites - verify system checks
# Step 2: Repository - verify clone and build instructions
# Step 3: Environment - verify Docker commands
# Step 4: FusionAuth - verify configuration forms
# Step 5: Tenant - verify tenant creation workflow
# Step 6: Authorization - verify final setup steps
```

## Integration Testing

### End-to-End Testing Scenarios

**Scenario 1: Fresh Installation**
1. Start with clean environment (no existing configuration)
2. Deploy all services using deployment instructions
3. Verify all services show as unconfigured in status page
4. Use setup page to complete configuration
5. Verify all services show as configured and ready

**Scenario 2: Service Failure Recovery**
1. Stop one service: `docker-compose stop player-ip`
2. Verify status page shows service as unhealthy
3. Verify HTTP polling updates reflect the change
4. Restart service: `docker-compose start player-ip`
5. Verify status page shows recovery

**Scenario 3: Configuration Changes**
1. Modify service configuration
2. Restart affected service
3. Verify status page reflects configuration changes
4. Use setup page to fix any configuration issues

### Load Testing

**WebSocket Connection Load Test:**
```javascript
// Test multiple concurrent connections
const connections = [];
for (let i = 0; i < 10; i++) {
  const ws = new WebSocket('ws://localhost/relay/ws');
  connections.push(ws);
}

// Monitor connection health
connections.forEach((ws, index) => {
  ws.onopen = () => console.log(`Connection ${index} opened`);
  ws.onerror = (error) => console.error(`Connection ${index} error:`, error);
});
```

**API Load Test:**
```bash
# Install Apache Bench
sudo apt-get install apache2-utils

# Test Relay Service under load
ab -n 1000 -c 10 http://localhost/relay

# Test Status Page under load
ab -n 1000 -c 10 http://localhost/status/
```

## Performance Validation

### Response Time Benchmarks

**Target Performance Metrics:**
- Status Page Load: < 500ms
- Relay Service API: < 100ms
- HTTP Polling Response: < 50ms
- Setup Page Load: < 1000ms

**Performance Testing Commands:**
```bash
# Test API response times
curl -w "@curl-format.txt" -s -o /dev/null http://localhost/relay

# Create curl-format.txt:
cat > curl-format.txt << EOF
     time_namelookup:  %{time_namelookup}\n
        time_connect:  %{time_connect}\n
     time_appconnect:  %{time_appconnect}\n
    time_pretransfer:  %{time_pretransfer}\n
       time_redirect:  %{time_redirect}\n
  time_starttransfer:  %{time_starttransfer}\n
                     ----------\n
          time_total:  %{time_total}\n
EOF
```

### Memory and CPU Monitoring

**Monitor Resource Usage:**
```bash
# Monitor Docker container resources
docker stats

# Monitor specific services
docker stats gamehub-relay-service
docker stats gamehub-nginx

# Check memory usage
free -h

# Check CPU usage
top -p $(pgrep -f relay-service)
```

### Network Performance

**Monitor Network Traffic:**
```bash
# Monitor network connections
netstat -tuln | grep -E ':(80|8084)'

# Monitor HTTP connections
ss -tuln | grep :8084

# Test network latency
ping localhost
```

## Troubleshooting

### Common Issues and Solutions

**Issue 1: Services Not Starting**
```bash
# Check Docker logs
docker-compose logs [service-name]

# Check port conflicts
netstat -tuln | grep -E ':(80|8081|8082|8083|8084)'

# Restart services
docker-compose restart [service-name]
```

**Issue 2: HTTP Polling Connection Failures**
```bash
# Check NGINX HTTP configuration
docker-compose exec nginx nginx -t

# Check Relay Service logs
docker-compose logs relay-service | grep -i http

# Test HTTP endpoint directly
curl -i http://localhost/relay
```

**Issue 3: Status Page Not Loading**
```bash
# Check NGINX static file serving
docker-compose exec nginx ls -la /usr/share/nginx/html/status/

# Check NGINX configuration
docker-compose exec nginx cat /etc/nginx/conf.d/default.conf

# Check browser console for JavaScript errors
# Open browser dev tools and check console
```

**Issue 4: Configuration Not Detected**
```bash
# Check service endpoints directly
curl -s http://localhost:8082/configured | jq
curl -s http://localhost:8083/configured | jq
curl -s http://localhost:8081/configured | jq

# Check Relay Service configuration
echo $RELAY_CONFIG | jq

# Verify environment variables
docker-compose exec relay-service env | grep RELAY
```

### Debug Mode

**Enable Debug Logging:**
```bash
# Set debug environment variables
export DEBUG=relay-service:*
export NODE_ENV=development

# Restart with debug logging
docker-compose up -d relay-service
docker-compose logs -f relay-service
```

**Browser Debug Mode:**
```javascript
// Enable debug mode in browser console
localStorage.setItem('debug', 'true');
location.reload();
```

### Health Check Commands

**System Health Verification:**
```bash
#!/bin/bash
# health-check.sh

echo "=== GameHub Status and Setup System Health Check ==="

# Check core services
services=("fusionauth" "postgres" "content-store" "service-ip" "player-ip" "relay-service" "nginx")
for service in "${services[@]}"; do
  if docker-compose ps $service | grep -q "Up"; then
    echo "✅ $service: Running"
  else
    echo "❌ $service: Not running"
  fi
done

# Check endpoints
endpoints=(
  "http://localhost/relay/health"
  "http://localhost/status"
  "http://localhost/setup"
  "http://localhost:8082/health"
  "http://localhost:8083/health"
  "http://localhost:8081/health"
)

for endpoint in "${endpoints[@]}"; do
  if curl -s -f "$endpoint" > /dev/null; then
    echo "✅ $endpoint: Accessible"
  else
    echo "❌ $endpoint: Not accessible"
  fi
done

# Check HTTP Polling
if curl -s -I http://localhost/relay | grep -q "200"; then
  echo "✅ HTTP Polling: Available"
else
  echo "❌ HTTP Polling: Not available"
fi

echo "=== Health Check Complete ==="
```

## Monitoring and Maintenance

### Ongoing Monitoring

**Log Monitoring:**
```bash
# Monitor all service logs
docker-compose logs -f

# Monitor specific service logs
docker-compose logs -f relay-service
docker-compose logs -f nginx

# Monitor error logs only
docker-compose logs --tail=100 | grep -i error
```

**Performance Monitoring:**
```bash
# Create monitoring script
cat > monitor.sh << 'EOF'
#!/bin/bash
while true; do
  echo "=== $(date) ==="
  echo "Memory Usage:"
  free -h
  echo "CPU Usage:"
  top -bn1 | grep "Cpu(s)"
  echo "Docker Stats:"
  docker stats --no-stream --format "table {{.Name}}\t{{.CPUPerc}}\t{{.MemUsage}}"
  echo "API Response Time:"
  curl -w "Total time: %{time_total}s\n" -s -o /dev/null http://localhost/relay
  echo "===================="
  sleep 60
done
EOF

chmod +x monitor.sh
./monitor.sh
```

### Maintenance Tasks

**Daily Maintenance:**
```bash
# Check service health
docker-compose ps

# Check disk usage
df -h

# Check logs for errors
docker-compose logs --since=24h | grep -i error

# Verify endpoints
curl -s http://localhost/relay/health | jq
```

**Weekly Maintenance:**
```bash
# Update Docker images
docker-compose pull

# Clean up unused Docker resources
docker system prune -f

# Backup configuration
cp mesh/.env mesh/.env.backup.$(date +%Y%m%d)

# Check for security updates
docker scan gamehub-relay-service
```

**Monthly Maintenance:**
```bash
# Review and rotate logs
docker-compose logs --since=720h > logs/gamehub-$(date +%Y%m).log

# Performance review
# Analyze response times and resource usage trends

# Security audit
# Review access logs and security configurations

# Update documentation
# Update any configuration changes or new procedures
```

### Backup and Recovery

**Configuration Backup:**
```bash
# Backup environment configuration
tar -czf gamehub-config-$(date +%Y%m%d).tar.gz mesh/.env mesh/secrets/

# Backup Docker volumes
docker run --rm -v gamehub_postgres_data:/data -v $(pwd):/backup alpine tar czf /backup/postgres-$(date +%Y%m%d).tar.gz /data
```

**Recovery Procedures:**
```bash
# Restore configuration
tar -xzf gamehub-config-YYYYMMDD.tar.gz

# Restart services
docker-compose down
docker-compose up -d

# Verify recovery
./health-check.sh
```

This deployment and testing guide provides comprehensive instructions for successfully deploying and maintaining the GameHub Status and Setup Pages system. Follow these procedures to ensure reliable operation and optimal performance of the observability and configuration management capabilities.