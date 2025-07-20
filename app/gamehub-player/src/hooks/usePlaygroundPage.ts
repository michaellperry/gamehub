import { Join, PlayerName, Playground, model } from '@model/model';
import { useSpecification } from 'jinaga-react';
import { j } from '../jinaga-config';
import { usePlayer } from './usePlayer';
import { usePlayground } from './usePlayground';

export interface PlaygroundPlayer {
    playerId: string;
    name: string;
    joinedAt: Date;
    isCurrentPlayer: boolean;
}

export interface PlaygroundGame {
    id: string;
    playerX: PlaygroundPlayer;
    playerO: PlaygroundPlayer;
    status: 'waiting' | 'active' | 'finished';
}

export interface PlaygroundPageData {
    players: PlaygroundPlayer[];
    games: PlaygroundGame[];
}

export interface PlaygroundPageViewModel {
    playground: Playground | null;
    data: PlaygroundPageData | null;
    error: string | null;
    loading: boolean;
    isValidCode: boolean;
    clearError: () => void;
    handleChallengePlayer: (player: PlaygroundPlayer) => void;
    handleJoinGame: (game: PlaygroundGame) => void;
}

// Create specification to find all players in a playground with their names
const playgroundPlayersSpec = model.given(Playground).match((playground) =>
    Join.in(playground)
        .selectMany(join => join.player.predecessor()
            .select(player => ({
                playerId: j.hash(player),
                sessionId: j.hash(join),
                joinedAt: join.joinedAt,
                names: PlayerName.current(player).select(name => name.name)
            }))
        )
);

export function usePlaygroundPage(code: string | undefined): PlaygroundPageViewModel {
    const { playerId, error: playerError, loading: playerLoading, clearError: clearPlayerError } = usePlayer();
    const { playground, isValidCode, error: playgroundError, loading: playgroundLoading, clearError: clearPlaygroundError } = usePlayground(code);

    // Use Jinaga to load all players in the playground
    const { data: playerSessions, error: specificationError, loading: playersLoading } = useSpecification(
        j,
        playgroundPlayersSpec,
        playground
    );

    // Group sessions by playerId and pick the most recent session
    const sessionsByPlayerId = playerSessions?.reduce((acc, playerData) => {
        const existing = acc[playerData.playerId];
        if (existing && existing.joinedAt > playerData.joinedAt) {
            return acc;
        }
        acc[playerData.playerId] = playerData;
        return acc;
    }, {} as Record<string, typeof playerSessions[number]>);

    const players: PlaygroundPlayer[] | undefined = sessionsByPlayerId ? Object.values(sessionsByPlayerId).map(session => ({
        playerId: session.playerId,
        name: session.names[0],
        joinedAt: new Date(session.joinedAt),
        isCurrentPlayer: session.playerId === playerId
    })) : undefined;

    const clearError = () => {
        clearPlaygroundError();
        clearPlayerError();
    };

    const handleChallengePlayer = (player: PlaygroundPlayer) => {
        // TODO: Implement challenge logic
        console.log('Challenge player:', player);
    };

    const handleJoinGame = (game: PlaygroundGame) => {
        // TODO: Implement join game logic
        console.log('Join game:', game);
    };

    // Loading state combines player loading, playground loading, and specification loading
    const isLoading = playerLoading || playgroundLoading || playersLoading;

    // Combine errors
    const combinedError = playgroundError || playerError || (specificationError ? specificationError.message : null);

    return {
        playground,
        data: players ? {
            players,
            games: [], // Placeholder for now
        } : null,
        error: combinedError,
        loading: isLoading,
        isValidCode,
        clearError,
        handleChallengePlayer,
        handleJoinGame,
    };
} 