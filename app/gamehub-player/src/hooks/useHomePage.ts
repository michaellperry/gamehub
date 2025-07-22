import { usePlayerName, PlayerNameViewModel } from './usePlayerName';
import { usePlaygroundLobby, PlaygroundLobbyViewModel } from './usePlaygroundLobby';
import { usePlayerPlaygrounds, PlayerPlaygroundsViewModel } from './usePlayerPlaygrounds';
import { usePlayerSessions, PlayerSessionsViewModel } from './usePlayerSession';
import { useTenant } from '../auth/useTenant';
import { useEffect, useRef } from 'react';

export interface HomePageViewModel {
    playerName: PlayerNameViewModel;
    playgroundLobby: PlaygroundLobbyViewModel;
    playerPlaygrounds: PlayerPlaygroundsViewModel;
    playerSessions: PlayerSessionsViewModel;
}

export function useHomePage(): HomePageViewModel {
    const playerName = usePlayerName();
    const playgroundLobby = usePlaygroundLobby();
    const playerPlaygrounds = usePlayerPlaygrounds();
    const tenant = useTenant();
    const playerSessions = usePlayerSessions(tenant);
    const hasCreatedPlayers = useRef(false);

    // Create simulated players in dev mode (only once)
    useEffect(() => {
        if (import.meta.env.DEV && tenant && !hasCreatedPlayers.current && playerSessions.players.length === 0) {
            hasCreatedPlayers.current = true;
            playerSessions.createPlayers(3, 'Simulated Player')
                .catch(error => {
                    console.error('Failed to create simulated players:', error);
                    hasCreatedPlayers.current = false; // Reset on error to allow retry
                });
        }
    }, [tenant, playerSessions.players.length, playerSessions.createPlayers]);

    return {
        playerName,
        playgroundLobby,
        playerPlaygrounds,
        playerSessions,
    };
} 