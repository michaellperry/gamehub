import { usePlayerName, PlayerNameViewModel } from './usePlayerName';
import { usePlaygroundLobby, PlaygroundLobbyViewModel } from './usePlaygroundLobby';
import { usePlayerPlaygrounds, PlayerPlaygroundsViewModel } from './usePlayerPlaygrounds';
import { usePlayerSessionsContext } from '../auth/PlayerSessionsProvider';
import { PlayerSessionsViewModel } from './usePlayerSession';
import { useTenant } from '../auth/useTenant';

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
    const playerSessions = usePlayerSessionsContext();

    // Simplified approach - player creation will be handled by the simplified hook in Phase 2
    // No complex player creation logic needed here

    return {
        playerName,
        playgroundLobby,
        playerPlaygrounds,
        playerSessions,
    };
} 