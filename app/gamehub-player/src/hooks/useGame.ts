import { j } from '@/jinaga-config';
import { Game, model, PlayerName, Playground } from '@model/model';
import { useSpecification } from 'jinaga-react';

export interface GameViewModel {
    game: Game | null;
    gameId: string | null;
    challengerName: string | null;
    opponentName: string | null;
    challengerStarts: boolean | null;
    createdAt: Date | null;
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

/**
 * Hook for retrieving a specific game by ID within a playground
 * @param playground - The playground fact
 * @param gameId - The hash ID of the game to find
 * @returns GameViewModel with game details and loading state
 */
export function useGame(playground: Playground | null, gameId: string | null): GameViewModel {
    const { data: gameProjections, loading, error } = useSpecification(j, gameSpec, playground);

    // Find the specific game by ID
    const gameProjection = gameProjections?.find(projection => projection.gameId === gameId);

    if (!playground || !gameId) {
        return {
            game: null,
            gameId: null,
            challengerName: null,
            opponentName: null,
            challengerStarts: null,
            createdAt: null,
            isLoading: false,
            error: null,
        };
    }

    if (loading) {
        return {
            game: null,
            gameId: null,
            challengerName: null,
            opponentName: null,
            challengerStarts: null,
            createdAt: null,
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
            isLoading: false,
            error: `Game with ID ${gameId} not found in playground ${playground.code}`,
        };
    }

    return {
        game: gameProjection.game,
        gameId: gameProjection.gameId,
        challengerName: gameProjection.challengerNames[0] || null,
        opponentName: gameProjection.opponentNames[0] || null,
        challengerStarts: gameProjection.game.challenge.challengerStarts,
        createdAt: typeof gameProjection.game.challenge.createdAt === 'string' ? new Date(gameProjection.game.challenge.createdAt) : gameProjection.game.challenge.createdAt,
        isLoading: false,
        error: null,
    };
} 