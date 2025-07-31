import { render, screen, fireEvent } from '@testing-library/react';
import { vi, describe, it, expect } from 'vitest';
import { GridCell } from '../../components/atoms/GridCell';

describe('GridCell', () => {
    const defaultProps = {
        row: 0,
        col: 0
    };

    it('renders correctly with default props', () => {
        render(<GridCell {...defaultProps} />);
        const cell = screen.getByRole('button');
        expect(cell).toBeInTheDocument();
        expect(cell).toHaveAttribute('title', 'A1');
    });

    it('displays correct cell coordinates in title', () => {
        render(<GridCell row={2} col={4} />);
        const cell = screen.getByRole('button');
        expect(cell).toHaveAttribute('title', 'C5');
    });

    it('calls onClick when clicked', () => {
        const mockOnClick = vi.fn();
        render(<GridCell {...defaultProps} onClick={mockOnClick} />);

        const cell = screen.getByRole('button');
        fireEvent.click(cell);

        expect(mockOnClick).toHaveBeenCalledTimes(1);
    });

    it('calls mouse event handlers', () => {
        const mockOnMouseEnter = vi.fn();
        const mockOnMouseLeave = vi.fn();

        render(
            <GridCell
                {...defaultProps}
                onMouseEnter={mockOnMouseEnter}
                onMouseLeave={mockOnMouseLeave}
            />
        );

        const cell = screen.getByRole('button');
        fireEvent.mouseEnter(cell);
        fireEvent.mouseLeave(cell);

        expect(mockOnMouseEnter).toHaveBeenCalledTimes(1);
        expect(mockOnMouseLeave).toHaveBeenCalledTimes(1);
    });

    it('is disabled when disabled prop is true', () => {
        render(<GridCell {...defaultProps} disabled={true} />);
        const cell = screen.getByRole('button');
        expect(cell).toBeDisabled();
    });

    it('shows ship part content when hasShipPart is true', () => {
        render(<GridCell {...defaultProps} hasShipPart={true} />);
        const cell = screen.getByRole('button');
        expect(cell).toHaveTextContent('⬛');
    });

    it('shows hit explosion when both isHit and hasShipPart are true', () => {
        render(<GridCell {...defaultProps} isHit={true} hasShipPart={true} />);
        const cell = screen.getByRole('button');
        expect(cell).toHaveTextContent('💥');
    });

    it('shows miss marker when isMiss is true', () => {
        render(<GridCell {...defaultProps} isMiss={true} />);
        const cell = screen.getByRole('button');
        expect(cell).toHaveTextContent('•');
    });

    it('applies correct CSS classes for different states', () => {
        const { rerender } = render(<GridCell {...defaultProps} />);
        let cell = screen.getByRole('button');
        expect(cell).toHaveClass('bg-white');

        rerender(<GridCell {...defaultProps} isHovered={true} isValid={true} />);
        cell = screen.getByRole('button');
        expect(cell).toHaveClass('bg-green-200');

        rerender(<GridCell {...defaultProps} isHovered={true} isValid={false} />);
        cell = screen.getByRole('button');
        expect(cell).toHaveClass('bg-red-200');

        rerender(<GridCell {...defaultProps} isSelected={true} />);
        cell = screen.getByRole('button');
        expect(cell).toHaveClass('bg-blue-400');
    });
});