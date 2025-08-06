import { renderHook, act } from '@testing-library/react';
import { useShipPlacement } from '../../hooks/useShipPlacement';

describe('useShipPlacement', () => {
    it('initializes with standard fleet', () => {
        const { result } = renderHook(() => useShipPlacement());
        
        expect(result.current.ships).toHaveLength(5);
        expect(result.current.placedShips).toHaveLength(0);
        expect(result.current.allShipsPlaced).toBe(false);
        
        // Check ship types
        const shipTypes = result.current.ships.map(ship => ship.type);
        expect(shipTypes).toContain('carrier');
        expect(shipTypes).toContain('battleship');
        expect(shipTypes).toContain('cruiser');
        expect(shipTypes).toContain('submarine');
        expect(shipTypes).toContain('destroyer');
    });

    it('auto-selects first unplaced ship', () => {
        const { result } = renderHook(() => useShipPlacement());
        
        expect(result.current.selectedShipId).toBe('carrier');
        expect(result.current.selectedShip?.type).toBe('carrier');
    });

    it('places ship at valid position', () => {
        const { result } = renderHook(() => useShipPlacement());
        
        const ship = result.current.ships[0]; // carrier
        
        act(() => {
            const success = result.current.placeShip(ship, 0, 0);
            expect(success).toBe(true);
        });
        
        expect(result.current.placedShips).toHaveLength(1);
        expect(result.current.placedShips[0].position).toEqual({ row: 0, col: 0 });
        expect(result.current.ships.find(s => s.id === ship.id)?.isPlaced).toBe(true);
    });

    it('rejects invalid ship placement', () => {
        const { result } = renderHook(() => useShipPlacement());
        
        const ship = result.current.ships[0]; // carrier (size 5)
        
        act(() => {
            // Try to place carrier at position that would go out of bounds
            const success = result.current.placeShip(ship, 0, 7); // would extend to column 11
            expect(success).toBe(false);
        });
        
        expect(result.current.placedShips).toHaveLength(0);
        expect(result.current.ships.find(s => s.id === ship.id)?.isPlaced).toBe(false);
    });

    it('validates placement correctly', () => {
        const { result } = renderHook(() => useShipPlacement());
        
        // Valid placement
        expect(result.current.isValidPlacement(0, 0, 5, 'horizontal')).toBe(true);
        
        // Out of bounds - horizontal
        expect(result.current.isValidPlacement(0, 6, 5, 'horizontal')).toBe(false);
        
        // Out of bounds - vertical
        expect(result.current.isValidPlacement(6, 0, 5, 'vertical')).toBe(false);
        
        // Negative coordinates
        expect(result.current.isValidPlacement(-1, 0, 5, 'horizontal')).toBe(false);
    });

    it('detects ship overlaps', () => {
        const { result } = renderHook(() => useShipPlacement());
        
        const ship1 = result.current.ships[0]; // carrier
        const ship2 = result.current.ships[1]; // battleship
        
        act(() => {
            // Place first ship
            result.current.placeShip(ship1, 0, 0);
        });
        
        // Try to place second ship overlapping
        expect(result.current.isValidPlacement(0, 2, 4, 'horizontal')).toBe(false);
        
        // Valid non-overlapping placement
        expect(result.current.isValidPlacement(1, 0, 4, 'horizontal')).toBe(true);
    });

    it('rotates ship correctly', () => {
        const { result } = renderHook(() => useShipPlacement());
        
        const shipId = 'carrier';
        const initialOrientation = result.current.ships.find(s => s.id === shipId)?.orientation;
        
        act(() => {
            result.current.rotateShip(shipId);
        });
        
        const newOrientation = result.current.ships.find(s => s.id === shipId)?.orientation;
        expect(newOrientation).not.toBe(initialOrientation);
        expect(newOrientation).toBe(initialOrientation === 'horizontal' ? 'vertical' : 'horizontal');
    });

    it('removes ship correctly', () => {
        const { result } = renderHook(() => useShipPlacement());
        
        const ship = result.current.ships[0];
        
        act(() => {
            result.current.placeShip(ship, 0, 0);
        });
        
        expect(result.current.placedShips).toHaveLength(1);
        
        act(() => {
            result.current.removeShip(ship.id);
        });
        
        expect(result.current.placedShips).toHaveLength(0);
        expect(result.current.ships.find(s => s.id === ship.id)?.isPlaced).toBe(false);
    });

    it('clears all ships', () => {
        const { result } = renderHook(() => useShipPlacement());
        
        // Place some ships
        act(() => {
            result.current.placeShip(result.current.ships[0], 0, 0);
            result.current.placeShip(result.current.ships[1], 1, 0);
        });
        
        expect(result.current.placedShips).toHaveLength(2);
        
        act(() => {
            result.current.clearAllShips();
        });
        
        expect(result.current.placedShips).toHaveLength(0);
        expect(result.current.ships.every(ship => !ship.isPlaced)).toBe(true);
    });

    it('selects ship correctly', () => {
        const { result } = renderHook(() => useShipPlacement());
        
        act(() => {
            result.current.selectShip('battleship');
        });
        
        expect(result.current.selectedShipId).toBe('battleship');
        expect(result.current.selectedShip?.type).toBe('battleship');
    });

    it('calls onShipPlaced callback', () => {
        const mockCallback = jest.fn();
        const { result } = renderHook(() => useShipPlacement({ onShipPlaced: mockCallback }));
        
        const ship = result.current.ships[0];
        
        act(() => {
            result.current.placeShip(ship, 0, 0);
        });
        
        expect(mockCallback).toHaveBeenCalledWith(
            expect.objectContaining({
                id: ship.id,
                type: ship.type,
                position: { row: 0, col: 0 }
            })
        );
    });

    it('determines when all ships are placed', () => {
        const { result } = renderHook(() => useShipPlacement());
        
        expect(result.current.allShipsPlaced).toBe(false);
        
        act(() => {
            // Place all ships
            result.current.ships.forEach((ship, index) => {
                result.current.placeShip(ship, index, 0);
            });
        });
        
        expect(result.current.allShipsPlaced).toBe(true);
    });
});