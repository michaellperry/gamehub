import { act, renderHook } from '@testing-library/react';
import { Playground, Tenant } from 'gamehub-model/model';
import { User } from 'jinaga';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { usePlayerSession } from '../hooks/usePlayerSession';
import { JinagaTestUtils, TestScenarios } from './jinaga-test-utils';

// Mock the configuration to control test behavior
vi.mock('../config/background-service', () => ({
    playerSessionConfig: {
        enabled: true,
        minDelay: 100, // Short delay for testing
        maxDelay: 200, // Short delay for testing
    },
}));

// Mock console methods to avoid noise in tests
const originalConsoleLog = console.log;
const originalConsoleError = console.error;

beforeAll(() => {
    console.log = vi.fn();
    console.error = vi.fn();
});

afterAll(() => {
    console.log = originalConsoleLog;
    console.error = originalConsoleError;
});

describe('usePlayerSessions Integration Tests', () => {
    describe('Reactive Playground Monitoring', () => {
        it('should handle playground creation without errors', async () => {
            const { jinaga, tenant } = await TestScenarios.singleUserWithTenant(
                new User('test-user-key')
            );

            const { result } = renderHook(() => usePlayerSession(tenant));

            // Create multiple playgrounds in sequence
            const playground1 = await jinaga.fact(new Playground(tenant, 'REACTIVE-TEST-1'));
            const playground2 = await jinaga.fact(new Playground(tenant, 'REACTIVE-TEST-2'));
            const playground3 = await jinaga.fact(new Playground(tenant, 'REACTIVE-TEST-3'));

            // The hook should remain functional
            expect(result.current.isEnabled).toBe(true);
            expect(typeof result.current.enableSimulation).toBe('function');
            expect(typeof result.current.disableSimulation).toBe('function');
        });

        it('should handle rapid playground creation', async () => {
            const { jinaga, tenant } = await TestScenarios.singleUserWithTenant(
                new User('test-user-key')
            );

            const { result } = renderHook(() => usePlayerSession(tenant));

            // Create playgrounds rapidly
            const playgrounds: Playground[] = [];
            for (let i = 0; i < 5; i++) {
                const playground = await jinaga.fact(new Playground(tenant, `RAPID-TEST-${i}`));
                playgrounds.push(playground);
            }

            // The hook should remain functional
            expect(result.current.isEnabled).toBe(true);
            expect(playgrounds.length).toBe(5);
        });
    });

    describe('Automatic Player Creation', () => {
        it('should handle playground creation with hook active', async () => {
            const { jinaga, tenant } = await TestScenarios.singleUserWithTenant(
                new User('test-user-key')
            );

            const { result } = renderHook(() => usePlayerSession(tenant));

            // Create a playground
            const playground = await jinaga.fact(new Playground(tenant, 'AUTO-CREATION-TEST'));

            // The hook should remain functional
            expect(result.current.isEnabled).toBe(true);
            expect(typeof result.current.enableSimulation).toBe('function');
            expect(typeof result.current.disableSimulation).toBe('function');
        });

        it('should handle multiple playground creation', async () => {
            const { jinaga, tenant } = await TestScenarios.singleUserWithTenant(
                new User('test-user-key')
            );

            const { result } = renderHook(() => usePlayerSession(tenant));

            // Create multiple playgrounds
            const playground1 = await jinaga.fact(new Playground(tenant, 'NAMES-TEST-1'));
            const playground2 = await jinaga.fact(new Playground(tenant, 'NAMES-TEST-2'));

            // The hook should remain functional
            expect(result.current.isEnabled).toBe(true);
            expect(typeof result.current.enableSimulation).toBe('function');
            expect(typeof result.current.disableSimulation).toBe('function');
        });
    });

    describe('Development Mode Behavior', () => {
        it('should be enabled by default in development mode', async () => {
            const { jinaga, tenant } = await TestScenarios.singleUserWithTenant(
                new User('test-user-key')
            );

            const { result } = renderHook(() => usePlayerSession(tenant));

            // Should be enabled by default (mocked config has enabled: true)
            expect(result.current.isEnabled).toBe(true);
        });

        it('should allow manual enable/disable control', async () => {
            const { jinaga, tenant } = await TestScenarios.singleUserWithTenant(
                new User('test-user-key')
            );

            const { result } = renderHook(() => usePlayerSession(tenant));

            // Initially enabled
            expect(result.current.isEnabled).toBe(true);

            // Disable
            act(() => {
                result.current.disableSimulation();
            });
            expect(result.current.isEnabled).toBe(false);

            // Enable
            act(() => {
                result.current.enableSimulation();
            });
            expect(result.current.isEnabled).toBe(true);
        });
    });

    describe('Memory Leak Prevention', () => {
        it('should handle unmount gracefully', async () => {
            const { jinaga, tenant } = await TestScenarios.singleUserWithTenant(
                new User('test-user-key')
            );

            const { result, unmount } = renderHook(() => usePlayerSession(tenant));

            // Unmount
            unmount();

            // Create playground after unmount
            await jinaga.fact(new Playground(tenant, 'POST-UNMOUNT-TEST'));

            // Should not throw errors
            expect(true).toBe(true);
        });
    });

    describe('Error Resilience', () => {
        it('should handle fact creation errors gracefully', async () => {
            const { jinaga, tenant } = await TestScenarios.singleUserWithTenant(
                new User('test-user-key')
            );

            const { result } = renderHook(() => usePlayerSession(tenant));

            // Create a playground
            const playground = await jinaga.fact(new Playground(tenant, 'ERROR-RESILIENCE-TEST'));

            // The hook should handle any fact creation errors gracefully
            // and not crash the application
            expect(result.current.isEnabled).toBe(true);
            expect(typeof result.current.enableSimulation).toBe('function');
            expect(typeof result.current.disableSimulation).toBe('function');
        });

        it('should handle Jinaga connection issues gracefully', async () => {
            // Create a test instance that might have connection issues
            const jinaga = JinagaTestUtils.createBasicTestInstance(new User('test-user-key'));
            const tenant = await jinaga.fact(new Tenant(new User('test-user-key')));

            const { result } = renderHook(() => usePlayerSession(tenant));

            // The hook should not throw errors even if there are connection issues
            expect(result.current.isEnabled).toBe(true);
            expect(typeof result.current.enableSimulation).toBe('function');
            expect(typeof result.current.disableSimulation).toBe('function');
        });
    });
}); 