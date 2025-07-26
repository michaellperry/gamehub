import React from 'react';
import { ChallengeModalViewModel } from '../../hooks/useChallengeModal';
import { Button, Typography } from '../atoms';
import { GameStarterSelector, Modal } from './index';

export interface ChallengeModalProps {
    viewModel: ChallengeModalViewModel;
    challengerName: string;
    playgroundCode: string;
}

export const ChallengeModal: React.FC<ChallengeModalProps> = ({
    viewModel,
    challengerName,
    playgroundCode,
}) => {
    const handleChallenge = () => {
        if (viewModel.selectedOpponent) {
            viewModel.handleChallengeSubmit(viewModel.selectedOpponent, viewModel.challengerStarts);
        }
    };

    const canSubmit = !viewModel.loading;

    return (
        <Modal
            isOpen={viewModel.showChallengeModal}
            onClose={viewModel.handleChallengeClose}
            title="Challenge Player"
            size="md"
            footer={
                <div className="sm:grid sm:grid-cols-2 sm:gap-3 sm:grid-flow-row-dense">
                    <Button
                        variant="primary"
                        onClick={handleChallenge}
                        disabled={!canSubmit}
                        loading={viewModel.loading}
                        className="sm:col-start-2"
                    >
                        {viewModel.loading ? 'Sending Challenge...' : 'Send Challenge'}
                    </Button>
                    <Button
                        variant="secondary"
                        onClick={viewModel.handleChallengeClose}
                        disabled={viewModel.loading}
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
                        {viewModel.selectedOpponent?.name}
                    </Typography>
                </div>

                {/* Who Starts Selection */}
                <div>
                    <Typography variant="h3" className="text-sm font-medium mb-3">
                        Who starts the game?
                    </Typography>
                    <GameStarterSelector
                        challengerName={challengerName}
                        selectedOpponent={viewModel.selectedOpponent!}
                        challengerStarts={viewModel.challengerStarts}
                        onStarterChange={viewModel.setChallengerStarts}
                    />
                </div>
            </div>
        </Modal>
    );
}; 