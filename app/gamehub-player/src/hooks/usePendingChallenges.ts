import { Challenge, Game, Join, PlayerName, Playground, Reject, model } from '@model/model';
import { useSpecification } from 'jinaga-react';
import { useState } from 'react';
import { j } from '../jinaga-config';

export interface PendingChallenge {
    challengeId: string;
    challengerStarts: boolean;
    createdAt: Date;
    challengerName: string;
    playgroundCode: string;
    challengerJoin: Join;
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
const pendingChallengesSpec = model.given(Join, Playground).match((opponentJoin, playground) =>
    Challenge.whereOpponent(opponentJoin.player)
        .join(challenge => challenge.opponentJoin, opponentJoin)
        .select(challenge => ({
            challengeId: j.hash(challenge),
            challengerStarts: challenge.challengerStarts,
            createdAt: challenge.createdAt,
            challengerName: challenge.challengerJoin.player.predecessor()
                .selectMany(player => PlayerName.current(player).select(name => name.name)),
            playgroundCode: playground.code,
            challengerJoin: challenge.challengerJoin
        }))
);

export function usePendingChallenges(playground: Playground | null, currentPlayerJoin: Join | null): PendingChallengesViewModel {
    const [actionError, setActionError] = useState<string | null>(null);

    // Query for pending challenges only if we have the current player's join and playground
    const { data: challengeData, error: specificationError, loading } = useSpecification(
        j,
        pendingChallengesSpec,
        currentPlayerJoin,
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
        playgroundCode: challenge.playgroundCode,
        challengerJoin: challenge.challengerJoin
    })) || [];

    const clearError = () => {
        setActionError(null);
    };

    const acceptChallenge = async (challengeId: string) => {
        try {
            setActionError(null);

            if (!currentPlayerJoin || !playground) {
                throw new Error('Current player join or playground not available');
            }

            // Find the challenge by ID
            const challenge = challenges.find(c => c.challengeId === challengeId);
            if (!challenge) {
                throw new Error('Challenge not found');
            }

            // We need to find the actual Challenge fact to create the Game
            // Query for the challenge using the challengeId (which is the hash)
            const challengeFacts = await j.query(
                model.given(Join, Playground).match((opponentJoin, _playground) =>
                    Challenge.whereOpponent(opponentJoin.player)
                        .join(challenge => challenge.opponentJoin, opponentJoin)
                        .select(challenge => ({
                            challenge,
                            challengeId: j.hash(challenge)
                        }))
                ),
                currentPlayerJoin,
                playground
            );

            // Find the specific challenge by ID
            const challengeFact = challengeFacts.find(c => c.challengeId === challengeId);
            if (!challengeFact) {
                throw new Error('Challenge fact not found');
            }

            // Create the Game fact
            await j.fact(new Game(challengeFact.challenge));

        } catch (error) {
            console.error('Error accepting challenge:', error);
            setActionError('Failed to accept challenge. Please try again.');
        }
    };

    const rejectChallenge = async (challengeId: string) => {
        try {
            setActionError(null);

            if (!currentPlayerJoin || !playground) {
                throw new Error('Current player join or playground not available');
            }

            // Find the challenge by ID
            const challenge = challenges.find(c => c.challengeId === challengeId);
            if (!challenge) {
                throw new Error('Challenge not found');
            }

            // We need to find the actual Challenge fact to create the Reject
            // Query for the challenge using the challengeId (which is the hash)
            const challengeFacts = await j.query(
                model.given(Join, Playground).match((opponentJoin, _playground) =>
                    Challenge.whereOpponent(opponentJoin.player)
                        .join(challenge => challenge.opponentJoin, opponentJoin)
                        .select(challenge => ({
                            challenge,
                            challengeId: j.hash(challenge)
                        }))
                ),
                currentPlayerJoin,
                playground
            );

            // Find the specific challenge by ID
            const challengeFact = challengeFacts.find(c => c.challengeId === challengeId);
            if (!challengeFact) {
                throw new Error('Challenge fact not found');
            }

            // Create the Reject fact
            await j.fact(new Reject(challengeFact.challenge));

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