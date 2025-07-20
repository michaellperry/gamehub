import { Join, Player, PlayerName, Playground, model } from '@model/model';
import { useSpecification } from 'jinaga-react';
import { useEffect, useMemo, useState } from 'react';
import { useUser } from '../auth/UserProvider';
import { useTenant } from '../auth/useTenant';
import { j } from '../jinaga-config';

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
    const [error, setError] = useState<string | null>(null);
    const { user } = useUser();
    const tenant = useTenant();

    // Create player fact if user is available
    const player = useMemo(() =>
        user && tenant ? new Player(user, tenant) : null,
        [user, tenant]
    );

    // Create player fact if it doesn't exist
    useEffect(() => {
        if (player) {
            j.fact(player).catch((error) => {
                console.error('Error creating player:', error);
                setError('Failed to load player. Please check the code and try again.');
            });
        }
    }, [player]);

    // Create playground fact if code and tenant are available (memoized to prevent infinite updates)
    const playground = useMemo(() =>
        code && tenant ? new Playground(tenant, code) : null,
        [code, tenant]
    );

    // Create the playground fact if it doesn't exist
    useEffect(() => {
        if (playground) {
            j.fact(playground).catch((error) => {
                console.error('Error creating playground:', error);
                setError('Failed to load playground. Please check the code and try again.');
            });
        }
    }, [playground]);

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
        isCurrentPlayer: session.playerId === (player ? j.hash(player) : null)
    })) : undefined;

    const clearError = () => {
        setError(null);
    };

    const handleChallengePlayer = (player: PlaygroundPlayer) => {
        // TODO: Implement challenge logic
        console.log('Challenge player:', player);
    };

    const handleJoinGame = (game: PlaygroundGame) => {
        // TODO: Implement join game logic
        console.log('Join game:', game);
    };

    // Loading state is handled by useSpecification
    const isLoading = playersLoading;

    // Combine errors
    const combinedError = error || (specificationError ? specificationError.message : null);

    return {
        playground,
        data: players ? {
            players,
            games: [], // Placeholder for now
        } : null,
        error: combinedError,
        loading: isLoading,
        clearError,
        handleChallengePlayer,
        handleJoinGame,
    };
} 