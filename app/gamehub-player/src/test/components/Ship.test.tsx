import { render, screen, fireEvent } from '@testing-library/react';
import { Ship } from '../../components/atoms/Ship';

describe('Ship', () => {
    const defaultProps = {
        type: 'destroyer' as const,
        size: 2
    };

    it('renders correctly with default props', () => {
        render(<Ship {...defaultProps} />);
        const ship = screen.getByText('Destroyer');
        expect(ship).toBeInTheDocument();
    });

    it('renders correct number of segments based on size', () => {
        render(<Ship type="carrier" size={5} />);
        // Check that we have 5 ship segments (ship parts)
        const segments = document.querySelectorAll('.bg-gray-600');
        expect(segments).toHaveLength(5);
    });

    it('calls onClick when clicked', () => {
        const mockOnClick = jest.fn();
        render(<Ship {...defaultProps} onClick={mockOnClick} />);
        
        const ship = screen.getByTitle(/Destroyer.*Double-click to rotate/);
        fireEvent.click(ship);
        
        expect(mockOnClick).toHaveBeenCalledTimes(1);
    });

    it('calls onRotate when double-clicked', () => {
        const mockOnRotate = jest.fn();
        render(<Ship {...defaultProps} onRotate={mockOnRotate} />);
        
        const ship = screen.getByTitle(/Destroyer.*Double-click to rotate/);
        fireEvent.doubleClick(ship);
        
        expect(mockOnRotate).toHaveBeenCalledTimes(1);
    });

    it('prevents event propagation on click', () => {
        const mockParentClick = jest.fn();
        const mockShipClick = jest.fn();
        
        render(
            <div onClick={mockParentClick}>
                <Ship {...defaultProps} onClick={mockShipClick} />
            </div>
        );
        
        const ship = screen.getByTitle(/Destroyer.*Double-click to rotate/);
        fireEvent.click(ship);
        
        expect(mockShipClick).toHaveBeenCalledTimes(1);
        expect(mockParentClick).not.toHaveBeenCalled();
    });

    it('applies correct CSS classes for different states', () => {
        const { rerender } = render(<Ship {...defaultProps} />);
        let ship = screen.getByTitle(/Destroyer.*Double-click to rotate/);
        expect(ship).toHaveClass('border-gray-300', 'bg-white');

        rerender(<Ship {...defaultProps} isSelected={true} />);
        ship = screen.getByTitle(/Destroyer.*Double-click to rotate/);
        expect(ship).toHaveClass('border-blue-500', 'bg-blue-50');

        rerender(<Ship {...defaultProps} isPlaced={true} />);
        ship = screen.getByTitle(/Destroyer.*Double-click to rotate/);
        expect(ship).toHaveClass('border-green-500', 'bg-green-50');

        rerender(<Ship {...defaultProps} isDragging={true} />);
        ship = screen.getByTitle(/Destroyer.*Double-click to rotate/);
        expect(ship).toHaveClass('opacity-50');

        rerender(<Ship {...defaultProps} isValid={false} />);
        ship = screen.getByTitle(/Destroyer.*Double-click to rotate/);
        expect(ship).toHaveClass('border-red-500', 'bg-red-50');
    });

    it('renders segments in vertical orientation', () => {
        render(<Ship {...defaultProps} orientation="vertical" />);
        const ship = screen.getByTitle(/Destroyer.*Double-click to rotate/);
        expect(ship).toHaveClass('flex-col');
    });

    it('renders segments in horizontal orientation by default', () => {
        render(<Ship {...defaultProps} />);
        const ship = screen.getByTitle(/Destroyer.*Double-click to rotate/);
        expect(ship).not.toHaveClass('flex-col');
    });

    it('displays correct ship names for different types', () => {
        const shipTypes = [
            { type: 'carrier', name: 'Carrier' },
            { type: 'battleship', name: 'Battleship' },
            { type: 'cruiser', name: 'Cruiser' },
            { type: 'submarine', name: 'Submarine' },
            { type: 'destroyer', name: 'Destroyer' }
        ] as const;

        shipTypes.forEach(({ type, name }) => {
            render(<Ship type={type} size={3} />);
            expect(screen.getByText(name)).toBeInTheDocument();
        });
    });
});