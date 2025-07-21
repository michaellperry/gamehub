import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { JinagaTestUtils } from './jinaga-test-utils';
import { BackgroundServiceManager, BackgroundServiceConfig } from '../services/background-service/BackgroundServiceManager';
import { Tenant } from 'gamehub-model/model';
import { User } from 'jinaga';

// Mock the dependencies that don't exist yet
vi.mock('../services/background-service/PlaygroundMonitor');
vi.mock('../services/background-service/PlayerPoolManager');

describe('BackgroundServiceManager', () => {
    let manager: BackgroundServiceManager;
    let jinaga: any;
    let config: BackgroundServiceConfig;
    let mockTenant: Tenant;

    beforeEach(async () => {
        // Reset all mocks
        vi.clearAllMocks();

        // Create Jinaga test instance
        jinaga = JinagaTestUtils.createBasicTestInstance(new User('test-user-key'));

        // Create test configuration
        config = {
            enabled: true,
            playerCount: 5,
            joinDelay: 1000,
            retryAttempts: 3,
            maxConcurrentJoins: 2,
        };

        // Create mock tenant
        const user = new User('test-user-key');
        mockTenant = await jinaga.fact(new Tenant(user));

        // Create manager instance
        manager = new BackgroundServiceManager(jinaga, config);
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    describe('constructor', () => {
        it('should initialize with provided configuration', () => {
            expect(manager).toBeInstanceOf(BackgroundServiceManager);
            expect(manager.isServiceRunning()).toBe(false);
        });
    });

    describe('start', () => {
        it('should start the service successfully', async () => {
            // Mock the internal methods
            const mockPlaygroundMonitor = {
                start: vi.fn().mockResolvedValue({ stop: vi.fn() }),
            };

            const mockPlayerPoolManager = {
                initialize: vi.fn().mockResolvedValue(undefined),
            };

            // Replace the internal instances with mocks
            (manager as any).playgroundMonitor = mockPlaygroundMonitor;
            (manager as any).playerPoolManager = mockPlayerPoolManager;

            await manager.start(mockTenant);

            expect(manager.isServiceRunning()).toBe(true);
            expect(mockPlayerPoolManager.initialize).toHaveBeenCalledWith(mockTenant);
            expect(mockPlaygroundMonitor.start).toHaveBeenCalled();
        });

        it('should not start if already running', async () => {
            // Start the service first
            const mockPlaygroundMonitor = {
                start: vi.fn().mockResolvedValue({ stop: vi.fn() }),
            };
            const mockPlayerPoolManager = {
                initialize: vi.fn().mockResolvedValue(undefined),
            };
            (manager as any).playgroundMonitor = mockPlaygroundMonitor;
            (manager as any).playerPoolManager = mockPlayerPoolManager;

            await manager.start(mockTenant);

            // Try to start again
            const consoleSpy = vi.spyOn(console, 'log');
            await manager.start(mockTenant);

            expect(consoleSpy).toHaveBeenCalledWith('Background service is already running');
        });
    });

    describe('stop', () => {
        it('should stop the service successfully', async () => {
            // Start the service first
            const mockObserver = { stop: vi.fn() };
            const mockPlaygroundMonitor = {
                start: vi.fn().mockResolvedValue(mockObserver),
            };
            const mockPlayerPoolManager = {
                initialize: vi.fn().mockResolvedValue(undefined),
                cleanup: vi.fn().mockResolvedValue(undefined),
            };
            (manager as any).playgroundMonitor = mockPlaygroundMonitor;
            (manager as any).playerPoolManager = mockPlayerPoolManager;

            await manager.start(mockTenant);
            await manager.stop();

            expect(manager.isServiceRunning()).toBe(false);
            expect(mockObserver.stop).toHaveBeenCalled();
            expect(mockPlayerPoolManager.cleanup).toHaveBeenCalled();
        });

        it('should not stop if not running', async () => {
            const consoleSpy = vi.spyOn(console, 'log');
            await manager.stop();

            expect(consoleSpy).toHaveBeenCalledWith('Background service is not running');
        });
    });

    describe('getServiceStatus', () => {
        it('should return correct status when not running', () => {
            // Mock the playerPoolManager.getActivePlayerCount method
            const mockPlayerPoolManager = {
                getActivePlayerCount: vi.fn().mockReturnValue(0),
            };
            (manager as any).playerPoolManager = mockPlayerPoolManager;

            const status = manager.getServiceStatus();

            expect(status).toEqual({
                isRunning: false,
                playerCount: 5,
                activePlayers: 0,
                tenant: null,
            });
        });

        it('should return correct status when running', async () => {
            const mockObserver = { stop: vi.fn() };
            const mockPlaygroundMonitor = {
                start: vi.fn().mockResolvedValue(mockObserver),
            };
            const mockPlayerPoolManager = {
                initialize: vi.fn().mockResolvedValue(undefined),
                getActivePlayerCount: vi.fn().mockReturnValue(3),
            };
            (manager as any).playgroundMonitor = mockPlaygroundMonitor;
            (manager as any).playerPoolManager = mockPlayerPoolManager;

            await manager.start(mockTenant);
            const status = manager.getServiceStatus();

            expect(status).toEqual({
                isRunning: true,
                playerCount: 5,
                activePlayers: 3,
                tenant: 'GameHub.Tenant',
            });
        });
    });
}); 