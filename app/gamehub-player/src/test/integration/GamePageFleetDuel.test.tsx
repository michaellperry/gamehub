import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import GamePage from '../../pages/GamePage';

// Mock the hooks and components
jest.mock('../../hooks/usePlayground', () => ({
    usePlayground: () => ({
        playground: { id: 'test-playground' },
        loading: false,
        error: null
    })
}));

jest.mock('../../hooks/usePlayer', () => ({
    usePlayer: () => ({
        playerId: 'test-player'
    })
}));

jest.mock('../../hooks/useGame', () => ({
    useGame: () => ({
        data: {
            challengerName: 'Player 1',
            opponentName: 'Player 2',
            challengerStarts: true,
            currentPlayerRole: 'X',
            isCurrentPlayerTurn: true,
            gameResult: 'ongoing',
            fleetDuelState: {
                phase: 'ship-placement',
                isFleetLocked: false
            },
            makeMove: jest.fn(),
            endGame: jest.fn()
        },
        isLoading: false,
        error: null
    })
}));

jest.mock('../../hooks/useGameType', () => ({
    useGameType: () => 'fleet-duel'
}));

// Mock the react-router-dom params
jest.mock('react-router-dom', () => ({
    ...jest.requireActual('react-router-dom'),
    useParams: () => ({
        code: 'test-playground',
        gameId: 'test-game'
    }),
    useNavigate: () => jest.fn()
}));

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

    it('shows loading state correctly', () => {
        // Mock loading state
        jest.doMock('../../hooks/useGame', () => ({
            useGame: () => ({
                data: null,
                isLoading: true,
                error: null
            })
        }));

        render(
            <BrowserRouter>
                <GamePage />
            </BrowserRouter>
        );

        expect(screen.getByText('Loading game...')).toBeInTheDocument();
    });

    it('handles missing game data', () => {
        // Mock missing game data
        jest.doMock('../../hooks/useGame', () => ({
            useGame: () => ({
                data: null,
                isLoading: false,
                error: null
            })
        }));

        render(
            <BrowserRouter>
                <GamePage />
            </BrowserRouter>
        );

        expect(screen.getByText('Game Not Found')).toBeInTheDocument();
        expect(screen.getByText('The specified game could not be found in this playground.')).toBeInTheDocument();
    });

    it('handles game errors', () => {
        // Mock error state
        jest.doMock('../../hooks/useGame', () => ({
            useGame: () => ({
                data: null,
                isLoading: false,
                error: 'Failed to load game'
            })
        }));

        render(
            <BrowserRouter>
                <GamePage />
            </BrowserRouter>
        );

        expect(screen.getByText('Game Error')).toBeInTheDocument();
        expect(screen.getByText('Failed to load game')).toBeInTheDocument();
    });

    it('renders player information correctly', () => {
        render(
            <BrowserRouter>
                <GamePage />
            </BrowserRouter>
        );

        expect(screen.getByText('Player 1')).toBeInTheDocument();
        expect(screen.getByText('Player 2')).toBeInTheDocument();
        expect(screen.getByText('VS')).toBeInTheDocument();
    });
});