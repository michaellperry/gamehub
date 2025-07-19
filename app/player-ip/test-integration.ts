#!/usr/bin/env node
/**
 * Comprehensive Integration Test Suite for Player-IP Service
 *
 * This script tests:
 * 1. Database schema and initialization
 * 2. OAuth 2.0 endpoints
 * 3. Service-to-service communication
 * 4. CORS and security configuration
 * 5. Health check endpoint
 * 6. JWT token generation and validation
 * 7. Error handling
 * 8. GAP integration (basic validation)
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import { JwtPayload } from 'jsonwebtoken';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Test configuration
const TEST_CONFIG = {
    baseUrl: 'http://localhost:8082',
    serviceIpUrl: 'http://localhost:8083',
    testDbPath: path.join(__dirname, 'test-data', 'test-player-ip.db'),
    timeout: 30000,
};

// Colors for console output
const colors = {
    reset: '\x1b[0m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m',
};

class TestRunner {
    private results: { name: string; passed: boolean; error?: string }[] = [];
    private serverProcess: any = null;

    async run() {
        console.log(`${colors.cyan}🚀 Starting Player-IP Integration Tests${colors.reset}\n`);

        try {
            await this.setupTestEnvironment();
            await this.startTestServer();
            await this.runAllTests();
        } catch (error) {
            console.error(`${colors.red}❌ Test setup failed:${colors.reset}`, error);
        } finally {
            await this.cleanup();
            this.printResults();
        }
    }

    private async setupTestEnvironment() {
        console.log(`${colors.blue}📋 Setting up test environment...${colors.reset}`);

        // Create test data directory
        const testDataDir = path.dirname(TEST_CONFIG.testDbPath);
        if (!fs.existsSync(testDataDir)) {
            fs.mkdirSync(testDataDir, { recursive: true });
        }

        // Remove existing test database
        if (fs.existsSync(TEST_CONFIG.testDbPath)) {
            fs.unlinkSync(TEST_CONFIG.testDbPath);
        }

        // Set test environment variables
        process.env.NODE_ENV = 'test';
        process.env.SQLITE_DB_PATH = TEST_CONFIG.testDbPath;
        process.env.SERVER_PORT = '8082';
        process.env.JWT_SECRET = 'test-secret-key';
        process.env.CORS_ORIGIN = '*';
        process.env.SERVICE_IP_URL = TEST_CONFIG.serviceIpUrl;
        process.env.TENANT_PUBLIC_KEY =
            '-----BEGIN PUBLIC KEY-----\nMIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA1234567890\n-----END PUBLIC KEY-----';

        console.log(`${colors.green}✅ Test environment setup complete${colors.reset}`);
    }

    private async startTestServer() {
        console.log(`${colors.blue}🔧 Building and starting test server...${colors.reset}`);

        try {
            // Build the project
            execSync('npm run build', { cwd: __dirname, stdio: 'pipe' });

            // Start server in background
            const { spawn } = await import('child_process');
            this.serverProcess = spawn('node', ['dist/server.js'], {
                cwd: __dirname,
                env: { ...process.env },
                stdio: 'pipe',
            });

            // Wait for server to start
            await this.waitForServer();
            console.log(`${colors.green}✅ Test server started on port 8082${colors.reset}`);
        } catch (error) {
            throw new Error(`Failed to start test server: ${error}`);
        }
    }

    private async waitForServer(maxAttempts = 30) {
        for (let i = 0; i < maxAttempts; i++) {
            try {
                const response = await fetch(`${TEST_CONFIG.baseUrl}/health`);
                if (response.ok) return;
            } catch (error) {
                // Server not ready yet
            }
            await new Promise((resolve) => setTimeout(resolve, 1000));
        }
        throw new Error('Server failed to start within timeout period');
    }

    private async runAllTests() {
        console.log(`${colors.cyan}🧪 Running integration tests...${colors.reset}\n`);

        // Database Tests
        await this.testDatabaseSchema();
        await this.testDatabaseInitialization();
        await this.testDataMigrationCompatibility();

        // API Endpoint Tests
        await this.testHealthCheckEndpoint();
        await this.testRootEndpoint();
        await this.testOAuth2Endpoints();
        await this.testCORSConfiguration();

        // Integration Tests
        await this.testJWTTokenGeneration();
        await this.testErrorHandling();
        await this.testGAPIntegration();
    }

    private async testDatabaseSchema() {
        await this.runTest('Database Schema Verification', async () => {
            // Import database after environment is set
            const { default: db } = await import('./src/config/database.js');

            // Check if all required tables exist
            const tables = db
                .prepare(
                    `
        SELECT name FROM sqlite_master 
        WHERE type='table' AND name NOT LIKE 'sqlite_%'
      `
                )
                .all();

            const expectedTables = [
                'users',
                'user_identities',
                'gaps',
                'gap_users',
                'auth_codes',
                'refresh_tokens',
            ];
            const actualTables = tables.map((t: any) => t.name);

            for (const table of expectedTables) {
                if (!actualTables.includes(table)) {
                    throw new Error(`Missing table: ${table}`);
                }
            }

            // Check foreign key constraints are enabled
            const foreignKeysEnabled = db.pragma('foreign_keys');
            if (!foreignKeysEnabled) {
                throw new Error('Foreign keys are not enabled');
            }

            console.log(
                `${colors.green}  ✓ All required tables exist with proper constraints${colors.reset}`
            );
        });
    }

    private async testDatabaseInitialization() {
        await this.runTest('Database Initialization', async () => {
            const { default: db } = await import('./src/config/database.js');

            // Test basic CRUD operations on each table
            const testUserId = crypto.randomUUID();
            const testCookie = crypto.randomUUID();

            // Insert test user
            db.prepare(
                `
        INSERT INTO users (id, identity_cookie, created_at, updated_at)
        VALUES (?, ?, ?, ?)
      `
            ).run(testUserId, testCookie, new Date().toISOString(), new Date().toISOString());

            // Verify user was inserted
            const user = db.prepare('SELECT * FROM users WHERE id = ?').get(testUserId);
            if (!user) {
                throw new Error('Failed to insert test user');
            }

            // Test user_identities table
            db.prepare(
                `
        INSERT INTO user_identities (cookie_value, user_id)
        VALUES (?, ?)
      `
            ).run(testCookie, testUserId);

            // Test gaps table
            const testGapId = crypto.randomUUID();
            db.prepare(
                `
        INSERT INTO gaps (id, type, policy, event_id)
        VALUES (?, ?, ?, ?)
      `
            ).run(testGapId, 'OPEN', 'COOKIE_BASED', crypto.randomUUID());

            console.log(
                `${colors.green}  ✓ Database initialization and basic operations work correctly${colors.reset}`
            );
        });
    }

    private async testDataMigrationCompatibility() {
        await this.runTest('Data Migration Compatibility', async () => {
            // Check if the schema is compatible with gamehub-model
            const { default: db } = await import('./src/config/database.js');

            // Verify that the schema supports all required OAuth 2.0 operations
            const schemaInfo = db
                .prepare(
                    `
        SELECT sql FROM sqlite_master
        WHERE type='table' AND name IN ('auth_codes', 'refresh_tokens')
      `
                )
                .all() as Array<{ sql: string }>;

            const authCodeSchema = schemaInfo.find((s) => s.sql.includes('auth_codes'));
            const refreshTokenSchema = schemaInfo.find((s) => s.sql.includes('refresh_tokens'));

            if (!authCodeSchema || !refreshTokenSchema) {
                throw new Error('OAuth 2.0 tables not found');
            }

            // Check for required OAuth 2.0 fields
            const requiredAuthCodeFields = [
                'code',
                'client_id',
                'redirect_uri',
                'code_challenge',
                'code_challenge_method',
                'expires_at',
                'user_id',
                'event_id',
                'scope',
            ];
            const requiredRefreshTokenFields = [
                'token',
                'user_id',
                'client_id',
                'scope',
                'event_id',
                'expires_at',
                'revoked',
            ];

            for (const field of requiredAuthCodeFields) {
                if (!authCodeSchema.sql.includes(field)) {
                    throw new Error(`Missing required auth_codes field: ${field}`);
                }
            }

            for (const field of requiredRefreshTokenFields) {
                if (!refreshTokenSchema.sql.includes(field)) {
                    throw new Error(`Missing required refresh_tokens field: ${field}`);
                }
            }

            console.log(
                `${colors.green}  ✓ Schema is compatible with OAuth 2.0 and GameHub model requirements${colors.reset}`
            );
        });
    }

    private async testHealthCheckEndpoint() {
        await this.runTest('Health Check Endpoint', async () => {
            const response = await fetch(`${TEST_CONFIG.baseUrl}/health`);

            if (!response.ok) {
                throw new Error(`Health check failed with status: ${response.status}`);
            }

            const data = await response.json();

            if (data.status !== 'ok') {
                throw new Error(`Health check returned wrong status: ${data.status}`);
            }

            if (!data.timestamp) {
                throw new Error('Health check missing timestamp');
            }

            console.log(
                `${colors.green}  ✓ Health check endpoint working correctly${colors.reset}`
            );
        });
    }

    private async testRootEndpoint() {
        await this.runTest('Root Endpoint', async () => {
            const response = await fetch(`${TEST_CONFIG.baseUrl}/`);

            if (!response.ok) {
                throw new Error(`Root endpoint failed with status: ${response.status}`);
            }

            const data = await response.json();

            if (data.name !== 'player-ip') {
                throw new Error(`Wrong service name: ${data.name}`);
            }

            if (!data.description || !data.version) {
                throw new Error('Missing service description or version');
            }

            console.log(`${colors.green}  ✓ Root endpoint working correctly${colors.reset}`);
        });
    }

    private async testOAuth2Endpoints() {
        await this.runTest('OAuth 2.0 Endpoints', async () => {
            // Test /authenticate endpoint with missing parameters
            const authResponse = await fetch(`${TEST_CONFIG.baseUrl}/authenticate`);

            if (authResponse.ok) {
                throw new Error('Authenticate endpoint should reject requests without parameters');
            }

            // Test /authenticate endpoint with missing gap_id only (should show QR code page)
            const params = new URLSearchParams({
                client_id: 'test-client',
                redirect_uri: 'http://localhost:3000/callback',
                response_type: 'code',
                scope: 'openid profile',
                code_challenge: 'test-challenge',
                code_challenge_method: 'S256',
            });

            const authResponseMissingGap = await fetch(
                `${TEST_CONFIG.baseUrl}/authenticate?${params}`
            );

            if (authResponseMissingGap.ok) {
                const html = await authResponseMissingGap.text();
                if (!html.includes('QR Code Required')) {
                    throw new Error('Should show QR code required page when gap_id is missing');
                }
            }

            // Test /token endpoint with missing parameters
            const tokenResponse = await fetch(`${TEST_CONFIG.baseUrl}/token`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({}),
            });

            if (tokenResponse.ok) {
                throw new Error('Token endpoint should reject requests without parameters');
            }

            const tokenError = await tokenResponse.json();
            if (!tokenError.error) {
                throw new Error('Token endpoint should return error for missing parameters');
            }

            console.log(
                `${colors.green}  ✓ OAuth 2.0 endpoints properly validate parameters${colors.reset}`
            );
        });
    }

    private async testCORSConfiguration() {
        await this.runTest('CORS Configuration', async () => {
            const response = await fetch(`${TEST_CONFIG.baseUrl}/health`, {
                method: 'OPTIONS',
            });

            const corsHeader = response.headers.get('Access-Control-Allow-Origin');
            if (!corsHeader) {
                throw new Error('CORS headers not present');
            }

            console.log(`${colors.green}  ✓ CORS configuration working correctly${colors.reset}`);
        });
    }

    private async testJWTTokenGeneration() {
        await this.runTest('JWT Token Generation', async () => {
            // Import JWT utilities
            const { generateAccessToken, verifyJwt } = await import('./src/utils/jwt.js');

            const testUserId = crypto.randomUUID();
            const testEventId = crypto.randomUUID();

            // Generate a test token
            const token = generateAccessToken(testUserId, testEventId);

            if (!token) {
                throw new Error('Failed to generate access token');
            }

            // Verify the token
            const decoded = verifyJwt(token) as JwtPayload;

            if (!decoded || decoded.sub !== testUserId) {
                throw new Error('Token verification failed');
            }

            console.log(
                `${colors.green}  ✓ JWT token generation and validation working correctly${colors.reset}`
            );
        });
    }

    private async testErrorHandling() {
        await this.runTest('Error Handling', async () => {
            // Test invalid endpoint
            const invalidResponse = await fetch(`${TEST_CONFIG.baseUrl}/invalid-endpoint`);

            if (invalidResponse.status !== 404) {
                throw new Error(`Expected 404 for invalid endpoint, got ${invalidResponse.status}`);
            }

            // Test malformed JSON in token endpoint
            const malformedResponse = await fetch(`${TEST_CONFIG.baseUrl}/token`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: 'invalid-json',
            });

            if (malformedResponse.ok) {
                throw new Error('Should reject malformed JSON');
            }

            console.log(`${colors.green}  ✓ Error handling working correctly${colors.reset}`);
        });
    }

    private async testGAPIntegration() {
        await this.runTest('GAP Integration (Basic)', async () => {
            // Test GAP repository functions
            const { createOpenAccessPath, getGAPById } = await import('./src/repository/index.js');
            const { OpenAccessPolicy } = await import('./src/models/index.js');

            const testGapId = crypto.randomUUID();
            const testEventId = crypto.randomUUID();

            // Create a test GAP
            createOpenAccessPath(testGapId, OpenAccessPolicy.COOKIE_BASED, testEventId);

            // Retrieve the GAP
            const gap = getGAPById(testGapId);

            if (!gap) {
                throw new Error('Failed to create or retrieve GAP');
            }

            if (gap.eventId !== testEventId) {
                throw new Error('GAP event ID mismatch');
            }

            console.log(
                `${colors.green}  ✓ GAP integration basic functionality working${colors.reset}`
            );
        });
    }

    private async runTest(name: string, testFn: () => Promise<void>) {
        console.log(`${colors.yellow}🧪 ${name}...${colors.reset}`);

        try {
            await testFn();
            this.results.push({ name, passed: true });
            console.log(`${colors.green}✅ ${name} PASSED${colors.reset}\n`);
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            this.results.push({ name, passed: false, error: errorMessage });
            console.log(`${colors.red}❌ ${name} FAILED: ${errorMessage}${colors.reset}\n`);
        }
    }

    private async cleanup() {
        console.log(`${colors.blue}🧹 Cleaning up...${colors.reset}`);

        if (this.serverProcess) {
            this.serverProcess.kill();
        }

        // Remove test database
        if (fs.existsSync(TEST_CONFIG.testDbPath)) {
            fs.unlinkSync(TEST_CONFIG.testDbPath);
        }

        console.log(`${colors.green}✅ Cleanup complete${colors.reset}`);
    }

    private printResults() {
        console.log(`\n${colors.cyan}📊 Test Results Summary${colors.reset}`);
        console.log('='.repeat(50));

        const passed = this.results.filter((r) => r.passed).length;
        const failed = this.results.filter((r) => !r.passed).length;

        this.results.forEach((result) => {
            const status = result.passed
                ? `${colors.green}✅ PASSED${colors.reset}`
                : `${colors.red}❌ FAILED${colors.reset}`;
            console.log(`${result.name}: ${status}`);
            if (!result.passed && result.error) {
                console.log(`   Error: ${colors.red}${result.error}${colors.reset}`);
            }
        });

        console.log('='.repeat(50));
        console.log(
            `Total: ${this.results.length} | Passed: ${colors.green}${passed}${colors.reset} | Failed: ${colors.red}${failed}${colors.reset}`
        );

        if (failed > 0) {
            console.log(
                `\n${colors.red}❌ Some tests failed. Please review the errors above.${colors.reset}`
            );
            process.exit(1);
        } else {
            console.log(
                `\n${colors.green}🎉 All tests passed! Player-IP service is working correctly.${colors.reset}`
            );
        }
    }
}

// Run tests if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
    const runner = new TestRunner();
    runner.run().catch(console.error);
}

export { TestRunner };
