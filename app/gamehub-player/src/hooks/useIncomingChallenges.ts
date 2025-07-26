import { Challenge, Join } from '@model/model';
import { useCallback, useState } from 'react';
import { usePendingChallenges } from './usePendingChallenges';

export interface IncomingChallenge {
    challenge: Challenge;
    challengeId: string;
    challengerName: string;
    createdAt: Date;
    challengerJoin: Join;
}

export interface IncomingChallengesViewModel {
    // State
    challenges: IncomingChallenge[];
    selectedChallenge: IncomingChallenge | null;
    showNotification: boolean;
    loading: boolean;
    error: string | null;

    // Actions
    handleChallengeSelect: (challenge: IncomingChallenge) => void;
    handleChallengeDismiss: () => void;
    handleAcceptChallenge: () => Promise<void>;
    handleRejectChallenge: () => Promise<void>;
    clearError: () => void;
}

export function useIncomingChallenges(currentPlayerJoin: Join | null): IncomingChallengesViewModel {
    const [selectedChallenge, setSelectedChallenge] = useState<IncomingChallenge | null>(null);
    const [showNotification, setShowNotification] = useState(false);

    // Use the existing hook for data fetching
    const pendingChallenges = usePendingChallenges(currentPlayerJoin);

    // Transform the data to match our view model interface
    const challenges: IncomingChallenge[] = pendingChallenges.challenges.map(challenge => ({
        challenge: challenge.challenge,
        challengeId: challenge.challengeId,
        challengerName: challenge.challengerName,
        createdAt: challenge.createdAt,
        challengerJoin: challenge.challengerJoin
    }));

    const handleChallengeSelect = useCallback((challenge: IncomingChallenge) => {
        setSelectedChallenge(challenge);
        setShowNotification(true);
    }, []);

    const handleChallengeDismiss = useCallback(() => {
        setShowNotification(false);
        setSelectedChallenge(null);
    }, []);

    const handleAcceptChallenge = useCallback(async () => {
        if (!selectedChallenge) return;

        try {
            await pendingChallenges.acceptChallenge(selectedChallenge.challenge);
            handleChallengeDismiss();
        } catch (error) {
            console.error('Error accepting challenge:', error);
            // Error is handled by the underlying hook
        }
    }, [selectedChallenge, pendingChallenges, handleChallengeDismiss]);

    const handleRejectChallenge = useCallback(async () => {
        if (!selectedChallenge) return;

        try {
            await pendingChallenges.rejectChallenge(selectedChallenge.challenge);
            handleChallengeDismiss();
        } catch (error) {
            console.error('Error rejecting challenge:', error);
            // Error is handled by the underlying hook
        }
    }, [selectedChallenge, pendingChallenges, handleChallengeDismiss]);

    return {
        // State
        challenges,
        selectedChallenge,
        showNotification,
        loading: pendingChallenges.loading,
        error: pendingChallenges.error,

        // Actions
        handleChallengeSelect,
        handleChallengeDismiss,
        handleAcceptChallenge,
        handleRejectChallenge,
        clearError: pendingChallenges.clearError,
    };
} 