import { Join, Leave, Player, PlayerName, Playground, model } from '@model/model';
import { useSpecification } from 'jinaga-react';
import { j } from '../jinaga-config';
import { usePlayer } from './usePlayer';
import { usePlayground } from './usePlayground';

export interface PlaygroundPlayer {
    playerId: string;
    name: string;
    joinedAt: Date;
    isCurrentPlayer: boolean;
    join: Join;
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
    currentPlayerJoin: Join | null;
    clearError: () => void;
    handleChallengePlayer: (player: PlaygroundPlayer) => void;
    handleJoinGame: (game: PlaygroundGame) => void;
    handleLeavePlayground: () => Promise<void>;
}

// Create specification to find all players in a playground with their names and joins
const playgroundPlayersSpec = model.given(Playground).match((playground) =>
    Join.in(playground)
        .selectMany(join => join.player.predecessor()
            .select(player => ({
                playerId: j.hash(player),
                sessionId: j.hash(join),
                joinedAt: join.joinedAt,
                names: PlayerName.current(player).select(name => name.name),
                join: join
            }))
        )
);

const playerJoinsSpec = model.given(Player, Playground).match((player, playground) => Join.in(playground)
    .join(join => join.player, player)
);

export function usePlaygroundPage(code: string | undefined): PlaygroundPageViewModel {
    const { playerId, player, error: playerError, loading: playerLoading, clearError: clearPlayerError } = usePlayer();
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
        isCurrentPlayer: session.playerId === playerId,
        join: session.join
    })) : undefined;

    // Extract the current player's join from the sessions data
    const currentPlayerJoin: Join | null = sessionsByPlayerId && playerId ?
        (sessionsByPlayerId[playerId]?.join || null) : null;

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

    const handleLeavePlayground = async (): Promise<void> => {
        if (!playground || !player) {
            throw new Error('Cannot leave playground: missing playground or player information');
        }

        try {
            // Find all joins for the current player in this playground
            const playerJoins = await j.query(playerJoinsSpec, player, playground);

            // Create a leave fact for each join
            await Promise.all(playerJoins.map(async (playerJoin) => {
                await j.fact(new Leave(playerJoin));
            }));
        } catch (error) {
            console.error('Error leaving playground:', error);
            throw error;
        }
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
        currentPlayerJoin,
        clearError,
        handleChallengePlayer,
        handleJoinGame,
        handleLeavePlayground,
    };
} 