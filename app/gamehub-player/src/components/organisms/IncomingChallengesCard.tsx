import { Join } from '@model/model';
import React from 'react';
import { useIncomingChallenges } from '../../hooks/useIncomingChallenges';
import { Button, Card, Icon, Typography, CenteredContent } from '../atoms';
import { ChallengeNotification } from '../molecules';

export interface IncomingChallengesCardProps {
    currentPlayerJoin: Join | null;
    playgroundCode: string;
}

export const IncomingChallengesCard: React.FC<IncomingChallengesCardProps> = ({
    currentPlayerJoin,
    playgroundCode,
}) => {
    // Use the view model hook
    const viewModel = useIncomingChallenges(currentPlayerJoin);

    // Don't render if no challenges
    if (viewModel.challenges.length === 0) {
        return null;
    }

    return (
        <>
            <Card variant="game" size="lg">
                <div className="space-y-4">
                    <CenteredContent>
                        <Typography variant="h2" className="text-xl font-semibold text-gray-900">
                            Incoming Challenges ({viewModel.challenges.length})
                        </Typography>
                    </CenteredContent>
                    <div className="space-y-2">
                        {viewModel.challenges.map(challenge => (
                            <div
                                key={challenge.challengeId}
                                className="flex items-center justify-between p-3 bg-yellow-50 border border-yellow-200 rounded-lg cursor-pointer hover:bg-yellow-100 transition-colors"
                                onClick={() => viewModel.handleChallengeSelect(challenge)}
                            >
                                <div className="flex items-center space-x-3">
                                    <Icon name="notifications" size="sm" className="text-yellow-600" />
                                    <div>
                                        <Typography variant="body" className="font-medium">
                                            Challenge from {challenge.challengerName}
                                        </Typography>
                                        <Typography variant="body-sm" className="text-gray-500">
                                            Received {challenge.createdAt.toLocaleTimeString()}
                                        </Typography>
                                    </div>
                                </div>
                                <Button
                                    variant="primary"
                                    size="sm"
                                    onClick={() => viewModel.handleChallengeSelect(challenge)}
                                >
                                    Respond
                                </Button>
                            </div>
                        ))}
                    </div>
                </div>
            </Card>

            {/* Challenge Notification Modal */}
            {viewModel.selectedChallenge && (
                <ChallengeNotification
                    isOpen={viewModel.showNotification}
                    onClose={viewModel.handleChallengeDismiss}
                    onAccept={viewModel.handleAcceptChallenge}
                    onReject={viewModel.handleRejectChallenge}
                    challenger={{
                        playerId: 'challenger-' + viewModel.selectedChallenge.challengeId,
                        name: viewModel.selectedChallenge.challengerName,
                        joinedAt: viewModel.selectedChallenge.createdAt,
                        isCurrentPlayer: false,
                        join: viewModel.selectedChallenge.challengerJoin,
                        isChallengePending: false
                    }}
                    playgroundCode={playgroundCode}
                    loading={viewModel.loading}
                />
            )}
        </>
    );
}; 