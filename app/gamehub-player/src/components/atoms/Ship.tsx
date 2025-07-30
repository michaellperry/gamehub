import { forwardRef } from 'react';

export type ShipType = 'carrier' | 'battleship' | 'cruiser' | 'submarine' | 'destroyer';
export type ShipOrientation = 'horizontal' | 'vertical';

interface ShipProps {
    type: ShipType;
    size: number;
    orientation?: ShipOrientation;
    isPlaced?: boolean;
    isDragging?: boolean;
    isValid?: boolean;
    isSelected?: boolean;
    onClick?: () => void;
    onRotate?: () => void;
    className?: string;
}

const SHIP_NAMES: Record<ShipType, string> = {
    carrier: 'Carrier',
    battleship: 'Battleship',
    cruiser: 'Cruiser',
    submarine: 'Submarine',
    destroyer: 'Destroyer'
};

const SHIP_ICONS: Record<ShipType, string> = {
    carrier: '🚢',
    battleship: '⚓',
    cruiser: '🛥️',
    submarine: '🚤',
    destroyer: '⛵'
};

export const Ship = forwardRef<HTMLDivElement, ShipProps>(({
    type,
    size,
    orientation = 'horizontal',
    isPlaced = false,
    isDragging = false,
    isValid = true,
    isSelected = false,
    onClick,
    onRotate,
    className = ''
}, ref) => {
    const getShipStyle = () => {
        let baseStyle = "inline-flex items-center justify-center gap-1 p-2 rounded-lg border-2 transition-all duration-200 select-none";

        // State-based styling
        if (isDragging) {
            baseStyle += " opacity-50 shadow-lg scale-105";
        } else if (isSelected) {
            baseStyle += " border-blue-500 bg-blue-50 shadow-md";
        } else if (isPlaced) {
            baseStyle += " border-green-500 bg-green-50";
        } else if (!isValid) {
            baseStyle += " border-red-500 bg-red-50";
        } else {
            baseStyle += " border-gray-300 bg-white hover:border-gray-400 hover:shadow-sm";
        }

        // Cursor styles
        if (onClick) {
            baseStyle += " cursor-pointer";
        } else if (isDragging) {
            baseStyle += " cursor-grabbing";
        } else {
            baseStyle += " cursor-grab";
        }

        // Orientation styles
        if (orientation === 'vertical') {
            baseStyle += " flex-col";
        }

        return `${baseStyle} ${className}`;
    };

    const renderShipSegments = () => {
        const segments = [];
        for (let i = 0; i < size; i++) {
            segments.push(
                <div
                    key={i}
                    className={`w-6 h-6 bg-gray-600 rounded border border-gray-700 flex items-center justify-center text-white text-xs ${
                        orientation === 'vertical' ? 'mb-1 last:mb-0' : 'mr-1 last:mr-0'
                    }`}
                >
                    {i === 0 ? SHIP_ICONS[type] : '⬛'}
                </div>
            );
        }
        return segments;
    };

    const handleClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (onClick) {
            onClick();
        }
    };

    const handleDoubleClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (onRotate) {
            onRotate();
        }
    };

    return (
        <div
            ref={ref}
            className={getShipStyle()}
            onClick={handleClick}
            onDoubleClick={handleDoubleClick}
            title={`${SHIP_NAMES[type]} (${size} units) - Double-click to rotate`}
        >
            <div className={`flex ${orientation === 'vertical' ? 'flex-col' : 'flex-row'}`}>
                {renderShipSegments()}
            </div>
            <div className="text-xs text-gray-600 ml-2">
                {SHIP_NAMES[type]}
            </div>
        </div>
    );
});

Ship.displayName = 'Ship';

export type { ShipProps };