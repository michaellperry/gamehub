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

describe('usePlayerSession', () => {
    describe('Hook Initialization and State', () => {
        it('should initialize with enabled state when tenant is provided', async () => {
            const { tenant } = await TestScenarios.singleUserWithTenant(
                new User('test-user-key')
            );

            const { result } = renderHook(() => usePlayerSession(tenant));

            expect(result.current.isEnabled).toBe(true);
            expect(typeof result.current.enableSimulation).toBe('function');
            expect(typeof result.current.disableSimulation).toBe('function');
        });

        it('should allow enabling and disabling simulation', async () => {
            const { tenant } = await TestScenarios.singleUserWithTenant(
                new User('test-user-key')
            );

            const { result } = renderHook(() => usePlayerSession(tenant));

            // Initially enabled
            expect(result.current.isEnabled).toBe(true);

            // Disable simulation
            act(() => {
                result.current.disableSimulation();
            });

            expect(result.current.isEnabled).toBe(false);

            // Enable simulation
            act(() => {
                result.current.enableSimulation();
            });

            expect(result.current.isEnabled).toBe(true);
        });
    });

    describe('Basic Functionality', () => {
        it('should handle tenant with playground creation', async () => {
            const { jinaga, tenant } = await TestScenarios.singleUserWithTenant(
                new User('test-user-key')
            );

            const { result } = renderHook(() => usePlayerSession(tenant));

            // Create a playground
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const _playground = await jinaga.fact(new Playground(tenant, 'TEST-PLAYGROUND'));

            // The hook should be functional without errors
            expect(result.current.isEnabled).toBe(true);
            expect(typeof result.current.enableSimulation).toBe('function');
            expect(typeof result.current.disableSimulation).toBe('function');
        });

        it('should handle simulation disabled state', async () => {
            const { jinaga, tenant } = await TestScenarios.singleUserWithTenant(
                new User('test-user-key')
            );

            const { result } = renderHook(() => usePlayerSession(tenant));

            // Disable simulation
            act(() => {
                result.current.disableSimulation();
            });

            expect(result.current.isEnabled).toBe(false);

            // Create a playground while disabled
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const _playground = await jinaga.fact(new Playground(tenant, 'DISABLED-TEST'));

            // Hook should remain functional
            expect(result.current.isEnabled).toBe(false);
        });
    });

    describe('Error Handling Scenarios', () => {
        it('should handle Jinaga connection errors gracefully', async () => {
            // Create a test instance that might have connection issues
            const _jinaga = JinagaTestUtils.createBasicTestInstance(new User('test-user-key'));
            const tenant = await _jinaga.fact(new Tenant(new User('test-user-key')));

            const { result } = renderHook(() => usePlayerSession(tenant));

            // The hook should not throw errors even if there are connection issues
            expect(result.current.isEnabled).toBe(true);
            expect(typeof result.current.enableSimulation).toBe('function');
            expect(typeof result.current.disableSimulation).toBe('function');
        });

        it('should handle null tenant gracefully', () => {
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const jinaga = JinagaTestUtils.createBasicTestInstance(new User('test-user-key'));

            const { result } = renderHook(() => usePlayerSession(null));

            // Should handle null tenant without errors
            expect(result.current.isEnabled).toBe(true);
            expect(typeof result.current.enableSimulation).toBe('function');
            expect(typeof result.current.disableSimulation).toBe('function');
        });
    });

    describe('Development Mode Behavior', () => {
        it('should be enabled by default in development mode', async () => {
            const { tenant } = await TestScenarios.singleUserWithTenant(
                new User('test-user-key')
            );

            const { result } = renderHook(() => usePlayerSession(tenant));

            // Should be enabled by default (mocked config has enabled: true)
            expect(result.current.isEnabled).toBe(true);
        });

        it('should allow manual enable/disable control', async () => {
            const { tenant } = await TestScenarios.singleUserWithTenant(
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
}); 