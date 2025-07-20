import { Jinaga, User } from 'jinaga';
import { Player, PlayerName, Tenant, Playground } from 'gamehub-model/model';

export interface BackgroundServiceConfig {
    enabled: boolean;
    playerCount: number;
    joinDelay: number;
    retryAttempts: number;
    maxConcurrentJoins: number;
}

export interface PlayerPoolStatus {
    totalPlayers: number;
    activePlayers: number;
    availablePlayers: number;
    players: Player[];
}

export class PlayerPoolManager {
    private j: Jinaga;
    private config: BackgroundServiceConfig;
    private players: Player[] = [];
    private activePlayers: Map<string, Playground> = new Map(); // player hash -> playground
    private tenant: Tenant | null = null;

    constructor(jinagaClient: Jinaga, config: BackgroundServiceConfig) {
        this.j = jinagaClient;
        this.config = config;
    }

    async initialize(tenant: Tenant): Promise<void> {
        this.tenant = tenant;
        console.log('Initializing player pool for tenant:', tenant);

        // Create background players if they don't exist
        await this.createBackgroundPlayers();
    }

    async cleanup(): Promise<void> {
        console.log('Cleaning up player pool');
        this.players = [];
        this.activePlayers.clear();
        this.tenant = null;
    }

    getActivePlayerCount(): number {
        return this.activePlayers.size;
    }

    async getAvailablePlayers(): Promise<Player[]> {
        return this.players.filter(player => {
            const playerHash = this.j.hash(player);
            return !this.activePlayers.has(playerHash);
        });
    }

    async markPlayerActive(player: Player, playground: Playground): Promise<void> {
        const playerHash = this.j.hash(player);
        this.activePlayers.set(playerHash, playground);
        console.log(`Player ${playerHash} marked as active in playground ${playground.code}`);
    }

    async markPlayerInactive(player: Player): Promise<void> {
        const playerHash = this.j.hash(player);
        this.activePlayers.delete(playerHash);
        console.log(`Player ${playerHash} marked as inactive`);
    }

    getStatus(): PlayerPoolStatus {
        const totalPlayers = this.players.length;
        const activePlayers = this.activePlayers.size;
        const availablePlayers = totalPlayers - activePlayers;

        return {
            totalPlayers,
            activePlayers,
            availablePlayers,
            players: [...this.players]
        };
    }

    private async createBackgroundPlayers(): Promise<void> {
        if (!this.tenant) {
            throw new Error('Tenant not initialized');
        }

        console.log(`Creating ${this.config.playerCount} background players`);

        for (let i = 0; i < this.config.playerCount; i++) {
            try {
                const player = await this.createBackgroundPlayer(i + 1);
                this.players.push(player);
                console.log(`Created background player ${i + 1}: ${this.j.hash(player)}`);
            } catch (error) {
                console.error(`Failed to create background player ${i + 1}:`, error);
            }
        }

        console.log(`Player pool initialized with ${this.players.length} players`);
    }

    private async createBackgroundPlayer(index: number): Promise<Player> {
        if (!this.tenant) {
            throw new Error('Tenant not initialized');
        }

        // Create background user account
        const userName = `Background Player ${index}`;
        const user = await this.j.fact(new User(userName));

        // Create player linked to the user
        const player = await this.j.fact(new Player(user, this.tenant));

        // Create player name
        await this.j.fact(new PlayerName(player, userName, []));

        return player;
    }
} 