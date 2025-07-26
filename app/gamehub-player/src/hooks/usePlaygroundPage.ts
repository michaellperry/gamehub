import { Challenge, Join, Leave, Player, PlayerName, Playground, model } from '@model/model';
import { useSpecification } from 'jinaga-react';
import { j } from '../jinaga-config';
import { ActiveGamesViewModel } from './useActiveGames';
import { ChallengeViewModel } from './useChallenge';
import { ChallengeModalViewModel } from './useChallengeModal';
import { LeavePlaygroundViewModel } from './useLeavePlayground';
import { usePlayer } from './usePlayer';
import { usePlayground } from './usePlayground';

export interface PlaygroundPlayer {
    playerId: string;
    name: string;
    joinedAt: Date;
    isCurrentPlayer: boolean;
    join: Join;
    isChallengePending: boolean;
}

export interface PlaygroundGame {
    id: string;
    playerX: PlaygroundPlayer;
    playerO: PlaygroundPlayer;
    status: 'waiting' | 'active' | 'finished';
}

export interface PlaygroundNavigationViewModel {
    goHome: () => void;
}

export interface PlaygroundUIViewModel {
    copyCode: () => void;
}

export interface PlaygroundPageData {
    players: PlaygroundPlayer[];
    games: PlaygroundGame[];
    // Navigation
    navigate: PlaygroundNavigationViewModel;
    // Challenge functionality
    challenge: {
        modal: ChallengeModalViewModel;
        challengeViewModel: ChallengeViewModel;
    };
    // Leave playground functionality
    leave: LeavePlaygroundViewModel;
    // Active games functionality
    activeGames: ActiveGamesViewModel;
    // UI state
    ui: PlaygroundUIViewModel;
}

export interface PlaygroundPageViewModel {
    playground: Playground | null;
    data: PlaygroundPageData | null;
    error: string | null;
    loading: boolean;
    isValidCode: boolean;
    currentPlayerJoin: Join | null;
    clearError: () => void;
    handleLeavePlayground: () => Promise<void>;
}

// Create specification to find all players in a playground with their names and joins
const playgroundPlayersSpec = model.given(Playground).match((playground) =>
    Join.in(playground)
        .selectMany(join => join.player.predecessor()
            .select(player => ({
                playerId: j.hash(player),
                joinedAt: join.joinedAt,
                names: PlayerName.current(player).select(name => name.name),
                join: join,
                pendingChallengePlayerIds: Challenge.for(player)
                    .selectMany(challenge => challenge.challengerJoin.player.predecessor()
                        .select(challenger => j.hash(challenger)))
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

    // Extract the current player's join from the sessions data
    const currentPlayerJoin: Join | null = sessionsByPlayerId && playerId ?
        (sessionsByPlayerId[playerId]?.join || null) : null;

    const clearError = () => {
        clearPlaygroundError();
        clearPlayerError();
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
        data: null, // Data will be composed by the composed hook
        error: combinedError,
        loading: isLoading,
        isValidCode,
        currentPlayerJoin,
        clearError,
        handleLeavePlayground,
    };
} 