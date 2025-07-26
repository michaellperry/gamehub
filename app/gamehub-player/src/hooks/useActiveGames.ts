import { PlaygroundGame } from './usePlaygroundPage';

export interface ActiveGamesViewModel {
    games: PlaygroundGame[];
    gameCount: number;
    hasGames: boolean;
}

export function useActiveGames(games: PlaygroundGame[]): ActiveGamesViewModel {
    return {
        games,
        gameCount: games.length,
        hasGames: games.length > 0,
    };
} 