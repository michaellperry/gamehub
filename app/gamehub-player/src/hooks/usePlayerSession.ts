import { Tenant } from 'gamehub-model/model';
import { useCallback, useState } from 'react';

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
    serviceStatus: {
        isRunning: boolean;
        totalPlayers: number;
        activePlayers: number;
        idlePlayers: number;
    };
}

export function usePlayerSessions(tenant: Tenant | null): PlayerSessionsViewModel {
    const [players, setPlayers] = useState<SimulatedPlayer[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [serviceStatus, setServiceStatus] = useState({
        isRunning: false,
        totalPlayers: 0,
        activePlayers: 0,
        idlePlayers: 0,
    });

    const activePlayers = players.filter(p => p.isActive);

    const clearError = useCallback(() => {
        setError(null);
    }, []);

    // Create multiple simulated players (placeholder for Phase 2 implementation)
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
            // Placeholder implementation - will be replaced in Phase 2
            console.log(`Creating ${count} players (placeholder implementation)`);

            // Return empty array for now - will be implemented in Phase 2
            return [];
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
        serviceStatus,
    };
} 