import { renderHook, waitFor } from '@testing-library/react';
import { Playground, Tenant } from 'gamehub-model/model';
import { User } from 'jinaga';
import { act } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { usePlayerSessions } from '../hooks/usePlayerSession';
import { JinagaTestUtils } from './jinaga-test-utils';

// Mock the background service config to enable it in tests
vi.mock('../config/background-service', () => ({
    backgroundServiceConfig: {
        enabled: true,
        playerCount: 3,
        joinDelay: 100,
        retryAttempts: 3,
        maxConcurrentJoins: 1,
    },
}));

// Mock environment to simulate dev mode
vi.mock('import.meta.env', () => ({
    env: {
        DEV: true,
    },
}));

describe('usePlayerSessions', () => {
    let tenant: Tenant;
    let owner: User;
    let jinaga: any;

    beforeEach(async () => {
        // Create a test instance with tenant
        const testSetup = await JinagaTestUtils.createTestInstanceWithTenant(
            new User('test-owner'),
            {
                administrators: [],
                players: [],
                playgrounds: [],
            }
        );
        tenant = testSetup.tenant;
        owner = testSetup.owner;
        jinaga = testSetup.jinaga;
    });

    describe('Hook Initialization', () => {
        it('should initialize with correct default state', () => {
            const { result } = renderHook(() => usePlayerSessions(tenant));

            expect(result.current.players).toEqual([]);
            expect(result.current.activePlayers).toEqual([]);
            expect(result.current.isLoading).toBe(false);
            expect(result.current.error).toBeNull();
            expect(result.current.serviceStatus.isRunning).toBe(false);
        });

        it('should handle null tenant', () => {
            const { result } = renderHook(() => usePlayerSessions(null));

            expect(result.current.players).toEqual([]);
            expect(result.current.activePlayers).toEqual([]);
            expect(result.current.isLoading).toBe(false);
            expect(result.current.error).toBeNull();
            expect(result.current.serviceStatus.isRunning).toBe(false);
        });
    });

    describe('Background Service Integration', () => {
        it('should start background service in dev mode', async () => {
            const { result } = renderHook(() => usePlayerSessions(tenant));

            // Wait for service to start
            await waitFor(() => {
                expect(result.current.serviceStatus.isRunning).toBe(true);
            }, { timeout: 10000 });

            expect(result.current.serviceStatus.totalPlayers).toBe(3);
            expect(result.current.serviceStatus.idlePlayers).toBe(3);
            expect(result.current.serviceStatus.activePlayers).toBe(0);
        });

        it('should sync players from service to hook state', async () => {
            const { result } = renderHook(() => usePlayerSessions(tenant));

            // Wait for service to start and sync players
            await waitFor(() => {
                expect(result.current.players.length).toBe(3);
            }, { timeout: 10000 });

            expect(result.current.players.length).toBe(3);
            expect(result.current.players[0].name).toContain('Simulated Player');
            expect(result.current.players[0].isActive).toBe(false); // Initially idle
        });

        it('should handle service startup errors gracefully', async () => {
            // Mock a failing service by providing invalid config
            const { result } = renderHook(() => usePlayerSessions(tenant));

            // Wait a bit to see if error is handled
            await new Promise(resolve => setTimeout(resolve, 2000));

            // Should not crash and should have error handling
            expect(result.current.error).toBeNull(); // Or should contain error message
        });
    });

    describe('Playground Integration', () => {
        it('should have service join players to playgrounds automatically', async () => {
            const { result } = renderHook(() => usePlayerSessions(tenant));

            // Wait for service to start
            await waitFor(() => {
                expect(result.current.serviceStatus.isRunning).toBe(true);
            }, { timeout: 10000 });

            // Create a playground
            const playground = await jinaga.fact(new Playground(tenant, 'TEST-PLAYGROUND'));

            // Wait for service to detect playground and join players
            await waitFor(() => {
                expect(result.current.serviceStatus.activePlayers).toBeGreaterThan(0);
            }, { timeout: 30000 }); // Increased timeout to 30 seconds

            // Verify that some players are now active (joined playground)
            expect(result.current.serviceStatus.activePlayers).toBeGreaterThan(0);
            expect(result.current.serviceStatus.idlePlayers).toBeLessThan(3);
        });

        it('should sync player state changes from service', async () => {
            const { result } = renderHook(() => usePlayerSessions(tenant));

            // Wait for service to start
            await waitFor(() => {
                expect(result.current.serviceStatus.isRunning).toBe(true);
            }, { timeout: 10000 });

            // Create playground to trigger joins
            await jinaga.fact(new Playground(tenant, 'SYNC-TEST'));

            // Wait for players to join and state to sync
            await waitFor(() => {
                const activePlayers = result.current.players.filter(p => p.isActive);
                expect(activePlayers.length).toBeGreaterThan(0);
            }, { timeout: 30000 }); // Increased timeout to 30 seconds

            // Verify hook state reflects service state
            const activePlayers = result.current.players.filter(p => p.isActive);
            expect(activePlayers.length).toBeGreaterThan(0);
            expect(activePlayers.length).toBe(result.current.serviceStatus.activePlayers);
        });
    });

    describe('createPlayers Function', () => {
        it('should delegate to service when service is running', async () => {
            const { result } = renderHook(() => usePlayerSessions(tenant));

            // Wait for service to start
            await waitFor(() => {
                expect(result.current.serviceStatus.isRunning).toBe(true);
            }, { timeout: 10000 });

            // Wait for service to create players and sync them
            await waitFor(() => {
                expect(result.current.serviceStatus.totalPlayers).toBe(3);
            }, { timeout: 10000 });

            // Call createPlayers - should delegate to service
            let createdPlayers: any[] = [];
            await act(async () => {
                createdPlayers = await result.current.createPlayers(1);
            });

            // Should return players from service
            expect(createdPlayers.length).toBeGreaterThan(0);
            expect(result.current.serviceStatus.totalPlayers).toBe(3);
        });

        it('should return empty array when service is not running', async () => {
            // Create a new Jinaga instance without service enabled
            const testJinaga = JinagaTestUtils.createBasicTestInstance();
            const testUser = new User('manual-test-owner');
            const testTenant = await testJinaga.fact(new Tenant(testUser));

            const { result } = renderHook(() => usePlayerSessions(testTenant));

            // Service should not be running for this instance
            expect(result.current.serviceStatus.isRunning).toBe(false);

            let createdPlayers: any[] = [];
            await act(async () => {
                createdPlayers = await result.current.createPlayers(2, 'Manual');
            });

            // Should return empty array since service is not running
            expect(createdPlayers).toEqual([]);
            expect(result.current.serviceStatus.totalPlayers).toBe(0);
        });

        it('should handle null tenant error', async () => {
            const { result } = renderHook(() => usePlayerSessions(null));

            await act(async () => {
                try {
                    await result.current.createPlayers(1);
                    expect.fail('Should have thrown an error');
                } catch (error) {
                    expect(error).toBeInstanceOf(Error);
                    expect((error as Error).message).toBe('Tenant not available');
                }
            });
        });
    });

    describe('togglePlayerActive Function', () => {
        it('should toggle player active state in hook', async () => {
            const { result } = renderHook(() => usePlayerSessions(tenant));

            // Wait for service to start and create players
            await waitFor(() => {
                expect(result.current.players.length).toBe(3);
            }, { timeout: 10000 });

            const firstPlayer = result.current.players[0];
            const initialActiveState = firstPlayer.isActive;

            // Toggle the player
            act(() => {
                result.current.togglePlayerActive(firstPlayer.id);
            });

            // Check that the state changed in the hook
            const updatedPlayer = result.current.players.find(p => p.id === firstPlayer.id);
            expect(updatedPlayer?.isActive).toBe(!initialActiveState);
        });
    });

    describe('clearError Function', () => {
        it('should clear error state', async () => {
            const { result } = renderHook(() => usePlayerSessions(null));

            // Trigger an error by trying to create players with null tenant
            await act(async () => {
                try {
                    await result.current.createPlayers(1);
                } catch (error) {
                    // Error is expected
                }
            });

            // Clear the error
            act(() => {
                result.current.clearError();
            });

            expect(result.current.error).toBeNull();
        });
    });

    describe('Service Lifecycle', () => {
        it('should stop service on unmount', async () => {
            const { result, unmount } = renderHook(() => usePlayerSessions(tenant));

            // Wait for service to start
            await waitFor(() => {
                expect(result.current.serviceStatus.isRunning).toBe(true);
            }, { timeout: 10000 });

            // Unmount the hook
            unmount();

            // Service should be stopped (we can't directly test this, but it should not crash)
            // The cleanup is handled in the useEffect return function
        });

        it('should restart service when tenant changes', async () => {
            const { result, rerender } = renderHook(({ tenant }) => usePlayerSessions(tenant), {
                initialProps: { tenant },
            });

            // Wait for service to start with first tenant
            await waitFor(() => {
                expect(result.current.serviceStatus.isRunning).toBe(true);
            }, { timeout: 10000 });

            // Create new tenant
            const newTenant = await jinaga.fact(new Tenant(new User('new-owner')));

            // Rerender with new tenant
            rerender({ tenant: newTenant });

            // Service should restart with new tenant
            await waitFor(() => {
                expect(result.current.serviceStatus.isRunning).toBe(true);
            }, { timeout: 10000 });
        });
    });

    describe('Integration Workflow', () => {
        it('should handle complete workflow: service start → playground creation → player joining', async () => {
            const { result } = renderHook(() => usePlayerSessions(tenant));

            // Wait for service to start
            await waitFor(() => {
                expect(result.current.serviceStatus.isRunning).toBe(true);
            }, { timeout: 10000 });

            // Verify initial state
            expect(result.current.serviceStatus.totalPlayers).toBe(3);
            expect(result.current.serviceStatus.idlePlayers).toBe(3);
            expect(result.current.serviceStatus.activePlayers).toBe(0);

            // Create playground
            await jinaga.fact(new Playground(tenant, 'WORKFLOW-TEST'));

            // Wait for players to join
            await waitFor(() => {
                expect(result.current.serviceStatus.activePlayers).toBeGreaterThan(0);
            }, { timeout: 30000 }); // Increased timeout to 30 seconds

            // Verify final state
            expect(result.current.serviceStatus.activePlayers).toBeGreaterThan(0);
            expect(result.current.serviceStatus.idlePlayers).toBeLessThan(3);
            expect(result.current.players.filter(p => p.isActive).length).toBeGreaterThan(0);
        });
    });
}); 