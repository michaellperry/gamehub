import React, { useState } from 'react';
import { Button, Typography } from '../atoms';
import { Modal, GameStarterSelector } from './index';
import { PlaygroundPlayer } from '../../hooks/usePlaygroundPage';

export interface ChallengeModalProps {
    isOpen: boolean;
    onClose: () => void;
    onChallenge: (opponent: PlaygroundPlayer, challengerStarts: boolean) => void;
    selectedOpponent: PlaygroundPlayer;
    challengerName: string;
    playgroundCode: string;
    loading?: boolean;
}

export const ChallengeModal: React.FC<ChallengeModalProps> = ({
    isOpen,
    onClose,
    onChallenge,
    selectedOpponent,
    challengerName,
    playgroundCode,
    loading = false,
}) => {
    const [challengerStarts, setChallengerStarts] = useState<boolean>(true);

    // Reset state when modal opens
    React.useEffect(() => {
        if (isOpen) {
            setChallengerStarts(true);
        }
    }, [isOpen]);

    const handleChallenge = () => {
        onChallenge(selectedOpponent, challengerStarts);
    };

    const canSubmit = !loading;

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Challenge Player"
            size="md"
            footer={
                <div className="sm:grid sm:grid-cols-2 sm:gap-3 sm:grid-flow-row-dense">
                    <Button
                        variant="primary"
                        onClick={handleChallenge}
                        disabled={!canSubmit}
                        loading={loading}
                        className="sm:col-start-2"
                    >
                        {loading ? 'Sending Challenge...' : 'Send Challenge'}
                    </Button>
                    <Button
                        variant="secondary"
                        onClick={onClose}
                        disabled={loading}
                        className="mt-3 sm:mt-0 sm:col-start-1"
                    >
                        Cancel
                    </Button>
                </div>
            }
        >
            <div className="space-y-6">
                {/* Playground Info */}
                <div className="text-center">
                    <Typography variant="body" className="text-gray-600">
                        Playground: {playgroundCode}
                    </Typography>
                </div>

                {/* Selected Opponent Info */}
                <div className="text-center">
                    <Typography variant="h3" className="text-sm font-medium mb-2">
                        Challenging:
                    </Typography>
                    <Typography variant="body" className="text-lg font-semibold">
                        {selectedOpponent.name}
                    </Typography>
                </div>

                {/* Who Starts Selection */}
                <div>
                    <Typography variant="h3" className="text-sm font-medium mb-3">
                        Who starts the game?
                    </Typography>
                    <GameStarterSelector
                        challengerName={challengerName}
                        selectedOpponent={selectedOpponent}
                        challengerStarts={challengerStarts}
                        onStarterChange={setChallengerStarts}
                    />
                </div>
            </div>
        </Modal>
    );
}; 