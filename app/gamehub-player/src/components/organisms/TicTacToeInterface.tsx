import { TicTacToeGame, TicTacToeGameData } from './TicTacToeGame';
import { BaseGameData } from './GameInterface';

// Extended interface for TicTacToe specific data
export interface TicTacToeGameInterface extends BaseGameData {
    ticTacToeState: {
        board: ('X' | 'O' | null)[];
    };
}

interface TicTacToeInterfaceProps {
    gameData: TicTacToeGameInterface;
    isMakingMove: boolean;
    onCellClick: (position: number) => Promise<void>;
}

export function TicTacToeInterface({
    gameData,
    isMakingMove,
    onCellClick
}: TicTacToeInterfaceProps) {
    return (
        <TicTacToeGame
            gameData={gameData as TicTacToeGameData}
            onCellClick={onCellClick}
            isMakingMove={isMakingMove}
        />
    );
}

export type { TicTacToeInterfaceProps };