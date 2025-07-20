import { useEffect, useState } from 'react';
import { Button, Card, Container, Icon, PageLayout, Typography } from '../components/atoms';
import { CodeInput, NameInput } from '../components/molecules';

export default function HomePage() {
    const [playerName, setPlayerName] = useState<string>('');
    const [playgroundCode, setPlaygroundCode] = useState<string>('');
    const [showNameInput, setShowNameInput] = useState<boolean>(true);

    // Load player name from localStorage on component mount
    useEffect(() => {
        const savedName = localStorage.getItem('gamehub-player-name');
        if (savedName) {
            setPlayerName(savedName);
            setShowNameInput(false);
        }
    }, []);

    const handleNameSubmit = (name: string) => {
        setPlayerName(name);
        localStorage.setItem('gamehub-player-name', name);
        setShowNameInput(false);
    };

    const handleStartPlayground = () => {
        // Generate a random 6-letter code
        const code = Array.from({ length: 6 }, () =>
            String.fromCharCode(65 + Math.floor(Math.random() * 26))
        ).join('');

        // Navigate to the playground
        window.location.href = `/playground/${code}`;
    };

    const handleJoinPlayground = () => {
        if (playgroundCode.length === 6) {
            window.location.href = `/playground/${playgroundCode}`;
        }
    };

    const canJoinPlayground = playgroundCode.length === 6;

    if (showNameInput) {
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

                        <NameInput onSubmit={handleNameSubmit} />
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
                            GameHub Playground
                        </Typography>
                        <Typography variant="body" className="text-gray-600">
                            Welcome back, {playerName}!
                        </Typography>
                    </div>

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
                                onClick={handleStartPlayground}
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
                                <Icon name="friends" size="md" className="text-primary-600 mx-auto mb-2" />
                                <Typography variant="h2" className="text-xl font-semibold text-gray-900">
                                    Join a Playground
                                </Typography>
                                <Typography variant="body-sm" className="text-gray-600">
                                    Enter the 6-letter code to join an existing game
                                </Typography>
                            </div>

                            <CodeInput
                                value={playgroundCode}
                                onChange={setPlaygroundCode}
                                className="mb-4"
                            />

                            <Button
                                variant="secondary"
                                size="lg"
                                fullWidth
                                disabled={!canJoinPlayground}
                                onClick={handleJoinPlayground}
                                icon={<Icon name="join" size="md" />}
                            >
                                Join Playground
                            </Button>
                        </div>
                    </Card>

                    {/* Change Name Option */}
                    <div className="text-center">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setShowNameInput(true)}
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
