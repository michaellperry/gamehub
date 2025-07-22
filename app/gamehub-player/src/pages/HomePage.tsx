import { Alert, Button, Card, Container, Icon, PageLayout, Typography } from '../components/atoms';
import { CodeInput, NameInput, PlayerPlaygroundsList } from '../components/molecules';
import { useHomePage } from '../hooks/useHomePage';

export default function HomePage() {
    const { playerName, playgroundLobby, playerPlaygrounds, playerSessions } = useHomePage();

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

                    {/* Simulated Players Section (Dev Mode Only) */}
                    {import.meta.env.DEV && playerSessions.players.length > 0 && (
                        <Card variant="game" size="lg" className="max-w-md mx-auto">
                            <div className="space-y-4">
                                <div className="text-center">
                                    <Icon name="friends" size="md" className="text-primary-600 mx-auto mb-2" />
                                    <Typography variant="h2" className="text-xl font-semibold text-gray-900">
                                        Simulated Players
                                    </Typography>
                                    <Typography variant="body-sm" className="text-gray-600">
                                        Development mode - {playerSessions.players.length} players ({playerSessions.activePlayers.length} active)
                                    </Typography>
                                </div>

                                {/* Player Sessions Error Display */}
                                {playerSessions.error && (
                                    <Alert
                                        variant="error"
                                        title="Player Sessions Error"
                                        dismissible
                                        onDismiss={playerSessions.clearError}
                                        className="max-w-sm mx-auto"
                                    >
                                        {playerSessions.error}
                                    </Alert>
                                )}

                                {/* Players List */}
                                <div className="space-y-2">
                                    {playerSessions.players.map((player) => (
                                        <div
                                            key={player.id}
                                            className={`flex items-center justify-between p-3 rounded-lg border ${player.isActive
                                                ? 'border-primary-500 bg-primary-50'
                                                : 'border-gray-200 bg-white'
                                                }`}
                                        >
                                            <div className="flex items-center space-x-3">
                                                <div className={`w-3 h-3 rounded-full ${player.isActive ? 'bg-primary-500' : 'bg-gray-300'
                                                    }`} />
                                                <Typography variant="body" className="font-medium">
                                                    {player.name}
                                                </Typography>
                                            </div>
                                            <Button
                                                variant={player.isActive ? "primary" : "secondary"}
                                                size="sm"
                                                onClick={() => playerSessions.togglePlayerActive(player.id)}
                                                disabled={playerSessions.isLoading}
                                            >
                                                {player.isActive ? 'Active' : 'Inactive'}
                                            </Button>
                                        </div>
                                    ))}
                                </div>

                                {/* Create More Players Button */}
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => playerSessions.createPlayers(1, 'Simulated Player')}
                                    disabled={playerSessions.isLoading}
                                    loading={playerSessions.isLoading}
                                >
                                    Add Another Player
                                </Button>
                            </div>
                        </Card>
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
