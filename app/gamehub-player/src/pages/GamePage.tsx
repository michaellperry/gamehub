import { useNavigate, useParams } from 'react-router-dom';
import { Alert, Button, CenteredContent, Container, PageLayout, Typography } from '../components/atoms';
import { useUser } from '../auth/UserProvider';
import { useGame } from '../hooks/useGame';
import { usePlayground } from '../hooks/usePlayground';

export default function GamePage() {
    const { code, gameId } = useParams<{ code: string; gameId: string }>();
    const navigate = useNavigate();
    const { user } = useUser();

    // Decode the game ID to handle URL-encoded special characters
    const decodedGameId = gameId ? decodeURIComponent(gameId) : undefined;

    // Get playground and game data
    const playground = usePlayground(code);
    const game = useGame(playground.playground, decodedGameId || null, user?.publicKey || null);

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

                    {/* Game Content */}
                    <CenteredContent className="py-12">
                        {playground.loading || game.isLoading ? (
                            <div className="text-center space-y-4">
                                <Typography variant="body" className="text-gray-600">
                                    Loading game...
                                </Typography>
                            </div>
                        ) : playground.error ? (
                            <div className="text-center space-y-4">
                                <Alert variant="error" title="Playground Error">
                                    {playground.error}
                                </Alert>
                            </div>
                        ) : game.error ? (
                            <div className="text-center space-y-4">
                                <Alert variant="error" title="Game Error">
                                    {game.error}
                                </Alert>
                            </div>
                        ) : game.game ? (
                            <div className="text-center space-y-6">
                                <div className="space-y-4">
                                    <Typography variant="h2" className="text-2xl font-semibold text-gray-700">
                                        {game.challengerName} vs {game.opponentName}
                                    </Typography>
                                    <div className="flex justify-center space-x-4">
                                        <div className="text-center">
                                            <Typography variant="body" className="font-semibold">
                                                {game.challengerStarts ? 'X' : 'O'}
                                            </Typography>
                                            <Typography variant="body" className="text-sm text-gray-600">
                                                {game.challengerName}
                                            </Typography>
                                        </div>
                                        <div className="text-center">
                                            <Typography variant="body" className="font-semibold">
                                                {game.challengerStarts ? 'O' : 'X'}
                                            </Typography>
                                            <Typography variant="body" className="text-sm text-gray-600">
                                                {game.opponentName}
                                            </Typography>
                                        </div>
                                    </div>
                                    {game.createdAt && (
                                        <Typography variant="body" className="text-sm text-gray-500">
                                            Game started: {game.createdAt.toLocaleDateString()}
                                        </Typography>
                                    )}
                                </div>

                                {/* Game Board Placeholder */}
                                <div className="mt-8">
                                    <Typography variant="h3" className="text-xl font-semibold text-gray-700 mb-4">
                                        Game Board Coming Soon
                                    </Typography>
                                    <Typography variant="body" className="text-gray-600 max-w-md">
                                        This is where the actual tic-tac-toe board will be implemented.
                                        The game will show the board state, player turns, and game state.
                                    </Typography>
                                </div>
                            </div>
                        ) : (
                            <div className="text-center space-y-4">
                                <Typography variant="h2" className="text-2xl font-semibold text-gray-700">
                                    Game Not Found
                                </Typography>
                                <Typography variant="body" className="text-gray-600 max-w-md">
                                    The specified game could not be found in this playground.
                                </Typography>
                            </div>
                        )}
                    </CenteredContent>
                </div>
            </Container>
        </PageLayout>
    );
} 