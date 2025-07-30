import { ReactNode } from 'react';

// Base game data interface that all games must implement
export interface BaseGameData {
    challengerName: string | null;
    opponentName: string | null;
    challengerStarts: boolean | null;
    currentPlayerRole: 'X' | 'O' | 'observer';
    isCurrentPlayerTurn: boolean;
    gameResult: 'won' | 'lost' | 'drawn' | 'ongoing' | 'completed';
    makeMove: (...args: any[]) => Promise<{ success: boolean; error?: string }>;
    endGame: (onSuccess?: () => void) => Promise<{ success: boolean; error?: string }>;
}

// Game interface props
export interface GameInterfaceProps {
    gameData: BaseGameData;
    isMakingMove: boolean;
    onMakeMove: (...args: any[]) => Promise<void>;
    children?: ReactNode;
}

// Base game interface component
export function GameInterface({
    gameData,
    isMakingMove,
    onMakeMove,
    children
}: GameInterfaceProps) {
    return (
        <div className="space-y-8 max-w-2xl mx-auto">
            {children}
        </div>
    );
}

export type { BaseGameData };