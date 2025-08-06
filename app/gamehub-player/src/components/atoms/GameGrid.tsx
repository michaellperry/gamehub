import { GridCell } from './GridCell';

interface GridState {
    [key: string]: {
        isOccupied?: boolean;
        hasShipPart?: boolean;
        isHit?: boolean;
        isMiss?: boolean;
        shipId?: string;
    };
}

interface GameGridProps {
    gridState?: GridState;
    hoveredCells?: string[];
    selectedCells?: string[];
    isValid?: boolean;
    onCellClick?: (row: number, col: number) => void;
    onCellHover?: (row: number, col: number) => void;
    onCellLeave?: () => void;
    disabled?: boolean;
    showLabels?: boolean;
}

export function GameGrid({
    gridState = {},
    hoveredCells = [],
    selectedCells = [],
    isValid = true,
    onCellClick,
    onCellHover,
    onCellLeave,
    disabled = false,
    showLabels = true
}: GameGridProps) {
    const getCellKey = (row: number, col: number) => `${row}-${col}`;

    const renderColumnLabels = () => {
        if (!showLabels) return null;
        
        return (
            <div className="flex">
                <div className="w-6 h-6" /> {/* Empty corner */}
                {Array.from({ length: 10 }, (_, col) => (
                    <div key={col} className="w-8 h-6 flex items-center justify-center text-sm font-medium text-gray-600">
                        {col + 1}
                    </div>
                ))}
            </div>
        );
    };

    const renderRowLabel = (row: number) => {
        if (!showLabels) return null;
        
        return (
            <div className="w-6 h-8 flex items-center justify-center text-sm font-medium text-gray-600">
                {String.fromCharCode(65 + row)}
            </div>
        );
    };

    const renderGrid = () => {
        const rows = [];
        
        for (let row = 0; row < 10; row++) {
            const cells = [];
            
            // Add row label
            if (showLabels) {
                cells.push(renderRowLabel(row));
            }
            
            // Add grid cells
            for (let col = 0; col < 10; col++) {
                const cellKey = getCellKey(row, col);
                const cellState = gridState[cellKey] || {};
                const isHovered = hoveredCells.includes(cellKey);
                const isSelected = selectedCells.includes(cellKey);
                
                cells.push(
                    <GridCell
                        key={cellKey}
                        row={row}
                        col={col}
                        isOccupied={cellState.isOccupied}
                        hasShipPart={cellState.hasShipPart}
                        isHit={cellState.isHit}
                        isMiss={cellState.isMiss}
                        isHovered={isHovered}
                        isSelected={isSelected}
                        isValid={isValid}
                        onClick={() => onCellClick?.(row, col)}
                        onMouseEnter={() => onCellHover?.(row, col)}
                        onMouseLeave={onCellLeave}
                        disabled={disabled}
                    />
                );
            }
            
            rows.push(
                <div key={row} className="flex">
                    {cells}
                </div>
            );
        }
        
        return rows;
    };

    return (
        <div className="inline-block bg-white p-4 rounded-lg shadow-lg border border-gray-200">
            {renderColumnLabels()}
            <div className="space-y-0">
                {renderGrid()}
            </div>
        </div>
    );
}

export type { GameGridProps, GridState };