import { useParams } from 'react-router-dom';
import { Alert, Button, Card, Container, Icon, LoadingIndicator, PageLayout, Typography } from '../components/atoms';
import { PlaygroundGame, usePlaygroundPage } from '../hooks/usePlaygroundPage';

export default function PlaygroundPage() {
    const { code } = useParams<{ code: string }>();
    const viewModel = usePlaygroundPage(code);

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
                            onClick={() => window.location.href = '/'}
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
                <div className="space-y-8">
                    {/* Header */}
                    <div className="text-center space-y-4">
                        <Icon name="home" size="xl" className="text-primary-600 mx-auto" />
                        <Typography variant="h1" className="text-3xl font-bold text-gray-900">
                            Playground: {code}
                        </Typography>
                        <Typography variant="body" className="text-gray-600">
                            Share this code with friends to join the playground
                        </Typography>
                    </div>

                    {/* Error Display */}
                    {viewModel.error && (
                        <Alert
                            variant="error"
                            title="Playground Error"
                            dismissible
                            onDismiss={viewModel.clearError}
                            className="max-w-md mx-auto"
                        >
                            {viewModel.error}
                        </Alert>
                    )}

                    {/* Loading State */}
                    {viewModel.loading && (
                        <div className="text-center py-12">
                            <LoadingIndicator
                                size="lg"
                                variant="spinner"
                                text="Loading playground..."
                            />
                        </div>
                    )}

                    {/* Playground Content */}
                    {!viewModel.loading && viewModel.data && (
                        <div className="space-y-6">
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
                                                <div
                                                    key={player.playerId}
                                                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                                                >
                                                    <div className="flex items-center space-x-3">
                                                        <Icon name="profile" size="sm" className="text-gray-500" />
                                                        <Typography variant="body" className="font-medium">
                                                            {player.name}
                                                        </Typography>
                                                    </div>
                                                    {player.isCurrentPlayer ? (
                                                        <Typography variant="body" className="font-medium">
                                                            (That's you!)
                                                        </Typography>
                                                    ) : (
                                                        <Button
                                                            variant="secondary"
                                                            size="sm"
                                                            disabled={player.isCurrentPlayer}
                                                            onClick={() => viewModel.handleChallengePlayer(player)}
                                                        >
                                                            Challenge
                                                        </Button>
                                                    )}
                                                </div>
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
                                                        <Typography variant="body" className="font-medium">
                                                            {game.playerX.name} vs {game.playerO.name}
                                                        </Typography>
                                                    </div>
                                                    <Button
                                                        variant="primary"
                                                        size="sm"
                                                        onClick={() => viewModel.handleJoinGame(game)}
                                                    >
                                                        {game.status === 'waiting' ? 'Join' : 'Watch'}
                                                    </Button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </Card>
                            )}

                            {/* Back to Home */}
                            <div className="text-center">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => window.location.href = '/'}
                                    className="text-gray-500 hover:text-gray-700"
                                >
                                    Back to Home
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            </Container>
        </PageLayout>
    );
} 