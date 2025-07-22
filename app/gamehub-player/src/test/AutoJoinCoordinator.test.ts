import { Playground, Player, Tenant, Join, Leave } from 'gamehub-model/model';
import { User } from 'jinaga';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AutoJoinCoordinator, BackgroundServiceConfig } from '../services/background-service/AutoJoinCoordinator';
import { JinagaTestUtils } from './jinaga-test-utils';

describe('AutoJoinCoordinator', () => {
    let coordinator: AutoJoinCoordinator;
    let jinaga: any;
    let config: BackgroundServiceConfig;
    let testTenant: Tenant;
    let testUser: User;
    let testPlayers: Player[];
    let testPlayground: Playground;

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
            joinDelay: 50, // Faster for tests
            retryAttempts: 2,
            maxConcurrentJoins: 1,
        };

        coordinator = new AutoJoinCoordinator(jinaga, config);
        await coordinator.initialize(testTenant);

        // Create test players
        testPlayers = [];
        for (let i = 0; i < 3; i++) {
            const user = new User(`test-player-${i}`);
            const player = await jinaga.fact(new Player(user, testTenant));
            testPlayers.push(player);
        }

        // Create test playground
        testPlayground = await jinaga.fact(new Playground(testTenant, 'TEST-PLAYGROUND'));
    });

    afterEach(async () => {
        await coordinator.cleanup();
    });

    describe('constructor and initialization', () => {
        it('should initialize with provided configuration', () => {
            expect(coordinator).toBeInstanceOf(AutoJoinCoordinator);
        });

        it('should initialize with tenant', async () => {
            const newCoordinator = new AutoJoinCoordinator(jinaga, config);
            await newCoordinator.initialize(testTenant);
            expect(newCoordinator).toBeInstanceOf(AutoJoinCoordinator);
        });
    });

    describe('coordinateJoins', () => {
        it('should coordinate joins with sequential delays', async () => {
            const joinSuccesses: Array<{ player: Player; playground: Playground }> = [];
            const joinFailures: Array<{ player: Player; playground: Playground; error: string }> = [];

            const onJoinSuccess = (player: Player, playground: Playground) => {
                joinSuccesses.push({ player, playground });
            };

            const onJoinFailure = (player: Player, playground: Playground, error: string) => {
                joinFailures.push({ player, playground, error });
            };

            // Coordinate joins for all test players
            await coordinator.coordinateJoins(testPlayers, testPlayground, onJoinSuccess, onJoinFailure);

            // Wait for all joins to complete (with delays)
            await new Promise(resolve => setTimeout(resolve, 200));

            // Verify all players joined successfully
            expect(joinSuccesses).toHaveLength(3);
            expect(joinFailures).toHaveLength(0);

            // Verify players are actually in the playground
            const playersInPlayground = await coordinator.getPlayersInPlayground(testPlayground);
            expect(playersInPlayground).toHaveLength(3);
        });

        it('should handle concurrent playground coordination', async () => {
            const playground2 = await jinaga.fact(new Playground(testTenant, 'TEST-PLAYGROUND-2'));

            const joinSuccesses: Array<{ player: Player; playground: Playground }> = [];

            const onJoinSuccess = (player: Player, playground: Playground) => {
                joinSuccesses.push({ player, playground });
            };

            // Coordinate joins for both playgrounds simultaneously
            await Promise.all([
                coordinator.coordinateJoins([testPlayers[0]], testPlayground, onJoinSuccess),
                coordinator.coordinateJoins([testPlayers[1]], playground2, onJoinSuccess)
            ]);

            // Wait for joins to complete
            await new Promise(resolve => setTimeout(resolve, 200));

            // Verify both joins completed
            expect(joinSuccesses).toHaveLength(2);
        });

        it('should prevent duplicate coordination for same playground', async () => {
            const joinSuccesses: Array<{ player: Player; playground: Playground }> = [];

            const onJoinSuccess = (player: Player, playground: Playground) => {
                joinSuccesses.push({ player, playground });
            };

            // Try to coordinate joins twice for the same playground
            await coordinator.coordinateJoins([testPlayers[0]], testPlayground, onJoinSuccess);
            await coordinator.coordinateJoins([testPlayers[1]], testPlayground, onJoinSuccess);

            // Wait for joins to complete
            await new Promise(resolve => setTimeout(resolve, 200));

            // Should only have one successful join (the first one)
            expect(joinSuccesses).toHaveLength(1);
        });
    });

    describe('join conflict resolution', () => {
        it('should handle existing joins gracefully', async () => {
            // Manually join a player first
            await jinaga.fact(new Join(testPlayers[0], testPlayground, new Date()));

            const joinSuccesses: Array<{ player: Player; playground: Playground }> = [];
            const joinFailures: Array<{ player: Player; playground: Playground; error: string }> = [];

            const onJoinSuccess = (player: Player, playground: Playground) => {
                joinSuccesses.push({ player, playground });
            };

            const onJoinFailure = (player: Player, playground: Playground, error: string) => {
                joinFailures.push({ player, playground, error });
            };

            // Try to coordinate joins including the already-joined player
            await coordinator.coordinateJoins(testPlayers, testPlayground, onJoinSuccess, onJoinFailure);

            // Wait for joins to complete
            await new Promise(resolve => setTimeout(resolve, 200));

            // Should handle existing join gracefully
            expect(joinSuccesses.length).toBeGreaterThan(0);
            expect(joinFailures).toHaveLength(0);
        });

        it('should handle concurrent join attempts', async () => {
            const joinSuccesses: Array<{ player: Player; playground: Playground }> = [];

            const onJoinSuccess = (player: Player, playground: Playground) => {
                joinSuccesses.push({ player, playground });
            };

            // Create multiple playgrounds and coordinate joins simultaneously
            const playgrounds = [
                await jinaga.fact(new Playground(testTenant, 'PLAYGROUND-1')),
                await jinaga.fact(new Playground(testTenant, 'PLAYGROUND-2')),
                await jinaga.fact(new Playground(testTenant, 'PLAYGROUND-3'))
            ];

            const joinPromises = playgrounds.map((playground, index) =>
                coordinator.coordinateJoins([testPlayers[index]], playground, onJoinSuccess)
            );

            await Promise.all(joinPromises);

            // Wait for all joins to complete
            await new Promise(resolve => setTimeout(resolve, 300));

            // Should handle concurrent joins without conflicts
            expect(joinSuccesses).toHaveLength(3);
        });
    });

    describe('leave logic', () => {
        it('should successfully leave a playground', async () => {
            // First join a player
            await jinaga.fact(new Join(testPlayers[0], testPlayground, new Date()));

            // Verify player is in playground
            let playersInPlayground = await coordinator.getPlayersInPlayground(testPlayground);
            expect(playersInPlayground).toHaveLength(1);

            // Leave the playground
            await coordinator.leavePlayground(testPlayers[0], testPlayground);

            // Verify player is no longer in playground
            playersInPlayground = await coordinator.getPlayersInPlayground(testPlayground);
            expect(playersInPlayground).toHaveLength(0);
        });

        it('should handle leaving when player is not in playground', async () => {
            // Try to leave without being joined
            await expect(coordinator.leavePlayground(testPlayers[0], testPlayground)).resolves.not.toThrow();

            // Verify no players in playground
            const playersInPlayground = await coordinator.getPlayersInPlayground(testPlayground);
            expect(playersInPlayground).toHaveLength(0);
        });

        it('should handle multiple leaves for same player', async () => {
            // Join player
            await jinaga.fact(new Join(testPlayers[0], testPlayground, new Date()));

            // Leave multiple times
            await coordinator.leavePlayground(testPlayers[0], testPlayground);
            await coordinator.leavePlayground(testPlayers[0], testPlayground);

            // Verify player is no longer in playground
            const playersInPlayground = await coordinator.getPlayersInPlayground(testPlayground);
            expect(playersInPlayground).toHaveLength(0);
        });
    });

    describe('join success/failure tracking', () => {
        it('should track successful joins', async () => {
            const joinSuccesses: Array<{ player: Player; playground: Playground }> = [];

            const onJoinSuccess = (player: Player, playground: Playground) => {
                joinSuccesses.push({ player, playground });
            };

            await coordinator.coordinateJoins([testPlayers[0]], testPlayground, onJoinSuccess);

            // Wait for join to complete
            await new Promise(resolve => setTimeout(resolve, 100));

            // Verify join was tracked
            expect(joinSuccesses).toHaveLength(1);
            expect(joinSuccesses[0].player).toBe(testPlayers[0]);
            expect(joinSuccesses[0].playground).toBe(testPlayground);

            // Verify status reflects successful join
            const status = coordinator.getStatus();
            expect(status.successfulJoins).toBeGreaterThan(0);
        });

        it('should track join attempts', async () => {
            const playground = await jinaga.fact(new Playground(testTenant, 'TRACKING-TEST'));

            const joinFailures: Array<{ player: Player; playground: Playground; error: string }> = [];

            const onJoinFailure = (player: Player, playground: Playground, error: string) => {
                joinFailures.push({ player, playground, error });
            };

            // Coordinate joins and track attempts
            await coordinator.coordinateJoins([testPlayers[0]], playground, undefined, onJoinFailure);

            // Wait for join attempt to complete
            await new Promise(resolve => setTimeout(resolve, 300));

            // Verify status tracking works
            const status = coordinator.getStatus();
            expect(status.totalAttempts).toBeGreaterThan(0);
            expect(status.successfulJoins + status.failedJoins).toBe(status.totalAttempts);
        });

        it('should track join history for players', async () => {
            // Join a player
            await coordinator.coordinateJoins([testPlayers[0]], testPlayground);
            await new Promise(resolve => setTimeout(resolve, 100));

            // Get join history for the player
            const playerHistory = coordinator.getPlayerJoinHistory(testPlayers[0]);
            expect(playerHistory.length).toBeGreaterThan(0);
            expect(playerHistory[0].player).toBe(testPlayers[0]);
            expect(playerHistory[0].playground).toBe(testPlayground);
        });

        it('should track join history for playgrounds', async () => {
            // Join multiple players to the same playground
            await coordinator.coordinateJoins(testPlayers, testPlayground);
            await new Promise(resolve => setTimeout(resolve, 200));

            // Get join history for the playground
            const playgroundHistory = coordinator.getPlaygroundJoinHistory(testPlayground);
            expect(playgroundHistory.length).toBeGreaterThan(0);
            expect(playgroundHistory.every(attempt => attempt.playground.code === testPlayground.code)).toBe(true);
        });
    });

    describe('status and monitoring', () => {
        it('should provide accurate status information', async () => {
            const initialStatus = coordinator.getStatus();
            expect(initialStatus.totalAttempts).toBe(0);
            expect(initialStatus.successfulJoins).toBe(0);
            expect(initialStatus.failedJoins).toBe(0);
            expect(initialStatus.pendingJoins).toBe(0);

            // Perform some joins
            await coordinator.coordinateJoins(testPlayers, testPlayground);
            await new Promise(resolve => setTimeout(resolve, 200));

            const finalStatus = coordinator.getStatus();
            expect(finalStatus.totalAttempts).toBeGreaterThan(0);
            expect(finalStatus.successfulJoins).toBeGreaterThan(0);
            expect(finalStatus.pendingJoins).toBe(0); // Should be 0 after completion
        });

        it('should limit join history to prevent memory leaks', async () => {
            // Create many playgrounds and join them
            for (let i = 0; i < 150; i++) {
                const playground = await jinaga.fact(new Playground(testTenant, `PLAYGROUND-${i}`));
                await coordinator.coordinateJoins([testPlayers[0]], playground);
            }

            // Wait for all joins to complete
            await new Promise(resolve => setTimeout(resolve, 1000));

            // Verify history is limited
            const status = coordinator.getStatus();
            expect(status.totalAttempts).toBeLessThanOrEqual(100); // Should be limited to 100
        });
    });

    describe('cleanup', () => {
        it('should clean up coordinator state', async () => {
            // Perform some operations
            await coordinator.coordinateJoins([testPlayers[0]], testPlayground);
            await new Promise(resolve => setTimeout(resolve, 100));

            // Verify state exists
            const statusBefore = coordinator.getStatus();
            expect(statusBefore.totalAttempts).toBeGreaterThan(0);

            // Clean up
            await coordinator.cleanup();

            // Verify state is cleared
            const statusAfter = coordinator.getStatus();
            expect(statusAfter.totalAttempts).toBe(0);
            expect(statusAfter.successfulJoins).toBe(0);
            expect(statusAfter.failedJoins).toBe(0);
            expect(statusAfter.pendingJoins).toBe(0);
        });
    });
}); 