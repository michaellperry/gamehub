interface TicTacToeBoardProps {
    board: ('X' | 'O' | null)[];
    onCellClick: (position: number) => void;
    isCurrentPlayerTurn: boolean;
    currentPlayerRole: 'X' | 'O' | 'observer';
    gameResult: 'won' | 'lost' | 'drawn' | 'ongoing' | 'completed';
}

export function TicTacToeBoard({
    board,
    onCellClick,
    isCurrentPlayerTurn,
    currentPlayerRole,
    gameResult
}: TicTacToeBoardProps) {
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

export type { TicTacToeBoardProps };