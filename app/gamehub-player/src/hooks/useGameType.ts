import { FleetDuelState } from './useFleetDuel';
import { TicTacToeState } from '../utils/ticTacToe';
import { BaseGameData } from '../components/organisms/GameInterface';
import { Game, Move } from '@model/model';

// Game type enumeration
export type GameType = 'tic-tac-toe' | 'fleet-duel' | 'unknown';

// Discriminated union for game data
export type GameDataUnion =
    | TicTacToeGameData
    | FleetDuelGameData;

// Tic-Tac-Toe specific game data
export interface TicTacToeGameData extends BaseGameData {
    gameType: 'tic-tac-toe';
    ticTacToeState: TicTacToeState;
    game: Game;
    gameId: string;
    createdAt: Date;
    moves: Move[];
}

// Fleet Duel specific game data  
export interface FleetDuelGameData extends BaseGameData {
    gameType: 'fleet-duel';
    fleetDuelState: FleetDuelState;
    game: Game;
    gameId: string;
    createdAt: Date;
    moves?: Move[];
}

// Type guard functions for type-safe narrowing
export function isTicTacToeGame(gameData: GameDataUnion | null): gameData is TicTacToeGameData {
    return gameData?.gameType === 'tic-tac-toe';
}

export function isFleetDuelGame(gameData: GameDataUnion | null): gameData is FleetDuelGameData {
    return gameData?.gameType === 'fleet-duel';
}

// Game type detection hook
export function useGameType(gameData: GameDataUnion | null): GameType {
    if (!gameData) {
        return 'unknown';
    }

    // Use the discriminator property for type-safe game type detection
    switch (gameData.gameType) {
        case 'tic-tac-toe':
            return 'tic-tac-toe';
        case 'fleet-duel':
            return 'fleet-duel';
        default:
            return 'unknown';
    }
}