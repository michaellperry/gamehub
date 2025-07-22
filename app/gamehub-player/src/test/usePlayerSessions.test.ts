import { renderHook } from '@testing-library/react';
import { Tenant } from 'gamehub-model/model';
import { User } from 'jinaga';
import { act } from 'react';
import { beforeEach, describe, expect, it } from 'vitest';
import { usePlayerSessions } from '../hooks/usePlayerSession';
import { JinagaTestUtils } from './jinaga-test-utils';

describe('usePlayerSessions', () => {
    let tenant: Tenant;
    let owner: User;

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
    });

    describe('Hook Initialization', () => {
        it('should initialize with correct default state', () => {
            const { result } = renderHook(() => usePlayerSessions(tenant));

            expect(result.current.players).toEqual([]);
            expect(result.current.activePlayer).toBeNull();
            expect(result.current.isLoading).toBe(false);
            expect(result.current.error).toBeNull();
        });

        it('should handle null tenant', () => {
            const { result } = renderHook(() => usePlayerSessions(null));

            expect(result.current.players).toEqual([]);
            expect(result.current.activePlayer).toBeNull();
            expect(result.current.isLoading).toBe(false);
            expect(result.current.error).toBeNull();
        });
    });

    describe('createPlayers Function', () => {
        it('should create a single player', async () => {
            const { result } = renderHook(() => usePlayerSessions(tenant));

            let createdPlayers: any[] = [];
            await act(async () => {
                createdPlayers = await result.current.createPlayers(1);
            });

            expect(createdPlayers).toHaveLength(1);
            expect(createdPlayers[0].name).toBe('Player 1');
            expect(createdPlayers[0].isActive).toBe(false);
            expect(result.current.players).toHaveLength(1);
            expect(result.current.isLoading).toBe(false);
        });

        it('should create multiple players', async () => {
            const { result } = renderHook(() => usePlayerSessions(tenant));

            let createdPlayers: any[] = [];
            await act(async () => {
                createdPlayers = await result.current.createPlayers(3);
            });

            expect(createdPlayers).toHaveLength(3);
            expect(createdPlayers[0].name).toBe('Player 1');
            expect(createdPlayers[1].name).toBe('Player 2');
            expect(createdPlayers[2].name).toBe('Player 3');
            expect(result.current.players).toHaveLength(3);
            expect(result.current.isLoading).toBe(false);
        });

        it('should create players with custom prefix', async () => {
            const { result } = renderHook(() => usePlayerSessions(tenant));

            let createdPlayers: any[] = [];
            await act(async () => {
                createdPlayers = await result.current.createPlayers(2, 'Bot');
            });

            expect(createdPlayers).toHaveLength(2);
            expect(createdPlayers[0].name).toBe('Bot 1');
            expect(createdPlayers[1].name).toBe('Bot 2');
            expect(result.current.players).toHaveLength(2);
        });

        it('should return empty array for zero players', async () => {
            const { result } = renderHook(() => usePlayerSessions(tenant));

            let createdPlayers: any[] = [];
            await act(async () => {
                createdPlayers = await result.current.createPlayers(0);
            });

            expect(createdPlayers).toEqual([]);
            expect(result.current.players).toHaveLength(0);
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

    describe('activatePlayer Function', () => {
        it('should activate a valid player', async () => {
            const { result } = renderHook(() => usePlayerSessions(tenant));

            // Create a player first
            let createdPlayers: any[] = [];
            await act(async () => {
                createdPlayers = await result.current.createPlayers(1);
            });

            // Activate the player
            act(() => {
                result.current.activatePlayer(createdPlayers[0].id);
            });

            expect(result.current.activePlayer).toEqual(createdPlayers[0]);
            // Note: The isActive property in the players array is not updated by the hook
            // Only the activePlayer reference is updated
        });

        it('should handle activating non-existent player', async () => {
            const { result } = renderHook(() => usePlayerSessions(tenant));

            // Try to activate a non-existent player
            act(() => {
                result.current.activatePlayer('non-existent-id');
            });

            expect(result.current.activePlayer).toBeNull();
        });

        it('should only have one active player at a time', async () => {
            const { result } = renderHook(() => usePlayerSessions(tenant));

            // Create multiple players
            let createdPlayers: any[] = [];
            await act(async () => {
                createdPlayers = await result.current.createPlayers(3);
            });

            // Activate first player
            act(() => {
                result.current.activatePlayer(createdPlayers[0].id);
            });

            expect(result.current.activePlayer).toEqual(createdPlayers[0]);

            // Activate second player
            act(() => {
                result.current.activatePlayer(createdPlayers[1].id);
            });

            expect(result.current.activePlayer).toEqual(createdPlayers[1]);
            expect(result.current.activePlayer).not.toEqual(createdPlayers[0]);
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

    describe('State Management', () => {
        it('should maintain players state across operations', async () => {
            const { result } = renderHook(() => usePlayerSessions(tenant));

            // Create first batch of players
            await act(async () => {
                await result.current.createPlayers(2);
            });

            expect(result.current.players).toHaveLength(2);

            // Create second batch of players
            await act(async () => {
                await result.current.createPlayers(1, 'Bot');
            });

            expect(result.current.players).toHaveLength(3);
            expect(result.current.players[0].name).toBe('Player 1');
            expect(result.current.players[1].name).toBe('Player 2');
            expect(result.current.players[2].name).toBe('Bot 1');
        });
    });

    describe('Integration Workflow', () => {
        it('should handle complete workflow: create → activate → verify', async () => {
            const { result } = renderHook(() => usePlayerSessions(tenant));

            // Create players
            let createdPlayers: any[] = [];
            await act(async () => {
                createdPlayers = await result.current.createPlayers(2, 'Test');
            });

            expect(result.current.players).toHaveLength(2);
            expect(result.current.activePlayer).toBeNull();

            // Activate first player
            act(() => {
                result.current.activatePlayer(createdPlayers[0].id);
            });

            expect(result.current.activePlayer).toEqual(createdPlayers[0]);

            // Activate second player
            act(() => {
                result.current.activatePlayer(createdPlayers[1].id);
            });

            expect(result.current.activePlayer).toEqual(createdPlayers[1]);
        });
    });
}); 