import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Alert, Button, CenteredContent, Container, PageLayout, Typography } from '../components/atoms';
import { TicTacToeInterface, FleetDuelInterface } from '../components/organisms';
import { j } from '../jinaga-config';
import { useGame } from '../hooks/useGame';
import { usePlayer } from '../hooks/usePlayer';
import { usePlayground } from '../hooks/usePlayground';
import { useGameType } from '../hooks/useGameType';

export default function GamePage() {
    const { code, gameId } = useParams<{ code: string; gameId: string }>();
    const navigate = useNavigate();
    const [isMakingMove, setIsMakingMove] = useState(false);

    // Decode the game ID to handle URL-encoded special characters
    const decodedGameId = gameId ? decodeURIComponent(gameId) : undefined;

    // Get playground and game data
    const playground = usePlayground(code);
    const { playerId } = usePlayer();
    const game = useGame(j, playground.playground, decodedGameId || null, playerId);
    
    // Detect game type
    const gameType = useGameType(game.data);

    const [isEndingGame, setIsEndingGame] = useState(false);

    const handleCellClick = async (position: number) => {
        if (!game.data || isMakingMove || game.data.gameResult !== 'ongoing' || game.data.currentPlayerRole === 'observer' || !game.data.isCurrentPlayerTurn) {
            return;
        }

        setIsMakingMove(true);
        try {
            const result = await game.data.makeMove(position);
            if (!result.success) {
                console.error('Move failed:', result.error);
                // You could show a toast notification here
            }
        } catch (error) {
            console.error('Error making move:', error);
        } finally {
            setIsMakingMove(false);
        }
    };

    const handleFleetDuelAction = async (...args: any[]) => {
        if (!game.data || isMakingMove) {
            return;
        }

        setIsMakingMove(true);
        try {
            // This will be implemented in Phase 2
            console.log('Fleet Duel action:', args);
        } catch (error) {
            console.error('Error in Fleet Duel action:', error);
        } finally {
            setIsMakingMove(false);
        }
    };

    const handleEndGame = async () => {
        if (!game.data || isEndingGame) {
            return;
        }

        setIsEndingGame(true);
        try {
            const result = await game.data.endGame(() => {
                // Navigate back to playground after successfully ending the game
                navigate(`/playground/${code}`);
            });
            if (!result.success) {
                console.error('End game failed:', result.error);
                // You could show a toast notification here
            }
        } catch (error) {
            console.error('Error ending game:', error);
        } finally {
            setIsEndingGame(false);
        }
    };

    const getGameTitle = () => {
        switch (gameType) {
            case 'tic-tac-toe':
                return '🎮 Tic-Tac-Toe';
            case 'fleet-duel':
                return '🚢 Fleet Duel';
            default:
                return '🎮 Game';
        }
    };

    const renderGameInterface = () => {
        if (!game.data) {
            return null;
        }

        switch (gameType) {
            case 'tic-tac-toe':
                return (
                    <TicTacToeInterface
                        gameData={game.data}
                        isMakingMove={isMakingMove}
                        onCellClick={handleCellClick}
                    />
                );
            case 'fleet-duel':
                return (
                    <FleetDuelInterface
                        gameData={game.data}
                        isMakingMove={isMakingMove}
                        onAction={handleFleetDuelAction}
                    />
                );
            default:
                return (
                    <div className="text-center space-y-4">
                        <Alert variant="error" title="Unknown Game Type">
                            This game type is not supported.
                        </Alert>
                    </div>
                );
        }
    };

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
                                {getGameTitle()}
                            </Typography>
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
                    <CenteredContent className="py-8">
                        {playground.loading || game.isLoading ? (
                            <div className="text-center space-y-4">
                                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
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
                        ) : game.data ? (
                            <div className="space-y-8">
                                {/* Render appropriate game interface */}
                                {renderGameInterface()}

                                {/* End Game Button - Show when game is over */}
                                {game.data.gameResult !== 'ongoing' && (
                                    <div className="flex justify-center">
                                        <Button
                                            variant="primary"
                                            onClick={handleEndGame}
                                            loading={isEndingGame}
                                            disabled={isEndingGame}
                                        >
                                            {isEndingGame ? 'Ending Game...' : 'End Game & Return to Playground'}
                                        </Button>
                                    </div>
                                )}
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