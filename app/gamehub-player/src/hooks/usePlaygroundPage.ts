import { Challenge, Join, Leave, Player, PlayerName, Playground, model } from '@model/model';
import { useSpecification } from 'jinaga-react';
import { useNavigate } from 'react-router-dom';
import { j } from '../jinaga-config';
import { ActiveGamesViewModel, useActiveGames } from './useActiveGames';
import { ChallengeViewModel, useChallenge } from './useChallenge';
import { ChallengeModalViewModel, useChallengeModal } from './useChallengeModal';
import { LeavePlaygroundViewModel, useLeavePlayground } from './useLeavePlayground';
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
    const navigate = useNavigate();
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

    // Create challenge and modal hooks
    const challengeViewModel = useChallenge(currentPlayerJoin);
    const challengeModal = useChallengeModal(challengeViewModel);

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

    // Create leave playground hook
    const leavePlayground = useLeavePlayground(handleLeavePlayground);

    // Transform player sessions into PlaygroundPlayer objects
    const players: PlaygroundPlayer[] | undefined = sessionsByPlayerId ? Object.values(sessionsByPlayerId).map(session => ({
        playerId: session.playerId,
        name: session.names[0],
        joinedAt: new Date(session.joinedAt),
        isCurrentPlayer: session.playerId === playerId,
        join: session.join,
        isChallengePending: session.pendingChallengePlayerIds.some(id => id === playerId)
    })) : undefined;

    // Create active games hook (placeholder for now)
    const activeGames = useActiveGames([]);

    // Navigation functions
    const goHome = () => navigate('/');

    const copyCode = () => {
        if (code) {
            navigator.clipboard.writeText(code);
            // TODO: Show success message
        }
    };

    // Create view model instances
    const navigationViewModel: PlaygroundNavigationViewModel = {
        goHome,
    };

    const uiViewModel: PlaygroundUIViewModel = {
        copyCode,
    };

    // Create the complete data structure
    const composedData = players ? {
        players,
        games: [], // Placeholder for now
        navigate: navigationViewModel,
        challenge: {
            modal: challengeModal,
            challengeViewModel,
        },
        leave: leavePlayground,
        activeGames,
        ui: uiViewModel,
    } : null;

    // Loading state combines player loading, playground loading, and specification loading
    const isLoading = playerLoading || playgroundLoading || playersLoading;

    // Combine errors
    const combinedError = playgroundError || playerError || (specificationError ? specificationError.message : null);

    return {
        playground,
        data: composedData,
        error: combinedError,
        loading: isLoading,
        isValidCode,
        currentPlayerJoin,
        clearError,
        handleLeavePlayground,
    };
} 