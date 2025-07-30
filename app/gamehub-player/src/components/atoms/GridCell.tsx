interface GridCellProps {
    row: number; // 0-9 (A-J)
    col: number; // 0-9 (1-10)
    isOccupied?: boolean;
    isHovered?: boolean;
    isSelected?: boolean;
    isValid?: boolean;
    hasShipPart?: boolean;
    isHit?: boolean;
    isMiss?: boolean;
    onClick?: () => void;
    onMouseEnter?: () => void;
    onMouseLeave?: () => void;
    disabled?: boolean;
}

export function GridCell({
    row,
    col,
    isOccupied = false,
    isHovered = false,
    isSelected = false,
    isValid = true,
    hasShipPart = false,
    isHit = false,
    isMiss = false,
    onClick,
    onMouseEnter,
    onMouseLeave,
    disabled = false
}: GridCellProps) {
    const getCellStyle = () => {
        let baseStyle = "w-8 h-8 border border-gray-300 flex items-center justify-center text-xs font-medium transition-all duration-200";

        // Background colors based on state
        if (isHit) {
            baseStyle += " bg-red-500 text-white";
        } else if (isMiss) {
            baseStyle += " bg-blue-200 text-blue-800";
        } else if (hasShipPart) {
            baseStyle += " bg-gray-600 text-white";
        } else if (isSelected) {
            baseStyle += " bg-blue-400 text-white";
        } else if (isHovered && isValid) {
            baseStyle += " bg-green-200 border-green-400";
        } else if (isHovered && !isValid) {
            baseStyle += " bg-red-200 border-red-400";
        } else if (isOccupied) {
            baseStyle += " bg-gray-100";
        } else {
            baseStyle += " bg-white hover:bg-gray-50";
        }

        // Cursor styles
        if (disabled) {
            baseStyle += " cursor-not-allowed opacity-50";
        } else if (onClick) {
            baseStyle += " cursor-pointer";
        }

        // Border styles
        if (isSelected || isHovered) {
            baseStyle += " border-2";
        }

        return baseStyle;
    };

    const getCellContent = () => {
        if (isHit && hasShipPart) {
            return "💥";
        }
        if (isHit) {
            return "X";
        }
        if (isMiss) {
            return "•";
        }
        if (hasShipPart && !isHit) {
            return "⬛";
        }
        return "";
    };

    return (
        <button
            className={getCellStyle()}
            onClick={onClick}
            onMouseEnter={onMouseEnter}
            onMouseLeave={onMouseLeave}
            disabled={disabled}
            title={`${String.fromCharCode(65 + row)}${col + 1}`}
        >
            {getCellContent()}
        </button>
    );
}

export type { GridCellProps };