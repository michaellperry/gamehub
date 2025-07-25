import { Challenge, Join, Player, PlayerName, Playground, model } from '@model/model';
import { useSpecification } from 'jinaga-react';
import { j } from '../jinaga-config';
import { usePlayer } from './usePlayer';
import { usePlayground } from './usePlayground';
import { useState } from 'react';

export interface PendingChallenge {
    challengeId: string;
    challengerStarts: boolean;
    createdAt: Date;
    challengerName: string;
    playgroundCode: string;
}

export interface PendingChallengesViewModel {
    challenges: PendingChallenge[];
    loading: boolean;
    error: string | null;
    acceptChallenge: (challengeId: string) => Promise<void>;
    rejectChallenge: (challengeId: string) => Promise<void>;
    clearError: () => void;
}

// Specification to find challenges where the current player is the opponent
const pendingChallengesSpec = model.given(Player, Playground).match((player, playground) =>
    Join.in(playground)
        .join(join => join.player, player)
        .selectMany(opponentJoin =>
            Challenge.whereOpponent(player)
                .join(challenge => challenge.opponentJoin, opponentJoin)
                .select(challenge => ({
                    challengeId: j.hash(challenge),
                    challengerStarts: challenge.challengerStarts,
                    createdAt: challenge.createdAt,
                    challengerName: challenge.challengerJoin.player.predecessor()
                        .selectMany(player => PlayerName.current(player).select(name => name.name)),
                    playgroundCode: playground.code
                }))
        )
);

export function usePendingChallenges(playgroundCode: string | undefined): PendingChallengesViewModel {
    const { player, error: playerError } = usePlayer();
    const { playground, error: playgroundError } = usePlayground(playgroundCode);
    const [actionError, setActionError] = useState<string | null>(null);

    // Query for pending challenges
    const { data: challengeData, error: specificationError, loading } = useSpecification(
        j,
        pendingChallengesSpec,
        player,
        playground
    );

    // Transform the data into a more usable format
    const challenges: PendingChallenge[] = challengeData?.map(challenge => ({
        challengeId: challenge.challengeId,
        challengerStarts: challenge.challengerStarts,
        createdAt: new Date(challenge.createdAt),
        challengerName: Array.isArray(challenge.challengerName) && challenge.challengerName.length > 0
            ? challenge.challengerName[0]
            : 'Unknown Player',
        playgroundCode: challenge.playgroundCode
    })) || [];

    const clearError = () => {
        setActionError(null);
    };

    const acceptChallenge = async (challengeId: string) => {
        try {
            setActionError(null);

            // Find the challenge by ID
            const challenge = challenges.find(c => c.challengeId === challengeId);
            if (!challenge) {
                throw new Error('Challenge not found');
            }

            // TODO: Implement game creation logic
            // For now, just log the acceptance
            console.log('Accepting challenge:', challengeId);

            // In the future, this would create a Game fact
            // We'll need to query for the actual Challenge fact to get the Join references
            // await j.fact(new Game(challenge.challengerJoin, challenge.opponentJoin, challenge.challengerStarts, new Date()));

        } catch (error) {
            console.error('Error accepting challenge:', error);
            setActionError('Failed to accept challenge. Please try again.');
        }
    };

    const rejectChallenge = async (challengeId: string) => {
        try {
            setActionError(null);

            // Find the challenge by ID
            const challenge = challenges.find(c => c.challengeId === challengeId);
            if (!challenge) {
                throw new Error('Challenge not found');
            }

            // TODO: Implement reject logic
            // For now, just log the rejection
            console.log('Rejecting challenge:', challengeId);

            // In the future, this would create a Reject fact
            // We'll need to query for the actual Challenge fact to get the Join references
            // await j.fact(new Reject(challenge));

        } catch (error) {
            console.error('Error rejecting challenge:', error);
            setActionError('Failed to reject challenge. Please try again.');
        }
    };

    // Combine errors
    const combinedError = actionError || playerError || playgroundError || (specificationError ? specificationError.message : null);

    return {
        challenges,
        loading,
        error: combinedError,
        acceptChallenge,
        rejectChallenge,
        clearError,
    };
} 