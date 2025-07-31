import { render, screen } from '@testing-library/react';
import { vi, describe, it, expect } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import GamePage from '../../pages/GamePage';

// Mock the hooks and components
vi.mock('../../hooks/usePlayground', () => ({
    usePlayground: () => ({
        playground: { id: 'test-playground' },
        isLoading: false,
        error: null,
    }),
}));

vi.mock('../../hooks/usePlayer', () => ({
    usePlayer: () => ({
        playerId: 'test-player'
    })
}));

vi.mock('../../hooks/useGame', () => ({
    useGame: () => ({
        data: {
            challengerName: 'Player 1',
            opponentName: 'Player 2',
            challengerStarts: true,
            currentPlayerRole: 'X' as const,
            isCurrentPlayerTurn: true,
            gameResult: 'ongoing' as const,
            fleetDuelState: {
                phase: 'ship-placement' as const,
                isFleetLocked: false
            },
            makeMove: vi.fn(),
            endGame: vi.fn()
        },
        isLoading: false,
        error: null
    })
}));

vi.mock('../../hooks/useGameType', () => ({
    useGameType: () => 'fleet-duel',
    isTicTacToeGame: () => false,
    isFleetDuelGame: () => true
}));

// Mock the react-router-dom params
vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual('react-router-dom');
    return {
        ...actual,
        useParams: () => ({
            code: 'test-playground',
            gameId: 'test-game'
        }),
        useNavigate: () => vi.fn(),
    };
});

describe('GamePage Fleet Duel Integration', () => {
    it('renders Fleet Duel game interface correctly', () => {
        render(
            <BrowserRouter>
                <GamePage />
            </BrowserRouter>
        );

        // Check game title
        expect(screen.getByText('🚢 Fleet Duel')).toBeInTheDocument();

        // Check navigation buttons
        expect(screen.getByText('Back to Playground')).toBeInTheDocument();
        expect(screen.getByText('Back to Home')).toBeInTheDocument();

        // Check Fleet Duel specific content
        expect(screen.getByText('🚢 Deploy Your Fleet')).toBeInTheDocument();
        expect(screen.getByText('Place your ships on the grid to prepare for battle')).toBeInTheDocument();

        // Check that we have fleet components
        expect(screen.getByText('🚢 Your Fleet')).toBeInTheDocument();
        expect(screen.getByText('⚙️ Fleet Controls')).toBeInTheDocument();
    });

    it('renders player information correctly', () => {
        render(
            <BrowserRouter>
                <GamePage />
            </BrowserRouter>
        );

        // Check player information is displayed
        expect(screen.getByText('Player 1')).toBeInTheDocument();
        expect(screen.getByText('Player 2')).toBeInTheDocument();
        expect(screen.getByText('VS')).toBeInTheDocument();
        expect(screen.getByText('You')).toBeInTheDocument();
        expect(screen.getByText('Starts first')).toBeInTheDocument();
    });
});