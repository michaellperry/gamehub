import { render, screen } from '@testing-library/react';
import { FleetDuelGame } from '../../components/organisms/FleetDuelGame';

describe('FleetDuelGame', () => {
    const mockGameData = {
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
        makeMove: jest.fn(),
        endGame: jest.fn()
    };

    const mockOnAction = jest.fn();

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('renders ship placement phase correctly', () => {
        render(
            <FleetDuelGame
                gameData={mockGameData}
                onAction={mockOnAction}
                isMakingMove={false}
            />
        );

        expect(screen.getByText('🚢 Deploy Your Fleet')).toBeInTheDocument();
        expect(screen.getByText('Place your ships on the grid to prepare for battle')).toBeInTheDocument();
    });

    it('renders attack phase placeholder', () => {
        const attackPhaseData = {
            ...mockGameData,
            fleetDuelState: {
                ...mockGameData.fleetDuelState,
                phase: 'attack' as const
            }
        };

        render(
            <FleetDuelGame
                gameData={attackPhaseData}
                onAction={mockOnAction}
                isMakingMove={false}
            />
        );

        expect(screen.getByText('⚔️ Battle Phase')).toBeInTheDocument();
        expect(screen.getByText('Attack phase coming soon...')).toBeInTheDocument();
    });

    it('renders completed phase placeholder', () => {
        const completedPhaseData = {
            ...mockGameData,
            fleetDuelState: {
                ...mockGameData.fleetDuelState,
                phase: 'completed' as const
            }
        };

        render(
            <FleetDuelGame
                gameData={completedPhaseData}
                onAction={mockOnAction}
                isMakingMove={false}
            />
        );

        expect(screen.getByText('🏆 Battle Complete')).toBeInTheDocument();
        expect(screen.getByText('Game over phase coming soon...')).toBeInTheDocument();
    });

    it('shows loading indicator when making move', () => {
        render(
            <FleetDuelGame
                gameData={mockGameData}
                onAction={mockOnAction}
                isMakingMove={true}
            />
        );

        expect(screen.getByText('Processing...')).toBeInTheDocument();
    });

    it('displays player information', () => {
        render(
            <FleetDuelGame
                gameData={mockGameData}
                onAction={mockOnAction}
                isMakingMove={false}
            />
        );

        expect(screen.getByText('Player 1')).toBeInTheDocument();
        expect(screen.getByText('Player 2')).toBeInTheDocument();
    });

    it('renders fleet locked state', () => {
        const lockedFleetData = {
            ...mockGameData,
            fleetDuelState: {
                ...mockGameData.fleetDuelState,
                isFleetLocked: true
            }
        };

        render(
            <FleetDuelGame
                gameData={lockedFleetData}
                onAction={mockOnAction}
                isMakingMove={false}
            />
        );

        expect(screen.getByText('🔒 Fleet Deployed!')).toBeInTheDocument();
        expect(screen.getByText('Your ships are locked and ready for battle.')).toBeInTheDocument();
        expect(screen.getByText('Waiting for opponent to deploy their fleet...')).toBeInTheDocument();
    });

    it('renders initializing state for unknown phase', () => {
        const unknownPhaseData = {
            ...mockGameData,
            fleetDuelState: {
                ...mockGameData.fleetDuelState,
                phase: 'unknown' as any
            }
        };

        render(
            <FleetDuelGame
                gameData={unknownPhaseData}
                onAction={mockOnAction}
                isMakingMove={false}
            />
        );

        expect(screen.getByText('🚢 Fleet Duel')).toBeInTheDocument();
        expect(screen.getByText('Initializing game...')).toBeInTheDocument();
    });
});