#!/usr/bin/env node
/**
 * API Contract Tests for Player-IP Service
 *
 * These tests verify that API endpoints conform to their specifications:
 * - Request/response formats
 * - HTTP status codes
 * - Headers and CORS
 * - Error response patterns
 */

import { strict as assert } from 'assert';
import { test, describe, beforeEach, afterEach } from 'node:test';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import { spawn } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Test configuration
const TEST_CONFIG = {
    baseUrl: 'http://localhost:8082',
    testDbPath: path.join(__dirname, '../test-data/contract-test.db'),
    timeout: 30000,
};

// Colors for console output
const colors = {
    reset: '\x1b[0m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m',
};

class APIContractTestRunner {
    constructor() {
        this.results = [];
        this.serverProcess = null;
    }

    async run() {
        console.log(`${colors.cyan}🚀 Starting API Contract Tests${colors.reset}\n`);

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

    async setupTestEnvironment() {
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
        process.env.SKIP_JINAGA_SUBSCRIPTION = 'true';

        console.log(`${colors.green}✅ Test environment setup complete${colors.reset}`);
    }

    async startTestServer() {
        console.log(`${colors.blue}🔧 Starting test server...${colors.reset}`);

        try {
            // Start server in background
            this.serverProcess = spawn('node', ['dist/server.js'], {
                cwd: path.join(__dirname, '../..'),
                env: { ...process.env },
                stdio: 'pipe',
            });

            // Wait for server to start
            await this.waitForServer();
            console.log(`${colors.green}✅ Test server started${colors.reset}`);
        } catch (error) {
            throw new Error(`Failed to start test server: ${error}`);
        }
    }

    async waitForServer(maxAttempts = 30) {
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

    async runAllTests() {
        console.log(`${colors.cyan}🧪 Running API contract tests...${colors.reset}\n`);

        // Health Check Endpoint Contract
        await this.testHealthCheckContract();

        // Root Endpoint Contract
        await this.testRootEndpointContract();

        // Public Key Endpoint Contract
        await this.testPublicKeyEndpointContract();

        // Authentication Endpoints Contract
        await this.testAuthenticateEndpointContract();
        await this.testTokenEndpointContract();

        // CORS Contract
        await this.testCORSContract();

        // Error Response Contract
        await this.testErrorResponseContract();

        // Security Headers Contract
        await this.testSecurityHeadersContract();
    }

    async testHealthCheckContract() {
        await this.runTest('Health Check Endpoint Contract', async () => {
            const response = await fetch(`${TEST_CONFIG.baseUrl}/health`);

            // Status code contract
            assert.strictEqual(response.status, 200, 'Health check should return 200');

            // Content-Type contract
            const contentType = response.headers.get('content-type');
            assert.ok(contentType.includes('application/json'), 'Health check should return JSON');

            // Response body contract
            const data = await response.json();
            assert.strictEqual(typeof data, 'object', 'Response should be an object');
            assert.strictEqual(data.status, 'ok', 'Status should be "ok"');
            assert.ok(data.timestamp, 'Should include timestamp');
            assert.strictEqual(typeof data.timestamp, 'string', 'Timestamp should be string');

            // Timestamp format contract (ISO 8601)
            assert.ok(new Date(data.timestamp).toISOString(), 'Timestamp should be valid ISO 8601');

            console.log(
                `${colors.green}  ✓ Health check endpoint contract verified${colors.reset}`
            );
        });
    }

    async testRootEndpointContract() {
        await this.runTest('Root Endpoint Contract', async () => {
            const response = await fetch(`${TEST_CONFIG.baseUrl}/`);

            // Status code contract
            assert.strictEqual(response.status, 200, 'Root endpoint should return 200');

            // Content-Type contract
            const contentType = response.headers.get('content-type');
            assert.ok(contentType.includes('application/json'), 'Root endpoint should return JSON');

            // Response body contract
            const data = await response.json();
            assert.strictEqual(typeof data, 'object', 'Response should be an object');
            assert.strictEqual(data.name, 'player-ip', 'Service name should be "player-ip"');
            assert.ok(data.description, 'Should include description');
            assert.ok(data.version, 'Should include version');
            assert.strictEqual(typeof data.description, 'string', 'Description should be string');
            assert.strictEqual(typeof data.version, 'string', 'Version should be string');

            console.log(`${colors.green}  ✓ Root endpoint contract verified${colors.reset}`);
        });
    }

    async testPublicKeyEndpointContract() {
        await this.runTest('Public Key Endpoint Contract', async () => {
            const response = await fetch(`${TEST_CONFIG.baseUrl}/public-key`);

            // Status code contract
            assert.strictEqual(response.status, 200, 'Public key endpoint should return 200');

            // Content-Type contract
            const contentType = response.headers.get('content-type');
            assert.ok(
                contentType.includes('application/json'),
                'Public key endpoint should return JSON'
            );

            // Response body contract
            const data = await response.json();
            assert.strictEqual(typeof data, 'object', 'Response should be an object');
            assert.ok(data.publicKey, 'Should include publicKey field');
            assert.strictEqual(typeof data.publicKey, 'string', 'Public key should be string');

            // Public key format contract (should be PEM format)
            assert.ok(
                data.publicKey.startsWith('-----BEGIN'),
                'Public key should be in PEM format'
            );
            assert.ok(
                data.publicKey.includes('-----END'),
                'Public key should be complete PEM format'
            );

            console.log(`${colors.green}  ✓ Public key endpoint contract verified${colors.reset}`);
        });
    }

    async testAuthenticateEndpointContract() {
        await this.runTest('Authenticate Endpoint Contract', async () => {
            // Test missing parameters contract
            const response = await fetch(`${TEST_CONFIG.baseUrl}/authenticate`);

            // Should return 400 for missing parameters
            assert.strictEqual(response.status, 400, 'Should return 400 for missing parameters');

            // Content-Type contract for errors
            const contentType = response.headers.get('content-type');
            assert.ok(contentType.includes('application/json'), 'Error response should be JSON');

            // Error response structure contract
            const errorData = await response.json();
            assert.strictEqual(typeof errorData, 'object', 'Error response should be object');
            assert.ok(errorData.error, 'Error response should include error field');
            assert.strictEqual(typeof errorData.error, 'string', 'Error should be string');

            // Test QR code required scenario
            const params = new URLSearchParams({
                client_id: 'test-client',
                redirect_uri: 'http://localhost:3000/callback',
                response_type: 'code',
                scope: 'openid profile',
                code_challenge: 'test-challenge',
                code_challenge_method: 'S256',
                // gap_id intentionally missing
            });

            const qrResponse = await fetch(`${TEST_CONFIG.baseUrl}/authenticate?${params}`);

            // Should return 400 with HTML for QR code required
            assert.strictEqual(qrResponse.status, 400, 'Should return 400 for missing gap_id');

            const qrContentType = qrResponse.headers.get('content-type');
            assert.ok(qrContentType.includes('text/html'), 'QR response should be HTML');

            const htmlContent = await qrResponse.text();
            assert.ok(
                htmlContent.includes('QR Code Required'),
                'Should show QR code required message'
            );
            assert.ok(htmlContent.includes('<!DOCTYPE html>'), 'Should be valid HTML');

            console.log(
                `${colors.green}  ✓ Authenticate endpoint contract verified${colors.reset}`
            );
        });
    }

    async testTokenEndpointContract() {
        await this.runTest('Token Endpoint Contract', async () => {
            // Test missing parameters contract
            const response = await fetch(`${TEST_CONFIG.baseUrl}/token`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({}),
            });

            // Should return 400 for missing parameters
            assert.strictEqual(response.status, 400, 'Should return 400 for missing parameters');

            // Content-Type contract
            const contentType = response.headers.get('content-type');
            assert.ok(
                contentType.includes('application/json'),
                'Token error response should be JSON'
            );

            // Error response structure contract
            const errorData = await response.json();
            assert.strictEqual(typeof errorData, 'object', 'Error response should be object');
            assert.ok(errorData.error, 'Error response should include error field');
            assert.strictEqual(typeof errorData.error, 'string', 'Error should be string');

            // Test unsupported grant type contract
            const unsupportedResponse = await fetch(`${TEST_CONFIG.baseUrl}/token`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    grant_type: 'unsupported_grant',
                    client_id: 'test-client',
                }),
            });

            assert.strictEqual(
                unsupportedResponse.status,
                400,
                'Should return 400 for unsupported grant'
            );

            const unsupportedError = await unsupportedResponse.json();
            assert.ok(
                unsupportedError.error.includes('Unsupported grant_type'),
                'Should specify unsupported grant type'
            );

            // Test authorization_code grant missing parameters
            const authCodeResponse = await fetch(`${TEST_CONFIG.baseUrl}/token`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    grant_type: 'authorization_code',
                    client_id: 'test-client',
                    // Missing code, redirect_uri, code_verifier
                }),
            });

            assert.strictEqual(
                authCodeResponse.status,
                400,
                'Should return 400 for missing auth code params'
            );

            const authCodeError = await authCodeResponse.json();
            assert.ok(
                authCodeError.error.includes('Missing required parameters'),
                'Should specify missing parameters'
            );

            console.log(`${colors.green}  ✓ Token endpoint contract verified${colors.reset}`);
        });
    }

    async testCORSContract() {
        await this.runTest('CORS Contract', async () => {
            // Test preflight request
            const preflightResponse = await fetch(`${TEST_CONFIG.baseUrl}/health`, {
                method: 'OPTIONS',
            });

            // CORS headers contract
            const corsOrigin = preflightResponse.headers.get('Access-Control-Allow-Origin');
            assert.ok(corsOrigin, 'Should include CORS origin header');

            const corsCredentials = preflightResponse.headers.get(
                'Access-Control-Allow-Credentials'
            );
            assert.ok(corsCredentials, 'Should include CORS credentials header');

            // Test actual request CORS headers
            const actualResponse = await fetch(`${TEST_CONFIG.baseUrl}/health`);
            const actualCorsOrigin = actualResponse.headers.get('Access-Control-Allow-Origin');
            assert.ok(actualCorsOrigin, 'Actual requests should include CORS headers');

            console.log(`${colors.green}  ✓ CORS contract verified${colors.reset}`);
        });
    }

    async testErrorResponseContract() {
        await this.runTest('Error Response Contract', async () => {
            // Test 404 error contract
            const notFoundResponse = await fetch(`${TEST_CONFIG.baseUrl}/non-existent-endpoint`);

            assert.strictEqual(
                notFoundResponse.status,
                404,
                'Should return 404 for non-existent endpoints'
            );

            // Test malformed JSON contract
            const malformedResponse = await fetch(`${TEST_CONFIG.baseUrl}/token`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: 'invalid-json',
            });

            assert.ok(
                malformedResponse.status >= 400,
                'Should return error status for malformed JSON'
            );

            // All error responses should be JSON when possible
            if (malformedResponse.headers.get('content-type')?.includes('application/json')) {
                const errorData = await malformedResponse.json();
                assert.strictEqual(
                    typeof errorData,
                    'object',
                    'JSON error responses should be objects'
                );
                assert.ok(
                    errorData.error || errorData.message,
                    'Should include error or message field'
                );
            }

            console.log(`${colors.green}  ✓ Error response contract verified${colors.reset}`);
        });
    }

    async testSecurityHeadersContract() {
        await this.runTest('Security Headers Contract', async () => {
            const response = await fetch(`${TEST_CONFIG.baseUrl}/health`);

            // Check for security-related headers
            const headers = response.headers;

            // Content-Type should be properly set
            const contentType = headers.get('content-type');
            assert.ok(contentType, 'Content-Type header should be present');
            assert.ok(contentType.includes('application/json'), 'Content-Type should specify JSON');

            // CORS headers should be present
            const corsOrigin = headers.get('access-control-allow-origin');
            assert.ok(corsOrigin, 'CORS origin header should be present');

            const corsCredentials = headers.get('access-control-allow-credentials');
            assert.ok(corsCredentials, 'CORS credentials header should be present');

            console.log(`${colors.green}  ✓ Security headers contract verified${colors.reset}`);
        });
    }

    async runTest(name, testFn) {
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

    async cleanup() {
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

    printResults() {
        console.log(`\n${colors.cyan}📊 API Contract Test Results${colors.reset}`);
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
            console.log(`\n${colors.red}❌ Some API contract tests failed.${colors.reset}`);
            process.exit(1);
        } else {
            console.log(`\n${colors.green}🎉 All API contract tests passed!${colors.reset}`);
        }
    }
}

// Run tests if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
    const runner = new APIContractTestRunner();
    runner.run().catch(console.error);
}

export { APIContractTestRunner };

console.log('✅ API contract test suite ready');
