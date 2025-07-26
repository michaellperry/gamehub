import { useNavigate } from 'react-router-dom';
import { useChallenge } from './useChallenge';
import { useChallengeModal } from './useChallengeModal';
import { useLeavePlayground } from './useLeavePlayground';
import { PlaygroundPageViewModel, usePlaygroundPage } from './usePlaygroundPage';

export interface ComposedPlaygroundPageViewModel extends PlaygroundPageViewModel {
    // Navigation
    navigate: {
        goHome: () => void;
    };

    // Challenge functionality
    challenge: {
        modal: ReturnType<typeof useChallengeModal>;
        challengeViewModel: ReturnType<typeof useChallenge>;
    };

    // Leave playground functionality
    leave: ReturnType<typeof useLeavePlayground>;

    // UI state
    ui: {
        copyCode: () => void;
    };
}

export function usePlaygroundPageComposed(code: string | undefined): ComposedPlaygroundPageViewModel {
    const navigate = useNavigate();
    const viewModel = usePlaygroundPage(code);
    const challengeViewModel = useChallenge(viewModel.currentPlayerJoin);
    const challengeModal = useChallengeModal(challengeViewModel);
    const leavePlayground = useLeavePlayground(viewModel.handleLeavePlayground);

    const goHome = () => navigate('/');

    const copyCode = () => {
        if (code) {
            navigator.clipboard.writeText(code);
            // TODO: Show success message
        }
    };

    return {
        ...viewModel,
        navigate: {
            goHome,
        },
        challenge: {
            modal: challengeModal,
            challengeViewModel,
        },
        leave: leavePlayground,
        ui: {
            copyCode,
        },
    };
} 