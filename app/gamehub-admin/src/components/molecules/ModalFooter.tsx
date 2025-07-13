import { Button } from '../atoms';

export interface ModalFooterProps {
    onConfirm: () => void;
    onCancel: () => void;
    confirmText: string;
    cancelText: string;
    isConfirmDisabled?: boolean;
    className?: string;
}

function ModalFooter({
    onConfirm,
    onCancel,
    confirmText,
    cancelText,
    isConfirmDisabled = false,
    className = '',
}: ModalFooterProps) {
    return (
        <div className={`sm:grid sm:grid-cols-2 sm:gap-3 sm:grid-flow-row-dense ${className}`}>
            <Button
                variant="primary"
                onClick={onConfirm}
                disabled={isConfirmDisabled}
                className="sm:col-start-2"
            >
                {confirmText}
            </Button>
            <Button variant="secondary" onClick={onCancel} className="mt-3 sm:mt-0 sm:col-start-1">
                {cancelText}
            </Button>
        </div>
    );
}

export default ModalFooter;
