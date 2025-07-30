import { TicTacToeBoard, GameStatusDisplay, PlayerInfoDisplay } from '../molecules';

interface TicTacToeGameData {
    challengerName: string | null;
    opponentName: string | null;
    challengerStarts: boolean | null;
    currentPlayerRole: 'X' | 'O' | 'observer';
    isCurrentPlayerTurn: boolean;
    gameResult: 'won' | 'lost' | 'drawn' | 'ongoing' | 'completed';
    ticTacToeState: {
        board: ('X' | 'O' | null)[];
    };
    makeMove: (position: number) => Promise<{ success: boolean; error?: string }>;
    endGame: (onSuccess?: () => void) => Promise<{ success: boolean; error?: string }>;
}

interface TicTacToeGameProps {
    gameData: TicTacToeGameData;
    onCellClick: (position: number) => void;
    isMakingMove: boolean;
}

export function TicTacToeGame({
    gameData,
    onCellClick,
    isMakingMove
}: TicTacToeGameProps) {
    return (
        <div className="space-y-8 max-w-2xl mx-auto">
            {/* Player Information */}
            <PlayerInfoDisplay
                challengerName={gameData.challengerName}
                opponentName={gameData.opponentName}
                challengerStarts={gameData.challengerStarts}
                currentPlayerRole={gameData.currentPlayerRole}
                gameResult={gameData.gameResult}
            />

            {/* Game Status */}
            <GameStatusDisplay
                currentPlayerRole={gameData.currentPlayerRole}
                isCurrentPlayerTurn={gameData.isCurrentPlayerTurn}
                gameResult={gameData.gameResult}
            />

            {/* Game Board */}
            <div className="flex justify-center">
                <TicTacToeBoard
                    board={gameData.ticTacToeState.board}
                    onCellClick={onCellClick}
                    isCurrentPlayerTurn={gameData.isCurrentPlayerTurn}
                    currentPlayerRole={gameData.currentPlayerRole}
                    gameResult={gameData.gameResult}
                />
            </div>

            {/* Loading indicator for moves */}
            {isMakingMove && (
                <div className="text-center">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
                    <div className="text-sm text-gray-600 mt-2">
                        Making move...
                    </div>
                </div>
            )}
        </div>
    );
}

export type { TicTacToeGameProps, TicTacToeGameData };