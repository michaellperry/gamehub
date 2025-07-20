import { usePlayerName, PlayerNameViewModel } from './usePlayerName';
import { usePlayground, PlaygroundViewModel } from './usePlayground';

export interface HomePageViewModel {
    playerName: PlayerNameViewModel;
    playground: PlaygroundViewModel;
}

export function useHomePage(): HomePageViewModel {
    const playerName = usePlayerName();
    const playground = usePlayground();

    return {
        playerName,
        playground,
    };
} 