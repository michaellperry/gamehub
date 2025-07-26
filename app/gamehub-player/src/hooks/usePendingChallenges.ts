import { Challenge, Game, Join, Player, PlayerName, Reject, model } from '@model/model';
import { useSpecification } from 'jinaga-react';
import { useState } from 'react';
import { j } from '../jinaga-config';

export interface PendingChallenge {
    challenge: Challenge;
    challengeId: string;
    challengerStarts: boolean;
    createdAt: Date;
    challengerName: string;
    challengerJoin: Join;
}

export interface PendingChallengesViewModel {
    challenges: PendingChallenge[];
    loading: boolean;
    error: string | null;
    acceptChallenge: (challenge: Challenge) => Promise<void>;
    rejectChallenge: (challenge: Challenge) => Promise<void>;
    clearError: () => void;
}

// Specification to find challenges where the current player is the opponent
const pendingChallengesSpec = model.given(Player).match((player) =>
    Challenge.whereOpponent(player)
        .selectMany(challenge => challenge.challengerJoin.predecessor()
            .select(challengerJoin => ({
                challenge,
                challengeId: j.hash(challenge),
                challengerStarts: challenge.challengerStarts,
                createdAt: challenge.createdAt,
                challengerName: challengerJoin.player.predecessor()
                    .selectMany(player => PlayerName.current(player).select(name => name.name)),
                challengerJoin: challengerJoin
            })))
);

export function usePendingChallenges(currentPlayerJoin: Join | null): PendingChallengesViewModel {
    const [actionError, setActionError] = useState<string | null>(null);

    // Extract the current player from the join
    const currentPlayer = currentPlayerJoin?.player || null;

    // Query for pending challenges only if we have the current player
    const { data: challengeData, error: specificationError, loading } = useSpecification(
        j,
        pendingChallengesSpec,
        currentPlayer
    );

    // Transform the data into a more usable format
    const challenges: PendingChallenge[] = challengeData?.map(challenge => ({
        challenge: challenge.challenge,
        challengeId: challenge.challengeId,
        challengerStarts: challenge.challengerStarts,
        createdAt: new Date(challenge.createdAt),
        challengerName: Array.isArray(challenge.challengerName) && challenge.challengerName.length > 0
            ? challenge.challengerName[0]
            : 'Unknown Player',
        challengerJoin: challenge.challengerJoin
    })) || [];

    const clearError = () => {
        setActionError(null);
    };

    const acceptChallenge = async (challenge: Challenge) => {
        try {
            setActionError(null);

            if (!currentPlayer) {
                throw new Error('Current player not available');
            }

            // Create the Game fact directly from the Challenge
            await j.fact(new Game(challenge));

        } catch (error) {
            console.error('Error accepting challenge:', error);
            setActionError('Failed to accept challenge. Please try again.');
        }
    };

    const rejectChallenge = async (challenge: Challenge) => {
        try {
            setActionError(null);

            if (!currentPlayer) {
                throw new Error('Current player not available');
            }

            // Create the Reject fact directly from the Challenge
            await j.fact(new Reject(challenge));

        } catch (error) {
            console.error('Error rejecting challenge:', error);
            setActionError('Failed to reject challenge. Please try again.');
        }
    };

    // Combine errors
    const combinedError = actionError || (specificationError ? specificationError.message : null);

    return {
        challenges,
        loading,
        error: combinedError,
        acceptChallenge,
        rejectChallenge,
        clearError,
    };
} 