import { useMemo } from 'react';
import { FleetShip } from '../components/atoms';

interface ValidationError {
    type: 'overlap' | 'out-of-bounds' | 'missing-ships' | 'invalid-position';
    message: string;
    shipId?: string;
    severity: 'error' | 'warning';
}

interface PlacedShip extends FleetShip {
    position: { row: number; col: number };
}

interface UseFleetValidationProps {
    ships: FleetShip[];
    placedShips: PlacedShip[];
}

export function useFleetValidation({ ships, placedShips }: UseFleetValidationProps) {
    const validation = useMemo(() => {
        const errors: ValidationError[] = [];
        const warnings: ValidationError[] = [];

        // Check for missing ships
        const unplacedShips = ships.filter(ship => !ship.isPlaced);
        if (unplacedShips.length > 0) {
            warnings.push({
                type: 'missing-ships',
                message: `${unplacedShips.length} ship${unplacedShips.length > 1 ? 's' : ''} still need to be placed`,
                severity: 'warning'
            });
        }

        // Check each placed ship
        placedShips.forEach(ship => {
            // Check bounds
            const shipCells = [];
            for (let i = 0; i < ship.size; i++) {
                const row = ship.orientation === 'vertical' ? ship.position.row + i : ship.position.row;
                const col = ship.orientation === 'horizontal' ? ship.position.col + i : ship.position.col;
                shipCells.push({ row, col });
            }

            // Check if ship goes out of bounds
            const outOfBounds = shipCells.some(cell => 
                cell.row < 0 || cell.row >= 10 || cell.col < 0 || cell.col >= 10
            );

            if (outOfBounds) {
                errors.push({
                    type: 'out-of-bounds',
                    message: `${ship.type} extends outside the game grid`,
                    shipId: ship.id,
                    severity: 'error'
                });
            }

            // Check for overlaps with other ships
            const otherShips = placedShips.filter(otherShip => otherShip.id !== ship.id);
            for (const otherShip of otherShips) {
                const otherCells = [];
                for (let i = 0; i < otherShip.size; i++) {
                    const row = otherShip.orientation === 'vertical' ? otherShip.position.row + i : otherShip.position.row;
                    const col = otherShip.orientation === 'horizontal' ? otherShip.position.col + i : otherShip.position.col;
                    otherCells.push({ row, col });
                }

                const overlaps = shipCells.some(cell => 
                    otherCells.some(otherCell => 
                        cell.row === otherCell.row && cell.col === otherCell.col
                    )
                );

                if (overlaps) {
                    errors.push({
                        type: 'overlap',
                        message: `${ship.type} overlaps with ${otherShip.type}`,
                        shipId: ship.id,
                        severity: 'error'
                    });
                    break; // Only report one overlap per ship
                }
            }
        });

        const isValid = errors.length === 0;
        const isComplete = unplacedShips.length === 0 && isValid;

        return {
            errors,
            warnings,
            isValid,
            isComplete,
            hasErrors: errors.length > 0,
            hasWarnings: warnings.length > 0
        };
    }, [ships, placedShips]);

    const getShipValidation = (shipId: string) => {
        const shipErrors = validation.errors.filter(error => error.shipId === shipId);
        const shipWarnings = validation.warnings.filter(warning => warning.shipId === shipId);
        
        return {
            errors: shipErrors,
            warnings: shipWarnings,
            isValid: shipErrors.length === 0,
            hasIssues: shipErrors.length > 0 || shipWarnings.length > 0
        };
    };

    const isValidPlacement = (
        row: number, 
        col: number, 
        size: number, 
        orientation: 'horizontal' | 'vertical',
        excludeShipId?: string
    ): boolean => {
        // Calculate ship cells
        const shipCells = [];
        for (let i = 0; i < size; i++) {
            const cellRow = orientation === 'vertical' ? row + i : row;
            const cellCol = orientation === 'horizontal' ? col + i : col;
            shipCells.push({ row: cellRow, col: cellCol });
        }

        // Check bounds
        const outOfBounds = shipCells.some(cell => 
            cell.row < 0 || cell.row >= 10 || cell.col < 0 || cell.col >= 10
        );
        if (outOfBounds) return false;

        // Check overlap with other ships
        const otherShips = placedShips.filter(ship => ship.id !== excludeShipId);
        for (const otherShip of otherShips) {
            const otherCells = [];
            for (let i = 0; i < otherShip.size; i++) {
                const cellRow = otherShip.orientation === 'vertical' ? otherShip.position.row + i : otherShip.position.row;
                const cellCol = otherShip.orientation === 'horizontal' ? otherShip.position.col + i : otherShip.position.col;
                otherCells.push({ row: cellRow, col: cellCol });
            }

            const overlaps = shipCells.some(cell => 
                otherCells.some(otherCell => 
                    cell.row === otherCell.row && cell.col === otherCell.col
                )
            );
            if (overlaps) return false;
        }

        return true;
    };

    return {
        ...validation,
        getShipValidation,
        isValidPlacement
    };
}

export type { UseFleetValidationProps, ValidationError };