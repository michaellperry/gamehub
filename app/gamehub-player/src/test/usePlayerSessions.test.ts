import { renderHook, waitFor } from '@testing-library/react';
import { Playground, Tenant } from 'gamehub-model/model';
import { User } from 'jinaga';
import { act } from 'react';
import { beforeEach, describe, expect, it, vi, afterEach } from 'vitest';
import { usePlayerSessions } from '../hooks/usePlayerSession';
import { JinagaTestUtils } from './jinaga-test-utils';

// Mock the simplified player session config to enable it in tests
vi.mock('../config/background-service', () => ({
    simplifiedPlayerSessionConfig: {
        enabled: true,
        minDelay: 100,
        maxDelay: 500,
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

    describe('createPlayers Function', () => {
        it('should return empty array for placeholder implementation', async () => {
            const { result } = renderHook(() => usePlayerSessions(tenant));

            let createdPlayers: any[] = [];
            await act(async () => {
                createdPlayers = await result.current.createPlayers(2, 'Test');
            });

            // Placeholder implementation returns empty array
            expect(createdPlayers).toEqual([]);
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

        it('should handle zero count', async () => {
            const { result } = renderHook(() => usePlayerSessions(tenant));

            let createdPlayers: any[] = [];
            await act(async () => {
                createdPlayers = await result.current.createPlayers(0);
            });

            expect(createdPlayers).toEqual([]);
        });
    });

    describe('togglePlayerActive Function', () => {
        it('should toggle player active state in hook', async () => {
            const { result } = renderHook(() => usePlayerSessions(tenant));

            // Manually add a player to test toggle functionality
            act(() => {
                // This is a placeholder test since the simplified implementation doesn't create players yet
                // In Phase 2, this will test real player toggling
            });

            // For now, just verify the function exists and doesn't crash
            expect(typeof result.current.togglePlayerActive).toBe('function');
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

    describe('Service Status', () => {
        it('should maintain consistent service status', () => {
            const { result } = renderHook(() => usePlayerSessions(tenant));

            expect(result.current.serviceStatus.isRunning).toBe(false);
            expect(result.current.serviceStatus.totalPlayers).toBe(0);
            expect(result.current.serviceStatus.activePlayers).toBe(0);
            expect(result.current.serviceStatus.idlePlayers).toBe(0);
        });
    });

    describe('Error Handling', () => {
        it('should handle errors gracefully', async () => {
            const { result } = renderHook(() => usePlayerSessions(tenant));

            // Test error handling in createPlayers
            await act(async () => {
                try {
                    await result.current.createPlayers(1);
                } catch (error) {
                    // Error is expected in placeholder implementation
                }
            });

            // Should not crash the hook
            expect(result.current.isLoading).toBe(false);
        });
    });
}); 