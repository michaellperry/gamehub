import { Jinaga } from 'jinaga';
import { Playground, Tenant, model } from 'gamehub-model/model';

export interface BackgroundServiceConfig {
    enabled: boolean;
    playerCount: number;
    joinDelay: number;
    retryAttempts: number;
    maxConcurrentJoins: number;
}

export interface PlaygroundObserver {
    cached(): Promise<boolean>;
    loaded(): Promise<void>;
    stop(): void;
}

export class PlaygroundMonitor {
    private j: Jinaga;

    constructor(jinagaClient: Jinaga, _config: BackgroundServiceConfig) {
        this.j = jinagaClient;
    }

    async start(
        tenant: Tenant,
        onNewPlayground: (playground: Playground) => Promise<void>
    ): Promise<PlaygroundObserver> {
        console.log('Starting playground monitor for tenant:', tenant);

        // Create specification to watch for new playgrounds in the tenant
        const playgroundSpec = model.given(Tenant).match((tenant) =>
            Playground.in(tenant)
        );

        // Use Jinaga's watch functionality to monitor for new playgrounds
        const observer = this.j.watch(playgroundSpec, tenant, async (playground: Playground) => {
            try {
                console.log('New playground detected:', playground.code);
                await onNewPlayground(playground);
            } catch (error) {
                console.error('Error handling new playground:', error);
            }
        });

        return {
            cached: () => observer.cached(),
            loaded: () => observer.loaded(),
            stop: () => {
                console.log('Stopping playground monitor');
                observer.stop();
            }
        };
    }
} 