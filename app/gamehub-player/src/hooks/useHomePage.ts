import { usePlayerName, PlayerNameViewModel } from './usePlayerName';
import { usePlaygroundLobby, PlaygroundLobbyViewModel } from './usePlaygroundLobby';
import { usePlayerPlaygrounds, PlayerPlaygroundsViewModel } from './usePlayerPlaygrounds';
import { usePlayerSessionsContext } from '../auth/PlayerSessionsProvider';
import { PlayerSessionViewModel } from './usePlayerSession';

export interface HomePageViewModel {
    playerName: PlayerNameViewModel;
    playgroundLobby: PlaygroundLobbyViewModel;
    playerPlaygrounds: PlayerPlaygroundsViewModel;
    playerSessions: PlayerSessionViewModel;
}

export function useHomePage(): HomePageViewModel {
    const playerName = usePlayerName();
    const playgroundLobby = usePlaygroundLobby();
    const playerPlaygrounds = usePlayerPlaygrounds();
    const playerSessions = usePlayerSessionsContext();

    // Simplified approach - player creation is handled automatically by the simplified hook
    // using Jinaga's reactive patterns to detect new playgrounds

    return {
        playerName,
        playgroundLobby,
        playerPlaygrounds,
        playerSessions,
    };
} 