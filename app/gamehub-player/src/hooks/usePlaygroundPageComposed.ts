import { Challenge, Join, PlayerName, Playground, model } from '@model/model';
import { useSpecification } from 'jinaga-react';
import { useNavigate } from 'react-router-dom';
import { j } from '../jinaga-config';
import { useActiveGames } from './useActiveGames';
import { useChallenge } from './useChallenge';
import { useChallengeModal } from './useChallengeModal';
import { useLeavePlayground } from './useLeavePlayground';
import { usePlayer } from './usePlayer';
import { PlaygroundNavigationViewModel, PlaygroundPageViewModel, PlaygroundPlayer, PlaygroundUIViewModel, usePlaygroundPage } from './usePlaygroundPage';

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

export interface ComposedPlaygroundPageViewModel {
    playground: PlaygroundPageViewModel['playground'];
    data: PlaygroundPageViewModel['data'];
    error: PlaygroundPageViewModel['error'];
    loading: PlaygroundPageViewModel['loading'];
    isValidCode: PlaygroundPageViewModel['isValidCode'];
    currentPlayerJoin: PlaygroundPageViewModel['currentPlayerJoin'];
    clearError: PlaygroundPageViewModel['clearError'];
    handleLeavePlayground: PlaygroundPageViewModel['handleLeavePlayground'];
}

export function usePlaygroundPageComposed(code: string | undefined): ComposedPlaygroundPageViewModel {
    const navigate = useNavigate();
    const { playerId } = usePlayer();
    const viewModel = usePlaygroundPage(code);
    const challengeViewModel = useChallenge(viewModel.currentPlayerJoin);
    const challengeModal = useChallengeModal(challengeViewModel);
    const leavePlayground = useLeavePlayground(viewModel.handleLeavePlayground);

    // Get players data from the base hook's specification
    const { data: playerSessions } = useSpecification(
        j,
        playgroundPlayersSpec,
        viewModel.playground
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
        join: session.join,
        isChallengePending: session.pendingChallengePlayerIds.some(id => id === playerId)
    })) : undefined;

    const activeGames = useActiveGames([]); // Placeholder for now

    const goHome = () => navigate('/');

    const copyCode = () => {
        if (code) {
            navigator.clipboard.writeText(code);
            // TODO: Show success message
        }
    };

    // Create named view model instances
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

    return {
        playground: viewModel.playground,
        data: composedData,
        error: viewModel.error,
        loading: viewModel.loading,
        isValidCode: viewModel.isValidCode,
        currentPlayerJoin: viewModel.currentPlayerJoin,
        clearError: viewModel.clearError,
        handleLeavePlayground: viewModel.handleLeavePlayground,
    };
} 