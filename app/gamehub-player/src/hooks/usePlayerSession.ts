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
    activePlayer: SimulatedPlayer | null;
    isLoading: boolean;
    error: string | null;
    createPlayers: (count: number, namePrefix?: string) => Promise<SimulatedPlayer[]>;
    activatePlayer: (playerId: string) => void;
    clearError: () => void;
}

export function usePlayerSessions(tenant: Tenant | null): PlayerSessionsViewModel {
    const [players, setPlayers] = useState<SimulatedPlayer[]>([]);
    const [activePlayerId, setActivePlayerId] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const activePlayer = players.find(p => p.id === activePlayerId) || null;

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
                    isActive: false,
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

    // Activate a player
    const activatePlayer = useCallback((playerId: string) => {
        setActivePlayerId(playerId);
    }, []);

    return {
        players,
        activePlayer,
        isLoading,
        error,
        createPlayers,
        activatePlayer,
        clearError,
    };
} 