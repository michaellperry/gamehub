#!/usr/bin/env node
/**
 * Performance and Load Tests for Player-IP Service
 *
 * These tests verify that the service can handle expected load:
 * - Concurrent authentication requests
 * - Token generation performance
 * - Database operation performance
 * - Memory usage under load
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
    testDbPath: path.join(__dirname, '../test-data/performance-test.db'),
    timeout: 60000, // Longer timeout for performance tests
    concurrentUsers: 50,
    requestsPerUser: 10,
    performanceThresholds: {
        healthCheckMaxMs: 100,
        tokenGenerationMaxMs: 50,
        databaseOperationMaxMs: 20,
        concurrentRequestMaxMs: 1000,
        memoryLeakThresholdMB: 100,
    },
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

class PerformanceTestRunner {
    constructor() {
        this.results = [];
        this.serverProcess = null;
        this.performanceMetrics = {
            responseTimes: [],
            memoryUsage: [],
            errorRates: [],
        };
    }

    async run() {
        console.log(`${colors.cyan}🚀 Starting Performance Tests${colors.reset}\n`);

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
        console.log(`${colors.blue}📋 Setting up performance test environment...${colors.reset}`);

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

        console.log(`${colors.green}✅ Performance test environment setup complete${colors.reset}`);
    }

    async startTestServer() {
        console.log(
            `${colors.blue}🔧 Starting test server for performance tests...${colors.reset}`
        );

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
        console.log(`${colors.cyan}🧪 Running performance tests...${colors.reset}\n`);

        // Basic Performance Tests
        await this.testHealthCheckPerformance();
        await this.testTokenGenerationPerformance();
        await this.testDatabasePerformance();

        // Load Tests
        await this.testConcurrentHealthChecks();
        await this.testConcurrentAuthentication();
        await this.testSustainedLoad();

        // Resource Usage Tests
        await this.testMemoryUsage();
        await this.testErrorRateUnderLoad();
    }

    async testHealthCheckPerformance() {
        await this.runTest('Health Check Performance', async () => {
            const iterations = 100;
            const responseTimes = [];

            for (let i = 0; i < iterations; i++) {
                const startTime = Date.now();
                const response = await fetch(`${TEST_CONFIG.baseUrl}/health`);
                const endTime = Date.now();

                assert.strictEqual(response.status, 200, 'Health check should succeed');

                const responseTime = endTime - startTime;
                responseTimes.push(responseTime);
            }

            const avgResponseTime = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
            const maxResponseTime = Math.max(...responseTimes);
            const minResponseTime = Math.min(...responseTimes);

            console.log(`${colors.blue}  📊 Health Check Stats:${colors.reset}`);
            console.log(
                `${colors.blue}     Average: ${avgResponseTime.toFixed(2)}ms${colors.reset}`
            );
            console.log(
                `${colors.blue}     Min: ${minResponseTime}ms, Max: ${maxResponseTime}ms${colors.reset}`
            );

            assert.ok(
                avgResponseTime < TEST_CONFIG.performanceThresholds.healthCheckMaxMs,
                `Average response time ${avgResponseTime.toFixed(2)}ms exceeds threshold ${TEST_CONFIG.performanceThresholds.healthCheckMaxMs}ms`
            );

            this.performanceMetrics.responseTimes.push({
                test: 'health-check',
                avg: avgResponseTime,
                min: minResponseTime,
                max: maxResponseTime,
            });

            console.log(
                `${colors.green}  ✓ Health check performance within acceptable limits${colors.reset}`
            );
        });
    }

    async testTokenGenerationPerformance() {
        await this.runTest('Token Generation Performance', async () => {
            // Import JWT utilities for direct testing
            const { generateAccessToken } = await import('../../dist/utils/jwt.js');

            const iterations = 1000;
            const generationTimes = [];

            for (let i = 0; i < iterations; i++) {
                const userId = crypto.randomUUID();
                const eventId = crypto.randomUUID();

                const startTime = process.hrtime.bigint();
                const token = generateAccessToken(userId, eventId);
                const endTime = process.hrtime.bigint();

                assert.ok(token, 'Token should be generated');

                const generationTimeMs = Number(endTime - startTime) / 1000000; // Convert to milliseconds
                generationTimes.push(generationTimeMs);
            }

            const avgGenerationTime =
                generationTimes.reduce((a, b) => a + b, 0) / generationTimes.length;
            const maxGenerationTime = Math.max(...generationTimes);
            const minGenerationTime = Math.min(...generationTimes);

            console.log(`${colors.blue}  📊 Token Generation Stats:${colors.reset}`);
            console.log(
                `${colors.blue}     Average: ${avgGenerationTime.toFixed(3)}ms${colors.reset}`
            );
            console.log(
                `${colors.blue}     Min: ${minGenerationTime.toFixed(3)}ms, Max: ${maxGenerationTime.toFixed(3)}ms${colors.reset}`
            );

            assert.ok(
                avgGenerationTime < TEST_CONFIG.performanceThresholds.tokenGenerationMaxMs,
                `Average token generation time ${avgGenerationTime.toFixed(3)}ms exceeds threshold ${TEST_CONFIG.performanceThresholds.tokenGenerationMaxMs}ms`
            );

            this.performanceMetrics.responseTimes.push({
                test: 'token-generation',
                avg: avgGenerationTime,
                min: minGenerationTime,
                max: maxGenerationTime,
            });

            console.log(
                `${colors.green}  ✓ Token generation performance within acceptable limits${colors.reset}`
            );
        });
    }

    async testDatabasePerformance() {
        await this.runTest('Database Performance', async () => {
            // Import repository functions for direct testing
            const { createUser, storeUserIdentity, getUserIdByCookie } = await import(
                '../../dist/repository/index.js'
            );

            const iterations = 500;
            const operationTimes = [];

            for (let i = 0; i < iterations; i++) {
                const cookieValue = crypto.randomUUID();

                const startTime = process.hrtime.bigint();

                // Perform complete user creation and identity storage
                const user = createUser();
                storeUserIdentity(user.id, cookieValue);
                const retrievedUserId = getUserIdByCookie(cookieValue);

                const endTime = process.hrtime.bigint();

                assert.strictEqual(retrievedUserId, user.id, 'User should be retrievable');

                const operationTimeMs = Number(endTime - startTime) / 1000000;
                operationTimes.push(operationTimeMs);
            }

            const avgOperationTime =
                operationTimes.reduce((a, b) => a + b, 0) / operationTimes.length;
            const maxOperationTime = Math.max(...operationTimes);
            const minOperationTime = Math.min(...operationTimes);

            console.log(`${colors.blue}  📊 Database Operation Stats:${colors.reset}`);
            console.log(
                `${colors.blue}     Average: ${avgOperationTime.toFixed(3)}ms${colors.reset}`
            );
            console.log(
                `${colors.blue}     Min: ${minOperationTime.toFixed(3)}ms, Max: ${maxOperationTime.toFixed(3)}ms${colors.reset}`
            );

            assert.ok(
                avgOperationTime < TEST_CONFIG.performanceThresholds.databaseOperationMaxMs,
                `Average database operation time ${avgOperationTime.toFixed(3)}ms exceeds threshold ${TEST_CONFIG.performanceThresholds.databaseOperationMaxMs}ms`
            );

            this.performanceMetrics.responseTimes.push({
                test: 'database-operations',
                avg: avgOperationTime,
                min: minOperationTime,
                max: maxOperationTime,
            });

            console.log(
                `${colors.green}  ✓ Database performance within acceptable limits${colors.reset}`
            );
        });
    }

    async testConcurrentHealthChecks() {
        await this.runTest('Concurrent Health Checks', async () => {
            const concurrentRequests = 100;
            const startTime = Date.now();

            const promises = Array.from({ length: concurrentRequests }, async () => {
                const requestStart = Date.now();
                const response = await fetch(`${TEST_CONFIG.baseUrl}/health`);
                const requestEnd = Date.now();

                return {
                    status: response.status,
                    responseTime: requestEnd - requestStart,
                    success: response.status === 200,
                };
            });

            const results = await Promise.all(promises);
            const endTime = Date.now();

            const totalTime = endTime - startTime;
            const successfulRequests = results.filter((r) => r.success).length;
            const avgResponseTime =
                results.reduce((sum, r) => sum + r.responseTime, 0) / results.length;
            const maxResponseTime = Math.max(...results.map((r) => r.responseTime));

            console.log(`${colors.blue}  📊 Concurrent Health Check Stats:${colors.reset}`);
            console.log(`${colors.blue}     Total time: ${totalTime}ms${colors.reset}`);
            console.log(
                `${colors.blue}     Successful requests: ${successfulRequests}/${concurrentRequests}${colors.reset}`
            );
            console.log(
                `${colors.blue}     Average response time: ${avgResponseTime.toFixed(2)}ms${colors.reset}`
            );
            console.log(
                `${colors.blue}     Max response time: ${maxResponseTime}ms${colors.reset}`
            );

            assert.strictEqual(
                successfulRequests,
                concurrentRequests,
                'All concurrent requests should succeed'
            );
            assert.ok(
                maxResponseTime < TEST_CONFIG.performanceThresholds.concurrentRequestMaxMs,
                `Max response time ${maxResponseTime}ms exceeds threshold ${TEST_CONFIG.performanceThresholds.concurrentRequestMaxMs}ms`
            );

            console.log(
                `${colors.green}  ✓ Concurrent health checks handled successfully${colors.reset}`
            );
        });
    }

    async testConcurrentAuthentication() {
        await this.runTest('Concurrent Authentication Requests', async () => {
            const concurrentRequests = 50;
            const startTime = Date.now();

            const promises = Array.from({ length: concurrentRequests }, async () => {
                const requestStart = Date.now();

                // Test authentication endpoint with missing gap_id (should return QR code page)
                const params = new URLSearchParams({
                    client_id: 'test-client',
                    redirect_uri: 'http://localhost:3000/callback',
                    response_type: 'code',
                    scope: 'openid profile',
                    code_challenge: 'test-challenge',
                    code_challenge_method: 'S256',
                });

                const response = await fetch(`${TEST_CONFIG.baseUrl}/authenticate?${params}`);
                const requestEnd = Date.now();

                return {
                    status: response.status,
                    responseTime: requestEnd - requestStart,
                    success: response.status === 400, // Expected for missing gap_id
                };
            });

            const results = await Promise.all(promises);
            const endTime = Date.now();

            const totalTime = endTime - startTime;
            const successfulRequests = results.filter((r) => r.success).length;
            const avgResponseTime =
                results.reduce((sum, r) => sum + r.responseTime, 0) / results.length;

            console.log(`${colors.blue}  📊 Concurrent Authentication Stats:${colors.reset}`);
            console.log(`${colors.blue}     Total time: ${totalTime}ms${colors.reset}`);
            console.log(
                `${colors.blue}     Successful requests: ${successfulRequests}/${concurrentRequests}${colors.reset}`
            );
            console.log(
                `${colors.blue}     Average response time: ${avgResponseTime.toFixed(2)}ms${colors.reset}`
            );

            assert.strictEqual(
                successfulRequests,
                concurrentRequests,
                'All concurrent authentication requests should be handled'
            );

            console.log(
                `${colors.green}  ✓ Concurrent authentication requests handled successfully${colors.reset}`
            );
        });
    }

    async testSustainedLoad() {
        await this.runTest('Sustained Load Test', async () => {
            const duration = 30000; // 30 seconds
            const requestInterval = 100; // Request every 100ms
            const startTime = Date.now();
            const results = [];

            console.log(
                `${colors.blue}  🔄 Running sustained load for ${duration / 1000} seconds...${colors.reset}`
            );

            while (Date.now() - startTime < duration) {
                const requestStart = Date.now();

                try {
                    const response = await fetch(`${TEST_CONFIG.baseUrl}/health`);
                    const requestEnd = Date.now();

                    results.push({
                        timestamp: requestStart,
                        responseTime: requestEnd - requestStart,
                        status: response.status,
                        success: response.status === 200,
                    });
                } catch (error) {
                    results.push({
                        timestamp: requestStart,
                        responseTime: -1,
                        status: 0,
                        success: false,
                        error: error.message,
                    });
                }

                // Wait for next request
                await new Promise((resolve) => setTimeout(resolve, requestInterval));
            }

            const successfulRequests = results.filter((r) => r.success).length;
            const totalRequests = results.length;
            const successRate = (successfulRequests / totalRequests) * 100;
            const avgResponseTime =
                results.filter((r) => r.success).reduce((sum, r) => sum + r.responseTime, 0) /
                successfulRequests;

            console.log(`${colors.blue}  📊 Sustained Load Stats:${colors.reset}`);
            console.log(`${colors.blue}     Total requests: ${totalRequests}${colors.reset}`);
            console.log(
                `${colors.blue}     Success rate: ${successRate.toFixed(2)}%${colors.reset}`
            );
            console.log(
                `${colors.blue}     Average response time: ${avgResponseTime.toFixed(2)}ms${colors.reset}`
            );

            assert.ok(successRate > 95, `Success rate ${successRate.toFixed(2)}% is below 95%`);

            console.log(
                `${colors.green}  ✓ Sustained load test completed successfully${colors.reset}`
            );
        });
    }

    async testMemoryUsage() {
        await this.runTest('Memory Usage Under Load', async () => {
            const initialMemory = process.memoryUsage();

            // Perform memory-intensive operations
            const operations = 1000;
            const { createUser, storeUserIdentity } = await import(
                '../../dist/repository/index.js'
            );

            for (let i = 0; i < operations; i++) {
                const user = createUser();
                const cookieValue = crypto.randomUUID();
                storeUserIdentity(user.id, cookieValue);

                // Periodically check memory usage
                if (i % 100 === 0) {
                    const currentMemory = process.memoryUsage();
                    this.performanceMetrics.memoryUsage.push({
                        iteration: i,
                        heapUsed: currentMemory.heapUsed,
                        heapTotal: currentMemory.heapTotal,
                        external: currentMemory.external,
                    });
                }
            }

            const finalMemory = process.memoryUsage();
            const memoryIncreaseMB = (finalMemory.heapUsed - initialMemory.heapUsed) / 1024 / 1024;

            console.log(`${colors.blue}  📊 Memory Usage Stats:${colors.reset}`);
            console.log(
                `${colors.blue}     Initial heap: ${(initialMemory.heapUsed / 1024 / 1024).toFixed(2)}MB${colors.reset}`
            );
            console.log(
                `${colors.blue}     Final heap: ${(finalMemory.heapUsed / 1024 / 1024).toFixed(2)}MB${colors.reset}`
            );
            console.log(
                `${colors.blue}     Memory increase: ${memoryIncreaseMB.toFixed(2)}MB${colors.reset}`
            );

            assert.ok(
                memoryIncreaseMB < TEST_CONFIG.performanceThresholds.memoryLeakThresholdMB,
                `Memory increase ${memoryIncreaseMB.toFixed(2)}MB exceeds threshold ${TEST_CONFIG.performanceThresholds.memoryLeakThresholdMB}MB`
            );

            console.log(`${colors.green}  ✓ Memory usage within acceptable limits${colors.reset}`);
        });
    }

    async testErrorRateUnderLoad() {
        await this.runTest('Error Rate Under Load', async () => {
            const totalRequests = 200;
            const concurrentBatches = 10;
            const requestsPerBatch = totalRequests / concurrentBatches;

            let totalErrors = 0;
            let totalSuccesses = 0;

            for (let batch = 0; batch < concurrentBatches; batch++) {
                const batchPromises = Array.from({ length: requestsPerBatch }, async () => {
                    try {
                        const response = await fetch(`${TEST_CONFIG.baseUrl}/health`);
                        return response.status === 200 ? 'success' : 'error';
                    } catch (error) {
                        return 'error';
                    }
                });

                const batchResults = await Promise.all(batchPromises);
                const batchErrors = batchResults.filter((r) => r === 'error').length;
                const batchSuccesses = batchResults.filter((r) => r === 'success').length;

                totalErrors += batchErrors;
                totalSuccesses += batchSuccesses;

                // Small delay between batches
                await new Promise((resolve) => setTimeout(resolve, 100));
            }

            const errorRate = (totalErrors / totalRequests) * 100;

            console.log(`${colors.blue}  📊 Error Rate Stats:${colors.reset}`);
            console.log(`${colors.blue}     Total requests: ${totalRequests}${colors.reset}`);
            console.log(`${colors.blue}     Errors: ${totalErrors}${colors.reset}`);
            console.log(`${colors.blue}     Successes: ${totalSuccesses}${colors.reset}`);
            console.log(`${colors.blue}     Error rate: ${errorRate.toFixed(2)}%${colors.reset}`);

            this.performanceMetrics.errorRates.push({
                test: 'load-test',
                errorRate: errorRate,
                totalRequests: totalRequests,
                errors: totalErrors,
            });

            assert.ok(errorRate < 5, `Error rate ${errorRate.toFixed(2)}% exceeds 5% threshold`);

            console.log(
                `${colors.green}  ✓ Error rate under load within acceptable limits${colors.reset}`
            );
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
        console.log(`\n${colors.cyan}📊 Performance Test Results${colors.reset}`);
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

        // Print performance summary
        if (this.performanceMetrics.responseTimes.length > 0) {
            console.log(`\n${colors.magenta}📈 Performance Summary${colors.reset}`);
            this.performanceMetrics.responseTimes.forEach((metric) => {
                console.log(
                    `${colors.magenta}${metric.test}: avg ${metric.avg.toFixed(3)}ms (${metric.min.toFixed(3)}-${metric.max.toFixed(3)}ms)${colors.reset}`
                );
            });
        }

        if (failed > 0) {
            console.log(`\n${colors.red}❌ Some performance tests failed.${colors.reset}`);
            process.exit(1);
        } else {
            console.log(`\n${colors.green}🎉 All performance tests passed!${colors.reset}`);
        }
    }
}

// Run tests if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
    const runner = new PerformanceTestRunner();
    runner.run().catch(console.error);
}

export { PerformanceTestRunner };

console.log('✅ Performance test suite ready');
