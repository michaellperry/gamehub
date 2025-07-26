import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Alert, Button, Card, Container, Icon, LoadingIndicator, PageLayout, Typography } from '../components/atoms';
import { ChallengeModal } from '../components/molecules';
import { IncomingChallengesCard, PlaygroundPlayersList } from '../components/organisms';
import { useChallenge } from '../hooks/useChallenge';
import { PlaygroundGame, PlaygroundPlayer, usePlaygroundPage } from '../hooks/usePlaygroundPage';

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





    // Use the challenge creation hook
    const challengeViewModel = useChallenge(viewModel.currentPlayerJoin);

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
            // Use the challenge hook to create the challenge
            await challengeViewModel.createChallenge(opponent.join, challengerStarts);

            // Close the modal on success
            setShowChallengeModal(false);
            setSelectedOpponent(null);
        } catch (error) {
            console.error('Error creating challenge:', error);
            // Error is already handled by the hook
        } finally {
            setChallengeLoading(false);
        }
    };

    // Get current player for challenge modal
    const currentPlayer = viewModel.data?.players.find(player => player.isCurrentPlayer);

    const handleChallengeStatusClick = (player: PlaygroundPlayer) => {
        // TODO: Implement challenge status click handler
        console.log('Challenge status clicked for player:', player.name);
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
                            <IncomingChallengesCard
                                currentPlayerJoin={viewModel.currentPlayerJoin}
                                playgroundCode={code}
                            />

                            {/* Players Section */}
                            <PlaygroundPlayersList
                                players={viewModel.data.players}
                                onChallengeClick={handleChallengeClick}
                                onChallengeStatusClick={handleChallengeStatusClick}
                            />

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