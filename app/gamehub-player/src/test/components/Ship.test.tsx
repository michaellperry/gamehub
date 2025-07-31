import { render, screen, fireEvent } from '@testing-library/react';
import { vi, describe, it, expect } from 'vitest';
import { Ship } from '../../components/atoms/Ship';

describe('Ship', () => {
    const defaultProps = {
        type: 'battleship' as const,
        size: 4,
        orientation: 'horizontal' as const,
        isSelected: false,
        isPlaced: false,
        onClick: undefined,
        onRotate: undefined,
    };

    it('renders correctly with default props', () => {
        render(<Ship {...defaultProps} />);
        const ship = screen.getByTitle(/Battleship.*Double-click to rotate/);
        expect(ship).toBeInTheDocument();
        expect(ship).toHaveClass('border-gray-300', 'bg-white');
    });

    it('renders correct number of segments based on size', () => {
        render(<Ship {...defaultProps} size={3} />);
        // Check that we have 3 ship segments (ship parts)
        const segments = document.querySelectorAll('.bg-gray-600');
        expect(segments).toHaveLength(3);
    });

    it('calls onClick when clicked', () => {
        const mockOnClick = vi.fn();
        render(<Ship {...defaultProps} onClick={mockOnClick} />);

        const ship = screen.getByTitle(/Battleship.*Double-click to rotate/);
        fireEvent.click(ship);

        expect(mockOnClick).toHaveBeenCalledTimes(1);
    });

    it('calls onRotate when double-clicked', () => {
        const mockOnRotate = vi.fn();
        render(<Ship {...defaultProps} onRotate={mockOnRotate} />);

        const ship = screen.getByTitle(/Battleship.*Double-click to rotate/);
        fireEvent.doubleClick(ship);

        expect(mockOnRotate).toHaveBeenCalledTimes(1);
    });

    it('prevents event propagation on click', () => {
        const mockParentClick = vi.fn();
        const mockShipClick = vi.fn();

        render(
            <div onClick={mockParentClick}>
                <Ship {...defaultProps} onClick={mockShipClick} />
            </div>
        );

        const ship = screen.getByTitle(/Battleship.*Double-click to rotate/);
        fireEvent.click(ship);

        expect(mockShipClick).toHaveBeenCalledTimes(1);
        expect(mockParentClick).not.toHaveBeenCalled();
    });

    it('applies correct CSS classes for different states', () => {
        const { rerender } = render(<Ship {...defaultProps} />);
        let ship = screen.getByTitle(/Battleship.*Double-click to rotate/);
        expect(ship).toHaveClass('border-gray-300', 'bg-white');

        rerender(<Ship {...defaultProps} isSelected={true} />);
        ship = screen.getByTitle(/Battleship.*Double-click to rotate/);
        expect(ship).toHaveClass('border-blue-500', 'bg-blue-50');

        rerender(<Ship {...defaultProps} isPlaced={true} />);
        ship = screen.getByTitle(/Battleship.*Double-click to rotate/);
        expect(ship).toHaveClass('border-green-500', 'bg-green-50');

        rerender(<Ship {...defaultProps} isDragging={true} />);
        ship = screen.getByTitle(/Battleship.*Double-click to rotate/);
        expect(ship).toHaveClass('opacity-50');

        rerender(<Ship {...defaultProps} isValid={false} />);
        ship = screen.getByTitle(/Battleship.*Double-click to rotate/);
        expect(ship).toHaveClass('border-red-500', 'bg-red-50');
    });

    it('renders segments in vertical orientation', () => {
        render(<Ship {...defaultProps} orientation="vertical" />);
        const ship = screen.getByTitle(/Battleship.*Double-click to rotate/);
        expect(ship).toHaveClass('flex-col');
    });

    it('renders segments in horizontal orientation by default', () => {
        render(<Ship {...defaultProps} />);
        const ship = screen.getByTitle(/Battleship.*Double-click to rotate/);
        expect(ship).not.toHaveClass('flex-col');
    });

    it('displays correct ship names for different types', () => {
        const { rerender } = render(<Ship {...defaultProps} type="carrier" />);
        expect(screen.getByText('Carrier')).toBeInTheDocument();

        rerender(<Ship {...defaultProps} type="cruiser" />);
        expect(screen.getByText('Cruiser')).toBeInTheDocument();

        rerender(<Ship {...defaultProps} type="submarine" />);
        expect(screen.getByText('Submarine')).toBeInTheDocument();

        rerender(<Ship {...defaultProps} type="destroyer" />);
        expect(screen.getByText('Destroyer')).toBeInTheDocument();
    });
});