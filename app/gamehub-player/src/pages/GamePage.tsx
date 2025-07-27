import { useParams, useNavigate } from 'react-router-dom';
import { Alert, Button, CenteredContent, Container, PageLayout, Typography } from '../components/atoms';

export default function GamePage() {
    const { code, gameId } = useParams<{ code: string; gameId: string }>();
    const navigate = useNavigate();

    // Decode the game ID to handle URL-encoded special characters
    const decodedGameId = gameId ? decodeURIComponent(gameId) : undefined;

    if (!code || !decodedGameId) {
        return (
            <PageLayout variant="default">
                <Container variant="hero">
                    <CenteredContent className="space-y-4">
                        <Alert variant="error" title="Invalid Game">
                            Missing playground code or game ID.
                        </Alert>
                        <Button
                            variant="primary"
                            onClick={() => navigate('/')}
                        >
                            Back to Home
                        </Button>
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
                                Game
                            </Typography>
                            <div className="flex items-center space-x-2">
                                <Typography variant="body" className="text-lg font-mono bg-gray-100 px-3 py-1 rounded">
                                    {code}
                                </Typography>
                                <Typography variant="body" className="text-lg font-mono bg-gray-100 px-3 py-1 rounded">
                                    {decodedGameId}
                                </Typography>
                            </div>
                        </div>

                        <div className="flex justify-center space-x-4">
                            <Button
                                variant="primary"
                                onClick={() => navigate(`/playground/${code}`)}
                            >
                                Back to Playground
                            </Button>
                            <Button
                                variant="secondary"
                                onClick={() => navigate('/')}
                            >
                                Back to Home
                            </Button>
                        </div>
                    </CenteredContent>

                    {/* Game Content Placeholder */}
                    <CenteredContent className="py-12">
                        <div className="text-center space-y-4">
                            <Typography variant="h2" className="text-2xl font-semibold text-gray-700">
                                Game Page Coming Soon
                            </Typography>
                            <Typography variant="body" className="text-gray-600 max-w-md">
                                This is where the actual game interface will be implemented.
                                The game will show the tic-tac-toe board, player turns, and game state.
                            </Typography>
                        </div>
                    </CenteredContent>
                </div>
            </Container>
        </PageLayout>
    );
} 