import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { PlayerCard } from '../../components/molecules/PlayerCard';

describe('PlayerCard', () => {
    const mockJoin = {
        type: 'GameHub.Join',
        playground: { type: 'GameHub.Playground', code: 'TEST' },
        player: { type: 'GameHub.Player', user: { type: 'GameHub.User', username: 'test' }, tenant: { type: 'GameHub.Tenant', name: 'test' } },
        joinedAt: new Date('2024-01-01T00:00:00Z')
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any;

    const mockPlayer = {
        playerId: 'player-1',
        name: 'Test Player',
        joinedAt: new Date('2024-01-01T00:00:00Z'),
        isCurrentPlayer: false,
        join: mockJoin,
        isChallengePending: false,
    };

    const mockCurrentPlayer = {
        ...mockPlayer,
        isCurrentPlayer: true,
    };

    const mockPlayerWithPendingChallenge = {
        ...mockPlayer,
        isChallengePending: true,
    };

    it('renders player information correctly', () => {
        render(<PlayerCard player={mockPlayer} isCurrentPlayer={false} />);

        expect(screen.getByText('Test Player')).toBeInTheDocument();
        expect(screen.getByText('Challenge')).toBeInTheDocument();
    });

    it('shows current player indicator', () => {
        render(<PlayerCard player={mockCurrentPlayer} isCurrentPlayer={true} />);

        expect(screen.getByText('(That\'s you!)')).toBeInTheDocument();
        expect(screen.queryByText('Challenge')).not.toBeInTheDocument();
    });

    it('displays challenge status when player has pending challenge', () => {
        render(
            <PlayerCard
                player={mockPlayerWithPendingChallenge}
                isCurrentPlayer={false}
            />
        );

        expect(screen.getByText('Pending')).toBeInTheDocument();
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

    it('disables challenge button when challenge is pending', () => {
        render(
            <PlayerCard
                player={mockPlayerWithPendingChallenge}
                isCurrentPlayer={false}
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