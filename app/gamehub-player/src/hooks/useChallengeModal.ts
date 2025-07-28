import { useState } from 'react';
import { ChallengeViewModel } from './useChallenge';
import { PlaygroundPlayer } from './usePlaygroundPage';

export interface ChallengeModalViewModel {
    showChallengeModal: boolean;
    selectedOpponent: PlaygroundPlayer | null;
    loading: boolean;
    challengerStarts: boolean;
    handleChallengeClick: (player: PlaygroundPlayer) => void;
    handleChallengeClose: () => void;
    handleChallengeSubmit: (opponent: PlaygroundPlayer, challengerStarts: boolean) => Promise<void>;
    setChallengerStarts: (starts: boolean) => void;
    setLoading: (loading: boolean) => void;
}

export function useChallengeModal(
    challengeViewModel: ChallengeViewModel
): ChallengeModalViewModel {
    const [showChallengeModal, setShowChallengeModal] = useState(false);
    const [selectedOpponent, setSelectedOpponent] = useState<PlaygroundPlayer | null>(null);
    const [loading, setLoading] = useState(false);
    const [challengerStarts, setChallengerStarts] = useState(true);

    const handleChallengeClick = (player: PlaygroundPlayer) => {
        setSelectedOpponent(player);
        setShowChallengeModal(true);
        setChallengerStarts(true); // Reset to default when opening
    };

    const handleChallengeClose = () => {
        setShowChallengeModal(false);
        setSelectedOpponent(null);
    };

    const handleChallengeSubmit = async (opponent: PlaygroundPlayer, challengerStarts: boolean) => {
        setLoading(true);
        try {
            await challengeViewModel.createChallenge(opponent.join, challengerStarts);
            setShowChallengeModal(false);
            setSelectedOpponent(null);
        } catch (error) {
            console.error('Error creating challenge:', error);
            // Error is already handled by the challenge hook
        } finally {
            setLoading(false);
        }
    };

    return {
        showChallengeModal,
        selectedOpponent,
        loading,
        challengerStarts,
        handleChallengeClick,
        handleChallengeClose,
        handleChallengeSubmit,
        setChallengerStarts,
        setLoading,
    };
} 