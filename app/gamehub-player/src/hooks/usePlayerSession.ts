import { Challenge, Game, Join, Player, PlayerName, Playground, Reject, Tenant, model } from '@model/model';
import { User } from 'jinaga';
import { useCallback, useEffect, useRef, useState } from 'react';
import { playerSessionConfig } from '../config/background-service';
import { j } from '../jinaga-config';
import { generateGamingName } from '../utils/gamingNames';

export interface PlayerSessionViewModel {
    isEnabled: boolean;
    enableSimulation: () => void;
    disableSimulation: () => void;
}

/**
 * Player session hook that uses Jinaga's watch API
 * to automatically detect new playgrounds and create simulated players.
 */
export function usePlayerSession(tenant: Tenant | null): PlayerSessionViewModel {
    const [isEnabled, setIsEnabled] = useState(playerSessionConfig.enabled);
    const cleanupFunctions = useRef<(() => void)[]>([]);

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
                playerSessionConfig.maxDelay,
                (cleanupFn) => {
                    cleanupFunctions.current.push(cleanupFn);
                }
            );
        });

        // Cleanup function to stop the observer and all challenge observers
        return () => {
            observer.stop();
            // Clean up all challenge observers
            cleanupFunctions.current.forEach(stopFn => stopFn());
            cleanupFunctions.current = [];
        };
    }, [tenant, isEnabled]);

    return {
        isEnabled,
        enableSimulation,
        disableSimulation,
    };
}

/**
 * Create a simulated player for a playground
 */
async function createSimulatedPlayer(
    playground: Playground,
    tenant: Tenant,
    minDelay: number,
    maxDelay: number,
    onObserverCreated: (cleanupFn: () => void) => void
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

        // Start watching for challenges to this simulated player
        const cleanupFn = watchForChallengesToSimulatedPlayer(playerJoin);
        onObserverCreated(cleanupFn);

        // Create a challenge after a random delay (fire and forget)
        createSimulatedChallenge(playground, playerJoin, 1000, 3000);

    } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to create simulated player';
        console.error('Error creating simulated player:', errorMessage);
    }
}

/**
 * Watch for challenges to a specific simulated player and automatically accept them
 */
function watchForChallengesToSimulatedPlayer(playerJoin: Join): () => void {
    // Create specification for challenges where this player is the opponent
    const challengeSpec = model.given(Join).match((join) =>
        join.successors(Challenge, (challenge) => challenge.opponentJoin)
            .notExists((challenge) => challenge.successors(Game, (game) => game.challenge))
            .notExists((challenge) => challenge.successors(Reject, (reject) => reject.challenge))
    );

    // Create observer to watch for new challenges to this player
    const observer = j.watch(challengeSpec, playerJoin, (challenge) => {
        // Accept the challenge (fire and forget)
        acceptSimulatedChallenge(challenge, playerJoin, 500, 1500);
    });

    // Return cleanup function
    return () => observer.stop();
}

/**
 * Accept a challenge to a simulated player after a random delay
 */
async function acceptSimulatedChallenge(
    challenge: Challenge,
    playerJoin: Join,
    minDelay: number,
    maxDelay: number
): Promise<void> {
    try {
        // Generate random delay
        const delay = Math.floor(Math.random() * (maxDelay - minDelay + 1)) + minDelay;

        // Wait for the delay
        await new Promise(resolve => setTimeout(resolve, delay));

        // Get the player from the join
        const player = playerJoin.player;

        console.log(`Challenge detected to simulated player ${player.user.publicKey}`);

        // Accept the challenge by creating a Game fact
        await j.fact(new Game(challenge));

        console.log(`Automatically accepted challenge to simulated player ${player.user.publicKey}`);
    } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to accept challenge to simulated player';
        console.error('Error accepting challenge to simulated player:', errorMessage);
    }
}

/**
 * Create a simulated challenge to another player in the playground
 */
async function createSimulatedChallenge(
    playground: Playground,
    challengerJoin: Join,
    minDelay: number,
    maxDelay: number
): Promise<void> {
    try {
        // Generate random delay
        const delay = Math.floor(Math.random() * (maxDelay - minDelay + 1)) + minDelay;

        // Wait for the delay
        await new Promise(resolve => setTimeout(resolve, delay));

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