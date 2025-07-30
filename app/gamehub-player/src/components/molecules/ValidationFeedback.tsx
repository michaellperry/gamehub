import { Alert } from '../atoms/Alert';

interface ValidationError {
    type: 'overlap' | 'out-of-bounds' | 'missing-ships' | 'invalid-position';
    message: string;
    shipId?: string;
}

interface ValidationFeedbackProps {
    errors: ValidationError[];
    warnings: ValidationError[];
    isValid: boolean;
    allShipsPlaced: boolean;
    className?: string;
}

export function ValidationFeedback({
    errors,
    warnings,
    isValid,
    allShipsPlaced,
    className = ''
}: ValidationFeedbackProps) {
    const hasErrors = errors.length > 0;
    const hasWarnings = warnings.length > 0;

    if (!hasErrors && !hasWarnings && allShipsPlaced && isValid) {
        return (
            <div className={className}>
                <Alert variant="success" title="Fleet Ready">
                    All ships are properly positioned and ready for battle!
                </Alert>
            </div>
        );
    }

    return (
        <div className={`space-y-3 ${className}`}>
            {/* Errors */}
            {hasErrors && (
                <div className="space-y-2">
                    {errors.map((error, index) => (
                        <Alert
                            key={index}
                            variant="error"
                            title="Placement Error"
                        >
                            {error.message}
                        </Alert>
                    ))}
                </div>
            )}

            {/* Warnings */}
            {hasWarnings && (
                <div className="space-y-2">
                    {warnings.map((warning, index) => (
                        <Alert
                            key={index}
                            variant="warning"
                            title="Placement Warning"
                        >
                            {warning.message}
                        </Alert>
                    ))}
                </div>
            )}

            {/* General validation state */}
            {!allShipsPlaced && !hasErrors && (
                <Alert variant="info" title="Fleet Incomplete">
                    Place all ships on the grid to proceed to battle.
                </Alert>
            )}

            {/* Helpful tips */}
            {(!allShipsPlaced || hasErrors) && (
                <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="text-sm text-blue-800">
                        <div className="font-medium mb-2">💡 Placement Tips:</div>
                        <ul className="text-xs space-y-1 list-disc list-inside">
                            <li>Ships cannot overlap or touch each other</li>
                            <li>Ships must be placed entirely within the grid</li>
                            <li>Double-click a ship to rotate it</li>
                            <li>Use random placement for quick setup</li>
                        </ul>
                    </div>
                </div>
            )}
        </div>
    );
}

export type { ValidationFeedbackProps, ValidationError };