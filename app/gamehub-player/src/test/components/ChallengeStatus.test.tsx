import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { ChallengeStatus } from '../../components/molecules/ChallengeStatus';

describe('ChallengeStatus', () => {
    it('renders with correct text and styling for different types', () => {
        const { rerender } = render(<ChallengeStatus type="pending" />);
        expect(screen.getByText('Pending')).toBeInTheDocument();

        rerender(<ChallengeStatus type="sent" />);
        expect(screen.getByText('Sent')).toBeInTheDocument();

        rerender(<ChallengeStatus type="received" />);
        expect(screen.getByText('Received')).toBeInTheDocument();

        rerender(<ChallengeStatus type="accepted" />);
        expect(screen.getByText('Accepted')).toBeInTheDocument();

        rerender(<ChallengeStatus type="rejected" />);
        expect(screen.getByText('Rejected')).toBeInTheDocument();

        rerender(<ChallengeStatus type="expired" />);
        expect(screen.getByText('Expired')).toBeInTheDocument();
    });

    it('displays count when count is greater than 1', () => {
        render(<ChallengeStatus type="pending" count={3} />);
        expect(screen.getByText('Pending (3)')).toBeInTheDocument();
    });

    it('does not display count when count is 1', () => {
        render(<ChallengeStatus type="pending" count={1} />);
        expect(screen.getByText('Pending')).toBeInTheDocument();
        expect(screen.queryByText('Pending (1)')).not.toBeInTheDocument();
    });

    it('renders nothing when count is 0 and showCount is true', () => {
        const { container } = render(<ChallengeStatus type="pending" count={0} />);
        expect(container.firstChild).toBeNull();
    });

    it('calls onClick when clicked and interactive', () => {
        const handleClick = vi.fn();
        render(<ChallengeStatus type="pending" onClick={handleClick} />);

        fireEvent.click(screen.getByText('Pending'));
        expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('applies pulse animation when pulse is true', () => {
        render(<ChallengeStatus type="pending" pulse />);
        const badge = screen.getByText('Pending').closest('span');
        expect(badge).toHaveClass('animate-pulse');
    });

    it('applies correct size classes', () => {
        const { rerender } = render(<ChallengeStatus type="pending" size="sm" />);
        const badge = screen.getByText('Pending').closest('span');
        expect(badge).toHaveClass('px-2', 'py-0.5', 'text-xs');

        rerender(<ChallengeStatus type="pending" size="md" />);
        expect(screen.getByText('Pending').closest('span')).toHaveClass('px-2.5', 'py-1', 'text-sm');

        rerender(<ChallengeStatus type="pending" size="lg" />);
        expect(screen.getByText('Pending').closest('span')).toHaveClass('px-3', 'py-1.5', 'text-base');
    });

    it('applies custom className', () => {
        render(<ChallengeStatus type="pending" className="custom-class" />);
        const badge = screen.getByText('Pending').closest('span');
        expect(badge).toHaveClass('custom-class');
    });
}); 