import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { PlayerCard } from '../../components/molecules/PlayerCard';

describe('PlayerCard', () => {
    const mockJoin = {
        type: 'GameHub.Join',
        playground: { type: 'GameHub.Playground', code: 'TEST' },
        player: { type: 'GameHub.Player', user: { type: 'GameHub.User', username: 'test' }, tenant: { type: 'GameHub.Tenant', name: 'test' } },
        joinedAt: new Date('2024-01-01T00:00:00Z')
    } as any;

    const mockPlayer = {
        playerId: 'player-1',
        name: 'Test Player',
        joinedAt: new Date('2024-01-01T00:00:00Z'),
        isCurrentPlayer: false,
        join: mockJoin,
    };

    const mockCurrentPlayer = {
        ...mockPlayer,
        isCurrentPlayer: true,
    };

    it('renders player information correctly', () => {
        render(<PlayerCard player={mockPlayer} isCurrentPlayer={false} />);

        expect(screen.getByText('Test Player')).toBeInTheDocument();
        expect(screen.getByText(/Joined/)).toBeInTheDocument();
        expect(screen.getByText('Challenge')).toBeInTheDocument();
    });

    it('shows current player indicator', () => {
        render(<PlayerCard player={mockCurrentPlayer} isCurrentPlayer={true} />);

        expect(screen.getByText('(That\'s you!)')).toBeInTheDocument();
        expect(screen.queryByText('Challenge')).not.toBeInTheDocument();
    });

    it('displays challenge status when provided', () => {
        const challengeStatus = { type: 'pending' as const, count: 2 };

        render(
            <PlayerCard
                player={mockPlayer}
                isCurrentPlayer={false}
                challengeStatus={challengeStatus}
            />
        );

        expect(screen.getByText('Pending (2)')).toBeInTheDocument();
    });

    it('calls onChallengeClick when challenge button is clicked', () => {
        const handleChallengeClick = vi.fn();

        render(
            <PlayerCard
                player={mockPlayer}
                isCurrentPlayer={false}
                onChallengeClick={handleChallengeClick}
            />
        );

        fireEvent.click(screen.getByText('Challenge'));
        expect(handleChallengeClick).toHaveBeenCalledWith(mockPlayer);
    });

    it('calls onChallengeStatusClick when challenge status is clicked', () => {
        const handleChallengeStatusClick = vi.fn();
        const challengeStatus = { type: 'received' as const };

        render(
            <PlayerCard
                player={mockPlayer}
                isCurrentPlayer={false}
                challengeStatus={challengeStatus}
                onChallengeStatusClick={handleChallengeStatusClick}
            />
        );

        fireEvent.click(screen.getByText('Received'));
        expect(handleChallengeStatusClick).toHaveBeenCalled();
    });

    it('disables challenge button when challenge is pending', () => {
        const challengeStatus = { type: 'pending' as const };

        render(
            <PlayerCard
                player={mockPlayer}
                isCurrentPlayer={false}
                challengeStatus={challengeStatus}
            />
        );

        const challengeButton = screen.getByText('Challenge');
        expect(challengeButton).toBeDisabled();
    });

    it('disables challenge button when challenge is sent', () => {
        const challengeStatus = { type: 'sent' as const };

        render(
            <PlayerCard
                player={mockPlayer}
                isCurrentPlayer={false}
                challengeStatus={challengeStatus}
            />
        );

        const challengeButton = screen.getByText('Challenge');
        expect(challengeButton).toBeDisabled();
    });

    it('does not show challenge button for current player', () => {
        render(
            <PlayerCard
                player={mockCurrentPlayer}
                isCurrentPlayer={true}
            />
        );

        expect(screen.queryByText('Challenge')).not.toBeInTheDocument();
    });
}); 