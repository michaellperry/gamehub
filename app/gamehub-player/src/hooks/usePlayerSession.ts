import { User } from 'jinaga';
import { Player, PlayerName, Tenant } from 'gamehub-model/model';
import { useCallback, useState } from 'react';
import { j } from '../jinaga-config';

export interface SimulatedPlayer {
    id: string;
    name: string;
    isActive: boolean;
}

export interface PlayerSessionsViewModel {
    players: SimulatedPlayer[];
    activePlayers: SimulatedPlayer[];
    isLoading: boolean;
    error: string | null;
    createPlayers: (count: number, namePrefix?: string) => Promise<SimulatedPlayer[]>;
    togglePlayerActive: (playerId: string) => void;
    clearError: () => void;
}

export function usePlayerSessions(tenant: Tenant | null): PlayerSessionsViewModel {
    const [players, setPlayers] = useState<SimulatedPlayer[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const activePlayers = players.filter(p => p.isActive);

    const clearError = useCallback(() => {
        setError(null);
    }, []);

    // Create multiple simulated players
    const createPlayers = useCallback(async (count: number, namePrefix: string = 'Player'): Promise<SimulatedPlayer[]> => {
        if (!tenant) {
            throw new Error('Tenant not available');
        }

        if (count <= 0) {
            return [];
        }

        setIsLoading(true);
        setError(null);

        try {
            const newPlayers: SimulatedPlayer[] = [];
            const timestamp = Date.now();

            for (let i = 1; i <= count; i++) {
                const user = await j.fact(new User(`simulated-${timestamp}-${i}`));
                const player = await j.fact(new Player(user, tenant));
                const name = `${namePrefix} ${i}`;
                await j.fact(new PlayerName(player, name, []));

                const simulatedPlayer: SimulatedPlayer = {
                    id: j.hash(player),
                    name,
                    isActive: true, // All players are active by default
                };

                newPlayers.push(simulatedPlayer);
            }

            setPlayers(prev => [...prev, ...newPlayers]);
            return newPlayers;
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to create players';
            setError(errorMessage);
            throw new Error(errorMessage);
        } finally {
            setIsLoading(false);
        }
    }, [tenant]);

    // Toggle a player's active state
    const togglePlayerActive = useCallback((playerId: string) => {
        setPlayers(prev => prev.map(player => ({
            ...player,
            isActive: player.id === playerId ? !player.isActive : player.isActive
        })));
    }, []);

    return {
        players,
        activePlayers,
        isLoading,
        error,
        createPlayers,
        togglePlayerActive,
        clearError,
    };
} 