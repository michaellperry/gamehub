import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ActiveGames } from '../../components/organisms/ActiveGames';
import { ActiveGamesViewModel } from '../../hooks/useActiveGames';

// Mock react-router-dom hooks
const mockNavigate = vi.fn();
const mockUseParams = vi.fn(() => ({ code: 'ABCDEF' }));

vi.mock('react-router-dom', () => ({
    useNavigate: () => mockNavigate,
    useParams: () => mockUseParams(),
}));

describe('ActiveGames', () => {
    const mockViewModel: ActiveGamesViewModel = {
        games: [
            {
                id: 'game-1',
                playerX: 'Alice',
                playerO: 'Bob',
                isActivePlayer: true,
            },
            {
                id: 'game-2',
                playerX: 'Charlie',
                playerO: 'David',
                isActivePlayer: false,
            },
        ],
        gameCount: 2,
        hasGames: true,
    };

    beforeEach(() => {
        mockNavigate.mockClear();
        mockUseParams.mockReturnValue({ code: 'ABCDEF' });
    });

    it('renders active games when games exist', () => {
        render(<ActiveGames viewModel={mockViewModel} />);

        expect(screen.getByText('Active Games')).toBeInTheDocument();
        expect(screen.getByText('2')).toBeInTheDocument();
        expect(screen.getByText('Alice vs Bob')).toBeInTheDocument();
        expect(screen.getByText('Charlie vs David')).toBeInTheDocument();
        expect(screen.getByText('You')).toBeInTheDocument();
        expect(screen.getByText('Click on a game to join or continue playing')).toBeInTheDocument();
    });

    it('does not render when no games exist', () => {
        const emptyViewModel: ActiveGamesViewModel = {
            games: [],
            gameCount: 0,
            hasGames: false,
        };

        const { container } = render(<ActiveGames viewModel={emptyViewModel} />);

        expect(container.firstChild).toBeNull();
    });

    it('navigates to game page when game is clicked', () => {
        render(<ActiveGames viewModel={mockViewModel} />);

        const firstGame = screen.getByText('Alice vs Bob').closest('[role="button"]');
        expect(firstGame).toBeInTheDocument();

        fireEvent.click(firstGame!);

        expect(mockNavigate).toHaveBeenCalledWith('/playground/ABCDEF/game/game-1');
    });

    it('navigates to game page when second game is clicked', () => {
        render(<ActiveGames viewModel={mockViewModel} />);

        const secondGame = screen.getByText('Charlie vs David').closest('[role="button"]');
        expect(secondGame).toBeInTheDocument();

        fireEvent.click(secondGame!);

        expect(mockNavigate).toHaveBeenCalledWith('/playground/ABCDEF/game/game-2');
    });

    it('handles game IDs with special characters', () => {
        const viewModelWithSpecialChars: ActiveGamesViewModel = {
            games: [
                {
                    id: 'game/with=special+chars',
                    playerX: 'Alice',
                    playerO: 'Bob',
                    isActivePlayer: true,
                },
            ],
            gameCount: 1,
            hasGames: true,
        };

        render(<ActiveGames viewModel={viewModelWithSpecialChars} />);

        const game = screen.getByText('Alice vs Bob').closest('[role="button"]');
        expect(game).toBeInTheDocument();

        fireEvent.click(game!);

        expect(mockNavigate).toHaveBeenCalledWith('/playground/ABCDEF/game/game%2Fwith%3Dspecial%2Bchars');
    });
}); 