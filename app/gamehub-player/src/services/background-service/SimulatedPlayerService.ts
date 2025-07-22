import { Jinaga, User } from 'jinaga';
import { Player, Playground, Join, Leave, Tenant, model } from 'gamehub-model/model';

export interface SimulatedPlayer {
    id: string;
    player: Player;
    state: 'idle' | 'joining' | 'playing' | 'leaving';
    currentPlayground?: Playground;
    joinAttempts: number;
    lastAction: Date;
    lastStateChange: Date;
}

export interface GameContext {
    availablePlaygrounds: Playground[];
    playerPool: SimulatedPlayer[];
    timeSinceLastAction: number;
    tenant: Tenant;
}

export type PlayerAction =
    | { type: 'JOIN_PLAYGROUND'; playground: Playground }
    | { type: 'LEAVE_PLAYGROUND' }
    | { type: 'WAIT'; duration: number }
    | { type: 'IDLE' };

export type PlayerBehavior = (player: SimulatedPlayer, context: GameContext) => Promise<PlayerAction>;

export interface SimulatedPlayerServiceConfig {
    enabled: boolean;
    playerCount: number;
    tickInterval: number; // How often to evaluate player behaviors
    maxJoinAttempts: number;
    maxPlayTime: number; // Maximum time a player stays in a playground
    minIdleTime: number; // Minimum time a player stays idle
}

export interface SimulatedPlayerServiceStatus {
    isRunning: boolean;
    totalPlayers: number;
    activePlayers: number;
    idlePlayers: number;
    joiningPlayers: number;
    leavingPlayers: number;
    availablePlaygrounds: number;
    tenant: string | null;
}

export class SimulatedPlayerService {
    private j: Jinaga;
    private config: SimulatedPlayerServiceConfig;
    private players: SimulatedPlayer[] = [];
    private behaviors: Map<string, PlayerBehavior> = new Map();
    private isRunning = false;
    private tickInterval?: NodeJS.Timeout;
    private tenant: Tenant | null = null;
    private playgroundObserver?: any;

    constructor(jinagaClient: Jinaga, config: SimulatedPlayerServiceConfig) {
        this.j = jinagaClient;
        this.config = config;
    }

    /**
     * Set the behavior function for a player
     */
    setPlayerBehavior(playerId: string, behavior: PlayerBehavior): void {
        this.behaviors.set(playerId, behavior);
    }

    /**
     * Set the default behavior for all players
     */
    setDefaultBehavior(behavior: PlayerBehavior): void {
        for (const player of this.players) {
            this.behaviors.set(player.id, behavior);
        }
    }

    /**
     * Start the actor-based background service
     */
    async start(tenant: Tenant): Promise<void> {
        if (this.isRunning) {
            console.log('Simulated player service is already running');
            return;
        }

        try {
            this.tenant = tenant;
            console.log('Starting simulated player service for tenant:', tenant);

            // Create simulated players
            await this.createSimulatedPlayers();

            // Set default behavior for all players
            this.setDefaultBehavior(this.defaultPlayerBehavior.bind(this));

            // Start playground monitoring
            await this.startPlaygroundMonitoring();

            // Start the tick loop
            this.startTickLoop();

            this.isRunning = true;
            console.log('Simulated player service started successfully');
        } catch (error) {
            console.error('Failed to start simulated player service:', error);
            throw error;
        }
    }

    /**
     * Stop the actor-based background service
     */
    async stop(): Promise<void> {
        if (!this.isRunning) {
            console.log('Simulated player service is not running');
            return;
        }

        try {
            console.log('Stopping simulated player service');

            // Stop the tick loop
            if (this.tickInterval) {
                clearInterval(this.tickInterval);
                this.tickInterval = undefined;
            }

            // Stop playground monitoring
            if (this.playgroundObserver) {
                this.playgroundObserver.stop();
                this.playgroundObserver = undefined;
            }

            // Leave all playgrounds
            await this.leaveAllPlaygrounds();

            this.isRunning = false;
            this.tenant = null;
            this.players = [];
            this.behaviors.clear();

            console.log('Simulated player service stopped successfully');
        } catch (error) {
            console.error('Error stopping simulated player service:', error);
            throw error;
        }
    }

    /**
     * Get the current status of the service
     */
    getStatus(): SimulatedPlayerServiceStatus {
        const activePlayers = this.players.filter(p => p.state === 'playing').length;
        const idlePlayers = this.players.filter(p => p.state === 'idle').length;
        const joiningPlayers = this.players.filter(p => p.state === 'joining').length;
        const leavingPlayers = this.players.filter(p => p.state === 'leaving').length;

        return {
            isRunning: this.isRunning,
            totalPlayers: this.players.length,
            activePlayers,
            idlePlayers,
            joiningPlayers,
            leavingPlayers,
            availablePlaygrounds: 0, // Will be updated asynchronously
            tenant: this.tenant?.type || null,
        };
    }

    /**
     * Get all simulated players
     */
    getPlayers(): SimulatedPlayer[] {
        return [...this.players];
    }

    /**
     * Get available playgrounds
     */
    async getAvailablePlaygrounds(): Promise<Playground[]> {
        if (!this.tenant) return [];

        try {
            const playgroundSpec = model.given(Tenant).match((tenant) =>
                Playground.in(tenant)
            );

            const playgrounds = await this.j.query(playgroundSpec, this.tenant);
            return playgrounds as Playground[];
        } catch (error) {
            console.error('Error getting available playgrounds:', error);
            return [];
        }
    }

    /**
     * Default player behavior - simple join/leave logic
     */
    private async defaultPlayerBehavior(player: SimulatedPlayer, context: GameContext): Promise<PlayerAction> {
        const now = new Date();
        const timeSinceLastAction = now.getTime() - player.lastAction.getTime();
        const timeSinceStateChange = now.getTime() - player.lastStateChange.getTime();

        // If player is idle and there are available playgrounds, try to join
        if (player.state === 'idle' && context.availablePlaygrounds.length > 0) {
            const playground = context.availablePlaygrounds[0];
            return { type: 'JOIN_PLAYGROUND', playground };
        }

        // If player has been playing too long, consider leaving
        if (player.state === 'playing' && timeSinceStateChange > this.config.maxPlayTime) {
            return { type: 'LEAVE_PLAYGROUND' };
        }

        // If player has been idle too long, wait a bit more
        if (player.state === 'idle' && timeSinceStateChange < this.config.minIdleTime) {
            return { type: 'WAIT', duration: 1000 };
        }

        // Otherwise wait a bit
        return { type: 'WAIT', duration: 2000 };
    }

    /**
     * Create simulated players
     */
    private async createSimulatedPlayers(): Promise<void> {
        if (!this.tenant) {
            throw new Error('Tenant not initialized');
        }

        console.log(`Creating ${this.config.playerCount} simulated players`);

        for (let i = 0; i < this.config.playerCount; i++) {
            try {
                const player = await this.createSimulatedPlayer(i + 1);
                this.players.push(player);
                console.log(`Created simulated player ${i + 1}: ${player.id}`);
            } catch (error) {
                console.error(`Failed to create simulated player ${i + 1}:`, error);
            }
        }

        console.log(`Simulated player service initialized with ${this.players.length} players`);
    }

    /**
 * Create a single simulated player
 */
    private async createSimulatedPlayer(index: number): Promise<SimulatedPlayer> {
        if (!this.tenant) {
            throw new Error('Tenant not initialized');
        }

        // Create a user for the simulated player
        const user = await this.j.fact(new User(`simulated-user-${index}`));

        // Create a simple player for simulation
        const player = await this.j.fact(new Player(user, this.tenant));

        return {
            id: `simulated-player-${index}`,
            player,
            state: 'idle',
            joinAttempts: 0,
            lastAction: new Date(),
            lastStateChange: new Date(),
        };
    }

    /**
     * Start playground monitoring
     */
    private async startPlaygroundMonitoring(): Promise<void> {
        if (!this.tenant) return;

        try {
            const playgroundSpec = model.given(Tenant).match((tenant) =>
                Playground.in(tenant)
            );

            this.playgroundObserver = this.j.watch(playgroundSpec, this.tenant, async (playground: Playground) => {
                console.log('New playground detected:', playground.code);
                // The tick loop will handle joining players to new playgrounds
            });
        } catch (error) {
            console.error('Error starting playground monitoring:', error);
        }
    }

    /**
     * Start the tick loop that evaluates player behaviors
     */
    private startTickLoop(): void {
        this.tickInterval = setInterval(async () => {
            await this.tick();
        }, this.config.tickInterval);
    }

    /**
     * Main tick function that evaluates all player behaviors
     */
    private async tick(): Promise<void> {
        if (!this.isRunning || !this.tenant) return;

        try {
            const context = await this.buildContext();

            for (const player of this.players) {
                await this.evaluatePlayerBehavior(player, context);
            }
        } catch (error) {
            console.error('Error in tick loop:', error);
        }
    }

    /**
     * Build the game context for behavior evaluation
     */
    private async buildContext(): Promise<GameContext> {
        const availablePlaygrounds = await this.getAvailablePlaygrounds();
        const now = new Date();

        return {
            availablePlaygrounds,
            playerPool: this.players,
            timeSinceLastAction: now.getTime(),
            tenant: this.tenant!,
        };
    }

    /**
     * Evaluate a single player's behavior
     */
    private async evaluatePlayerBehavior(player: SimulatedPlayer, context: GameContext): Promise<void> {
        const behavior = this.behaviors.get(player.id);
        if (!behavior) return;

        try {
            const action = await behavior(player, context);
            await this.executeAction(player, action);
        } catch (error) {
            console.error(`Error evaluating behavior for player ${player.id}:`, error);
        }
    }

    /**
     * Execute a player action
     */
    private async executeAction(player: SimulatedPlayer, action: PlayerAction): Promise<void> {
        const now = new Date();
        player.lastAction = now;

        switch (action.type) {
            case 'JOIN_PLAYGROUND':
                await this.joinPlayground(player, action.playground);
                break;
            case 'LEAVE_PLAYGROUND':
                await this.leavePlayground(player);
                break;
            case 'WAIT':
                // Wait is handled by the tick interval
                break;
            case 'IDLE':
                // No action needed
                break;
        }
    }

    /**
     * Join a player to a playground
     */
    private async joinPlayground(player: SimulatedPlayer, playground: Playground): Promise<void> {
        if (player.state !== 'idle') return;

        try {
            player.state = 'joining';
            player.lastStateChange = new Date();
            player.joinAttempts++;

            // Check if player is already in this playground
            const existingJoin = await this.checkExistingJoin(player.player, playground);
            if (existingJoin) {
                console.log(`Player ${player.id} already joined playground ${playground.code}`);
                player.state = 'playing';
                player.currentPlayground = playground;
                player.lastStateChange = new Date();
                return;
            }

            // Create join fact
            await this.j.fact(new Join(player.player, playground, new Date()));

            console.log(`Player ${player.id} joined playground ${playground.code}`);
            player.state = 'playing';
            player.currentPlayground = playground;
            player.lastStateChange = new Date();
            player.joinAttempts = 0;

        } catch (error) {
            console.error(`Failed to join player ${player.id} to playground ${playground.code}:`, error);
            player.state = 'idle';
            player.lastStateChange = new Date();
        }
    }

    /**
     * Leave a playground
     */
    private async leavePlayground(player: SimulatedPlayer): Promise<void> {
        if (player.state !== 'playing' || !player.currentPlayground) return;

        try {
            player.state = 'leaving';
            player.lastStateChange = new Date();

            // Find the join fact for this player in this playground
            const existingJoin = await this.checkExistingJoin(player.player, player.currentPlayground);
            if (existingJoin) {
                await this.j.fact(new Leave(existingJoin));
                console.log(`Player ${player.id} left playground ${player.currentPlayground.code}`);
            }

            player.state = 'idle';
            player.currentPlayground = undefined;
            player.lastStateChange = new Date();

        } catch (error) {
            console.error(`Error leaving playground for player ${player.id}:`, error);
            player.state = 'idle';
            player.lastStateChange = new Date();
        }
    }

    /**
     * Check if a player is already joined to a playground
     */
    private async checkExistingJoin(player: Player, playground: Playground): Promise<Join | null> {
        try {
            const playerJoinsSpec = model.given(Player, Playground).match((player, playground) =>
                Join.in(playground).join(join => join.player, player)
            );

            const existingJoins = await this.j.query(playerJoinsSpec, player, playground);
            return existingJoins.length > 0 ? existingJoins[0] : null;
        } catch (error) {
            console.error('Error checking existing join:', error);
            return null;
        }
    }

    /**
     * Leave all playgrounds (cleanup)
     */
    private async leaveAllPlaygrounds(): Promise<void> {
        for (const player of this.players) {
            if (player.state === 'playing' && player.currentPlayground) {
                await this.leavePlayground(player);
            }
        }
    }
} 