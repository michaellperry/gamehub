import { Jinaga } from 'jinaga';
import { Player, Playground, Join, Leave, Tenant, model } from 'gamehub-model/model';

export interface BackgroundServiceConfig {
    enabled: boolean;
    playerCount: number;
    joinDelay: number;
    retryAttempts: number;
    maxConcurrentJoins: number;
}

export interface JoinAttempt {
    player: Player;
    playground: Playground;
    attemptTime: Date;
    status: 'pending' | 'success' | 'failed';
    retryCount: number;
    error?: string;
}

export interface JoinCoordinatorStatus {
    totalAttempts: number;
    successfulJoins: number;
    failedJoins: number;
    pendingJoins: number;
    activeJoins: Map<string, JoinAttempt>; // playground code -> join attempt
}

export class AutoJoinCoordinator {
    private j: Jinaga;
    private config: BackgroundServiceConfig;
    private joinAttempts: Map<string, JoinAttempt> = new Map(); // player hash -> join attempt
    private activeJoins: Map<string, JoinAttempt> = new Map(); // playground code -> join attempt
    private joinHistory: JoinAttempt[] = [];
    private tenant: Tenant | null = null;

    constructor(jinagaClient: Jinaga, config: BackgroundServiceConfig) {
        this.j = jinagaClient;
        this.config = config;
    }

    /**
     * Initialize the coordinator with a tenant
     */
    async initialize(tenant: Tenant): Promise<void> {
        this.tenant = tenant;
        console.log('AutoJoinCoordinator initialized for tenant:', tenant);
    }

    /**
     * Coordinate player joins to a new playground with timing and conflict resolution
     */
    async coordinateJoins(
        players: Player[],
        playground: Playground,
        onJoinSuccess?: (player: Player, playground: Playground) => void,
        onJoinFailure?: (player: Player, playground: Playground, error: string) => void
    ): Promise<void> {
        if (!this.tenant) {
            throw new Error('AutoJoinCoordinator not initialized');
        }

        console.log(`Coordinating joins for playground ${playground.code} with ${players.length} players`);

        // Check if we're already coordinating joins for this playground
        if (this.activeJoins.has(playground.code)) {
            console.log(`Already coordinating joins for playground ${playground.code}`);
            return;
        }

        // Mark this playground as being coordinated
        this.activeJoins.set(playground.code, {
            player: players[0],
            playground,
            attemptTime: new Date(),
            status: 'pending',
            retryCount: 0
        });

        // Sequential joins with delays to avoid conflicts
        for (let i = 0; i < players.length; i++) {
            const player = players[i];
            const delay = i * this.config.joinDelay;

            setTimeout(async () => {
                await this.attemptJoin(player, playground, onJoinSuccess, onJoinFailure);
            }, delay);
        }
    }

    /**
     * Attempt to join a player to a playground with retry logic
     */
    private async attemptJoin(
        player: Player,
        playground: Playground,
        onJoinSuccess?: (player: Player, playground: Playground) => void,
        onJoinFailure?: (player: Player, playground: Playground, error: string) => void
    ): Promise<void> {
        const playerHash = this.j.hash(player);
        const joinAttempt: JoinAttempt = {
            player,
            playground,
            attemptTime: new Date(),
            status: 'pending',
            retryCount: 0
        };

        this.joinAttempts.set(playerHash, joinAttempt);
        this.activeJoins.set(playground.code, joinAttempt);

        try {
            console.log(`Attempting to join player ${playerHash} to playground ${playground.code}`);

            // Check if player is already in this playground
            const existingJoin = await this.checkExistingJoin(player, playground);
            if (existingJoin) {
                console.log(`Player ${playerHash} already joined playground ${playground.code}`);
                joinAttempt.status = 'success';
                this.recordJoinAttempt(joinAttempt);
                onJoinSuccess?.(player, playground);
                return;
            }

            // Create join fact
            await this.j.fact(new Join(player, playground, new Date()));

            console.log(`Player ${playerHash} successfully joined playground ${playground.code}`);
            joinAttempt.status = 'success';
            this.recordJoinAttempt(joinAttempt);
            onJoinSuccess?.(player, playground);

        } catch (error) {
            console.error(`Failed to join player ${playerHash} to playground ${playground.code}:`, error);

            // Retry logic
            if (joinAttempt.retryCount < this.config.retryAttempts) {
                joinAttempt.retryCount++;
                joinAttempt.status = 'pending';
                joinAttempt.error = error instanceof Error ? error.message : String(error);

                console.log(`Retrying join attempt ${joinAttempt.retryCount}/${this.config.retryAttempts} for player ${playerHash}`);

                setTimeout(async () => {
                    await this.attemptJoin(player, playground, onJoinSuccess, onJoinFailure);
                }, this.config.joinDelay);
            } else {
                joinAttempt.status = 'failed';
                joinAttempt.error = error instanceof Error ? error.message : String(error);
                this.recordJoinAttempt(joinAttempt);
                onJoinFailure?.(player, playground, joinAttempt.error);
            }
        } finally {
            // Only remove from active joins if this was the coordinating attempt
            if (this.activeJoins.get(playground.code)?.player === player) {
                this.activeJoins.delete(playground.code);
            }
        }
    }

    /**
     * Check if a player is already joined to a playground
     */
    private async checkExistingJoin(player: Player, playground: Playground): Promise<Join | null> {
        try {
            // Create specification to find joins for this player in this playground
            const playerJoinsSpec = model.given(Player, Playground).match((player, playground) =>
                Join.in(playground).join(join => join.player, player)
            );

            // Query for existing join facts for this player in this playground
            const existingJoins = await this.j.query(playerJoinsSpec, player, playground);
            return existingJoins.length > 0 ? existingJoins[0] : null;
        } catch (error) {
            console.error('Error checking existing join:', error);
            return null;
        }
    }

    /**
 * Leave a playground (create Leave fact)
 */
    async leavePlayground(player: Player, playground: Playground): Promise<void> {
        try {
            // Create specification to find joins for this player in this playground
            const playerJoinsSpec = model.given(Player, Playground).match((player, playground) =>
                Join.in(playground).join(join => join.player, player)
            );

            // Find the join fact for this player in this playground
            const existingJoins = await this.j.query(playerJoinsSpec, player, playground);

            if (existingJoins.length === 0) {
                console.log(`Player ${this.j.hash(player)} not found in playground ${playground.code}`);
                return;
            }

            const join = existingJoins[0] as Join;

            // Create leave fact
            await this.j.fact(new Leave(join));

            console.log(`Player ${this.j.hash(player)} left playground ${playground.code}`);

            // Clean up tracking
            const playerHash = this.j.hash(player);
            this.joinAttempts.delete(playerHash);

        } catch (error) {
            console.error(`Error leaving playground:`, error);
            throw error;
        }
    }

    /**
     * Get players currently in a playground
     */
    async getPlayersInPlayground(playground: Playground): Promise<Player[]> {
        try {
            // Create specification to find all joins in this playground
            const playgroundJoinsSpec = model.given(Playground).match((playground) =>
                Join.in(playground)
            );

            const joins = await this.j.query(playgroundJoinsSpec, playground);
            return joins.map(join => (join as Join).player);
        } catch (error) {
            console.error('Error getting players in playground:', error);
            return [];
        }
    }

    /**
     * Get join history for a player
     */
    getPlayerJoinHistory(player: Player): JoinAttempt[] {
        const playerHash = this.j.hash(player);
        return this.joinHistory.filter(attempt => this.j.hash(attempt.player) === playerHash);
    }

    /**
     * Get join history for a playground
     */
    getPlaygroundJoinHistory(playground: Playground): JoinAttempt[] {
        return this.joinHistory.filter(attempt => attempt.playground.code === playground.code);
    }

    /**
     * Get coordinator status
     */
    getStatus(): JoinCoordinatorStatus {
        const totalAttempts = this.joinHistory.length;
        const successfulJoins = this.joinHistory.filter(attempt => attempt.status === 'success').length;
        const failedJoins = this.joinHistory.filter(attempt => attempt.status === 'failed').length;
        // Count only truly pending attempts (not completed ones)
        const pendingJoins = Array.from(this.joinAttempts.values()).filter(attempt => attempt.status === 'pending').length;

        return {
            totalAttempts,
            successfulJoins,
            failedJoins,
            pendingJoins,
            activeJoins: new Map(this.activeJoins)
        };
    }

    /**
     * Clean up coordinator state
     */
    async cleanup(): Promise<void> {
        console.log('Cleaning up AutoJoinCoordinator');
        this.joinAttempts.clear();
        this.activeJoins.clear();
        this.joinHistory = [];
        this.tenant = null;
    }

    /**
     * Record a join attempt in history
     */
    private recordJoinAttempt(attempt: JoinAttempt): void {
        this.joinHistory.push(attempt);

        // Keep only last 100 attempts to prevent memory leaks
        if (this.joinHistory.length > 100) {
            this.joinHistory = this.joinHistory.slice(-100);
        }
    }
} 