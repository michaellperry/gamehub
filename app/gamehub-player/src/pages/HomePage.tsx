import { Alert, Button, Card, Container, Icon, PageLayout, Typography, CenteredContent } from '../components/atoms';
import { CodeInput, NameInput, PlayerPlaygroundsList } from '../components/molecules';
import { useHomePage } from '../hooks/useHomePage';

export default function HomePage() {
    const { playerName, playgroundLobby, playerPlaygrounds, playerSessions } = useHomePage();

    // Show loading state if playerName is still loading
    if (playerName.loading) {
        return (
            <PageLayout variant="default">
                <Container variant="hero">
                    <CenteredContent className="space-y-8">
                        <div className="space-y-4">
                            <Icon name="home" size="xl" className="text-primary-600 mx-auto" />
                            <Typography variant="h1" className="text-3xl font-bold text-gray-900">
                                Loading...
                            </Typography>
                        </div>
                    </CenteredContent>
                </Container>
            </PageLayout>
        );
    }

    // Show error state if there's an error and no data
    if (playerName.error && !playerName.data) {
        return (
            <PageLayout variant="default">
                <Container variant="hero">
                    <CenteredContent className="space-y-8">
                        <div className="space-y-4">
                            <Icon name="home" size="xl" className="text-primary-600 mx-auto" />
                            <Typography variant="h1" className="text-3xl font-bold text-gray-900">
                                Welcome to GameHub
                            </Typography>
                        </div>
                        <Alert
                            variant="error"
                            title="Error"
                            dismissible
                            onDismiss={playerName.clearError}
                            className="max-w-md mx-auto"
                        >
                            {playerName.error}
                        </Alert>
                    </CenteredContent>
                </Container>
            </PageLayout>
        );
    }

    if (playerName.data && playerName.data.showNameInput) {
        return (
            <PageLayout variant="default">
                <Container variant="hero">
                    <CenteredContent className="space-y-8">
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
                            value={playerName.data.playerName}
                            onSubmit={playerName.data.handleNameSubmit}
                            onCancel={playerName.data.handleCancel}
                            allowCancel={playerName.data.allowCancel}
                            loading={playerName.loading}
                            disabled={playerName.loading}
                        />
                    </CenteredContent>
                </Container>
            </PageLayout>
        );
    }

    const welcomeMessage = playerName.data
        ? `Welcome back, ${playerName.data.playerName || 'Player'}!`
        : '';

    return (
        <PageLayout variant="default">
            <Container variant="hero">
                <CenteredContent className="space-y-8">
                    {/* Header */}
                    <div className="space-y-4">
                        <Icon name="home" size="xl" className="text-primary-600 mx-auto" />
                        <Typography variant="h1" className="text-3xl font-bold text-gray-900">
                            GameHub Lobby
                        </Typography>
                        <Typography variant="body" className="text-gray-600">
                            {welcomeMessage}
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

                    {/* Simplified Player Sessions Section (Dev Mode Only) */}
                    {import.meta.env.DEV && (
                        <Card variant="game" size="lg" className="max-w-md mx-auto">
                            <div className="space-y-4">
                                <CenteredContent>
                                    <Icon name="friends" size="md" className="text-primary-600 mx-auto mb-2" />
                                    <Typography variant="h2" className="text-xl font-semibold text-gray-900">
                                        Simulated Players
                                    </Typography>
                                    <Typography variant="body-sm" className="text-gray-600">
                                        Development mode - Automatic player simulation
                                    </Typography>

                                    {/* Simulation Status */}
                                    <div className="mt-2 p-2 bg-gray-50 rounded-lg">
                                        <Typography variant="body-sm" className="text-gray-600">
                                            Simulation: {playerSessions.isEnabled ? '🟢 Enabled' : '🔴 Disabled'}
                                        </Typography>
                                        <Typography variant="body-sm" className="text-gray-500">
                                            Automatically creates players for new playgrounds
                                        </Typography>
                                    </div>
                                </CenteredContent>

                                {/* Enable/Disable Controls */}
                                <div className="flex justify-center space-x-2">
                                    <Button
                                        variant={playerSessions.isEnabled ? "secondary" : "primary"}
                                        size="sm"
                                        onClick={playerSessions.enableSimulation}
                                        disabled={playerSessions.isEnabled}
                                    >
                                        Enable Simulation
                                    </Button>
                                    <Button
                                        variant={playerSessions.isEnabled ? "primary" : "secondary"}
                                        size="sm"
                                        onClick={playerSessions.disableSimulation}
                                        disabled={!playerSessions.isEnabled}
                                    >
                                        Disable Simulation
                                    </Button>
                                </div>
                            </div>
                        </Card>
                    )}

                    {/* Start Playground Section */}
                    <Card variant="game" size="lg" className="max-w-md mx-auto">
                        <div className="space-y-4">
                            <CenteredContent>
                                <Icon name="play" size="md" className="text-primary-600 mx-auto mb-2" />
                                <Typography variant="h2" className="text-xl font-semibold text-gray-900">
                                    Start a New Playground
                                </Typography>
                                <Typography variant="body-sm" className="text-gray-600">
                                    Create a new game session and invite friends
                                </Typography>
                            </CenteredContent>

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
                            <CenteredContent>
                                <Icon name="door" size="md" className="text-primary-600 mx-auto mb-2" />
                                <Typography variant="h2" className="text-xl font-semibold text-gray-900">
                                    Join a Playground
                                </Typography>
                                <Typography variant="body-sm" className="text-gray-600">
                                    Enter the 6-letter code to join an existing game
                                </Typography>
                            </CenteredContent>

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
                    <CenteredContent>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => playerName.data?.setShowNameInput(true)}
                            className="text-gray-500 hover:text-gray-700"
                        >
                            Change Name
                        </Button>
                    </CenteredContent>
                </CenteredContent>
            </Container>
        </PageLayout>
    );
}
