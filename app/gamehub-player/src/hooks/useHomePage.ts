import { usePlayerName, PlayerNameViewModel } from './usePlayerName';
import { usePlaygroundLobby, PlaygroundLobbyViewModel } from './usePlaygroundLobby';
import { usePlayerPlaygrounds, PlayerPlaygroundsViewModel } from './usePlayerPlaygrounds';

export interface HomePageViewModel {
    playerName: PlayerNameViewModel;
    playgroundLobby: PlaygroundLobbyViewModel;
    playerPlaygrounds: PlayerPlaygroundsViewModel;
}

export function useHomePage(): HomePageViewModel {
    const playerName = usePlayerName();
    const playgroundLobby = usePlaygroundLobby();
    const playerPlaygrounds = usePlayerPlaygrounds();

    return {
        playerName,
        playgroundLobby,
        playerPlaygrounds,
    };
} 