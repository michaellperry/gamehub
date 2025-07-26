import { useParams } from 'react-router-dom';
import { Alert, Button, CenteredContent, Container, LoadingIndicator, PageLayout, Typography } from '../components/atoms';
import { ChallengeModal } from '../components/molecules';
import { ActiveGames, IncomingChallengesCard, PlaygroundPlayersList } from '../components/organisms';
import { usePlaygroundPageComposed } from '../hooks/usePlaygroundPageComposed';

export default function PlaygroundPage() {
    const { code } = useParams<{ code: string }>();
    const viewModel = usePlaygroundPageComposed(code);

    if (!code) {
        return (
            <PageLayout variant="default">
                <Container variant="hero">
                    <CenteredContent className="space-y-4">
                        <Alert variant="error" title="Invalid Playground">
                            No playground code provided.
                        </Alert>
                    </CenteredContent>
                </Container>
            </PageLayout>
        );
    }

    if (!viewModel.isValidCode) {
        return (
            <PageLayout variant="default">
                <Container variant="hero">
                    <CenteredContent className="space-y-4">
                        <Alert variant="error" title="Invalid Playground Code">
                            Playground code must be exactly 6 uppercase letters (e.g., ABCDEF).
                        </Alert>
                        <Button
                            variant="primary"
                            onClick={viewModel.data?.navigate.goHome}
                        >
                            Back to Home
                        </Button>
                    </CenteredContent>
                </Container>
            </PageLayout>
        );
    }

    // Get current player for challenge modal
    const currentPlayer = viewModel.data?.players.find(player => player.isCurrentPlayer);

    if (viewModel.loading) {
        return (
            <PageLayout variant="default">
                <Container variant="hero">
                    <CenteredContent className="space-y-4">
                        <LoadingIndicator size="lg" />
                        <Typography variant="body" className="text-gray-600">
                            Loading playground...
                        </Typography>
                    </CenteredContent>
                </Container>
            </PageLayout>
        );
    }

    if (viewModel.error) {
        return (
            <PageLayout variant="default">
                <Container variant="hero">
                    <CenteredContent className="space-y-4">
                        <Alert variant="error" title="Error Loading Playground">
                            {viewModel.error}
                        </Alert>
                        <Button
                            variant="primary"
                            onClick={viewModel.data?.navigate.goHome}
                        >
                            Back to Home
                        </Button>
                    </CenteredContent>
                </Container>
            </PageLayout>
        );
    }

    // Early null check for data
    if (!viewModel.data) {
        return (
            <PageLayout variant="default">
                <Container variant="hero">
                    <CenteredContent className="space-y-4">
                        <LoadingIndicator size="lg" />
                        <Typography variant="body" className="text-gray-600">
                            Loading playground data...
                        </Typography>
                    </CenteredContent>
                </Container>
            </PageLayout>
        );
    }

    return (
        <PageLayout variant="default">
            <Container variant="hero">
                <div className="space-y-6">
                    {/* Header */}
                    <CenteredContent className="space-y-4">
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
                                    onClick={viewModel.data.ui.copyCode}
                                >
                                    Copy
                                </Button>
                            </div>
                        </div>

                        <div className="flex justify-center space-x-4">
                            <Button
                                variant="primary"
                                onClick={viewModel.data.navigate.goHome}
                            >
                                Back to Home
                            </Button>
                            <Button
                                variant="danger"
                                onClick={viewModel.data.leave.handleLeaveClick}
                                loading={viewModel.data.leave.isLeaving}
                            >
                                Leave Playground
                            </Button>
                        </div>
                    </CenteredContent>

                    {/* Content */}
                    {!viewModel.loading && (
                        <div className="space-y-6">
                            {/* Challenge Notifications Area */}
                            <IncomingChallengesCard
                                currentPlayerJoin={viewModel.currentPlayerJoin}
                                playgroundCode={code}
                            />

                            {/* Players Section */}
                            <PlaygroundPlayersList
                                players={viewModel.data.players}
                                onChallengeClick={viewModel.data.challenge.modal.handleChallengeClick}
                            />

                            {/* Active Games Section */}
                            <ActiveGames viewModel={viewModel.data.activeGames} />

                            {/* Challenge Modal */}
                            {currentPlayer && viewModel.data.challenge.modal.selectedOpponent && (
                                <ChallengeModal
                                    viewModel={viewModel.data.challenge.modal}
                                    challengerName={currentPlayer.name}
                                    playgroundCode={code}
                                />
                            )}


                        </div>
                    )}
                </div>
            </Container>

            {/* Leave Confirmation Modal */}
            {viewModel.data.leave.showLeaveConfirmation && (
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
                                onClick={viewModel.data.leave.handleLeaveConfirm}
                                loading={viewModel.data.leave.isLeaving}
                                fullWidth
                            >
                                Leave Playground
                            </Button>
                            <Button
                                variant="secondary"
                                onClick={viewModel.data.leave.handleLeaveCancel}
                                disabled={viewModel.data.leave.isLeaving}
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