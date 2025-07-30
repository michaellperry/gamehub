interface GameStatusDisplayProps {
    currentPlayerRole: 'X' | 'O' | 'observer';
    isCurrentPlayerTurn: boolean;
    gameResult: 'won' | 'lost' | 'drawn' | 'ongoing' | 'completed';
}

export function GameStatusDisplay({
    currentPlayerRole,
    isCurrentPlayerTurn,
    gameResult
}: GameStatusDisplayProps) {
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

export type { GameStatusDisplayProps };