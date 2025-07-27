import { j } from '@/jinaga-config';
import { Game, Move, model, PlayerName, Playground } from '@model/model';
import { useSpecification } from 'jinaga-react';
import { computeTicTacToeState, TicTacToeState } from '@/utils/ticTacToe';

export interface GameViewModel {
    game: Game | null;
    gameId: string | null;
    challengerName: string | null;
    opponentName: string | null;
    challengerStarts: boolean | null;
    createdAt: Date | null;
    moves: Move[];
    ticTacToeState: TicTacToeState;
    isLoading: boolean;
    error: string | null;
}

const gameSpec = model.given(Playground).match((playground) => Game.in(playground)
    .selectMany(game => game.challenge.opponentJoin.player.predecessor()
        .selectMany(opponentPlayer => game.challenge.challengerJoin.player.predecessor()
            .select(challengerPlayer => ({
                gameId: j.hash(game),
                game,
                opponentPlayerId: j.hash(opponentPlayer),
                opponentNames: PlayerName.current(opponentPlayer).select(name => name.name),
                challengerPlayerId: j.hash(challengerPlayer),
                challengerNames: PlayerName.current(challengerPlayer).select(name => name.name),
            }))
        ))
);

const movesSpec = model.given(Game).match((game) => Move.in(game)
    .select(move => ({
        moveId: j.hash(move),
        index: move.index,
        position: move.position,
        move,
    }))
);

/**
 * Hook for retrieving a specific game by ID within a playground
 * @param playground - The playground fact
 * @param gameId - The hash ID of the game to find
 * @returns GameViewModel with game details and loading state
 */
export function useGame(playground: Playground | null, gameId: string | null): GameViewModel {
    const { data: gameProjections, loading: gameLoading, error: gameError } = useSpecification(j, gameSpec, playground);

    // Find the specific game by ID
    const gameProjection = gameProjections?.find(projection => projection.gameId === gameId);

    // Get moves for the specific game if found
    const { data: movesProjections, loading: movesLoading, error: movesError } = useSpecification(j, movesSpec, gameProjection?.game || null);

    const defaultTicTacToeState: TicTacToeState = {
        board: Array(9).fill(null),
        currentPlayer: 'X',
        winner: null,
        isGameOver: false,
    };

    if (!playground || !gameId) {
        return {
            game: null,
            gameId: null,
            challengerName: null,
            opponentName: null,
            challengerStarts: null,
            createdAt: null,
            moves: [],
            ticTacToeState: defaultTicTacToeState,
            isLoading: false,
            error: null,
        };
    }

    const isLoading = gameLoading || movesLoading;
    const error = gameError || movesError;

    if (isLoading) {
        return {
            game: null,
            gameId: null,
            challengerName: null,
            opponentName: null,
            challengerStarts: null,
            createdAt: null,
            moves: [],
            ticTacToeState: defaultTicTacToeState,
            isLoading: true,
            error: null,
        };
    }

    if (error) {
        return {
            game: null,
            gameId: null,
            challengerName: null,
            opponentName: null,
            challengerStarts: null,
            createdAt: null,
            moves: [],
            ticTacToeState: defaultTicTacToeState,
            isLoading: false,
            error: error.message,
        };
    }

    if (!gameProjection) {
        return {
            game: null,
            gameId: null,
            challengerName: null,
            opponentName: null,
            challengerStarts: null,
            createdAt: null,
            moves: [],
            ticTacToeState: defaultTicTacToeState,
            isLoading: false,
            error: `Game with ID ${gameId} not found in playground ${playground.code}`,
        };
    }

    // Extract moves from the moves projections
    const moves = movesProjections?.map(projection => projection.move) || [];

    const ticTacToeState = computeTicTacToeState(moves);

    return {
        game: gameProjection.game,
        gameId: gameProjection.gameId,
        challengerName: gameProjection.challengerNames[0] || null,
        opponentName: gameProjection.opponentNames[0] || null,
        challengerStarts: gameProjection.game.challenge.challengerStarts,
        createdAt: typeof gameProjection.game.challenge.createdAt === 'string' ? new Date(gameProjection.game.challenge.createdAt) : gameProjection.game.challenge.createdAt,
        moves,
        ticTacToeState,
        isLoading: false,
        error: null,
    };
} 