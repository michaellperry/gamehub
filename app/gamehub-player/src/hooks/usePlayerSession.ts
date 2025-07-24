import { useEffect, useState, useCallback } from 'react';
import { User } from 'jinaga';
import { Tenant, Playground, Player, PlayerName, Join, Challenge, model } from 'gamehub-model/model';
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
        const userId = `simulated-user-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
        const user = await j.fact(new User(userId));

        // Create a player associated with the tenant
        const player = await j.fact(new Player(user, tenant));

        // Generate a gaming name for the player
        const name = generateGamingName();
        await j.fact(new PlayerName(player, name, []));

        // Join the playground
        const playerJoin = await j.fact(new Join(player, playground, new Date()));

        console.log(`Created simulated player "${name}" for playground ${playground.code}`);

        // Start a timer to create a challenge after a random delay
        setTimeout(async () => {
            try {
                await createSimulatedChallenge(playground, playerJoin);
            } catch (err) {
                const errorMessage = err instanceof Error ? err.message : 'Failed to create simulated challenge';
                console.error('Error creating simulated challenge:', errorMessage);
            }
        }, Math.floor(Math.random() * 2000) + 1000); // Random delay between 1-3 seconds

    } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to create simulated player';
        console.error('Error creating simulated player:', errorMessage);
    }
}

/**
 * Create a simulated challenge to another player in the playground
 */
async function createSimulatedChallenge(
    playground: Playground,
    challengerJoin: Join
): Promise<void> {
    try {
        // Find all other players in the playground
        const allJoins = await j.query(
            model.given(Playground).match((playground) => Join.in(playground)),
            playground
        );

        // Filter out the current player's join
        const otherJoins = allJoins.filter(join => j.hash(join) !== j.hash(challengerJoin));

        if (otherJoins.length === 0) {
            console.log('No other players found in playground to challenge');
            return;
        }

        // Pick a random opponent
        const randomIndex = Math.floor(Math.random() * otherJoins.length);
        const opponentJoin = otherJoins[randomIndex];

        // Randomly decide who starts (challenger or opponent)
        const challengerStarts = Math.random() < 0.5;

        // Create the challenge
        await j.fact(new Challenge(
            challengerJoin,
            opponentJoin,
            challengerStarts,
            new Date()
        ));

        console.log(`Created simulated challenge from player ${j.hash(challengerJoin)} to player ${j.hash(opponentJoin)} in playground ${playground.code}`);
    } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to create simulated challenge';
        console.error('Error creating simulated challenge:', errorMessage);
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
        const observer = j.watch(playgroundSpec, tenant, (playground) => {
            console.log(`New playground detected: ${playground.code}`);

            // Create a simulated player for this playground (fire and forget)
            createSimulatedPlayer(
                playground,
                tenant,
                playerSessionConfig.minDelay,
                playerSessionConfig.maxDelay
            ).catch(err => {
                console.error('Error in createSimulatedPlayer:', err);
            });
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