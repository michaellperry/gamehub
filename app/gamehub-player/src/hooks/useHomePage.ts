import { usePlayerName, PlayerNameViewModel } from './usePlayerName';
import { usePlaygroundLobby, PlaygroundLobbyViewModel } from './usePlaygroundLobby';

export interface HomePageViewModel {
    playerName: PlayerNameViewModel;
    playgroundLobby: PlaygroundLobbyViewModel;
}

export function useHomePage(): HomePageViewModel {
    const playerName = usePlayerName();
    const playgroundLobby = usePlaygroundLobby();

    return {
        playerName,
        playgroundLobby,
    };
} 