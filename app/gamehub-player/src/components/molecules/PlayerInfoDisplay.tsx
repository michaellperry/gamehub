interface PlayerInfoDisplayProps {
    challengerName: string | null;
    opponentName: string | null;
    challengerStarts: boolean | null;
    currentPlayerRole: 'X' | 'O' | 'observer';
    gameResult: 'won' | 'lost' | 'drawn' | 'ongoing' | 'completed';
}

export function PlayerInfoDisplay({
    challengerName,
    opponentName,
    challengerStarts,
    currentPlayerRole,
    gameResult
}: PlayerInfoDisplayProps) {
    const getPlayerStyle = (isCurrentPlayer: boolean, isWinner: boolean) => {
        const baseStyle = "p-4 rounded-lg border-2 transition-all duration-200 w-[150px]";

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

export type { PlayerInfoDisplayProps };