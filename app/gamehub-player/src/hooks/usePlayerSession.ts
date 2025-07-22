import { useEffect, useState, useCallback } from 'react';
import { User } from 'jinaga';
import { Tenant, Playground, Player, PlayerName, Join, model } from 'gamehub-model/model';
import { playerSessionConfig } from '../config/background-service';
import { generateGamingName } from '../utils/gamingNames';
import { j } from '../jinaga-config';

export interface PlayerSessionViewModel {
    isEnabled: boolean;
    enableSimulation: () => void;
    disableSimulation: () => void;
}

/**
 * Create a simulated player for a playground
 */
async function createSimulatedPlayer(
    playground: Playground,
    tenant: Tenant,
    minDelay: number,
    maxDelay: number
): Promise<void> {
    try {
        // Generate random delay
        const delay = Math.floor(Math.random() * (maxDelay - minDelay + 1)) + minDelay;

        // Wait for the delay
        await new Promise(resolve => setTimeout(resolve, delay));

        // Create a unique user for the simulated player
        const userId = `simulated-user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const user = await j.fact(new User(userId));

        // Create a player associated with the tenant
        const player = await j.fact(new Player(user, tenant));

        // Generate a gaming name for the player
        const name = generateGamingName();
        await j.fact(new PlayerName(player, name, []));

        // Join the playground
        await j.fact(new Join(player, playground, new Date()));

        console.log(`Created simulated player "${name}" for playground ${playground.code}`);
    } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to create simulated player';
        console.error('Error creating simulated player:', errorMessage);
    }
}

/**
 * Player session hook that uses Jinaga's watch API
 * to automatically detect new playgrounds and create simulated players.
 */
export function usePlayerSession(tenant: Tenant | null): PlayerSessionViewModel {
    const [isEnabled, setIsEnabled] = useState(playerSessionConfig.enabled);

    const enableSimulation = useCallback(() => {
        setIsEnabled(true);
    }, []);

    const disableSimulation = useCallback(() => {
        setIsEnabled(false);
    }, []);

    // Watch for playgrounds and create simulated players
    useEffect(() => {
        if (!tenant || !isEnabled) {
            return;
        }

        // Create specification for playgrounds in tenant
        const playgroundSpec = model.given(Tenant).match((tenant) => Playground.in(tenant));

        // Create observer to watch for playgrounds
        const observer = j.watch(playgroundSpec, tenant, async (playground) => {
            console.log(`New playground detected: ${playground.code}`);

            // Create a simulated player for this playground
            await createSimulatedPlayer(
                playground,
                tenant,
                playerSessionConfig.minDelay,
                playerSessionConfig.maxDelay
            );
        });

        // Cleanup function to stop the observer
        return () => {
            observer.stop();
        };
    }, [tenant, isEnabled]);

    return {
        isEnabled,
        enableSimulation,
        disableSimulation,
    };
} 