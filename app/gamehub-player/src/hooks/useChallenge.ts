import { Challenge, Join } from '@model/model';
import { useState } from 'react';
import { j } from '../jinaga-config';

export interface ChallengeViewModel {
    loading: boolean;
    error: string | null;
    createChallenge: (opponentJoin: Join, challengerStarts: boolean) => Promise<void>;
    clearError: () => void;
}

export function useChallenge(currentPlayerJoin: Join | null): ChallengeViewModel {
    const [actionError, setActionError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const clearError = () => {
        setActionError(null);
    };

    const createChallenge = async (opponentJoin: Join, challengerStarts: boolean) => {
        if (!currentPlayerJoin) {
            throw new Error('Current player join not available');
        }

        setLoading(true);
        setActionError(null);

        try {
            // Prevent self-challenges
            if (j.hash(currentPlayerJoin) === j.hash(opponentJoin)) {
                throw new Error('Cannot challenge yourself');
            }

            // Create the challenge
            await j.fact(new Challenge(
                currentPlayerJoin,
                opponentJoin,
                challengerStarts,
                new Date()
            ));

        } catch (error) {
            console.error('Error creating challenge:', error);
            setActionError(error instanceof Error ? error.message : 'Failed to create challenge. Please try again.');
            throw error;
        } finally {
            setLoading(false);
        }
    };

    // Combine errors
    const combinedError = actionError;

    return {
        loading,
        error: combinedError,
        createChallenge,
        clearError,
    };
} 