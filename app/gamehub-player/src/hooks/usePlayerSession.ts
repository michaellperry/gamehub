import { Tenant } from 'gamehub-model/model';
import { useCallback, useEffect, useRef, useState } from 'react';
import { backgroundServiceConfig } from '../config/background-service';
import { j } from '../jinaga-config';
import { SimulatedPlayerService } from '../services/background-service';

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

    // Use ref to maintain service instance across renders
    const serviceRef = useRef<SimulatedPlayerService | null>(null);
    const hasStartedService = useRef(false);

    const activePlayers = players.filter(p => p.isActive);

    const clearError = useCallback(() => {
        setError(null);
    }, []);

    // Initialize and start background service
    useEffect(() => {
        if (import.meta.env.DEV && backgroundServiceConfig.enabled && tenant && !hasStartedService.current) {
            console.log('Starting background service for simulated players');

            const service = new SimulatedPlayerService(j, {
                enabled: true,
                playerCount: backgroundServiceConfig.playerCount,
                tickInterval: 500, // Faster tick for better responsiveness
                maxJoinAttempts: backgroundServiceConfig.retryAttempts,
                maxPlayTime: 300000, // 5 minutes
                minIdleTime: 1000, // 1 second - faster for testing
            });

            service.start(tenant)
                .then(() => {
                    serviceRef.current = service;
                    hasStartedService.current = true;
                    console.log('Background service started successfully');

                    // Initial status update
                    const status = service.getStatus();
                    setServiceStatus({
                        isRunning: status.isRunning,
                        totalPlayers: status.totalPlayers,
                        activePlayers: status.activePlayers,
                        idlePlayers: status.idlePlayers,
                    });
                })
                .catch(error => {
                    console.error('Failed to start background service:', error);
                    setError('Failed to start background service');
                });
        }

        // Cleanup on unmount or tenant change
        return () => {
            if (serviceRef.current) {
                console.log('Stopping background service');
                serviceRef.current.stop();
                serviceRef.current = null;
                hasStartedService.current = false;
                setServiceStatus({
                    isRunning: false,
                    totalPlayers: 0,
                    activePlayers: 0,
                    idlePlayers: 0,
                });
            }
        };
    }, [tenant]);

    // Sync hook state with service state
    useEffect(() => {
        if (!serviceRef.current) return;

        const syncInterval = setInterval(() => {
            const service = serviceRef.current;
            if (!service) return;

            const status = service.getStatus();
            setServiceStatus({
                isRunning: status.isRunning,
                totalPlayers: status.totalPlayers,
                activePlayers: status.activePlayers,
                idlePlayers: status.idlePlayers,
            });

            // Sync players from service to hook state
            const servicePlayers = service.getPlayers();

            const hookPlayers: SimulatedPlayer[] = servicePlayers.map(sp => {
                return {
                    id: sp.id,
                    name: sp.name, // Use the name from the service player
                    isActive: sp.state === 'playing'
                };
            });

            setPlayers(hookPlayers);
        }, 500); // Sync more frequently for better responsiveness

        return () => clearInterval(syncInterval);
    }, [serviceRef.current]);

    // Create multiple simulated players (only when service is running)
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
            // Only create players if service is running
            if (!serviceRef.current) {
                console.log('Background service not running, cannot create players');
                return [];
            }

            console.log(`Service is running, ${count} players will be created by background service`);

            // Wait for service to have players and sync them to hook state
            let attempts = 0;
            const maxAttempts = 10;
            while (attempts < maxAttempts) {
                const servicePlayers = serviceRef.current.getPlayers();
                if (servicePlayers.length > 0) {
                    // Convert service players to hook format
                    const hookPlayers: SimulatedPlayer[] = servicePlayers.map(sp => {
                        return {
                            id: sp.id,
                            name: sp.name, // Use the name from the service player
                            isActive: sp.state === 'playing'
                        };
                    });
                    return hookPlayers.slice(0, count);
                }

                // Wait a bit before next attempt
                await new Promise(resolve => setTimeout(resolve, 200));
                attempts++;
            }

            // If we get here, service didn't create players in time
            console.log('Service did not create players in time');
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