import { Playground, Tenant } from 'gamehub-model/model';
import { User } from 'jinaga';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { BackgroundServiceConfig, BackgroundServiceManager } from '../services/background-service/BackgroundServiceManager';
import { JinagaTestUtils } from './jinaga-test-utils';

describe('BackgroundServiceManager', () => {
    let manager: BackgroundServiceManager;
    let jinaga: any;
    let config: BackgroundServiceConfig;
    let testTenant: Tenant;
    let testUser: User;

    beforeEach(async () => {
        // Create a real Jinaga test instance with full model
        testUser = new User('test-user-key');
        const { jinaga: testJinaga, tenant } = await JinagaTestUtils.createTestInstanceWithTenant(testUser);

        jinaga = testJinaga;
        testTenant = tenant;

        // Create test configuration optimized for testing
        config = {
            enabled: true,
            playerCount: 3, // Smaller number for faster tests
            joinDelay: 50, // Faster for tests
            retryAttempts: 2,
            maxConcurrentJoins: 1,
        };

        manager = new BackgroundServiceManager(jinaga, config);
    });

    afterEach(async () => {
        // Clean up - stop service if running
        if (manager.isServiceRunning()) {
            await manager.stop();
        }
    });

    describe('constructor', () => {
        it('should initialize with provided configuration', () => {
            expect(manager).toBeInstanceOf(BackgroundServiceManager);
            expect(manager.isServiceRunning()).toBe(false);
        });
    });

    describe('start', () => {
        it('should start the service successfully and create background players', async () => {
            await manager.start(testTenant);

            expect(manager.isServiceRunning()).toBe(true);

            const status = manager.getServiceStatus();
            expect(status.isRunning).toBe(true);
            expect(status.playerCount).toBe(3);
            expect(status.activePlayers).toBe(0); // No playgrounds yet
            expect(status.tenant).toBe('GameHub.Tenant');
        });

        it('should not start if already running', async () => {
            // Start the service first
            await manager.start(testTenant);
            expect(manager.isServiceRunning()).toBe(true);

            // Try to start again
            const consoleSpy = vi.spyOn(console, 'log');
            await manager.start(testTenant);

            expect(consoleSpy).toHaveBeenCalledWith('Background service is already running');
            expect(manager.isServiceRunning()).toBe(true); // Should still be running
        });

        it('should handle start-stop-start cycles', async () => {
            // First start
            await manager.start(testTenant);
            expect(manager.isServiceRunning()).toBe(true);

            // Stop
            await manager.stop();
            expect(manager.isServiceRunning()).toBe(false);

            // Start again
            await manager.start(testTenant);
            expect(manager.isServiceRunning()).toBe(true);
        });
    });

    describe('stop', () => {
        it('should stop the service successfully', async () => {
            // Start the service first
            await manager.start(testTenant);
            expect(manager.isServiceRunning()).toBe(true);

            // Stop the service
            await manager.stop();

            expect(manager.isServiceRunning()).toBe(false);

            const status = manager.getServiceStatus();
            expect(status.isRunning).toBe(false);
            expect(status.tenant).toBe(null);
        });

        it('should not stop if not running', async () => {
            const consoleSpy = vi.spyOn(console, 'log');
            await manager.stop();

            expect(consoleSpy).toHaveBeenCalledWith('Background service is not running');
            expect(manager.isServiceRunning()).toBe(false);
        });
    });

    describe('getServiceStatus', () => {
        it('should return correct status when not running', () => {
            const status = manager.getServiceStatus();

            expect(status).toEqual({
                isRunning: false,
                playerCount: 3,
                activePlayers: 0,
                tenant: null,
            });
        });

        it('should return correct status when running', async () => {
            await manager.start(testTenant);
            const status = manager.getServiceStatus();

            expect(status).toEqual({
                isRunning: true,
                playerCount: 3,
                activePlayers: 0, // No playgrounds yet
                tenant: 'GameHub.Tenant',
            });
        });
    });

    describe('playground monitoring', () => {
        it('should detect new playgrounds and join players', async () => {
            await manager.start(testTenant);

            // Create a real playground
            const playground = await jinaga.fact(new Playground(testTenant, 'TEST123'));

            // Wait for the service to process the playground
            await new Promise(resolve => setTimeout(resolve, 200));

            const status = manager.getServiceStatus();
            expect(status.activePlayers).toBeGreaterThan(0);
            expect(status.activePlayers).toBeLessThanOrEqual(3);
        });

        it('should handle multiple playgrounds', async () => {
            await manager.start(testTenant);

            // Create multiple playgrounds
            const playground1 = await jinaga.fact(new Playground(testTenant, 'GAME1'));
            const playground2 = await jinaga.fact(new Playground(testTenant, 'GAME2'));

            // Wait for processing
            await new Promise(resolve => setTimeout(resolve, 300));

            const status = manager.getServiceStatus();
            expect(status.activePlayers).toBeGreaterThan(0);
            expect(status.activePlayers).toBeLessThanOrEqual(3);
        });

        it('should respect join delays', async () => {
            const fastConfig = {
                ...config,
                joinDelay: 200, // 200ms delay
            };
            const fastManager = new BackgroundServiceManager(jinaga, fastConfig);

            await fastManager.start(testTenant);

            // Create playground
            await jinaga.fact(new Playground(testTenant, 'TIMING'));

            // Wait for processing but before delay completes
            await new Promise(resolve => setTimeout(resolve, 100));

            // Should not have joined yet due to delay (or very few if any)
            let status = fastManager.getServiceStatus();
            expect(status.activePlayers).toBeLessThanOrEqual(1); // Allow for some immediate joins

            // Wait for delay to complete
            await new Promise(resolve => setTimeout(resolve, 200));

            status = fastManager.getServiceStatus();
            expect(status.activePlayers).toBeGreaterThan(0);

            await fastManager.stop();
        });
    });

    describe('configuration variations', () => {
        it('should work with different player counts', async () => {
            const configs = [
                { playerCount: 1, joinDelay: 10 },
                { playerCount: 2, joinDelay: 10 },
                { playerCount: 3, joinDelay: 10 },
            ];

            for (const config of configs) {
                const testManager = new BackgroundServiceManager(jinaga, {
                    enabled: true,
                    ...config,
                    retryAttempts: 1,
                    maxConcurrentJoins: 1,
                });

                await testManager.start(testTenant);

                const status = testManager.getServiceStatus();
                expect(status.playerCount).toBe(config.playerCount);
                expect(status.isRunning).toBe(true);

                await testManager.stop();
            }
        });

        it('should work with different concurrent join limits', async () => {
            const configs = [
                { maxConcurrentJoins: 1, joinDelay: 10 },
                { maxConcurrentJoins: 2, joinDelay: 10 },
            ];

            for (const config of configs) {
                const testManager = new BackgroundServiceManager(jinaga, {
                    enabled: true,
                    playerCount: 2,
                    ...config,
                    retryAttempts: 1,
                });

                await testManager.start(testTenant);

                // Create multiple playgrounds to test concurrency
                await jinaga.fact(new Playground(testTenant, 'CONCURRENT1'));
                await jinaga.fact(new Playground(testTenant, 'CONCURRENT2'));

                // Wait for processing
                await new Promise(resolve => setTimeout(resolve, 200));

                const status = testManager.getServiceStatus();
                expect(status.isRunning).toBe(true);

                await testManager.stop();
            }
        });
    });

    describe('error handling', () => {
        it('should continue running despite playground processing issues', async () => {
            await manager.start(testTenant);

            // Create a playground that might cause issues
            const problematicPlayground = await jinaga.fact(new Playground(testTenant, 'PROBLEM'));

            // Service should continue running despite issues
            await new Promise(resolve => setTimeout(resolve, 100));

            expect(manager.isServiceRunning()).toBe(true);
        });

        it('should handle rapid start-stop cycles', async () => {
            for (let i = 0; i < 3; i++) {
                await manager.start(testTenant);
                expect(manager.isServiceRunning()).toBe(true);

                await manager.stop();
                expect(manager.isServiceRunning()).toBe(false);
            }
        });
    });

    describe('real-time behavior', () => {
        it('should respond to playground creation in real-time', async () => {
            await manager.start(testTenant);

            // Create playground and immediately check status
            await jinaga.fact(new Playground(testTenant, 'REALTIME'));

            // Wait a bit for processing
            await new Promise(resolve => setTimeout(resolve, 150));

            const status = manager.getServiceStatus();
            expect(status.activePlayers).toBeGreaterThan(0);
        });

        it('should maintain state across multiple operations', async () => {
            await manager.start(testTenant);

            // Create multiple playgrounds over time
            for (let i = 0; i < 3; i++) {
                await jinaga.fact(new Playground(testTenant, `GAME${i}`));
                await new Promise(resolve => setTimeout(resolve, 50));
            }

            const status = manager.getServiceStatus();
            expect(status.isRunning).toBe(true);
            expect(status.activePlayers).toBeGreaterThan(0);
        });
    });
}); 