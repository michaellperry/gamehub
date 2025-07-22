import { Playground, Tenant } from 'gamehub-model/model';
import { User } from 'jinaga';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { SimulatedPlayerService, SimulatedPlayerServiceConfig, PlayerBehavior } from '../services/background-service/SimulatedPlayerService';
import { JinagaTestUtils } from './jinaga-test-utils';

describe('SimulatedPlayerService', () => {
    let service: SimulatedPlayerService;
    let jinaga: any;
    let config: SimulatedPlayerServiceConfig;
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
            playerCount: 3,
            tickInterval: 100, // Fast ticks for testing
            maxJoinAttempts: 3,
            maxPlayTime: 5000, // 5 seconds max play time
            minIdleTime: 1000, // 1 second min idle time
        };

        service = new SimulatedPlayerService(jinaga, config);
    });

    afterEach(async () => {
        // Clean up - stop service if running
        if (service.getStatus().isRunning) {
            await service.stop();
        }
    });

    describe('constructor and initialization', () => {
        it('should initialize with provided configuration', () => {
            expect(service).toBeInstanceOf(SimulatedPlayerService);
            expect(service.getStatus().isRunning).toBe(false);
        });
    });

    describe('start and stop', () => {
        it('should start the service successfully and create simulated players', async () => {
            await service.start(testTenant);

            const status = service.getStatus();
            expect(status.isRunning).toBe(true);
            expect(status.totalPlayers).toBe(3);
            expect(status.activePlayers).toBe(0); // No playgrounds yet
            expect(status.tenant).toBe('GameHub.Tenant');
        });

        it('should not start if already running', async () => {
            await service.start(testTenant);
            expect(service.getStatus().isRunning).toBe(true);

            const consoleSpy = vi.spyOn(console, 'log');
            await service.start(testTenant);

            expect(consoleSpy).toHaveBeenCalledWith('Simulated player service is already running');
            expect(service.getStatus().isRunning).toBe(true);
        });

        it('should stop the service successfully', async () => {
            await service.start(testTenant);
            expect(service.getStatus().isRunning).toBe(true);

            await service.stop();

            const status = service.getStatus();
            expect(status.isRunning).toBe(false);
            expect(status.tenant).toBe(null);
        });

        it('should not stop if not running', async () => {
            const consoleSpy = vi.spyOn(console, 'log');
            await service.stop();

            expect(consoleSpy).toHaveBeenCalledWith('Simulated player service is not running');
            expect(service.getStatus().isRunning).toBe(false);
        });
    });

    describe('player behavior', () => {
        it('should join players to new playgrounds automatically', async () => {
            await service.start(testTenant);

            // Create a playground
            const playground = await jinaga.fact(new Playground(testTenant, 'TEST-PLAYGROUND'));

            // Wait for the service to process the playground
            await new Promise(resolve => setTimeout(resolve, 300));

            const status = service.getStatus();
            expect(status.activePlayers).toBeGreaterThan(0);
            expect(status.activePlayers).toBeLessThanOrEqual(3);
        });

        it('should handle custom player behaviors', async () => {
            await service.start(testTenant);

            // Create a custom behavior that always joins the first available playground
            const customBehavior: PlayerBehavior = async (player, context) => {
                if (player.state === 'idle' && context.availablePlaygrounds.length > 0) {
                    return { type: 'JOIN_PLAYGROUND', playground: context.availablePlaygrounds[0] };
                }
                return { type: 'WAIT', duration: 1000 };
            };

            // Set custom behavior for all players
            service.setDefaultBehavior(customBehavior);

            // Create a playground
            const playground = await jinaga.fact(new Playground(testTenant, 'CUSTOM-BEHAVIOR'));

            // Wait for processing
            await new Promise(resolve => setTimeout(resolve, 300));

            const status = service.getStatus();
            expect(status.activePlayers).toBeGreaterThan(0);
        });

        it('should handle individual player behaviors', async () => {
            await service.start(testTenant);

            const players = service.getPlayers();
            expect(players.length).toBe(3);

            // Set different behavior for first player
            const aggressiveBehavior: PlayerBehavior = async (player, context) => {
                if (player.state === 'idle' && context.availablePlaygrounds.length > 0) {
                    return { type: 'JOIN_PLAYGROUND', playground: context.availablePlaygrounds[0] };
                }
                return { type: 'WAIT', duration: 500 };
            };

            service.setPlayerBehavior(players[0].id, aggressiveBehavior);

            // Create a playground
            const playground = await jinaga.fact(new Playground(testTenant, 'INDIVIDUAL-BEHAVIOR'));

            // Wait for processing
            await new Promise(resolve => setTimeout(resolve, 300));

            const status = service.getStatus();
            expect(status.activePlayers).toBeGreaterThan(0);
        });
    });

    describe('playground monitoring', () => {
        it('should detect new playgrounds and join players', async () => {
            await service.start(testTenant);

            // Create multiple playgrounds
            const playground1 = await jinaga.fact(new Playground(testTenant, 'GAME1'));
            const playground2 = await jinaga.fact(new Playground(testTenant, 'GAME2'));

            // Wait for processing
            await new Promise(resolve => setTimeout(resolve, 400));

            const status = service.getStatus();
            expect(status.activePlayers).toBeGreaterThan(0);
            expect(status.activePlayers).toBeLessThanOrEqual(3);
        });

        it('should respect timing configuration', async () => {
            const slowConfig = {
                ...config,
                tickInterval: 200, // Slower ticks
                maxPlayTime: 1000, // 1 second max play time
            };
            const slowService = new SimulatedPlayerService(jinaga, slowConfig);

            await slowService.start(testTenant);

            // Create playground
            await jinaga.fact(new Playground(testTenant, 'TIMING'));

            // Wait for processing
            await new Promise(resolve => setTimeout(resolve, 300));

            const status = slowService.getStatus();
            expect(status.isRunning).toBe(true);

            await slowService.stop();
        });
    });

    describe('configuration variations', () => {
        it('should work with different player counts', async () => {
            const configs = [
                { playerCount: 1, tickInterval: 100 },
                { playerCount: 2, tickInterval: 100 },
                { playerCount: 3, tickInterval: 100 },
            ];

            for (const config of configs) {
                const testService = new SimulatedPlayerService(jinaga, {
                    enabled: true,
                    ...config,
                    maxJoinAttempts: 3,
                    maxPlayTime: 5000,
                    minIdleTime: 1000,
                });

                await testService.start(testTenant);

                const status = testService.getStatus();
                expect(status.totalPlayers).toBe(config.playerCount);
                expect(status.isRunning).toBe(true);

                await testService.stop();
            }
        });

        it('should work with different timing configurations', async () => {
            const configs = [
                { tickInterval: 50, maxPlayTime: 2000, minIdleTime: 500 },
                { tickInterval: 100, maxPlayTime: 5000, minIdleTime: 1000 },
                { tickInterval: 200, maxPlayTime: 10000, minIdleTime: 2000 },
            ];

            for (const config of configs) {
                const testService = new SimulatedPlayerService(jinaga, {
                    enabled: true,
                    playerCount: 2,
                    ...config,
                    maxJoinAttempts: 3,
                });

                await testService.start(testTenant);

                // Create playground to test behavior
                await jinaga.fact(new Playground(testTenant, `TIMING-${config.tickInterval}`));

                // Wait for processing
                await new Promise(resolve => setTimeout(resolve, 300));

                const status = testService.getStatus();
                expect(status.isRunning).toBe(true);

                await testService.stop();
            }
        });
    });

    describe('error handling', () => {
        it('should continue running despite individual player errors', async () => {
            await service.start(testTenant);

            // Create a problematic behavior that throws errors
            const errorBehavior: PlayerBehavior = async (player, context) => {
                throw new Error('Simulated error');
            };

            service.setDefaultBehavior(errorBehavior);

            // Service should continue running despite errors
            await new Promise(resolve => setTimeout(resolve, 200));

            expect(service.getStatus().isRunning).toBe(true);
        });

        it('should handle rapid start-stop cycles', async () => {
            for (let i = 0; i < 3; i++) {
                await service.start(testTenant);
                expect(service.getStatus().isRunning).toBe(true);

                await service.stop();
                expect(service.getStatus().isRunning).toBe(false);
            }
        });
    });

    describe('real-time behavior', () => {
        it('should respond to playground creation in real-time', async () => {
            await service.start(testTenant);

            // Create playground and immediately check status
            await jinaga.fact(new Playground(testTenant, 'REALTIME'));

            // Wait a bit for processing
            await new Promise(resolve => setTimeout(resolve, 200));

            const status = service.getStatus();
            expect(status.activePlayers).toBeGreaterThan(0);
        });

        it('should maintain state across multiple operations', async () => {
            await service.start(testTenant);

            // Create multiple playgrounds over time
            for (let i = 0; i < 3; i++) {
                await jinaga.fact(new Playground(testTenant, `GAME${i}`));
                await new Promise(resolve => setTimeout(resolve, 100));
            }

            const status = service.getStatus();
            expect(status.isRunning).toBe(true);
            expect(status.activePlayers).toBeGreaterThan(0);
        });
    });

    describe('player state management', () => {
        it('should track player states correctly', async () => {
            await service.start(testTenant);

            const players = service.getPlayers();
            expect(players.length).toBe(3);

            // All players should start idle
            const status = service.getStatus();
            expect(status.idlePlayers).toBe(3);
            expect(status.activePlayers).toBe(0);
            expect(status.joiningPlayers).toBe(0);
            expect(status.leavingPlayers).toBe(0);
        });

        it('should transition players through states', async () => {
            await service.start(testTenant);

            // Create playground to trigger joins
            await jinaga.fact(new Playground(testTenant, 'STATE-TEST'));

            // Wait for state transitions
            await new Promise(resolve => setTimeout(resolve, 300));

            const status = service.getStatus();
            expect(status.activePlayers).toBeGreaterThan(0);
            expect(status.idlePlayers).toBeLessThan(3);
        });
    });
}); 