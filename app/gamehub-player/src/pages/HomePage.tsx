import { Alert, Button, Card, Container, Icon, PageLayout, Typography } from '../components/atoms';
import { CodeInput, NameInput, PlayerPlaygroundsList } from '../components/molecules';
import { useHomePage } from '../hooks/useHomePage';

export default function HomePage() {
    const { playerName, playgroundLobby, playerPlaygrounds } = useHomePage();

    if (playerName.showNameInput) {
        return (
            <PageLayout variant="default">
                <Container variant="hero">
                    <div className="text-center space-y-8">
                        <div className="space-y-4">
                            <Icon name="home" size="xl" className="text-primary-600 mx-auto" />
                            <Typography variant="h1" className="text-3xl font-bold text-gray-900">
                                Welcome to GameHub
                            </Typography>
                            <Typography variant="body" className="text-gray-600">
                                Join multiplayer games and have fun with friends
                            </Typography>
                        </div>

                        {/* Player Name Error Display */}
                        {playerName.error && (
                            <Alert
                                variant="error"
                                title="Name Error"
                                dismissible
                                onDismiss={playerName.clearError}
                                className="max-w-md mx-auto"
                            >
                                {playerName.error}
                            </Alert>
                        )}

                        <NameInput
                            value={playerName.playerName}
                            onSubmit={playerName.handleNameSubmit}
                            onCancel={playerName.handleCancel}
                            allowCancel={playerName.allowCancel}
                            loading={playerName.loading}
                            disabled={playerName.loading}
                        />
                    </div>
                </Container>
            </PageLayout>
        );
    }

    return (
        <PageLayout variant="default">
            <Container variant="hero">
                <div className="text-center space-y-8">
                    {/* Header */}
                    <div className="space-y-4">
                        <Icon name="home" size="xl" className="text-primary-600 mx-auto" />
                        <Typography variant="h1" className="text-3xl font-bold text-gray-900">
                            GameHub Lobby
                        </Typography>
                        <Typography variant="body" className="text-gray-600">
                            Welcome back, {playerName.playerName}!
                        </Typography>
                    </div>

                    {/* Error Display */}
                    {playgroundLobby.error && (
                        <Alert
                            variant="error"
                            title="Playground Error"
                            dismissible
                            onDismiss={playgroundLobby.clearError}
                            className="max-w-md mx-auto"
                        >
                            {playgroundLobby.error}
                        </Alert>
                    )}

                    {/* Start Playground Section */}
                    <Card variant="game" size="lg" className="max-w-md mx-auto">
                        <div className="space-y-4">
                            <div className="text-center">
                                <Icon name="play" size="md" className="text-primary-600 mx-auto mb-2" />
                                <Typography variant="h2" className="text-xl font-semibold text-gray-900">
                                    Start a New Playground
                                </Typography>
                                <Typography variant="body-sm" className="text-gray-600">
                                    Create a new game session and invite friends
                                </Typography>
                            </div>

                            <Button
                                variant="primary"
                                size="lg"
                                fullWidth
                                loading={playgroundLobby.isLoading}
                                disabled={playgroundLobby.isLoading}
                                onClick={playgroundLobby.handleStartPlayground}
                                icon={<Icon name="play" size="md" />}
                            >
                                Start Playground
                            </Button>
                        </div>
                    </Card>

                    {/* Join Playground Section */}
                    <Card variant="game" size="lg" className="max-w-md mx-auto">
                        <div className="space-y-4">
                            <div className="text-center">
                                <Icon name="door" size="md" className="text-primary-600 mx-auto mb-2" />
                                <Typography variant="h2" className="text-xl font-semibold text-gray-900">
                                    Join a Playground
                                </Typography>
                                <Typography variant="body-sm" className="text-gray-600">
                                    Enter the 6-letter code to join an existing game
                                </Typography>
                            </div>

                            <CodeInput
                                value={playgroundLobby.playgroundCode}
                                onChange={playgroundLobby.setPlaygroundCode}
                                className="mb-4"
                            />

                            <Button
                                variant="secondary"
                                size="lg"
                                fullWidth
                                loading={playgroundLobby.isLoading}
                                disabled={!playgroundLobby.canJoinPlayground || playgroundLobby.isLoading}
                                onClick={playgroundLobby.handleJoinPlayground}
                                icon={<Icon name="join" size="md" />}
                            >
                                Join Playground
                            </Button>
                        </div>
                    </Card>

                    {/* Player Playgrounds List */}
                    <PlayerPlaygroundsList
                        playgrounds={playerPlaygrounds.playgrounds}
                        loading={playerPlaygrounds.loading}
                        error={playerPlaygrounds.error}
                        onClearError={playerPlaygrounds.clearError}
                    />

                    {/* Change Name Option */}
                    <div className="text-center">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => playerName.setShowNameInput(true)}
                            className="text-gray-500 hover:text-gray-700"
                        >
                            Change Name
                        </Button>
                    </div>
                </div>
            </Container>
        </PageLayout>
    );
}
