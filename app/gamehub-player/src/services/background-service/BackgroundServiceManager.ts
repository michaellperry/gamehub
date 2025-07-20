import { Jinaga } from 'jinaga';
import { Observer } from 'jinaga/src/observer/observer';
import { Playground, Player, Tenant, Join } from 'gamehub-model/model';
import { PlaygroundMonitor } from './PlaygroundMonitor';
import { PlayerPoolManager } from './PlayerPoolManager';

export interface BackgroundServiceConfig {
    enabled: boolean;
    playerCount: number;
    joinDelay: number;
    retryAttempts: number;
    maxConcurrentJoins: number;
}

export class BackgroundServiceManager {
    private observers: Observer<any>[] = [];
    private isRunning = false;
    private j: Jinaga;
    private config: BackgroundServiceConfig;
    private playgroundMonitor: PlaygroundMonitor;
    private playerPoolManager: PlayerPoolManager;
    private tenant: Tenant | null = null;

    constructor(jinagaClient: Jinaga, config: BackgroundServiceConfig) {
        this.j = jinagaClient;
        this.config = config;
        this.playgroundMonitor = new PlaygroundMonitor(jinagaClient, config);
        this.playerPoolManager = new PlayerPoolManager(jinagaClient, config);
    }

    async start(tenant: Tenant): Promise<void> {
        if (this.isRunning) {
            console.log('Background service is already running');
            return;
        }

        try {
            this.tenant = tenant;
            console.log('Starting background service for tenant:', tenant);

            // Initialize player pool
            await this.playerPoolManager.initialize(tenant);

            // Start playground monitoring
            const playgroundObserver = await this.playgroundMonitor.start(tenant, async (playground: Playground) => {
                await this.handleNewPlayground(playground);
            });

            this.observers.push(playgroundObserver);
            this.isRunning = true;

            console.log('Background service started successfully');
        } catch (error) {
            console.error('Failed to start background service:', error);
            throw error;
        }
    }

    async stop(): Promise<void> {
        if (!this.isRunning) {
            console.log('Background service is not running');
            return;
        }

        try {
            console.log('Stopping background service');

            // Stop all observers
            this.observers.forEach(observer => observer.stop());
            this.observers = [];

            // Clean up player pool
            await this.playerPoolManager.cleanup();

            this.isRunning = false;
            this.tenant = null;

            console.log('Background service stopped successfully');
        } catch (error) {
            console.error('Error stopping background service:', error);
            throw error;
        }
    }

    isServiceRunning(): boolean {
        return this.isRunning;
    }

    getServiceStatus(): {
        isRunning: boolean;
        playerCount: number;
        activePlayers: number;
        tenant: string | null;
    } {
        return {
            isRunning: this.isRunning,
            playerCount: this.config.playerCount,
            activePlayers: this.playerPoolManager.getActivePlayerCount(),
            tenant: this.tenant?.type || null,
        };
    }

    private async handleNewPlayground(playground: Playground): Promise<void> {
        try {
            console.log('New playground detected:', playground.code);

            // Get available players from the pool
            const availablePlayers = await this.playerPoolManager.getAvailablePlayers();

            if (availablePlayers.length === 0) {
                console.log('No available players in pool');
                return;
            }

            // Join players to the playground with delays
            for (let i = 0; i < Math.min(availablePlayers.length, this.config.maxConcurrentJoins); i++) {
                const player = availablePlayers[i];
                const delay = i * this.config.joinDelay;

                setTimeout(async () => {
                    try {
                        await this.joinPlayerToPlayground(player, playground);
                    } catch (error) {
                        console.error(`Failed to join player ${player.type} to playground ${playground.code}:`, error);
                    }
                }, delay);
            }
        } catch (error) {
            console.error('Error handling new playground:', error);
        }
    }

    private async joinPlayerToPlayground(player: Player, playground: Playground): Promise<void> {
        try {
            // Create join fact
            await this.j.fact(new Join(player, playground, new Date()));

            console.log(`Player ${player.type} joined playground ${playground.code}`);

            // Mark player as active in this playground
            await this.playerPoolManager.markPlayerActive(player, playground);
        } catch (error) {
            console.error(`Error joining player to playground:`, error);
            throw error;
        }
    }
} 