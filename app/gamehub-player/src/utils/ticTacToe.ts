import { Move } from '@model/model';

export type BoardCell = 'X' | 'O' | null;
export type BoardState = BoardCell[];

export interface TicTacToeState {
    board: BoardState;
    currentPlayer: 'X' | 'O' | null;
    winner: 'X' | 'O' | 'draw' | null;
    isGameOver: boolean;
}

/**
 * Computes the current state of a tic-tac-toe board from moves
 * @param moves - Array of moves sorted by index (chronological order)
 * @returns TicTacToeState with board, current player, winner, and game status
 */
export function computeTicTacToeState(moves: Move[]): TicTacToeState {
    // Initialize empty board (9 positions: 0-8)
    const board: BoardState = Array(9).fill(null);

    // Sort moves by index to ensure chronological order
    const sortedMoves = [...moves].sort((a, b) => a.index - b.index);

    // Apply moves to board
    sortedMoves.forEach(move => {
        const position = move.position;
        if (position >= 0 && position < 9 && board[position] === null) {
            // Even indexes are X, odd indexes are O
            board[position] = move.index % 2 === 0 ? 'X' : 'O';
        }
    });

    // Determine current player (next move)
    const nextPlayer = sortedMoves.length % 2 === 0 ? 'X' : 'O';

    // Check for winner
    const winner = checkWinner(board);

    // Game is over if there's a winner or board is full
    const isGameOver = winner !== null || board.every(cell => cell !== null);

    return {
        board,
        currentPlayer: isGameOver ? null : nextPlayer,
        winner,
        isGameOver,
    };
}

/**
 * Checks if there's a winner on the board
 * @param board - Current board state
 * @returns 'X', 'O', 'draw', or null
 */
function checkWinner(board: BoardState): 'X' | 'O' | 'draw' | null {
    // Winning combinations (rows, columns, diagonals)
    const winCombinations = [
        [0, 1, 2], [3, 4, 5], [6, 7, 8], // Rows
        [0, 3, 6], [1, 4, 7], [2, 5, 8], // Columns
        [0, 4, 8], [2, 4, 6], // Diagonals
    ];

    // Check for winner
    for (const combination of winCombinations) {
        const [a, b, c] = combination;
        if (board[a] && board[a] === board[b] && board[a] === board[c]) {
            return board[a];
        }
    }

    // Check for draw (board full)
    if (board.every(cell => cell !== null)) {
        return 'draw';
    }

    return null;
}

/**
 * Gets the position description for debugging
 * @param position - Board position (0-8)
 * @returns Human-readable position description
 */
export function getPositionDescription(position: number): string {
    const positions = [
        'top-left', 'top-center', 'top-right',
        'middle-left', 'center', 'middle-right',
        'bottom-left', 'bottom-center', 'bottom-right'
    ];
    return positions[position] || `position-${position}`;
}

/**
 * Formats board for display
 * @param board - Board state
 * @returns Formatted string representation
 */
export function formatBoard(board: BoardState): string {
    const formatCell = (cell: BoardCell) => cell || ' ';
    return [
        `${formatCell(board[0])} | ${formatCell(board[1])} | ${formatCell(board[2])}`,
        '---------',
        `${formatCell(board[3])} | ${formatCell(board[4])} | ${formatCell(board[5])}`,
        '---------',
        `${formatCell(board[6])} | ${formatCell(board[7])} | ${formatCell(board[8])}`
    ].join('\n');
} 