import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Alert, Button, CenteredContent, Container, PageLayout, Typography } from '../components/atoms';
import { useGame } from '../hooks/useGame';
import { usePlayer } from '../hooks/usePlayer';
import { usePlayground } from '../hooks/usePlayground';

// TicTacToe Board Component
function TicTacToeBoard({
    board,
    onCellClick,
    isCurrentPlayerTurn,
    currentPlayerRole,
    gameResult
}: {
    board: ('X' | 'O' | null)[];
    onCellClick: (position: number) => void;
    isCurrentPlayerTurn: boolean;
    currentPlayerRole: 'X' | 'O' | 'observer';
    gameResult: 'won' | 'lost' | 'drawn' | 'ongoing' | 'completed';
}) {
    const getCellContent = (cell: 'X' | 'O' | null) => {
        if (cell === 'X') {
            return (
                <div className="text-4xl font-bold text-blue-600 animate-pulse">
                    ✕
                </div>
            );
        }
        if (cell === 'O') {
            return (
                <div className="text-4xl font-bold text-red-600 animate-pulse">
                    ○
                </div>
            );
        }
        return null;
    };

    const getCellStyle = () => {
        const baseStyle = "w-20 h-20 border-2 border-gray-300 flex items-center justify-center text-2xl font-bold transition-all duration-200 hover:bg-gray-50";

        if (gameResult !== 'ongoing') {
            return `${baseStyle} cursor-default`;
        }

        if (currentPlayerRole === 'observer') {
            return `${baseStyle} cursor-default`;
        }

        if (!isCurrentPlayerTurn) {
            return `${baseStyle} cursor-not-allowed opacity-50`;
        }

        return `${baseStyle} cursor-pointer hover:bg-blue-50 hover:border-blue-400`;
    };

    return (
        <div className="space-y-4">
            <div className="grid grid-cols-3 gap-2 bg-white p-4 rounded-lg shadow-lg">
                {board.map((cell, index) => (
                    <button
                        key={index}
                        className={getCellStyle()}
                        onClick={() => onCellClick(index)}
                        disabled={gameResult !== 'ongoing' || currentPlayerRole === 'observer' || !isCurrentPlayerTurn}
                    >
                        {getCellContent(cell)}
                    </button>
                ))}
            </div>
        </div>
    );
}

// Game Status Component
function GameStatus({
    currentPlayerRole,
    isCurrentPlayerTurn,
    gameResult
}: {
    currentPlayerRole: 'X' | 'O' | 'observer';
    isCurrentPlayerTurn: boolean;
    gameResult: 'won' | 'lost' | 'drawn' | 'ongoing' | 'completed';
}) {
    const getStatusMessage = () => {
        if (gameResult === 'won') {
            return { text: '🎉 Congratulations! You won!', color: 'text-green-600' };
        }
        if (gameResult === 'lost') {
            return { text: '😔 Better luck next time!', color: 'text-red-600' };
        }
        if (gameResult === 'drawn') {
            return { text: '🤝 It\'s a tie!', color: 'text-yellow-600' };
        }
        if (gameResult === 'completed') {
            return { text: '👀 Game completed', color: 'text-gray-600' };
        }
        if (currentPlayerRole === 'observer') {
            return { text: '👀 Watching the game...', color: 'text-gray-600' };
        }
        if (isCurrentPlayerTurn) {
            return { text: '🎯 Your turn!', color: 'text-blue-600' };
        }
        return { text: '⏳ Waiting for opponent...', color: 'text-gray-600' };
    };

    const status = getStatusMessage();

    return (
        <div className="text-center space-y-2">
            <div className={`text-xl font-bold ${status.color}`}>
                {status.text}
            </div>
            {gameResult === 'ongoing' && currentPlayerRole !== 'observer' && (
                <div className="text-sm text-gray-600">
                    You are playing as <span className="font-semibold">{currentPlayerRole}</span>
                </div>
            )}
        </div>
    );
}

// Player Info Component
function PlayerInfo({
    challengerName,
    opponentName,
    challengerStarts,
    currentPlayerRole,
    gameResult
}: {
    challengerName: string | null;
    opponentName: string | null;
    challengerStarts: boolean | null;
    currentPlayerRole: 'X' | 'O' | 'observer';
    gameResult: 'won' | 'lost' | 'drawn' | 'ongoing' | 'completed';
}) {
    const getPlayerStyle = (isCurrentPlayer: boolean, isWinner: boolean) => {
        const baseStyle = "p-4 rounded-lg border-2 transition-all duration-200";

        if (isWinner) {
            return `${baseStyle} border-green-500 bg-green-50`;
        }

        if (isCurrentPlayer && gameResult === 'ongoing') {
            return `${baseStyle} border-blue-500 bg-blue-50`;
        }

        return `${baseStyle} border-gray-200 bg-gray-50`;
    };

    // Determine who is X and who is O based on challengerStarts
    const xPlayerName = challengerStarts ? challengerName : opponentName;
    const oPlayerName = challengerStarts ? opponentName : challengerName;

    const isXCurrent = currentPlayerRole === 'X';
    const isOCurrent = currentPlayerRole === 'O';
    const xWon = gameResult === 'won' && currentPlayerRole === 'X';
    const oWon = gameResult === 'won' && currentPlayerRole === 'O';

    return (
        <div className="flex justify-center space-x-8">
            <div className={getPlayerStyle(isXCurrent, xWon)}>
                <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600 mb-1">X</div>
                    <div className="font-semibold text-gray-800">{xPlayerName || 'Unknown'}</div>
                    <div className="text-xs text-gray-500">Starts first</div>
                    {isXCurrent && gameResult === 'ongoing' && (
                        <div className="text-xs text-blue-600 font-semibold">You</div>
                    )}
                </div>
            </div>

            <div className="flex items-center">
                <div className="text-2xl font-bold text-gray-400">VS</div>
            </div>

            <div className={getPlayerStyle(isOCurrent, oWon)}>
                <div className="text-center">
                    <div className="text-2xl font-bold text-red-600 mb-1">O</div>
                    <div className="font-semibold text-gray-800">{oPlayerName || 'Unknown'}</div>
                    {isOCurrent && gameResult === 'ongoing' && (
                        <div className="text-xs text-red-600 font-semibold">You</div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default function GamePage() {
    const { code, gameId } = useParams<{ code: string; gameId: string }>();
    const navigate = useNavigate();
    const [isMakingMove, setIsMakingMove] = useState(false);

    // Decode the game ID to handle URL-encoded special characters
    const decodedGameId = gameId ? decodeURIComponent(gameId) : undefined;

    // Get playground and game data
    const playground = usePlayground(code);
    const { playerId } = usePlayer();
    const game = useGame(playground.playground, decodedGameId || null, playerId);

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
                                🎮 Tic-Tac-Toe
                            </Typography>
                            <div className="flex items-center space-x-2">
                                <Typography variant="body" className="text-lg font-mono bg-gray-100 px-3 py-1 rounded">
                                    {code}
                                </Typography>
                                <Typography variant="body" className="text-lg font-mono bg-gray-100 px-3 py-1 rounded">
                                    {decodedGameId.slice(0, 8)}...
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
                            <div className="space-y-8 max-w-2xl mx-auto">
                                {/* Player Information */}
                                <PlayerInfo
                                    challengerName={game.data.challengerName}
                                    opponentName={game.data.opponentName}
                                    challengerStarts={game.data.challengerStarts}
                                    currentPlayerRole={game.data.currentPlayerRole}
                                    gameResult={game.data.gameResult}
                                />

                                {/* Game Status */}
                                <GameStatus
                                    currentPlayerRole={game.data.currentPlayerRole}
                                    isCurrentPlayerTurn={game.data.isCurrentPlayerTurn}
                                    gameResult={game.data.gameResult}
                                />

                                {/* Game Board */}
                                <div className="flex justify-center">
                                    <TicTacToeBoard
                                        board={game.data.ticTacToeState.board}
                                        onCellClick={handleCellClick}
                                        isCurrentPlayerTurn={game.data.isCurrentPlayerTurn}
                                        currentPlayerRole={game.data.currentPlayerRole}
                                        gameResult={game.data.gameResult}
                                    />
                                </div>

                                {/* Game Info */}
                                {game.data.createdAt && (
                                    <div className="text-center">
                                        <Typography variant="body" className="text-sm text-gray-500">
                                            Game started: {game.data.createdAt.toLocaleDateString()} at {game.data.createdAt.toLocaleTimeString()}
                                        </Typography>
                                        <Typography variant="body" className="text-sm text-gray-500">
                                            Moves made: {game.data.moves.length}
                                        </Typography>
                                    </div>
                                )}

                                {/* Loading indicator for moves */}
                                {isMakingMove && (
                                    <div className="text-center">
                                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
                                        <Typography variant="body" className="text-sm text-gray-600 mt-2">
                                            Making move...
                                        </Typography>
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