import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Alert, Button, Card, Container, Icon, LoadingIndicator, PageLayout, Typography } from '../components/atoms';
import { ChallengeModal, ChallengeNotification, PlayerCard } from '../components/molecules';
import { PlaygroundGame, PlaygroundPlayer, usePlaygroundPage } from '../hooks/usePlaygroundPage';
import { usePendingChallenges } from '../hooks/usePendingChallenges';

export default function PlaygroundPage() {
    const { code } = useParams<{ code: string }>();
    const viewModel = usePlaygroundPage(code);
    const navigate = useNavigate();
    const [isLeaving, setIsLeaving] = useState(false);
    const [showLeaveConfirmation, setShowLeaveConfirmation] = useState(false);

    // Challenge modal state
    const [showChallengeModal, setShowChallengeModal] = useState(false);
    const [selectedOpponent, setSelectedOpponent] = useState<PlaygroundPlayer | null>(null);
    const [challengeLoading, setChallengeLoading] = useState(false);

    // Challenge notifications state
    const [showChallengeNotification, setShowChallengeNotification] = useState(false);
    const [selectedChallenge, setSelectedChallenge] = useState<any>(null);
    const [challengeActionLoading, setChallengeActionLoading] = useState(false);

    // Use the pending challenges hook
    const pendingChallenges = usePendingChallenges(code);

    if (!code) {
        return (
            <PageLayout variant="default">
                <Container variant="hero">
                    <div className="text-center space-y-4">
                        <Alert variant="error" title="Invalid Playground">
                            No playground code provided.
                        </Alert>
                    </div>
                </Container>
            </PageLayout>
        );
    }

    if (!viewModel.isValidCode) {
        return (
            <PageLayout variant="default">
                <Container variant="hero">
                    <div className="text-center space-y-4">
                        <Alert variant="error" title="Invalid Playground Code">
                            Playground code must be exactly 6 uppercase letters (e.g., ABCDEF).
                        </Alert>
                        <Button
                            variant="primary"
                            onClick={() => navigate('/')}
                        >
                            Back to Home
                        </Button>
                    </div>
                </Container>
            </PageLayout>
        );
    }

    const handleLeavePlayground = async () => {
        if (!viewModel.handleLeavePlayground) return;

        setIsLeaving(true);
        try {
            await viewModel.handleLeavePlayground();
            setShowLeaveConfirmation(false);
            // Navigate to home page after successful leave
            navigate('/', {
                state: {
                    message: 'Successfully left playground',
                    type: 'success'
                }
            });
        } catch (error) {
            console.error('Error leaving playground:', error);
            // Show error message
            alert('Failed to leave playground. Please try again.');
        } finally {
            setIsLeaving(false);
        }
    };

    // Challenge modal handlers
    const handleChallengeClick = (player: PlaygroundPlayer) => {
        setSelectedOpponent(player);
        setShowChallengeModal(true);
    };

    const handleChallengeClose = () => {
        setShowChallengeModal(false);
        setSelectedOpponent(null);
    };

    const handleChallengeSubmit = async (opponent: PlaygroundPlayer, challengerStarts: boolean) => {
        setChallengeLoading(true);
        try {
            // TODO: Implement actual challenge creation logic
            console.log('Creating challenge:', { opponent, challengerStarts });

            // For now, just close the modal
            setShowChallengeModal(false);
            setSelectedOpponent(null);
        } catch (error) {
            console.error('Error creating challenge:', error);
            // TODO: Show error message to user
        } finally {
            setChallengeLoading(false);
        }
    };

    // Get current player for challenge modal
    const currentPlayer = viewModel.data?.players.find(player => player.isCurrentPlayer);

    // Mock challenge status data - this would come from actual challenge hooks
    const getChallengeStatus = (player: PlaygroundPlayer) => {
        // TODO: Replace with actual challenge status from hooks
        // This is mock data for demonstration
        if (player.isCurrentPlayer) return undefined;

        // Simulate different challenge statuses for demo
        const statuses = ['pending', 'sent', 'received', 'accepted', 'rejected', 'expired'] as const;
        const randomStatus = statuses[Math.floor(Math.random() * statuses.length)];
        const hasChallenge = Math.random() > 0.7; // 30% chance of having a challenge

        if (!hasChallenge) return undefined;

        return {
            type: randomStatus,
            count: Math.floor(Math.random() * 3) + 1
        };
    };

    const handleChallengeStatusClick = (player: PlaygroundPlayer) => {
        // TODO: Implement challenge status click handler
        console.log('Challenge status clicked for player:', player.name);
    };

    // Challenge notification handlers
    const handleChallengeNotificationOpen = (challenge: any) => {
        setSelectedChallenge(challenge);
        setShowChallengeNotification(true);
    };

    const handleChallengeNotificationClose = () => {
        setShowChallengeNotification(false);
        setSelectedChallenge(null);
    };

    const handleAcceptChallenge = async () => {
        if (!selectedChallenge) return;

        setChallengeActionLoading(true);
        try {
            await pendingChallenges.acceptChallenge(selectedChallenge.challengeId);
            setShowChallengeNotification(false);
            setSelectedChallenge(null);
        } catch (error) {
            console.error('Error accepting challenge:', error);
        } finally {
            setChallengeActionLoading(false);
        }
    };

    const handleRejectChallenge = async () => {
        if (!selectedChallenge) return;

        setChallengeActionLoading(true);
        try {
            await pendingChallenges.rejectChallenge(selectedChallenge.challengeId);
            setShowChallengeNotification(false);
            setSelectedChallenge(null);
        } catch (error) {
            console.error('Error rejecting challenge:', error);
        } finally {
            setChallengeActionLoading(false);
        }
    };

    if (viewModel.loading) {
        return (
            <PageLayout variant="default">
                <Container variant="hero">
                    <div className="text-center space-y-4">
                        <LoadingIndicator size="lg" />
                        <Typography variant="body" className="text-gray-600">
                            Loading playground...
                        </Typography>
                    </div>
                </Container>
            </PageLayout>
        );
    }

    if (viewModel.error) {
        return (
            <PageLayout variant="default">
                <Container variant="hero">
                    <div className="text-center space-y-4">
                        <Alert variant="error" title="Error Loading Playground">
                            {viewModel.error}
                        </Alert>
                        <Button
                            variant="primary"
                            onClick={() => navigate('/')}
                        >
                            Back to Home
                        </Button>
                    </div>
                </Container>
            </PageLayout>
        );
    }

    return (
        <PageLayout variant="default">
            <Container variant="hero">
                <div className="space-y-6">
                    {/* Header */}
                    <div className="text-center space-y-4">
                        <div className="flex items-center justify-center space-x-4">
                            <Typography variant="h1" className="text-3xl font-bold text-gray-900">
                                Playground
                            </Typography>
                            <div className="flex items-center space-x-2">
                                <Typography variant="body" className="text-lg font-mono bg-gray-100 px-3 py-1 rounded">
                                    {code}
                                </Typography>
                                <Button
                                    variant="secondary"
                                    size="sm"
                                    onClick={() => {
                                        navigator.clipboard.writeText(code);
                                        // TODO: Show success message
                                    }}
                                >
                                    Copy
                                </Button>
                            </div>
                        </div>

                        <div className="flex justify-center space-x-4">
                            <Button
                                variant="primary"
                                onClick={() => navigate('/')}
                            >
                                Back to Home
                            </Button>
                            <Button
                                variant="danger"
                                onClick={() => setShowLeaveConfirmation(true)}
                                loading={isLeaving}
                            >
                                Leave Playground
                            </Button>
                        </div>
                    </div>

                    {/* Content */}
                    {!viewModel.loading && viewModel.data && (
                        <div className="space-y-6">
                            {/* Challenge Notifications Area */}
                            {pendingChallenges.challenges.length > 0 && (
                                <Card variant="game" size="lg">
                                    <div className="space-y-4">
                                        <div className="text-center">
                                            <Typography variant="h2" className="text-xl font-semibold text-gray-900">
                                                Incoming Challenges ({pendingChallenges.challenges.length})
                                            </Typography>
                                        </div>
                                        <div className="space-y-2">
                                            {pendingChallenges.challenges.map(challenge => {
                                                return (
                                                    <div
                                                        key={challenge.challengeId}
                                                        className="flex items-center justify-between p-3 bg-yellow-50 border border-yellow-200 rounded-lg cursor-pointer hover:bg-yellow-100 transition-colors"
                                                        onClick={() => handleChallengeNotificationOpen(challenge)}
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
                                                            onClick={() => handleChallengeNotificationOpen(challenge)}
                                                        >
                                                            Respond
                                                        </Button>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </Card>
                            )}

                            {/* Players Section */}
                            <Card variant="game" size="lg">
                                <div className="space-y-4">
                                    <div className="text-center">
                                        <Typography variant="h2" className="text-xl font-semibold text-gray-900">
                                            Players ({viewModel.data.players.length})
                                        </Typography>
                                    </div>

                                    {viewModel.data.players.length === 0 ? (
                                        <div className="text-center py-8">
                                            <Typography variant="body" className="text-gray-600">
                                                No players have joined yet. Share the code to invite friends!
                                            </Typography>
                                        </div>
                                    ) : (
                                        <div className="space-y-2">
                                            {viewModel.data.players.map(player => (
                                                <PlayerCard
                                                    key={player.playerId}
                                                    player={player}
                                                    isCurrentPlayer={player.isCurrentPlayer}
                                                    challengeStatus={getChallengeStatus(player)}
                                                    onChallengeClick={handleChallengeClick}
                                                    onChallengeStatusClick={() => handleChallengeStatusClick(player)}
                                                />
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </Card>

                            {/* Active Games Section */}
                            {viewModel.data.games.length > 0 && (
                                <Card variant="game" size="lg">
                                    <div className="space-y-4">
                                        <div className="text-center">
                                            <Typography variant="h2" className="text-xl font-semibold text-gray-900">
                                                Active Games ({viewModel.data.games.length})
                                            </Typography>
                                        </div>

                                        <div className="space-y-2">
                                            {viewModel.data.games.map((game: PlaygroundGame) => (
                                                <div
                                                    key={game.id}
                                                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                                                >
                                                    <div className="flex items-center space-x-3">
                                                        <Icon name="play" size="sm" className="text-gray-500" />
                                                        <div>
                                                            <Typography variant="body" className="font-medium">
                                                                {game.playerX.name} vs {game.playerO.name}
                                                            </Typography>
                                                            <Typography variant="body-sm" className="text-gray-500">
                                                                Status: {game.status}
                                                            </Typography>
                                                        </div>
                                                    </div>
                                                    <Button
                                                        variant="primary"
                                                        size="sm"
                                                        onClick={() => viewModel.handleJoinGame(game)}
                                                    >
                                                        Join
                                                    </Button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </Card>
                            )}

                            {/* Challenge Modal */}
                            {currentPlayer && selectedOpponent && (
                                <ChallengeModal
                                    isOpen={showChallengeModal}
                                    onClose={handleChallengeClose}
                                    onChallenge={handleChallengeSubmit}
                                    selectedOpponent={selectedOpponent}
                                    challengerName={currentPlayer.name}
                                    playgroundCode={code}
                                    loading={challengeLoading}
                                />
                            )}

                            {/* Challenge Notification Modal */}
                            {selectedChallenge && (
                                <ChallengeNotification
                                    isOpen={showChallengeNotification}
                                    onClose={handleChallengeNotificationClose}
                                    onAccept={handleAcceptChallenge}
                                    onReject={handleRejectChallenge}
                                    challenger={{
                                        playerId: 'challenger-' + selectedChallenge.challengeId,
                                        name: selectedChallenge.challengerName,
                                        joinedAt: selectedChallenge.createdAt,
                                        isCurrentPlayer: false
                                    }}
                                    playgroundCode={code}
                                    loading={challengeActionLoading}
                                />
                            )}
                        </div>
                    )}
                </div>
            </Container>

            {/* Leave Confirmation Modal */}
            {showLeaveConfirmation && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
                        <Typography variant="h3" className="mb-4">
                            Leave Playground?
                        </Typography>
                        <Typography variant="body" className="mb-6 text-gray-600">
                            Are you sure you want to leave this playground? You can rejoin anytime using the code.
                        </Typography>
                        <div className="flex space-x-3">
                            <Button
                                variant="danger"
                                onClick={handleLeavePlayground}
                                loading={isLeaving}
                                fullWidth
                            >
                                Leave Playground
                            </Button>
                            <Button
                                variant="secondary"
                                onClick={() => setShowLeaveConfirmation(false)}
                                disabled={isLeaving}
                                fullWidth
                            >
                                Cancel
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </PageLayout>
    );
} 