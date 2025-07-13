import React, { useEffect } from 'react';
import ModalFooter from './ModalFooter';

export interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: React.ReactNode;
    children: React.ReactNode;
    footer?: React.ReactNode;
    size?: 'sm' | 'md' | 'lg' | 'xl';
    closeOnEsc?: boolean;
    closeOnOverlayClick?: boolean;
    preventScroll?: boolean;
}

const Modal: React.FC<ModalProps> = ({
    isOpen,
    onClose,
    title,
    children,
    footer,
    size = 'md',
    closeOnEsc = true,
    closeOnOverlayClick = true,
    preventScroll = true,
}) => {
    // Handle ESC key press
    useEffect(() => {
        const handleEscKey = (event: KeyboardEvent) => {
            if (closeOnEsc && isOpen && event.key === 'Escape') {
                onClose();
            }
        };

        if (isOpen) {
            document.addEventListener('keydown', handleEscKey);
        }

        return () => {
            document.removeEventListener('keydown', handleEscKey);
        };
    }, [isOpen, onClose, closeOnEsc]);

    // Prevent body scroll when modal is open
    useEffect(() => {
        if (preventScroll) {
            if (isOpen) {
                document.body.style.overflow = 'hidden';
            } else {
                document.body.style.overflow = '';
            }
        }

        return () => {
            document.body.style.overflow = '';
        };
    }, [isOpen, preventScroll]);

    // Size classes
    const sizeClasses = {
        sm: 'sm:max-w-sm',
        md: 'sm:max-w-lg',
        lg: 'sm:max-w-2xl',
        xl: 'sm:max-w-4xl',
    };

    if (!isOpen) return null;

    return (
        <div className="fixed z-10 inset-0 overflow-y-auto">
            <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                {/* Background overlay */}
                <div
                    className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
                    aria-hidden="true"
                    onClick={closeOnOverlayClick ? onClose : undefined}
                ></div>

                {/* This element is to trick the browser into centering the modal contents. */}
                <span
                    className="hidden sm:inline-block sm:align-middle sm:h-screen"
                    aria-hidden="true"
                >
                    &#8203;
                </span>

                {/* Modal panel */}
                <div
                    className={`inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle ${sizeClasses[size]} sm:w-full sm:p-6`}
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="modal-title"
                >
                    {/* Header */}
                    <div className="flex items-start justify-between">
                        <h3
                            className="text-lg leading-6 font-medium text-gray-900"
                            id="modal-title"
                        >
                            {title}
                        </h3>
                        <button
                            type="button"
                            className="bg-white rounded-md text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                            onClick={onClose}
                        >
                            <span className="sr-only">Close</span>
                            <svg
                                className="h-6 w-6"
                                xmlns="http://www.w3.org/2000/svg"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                                aria-hidden="true"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth="2"
                                    d="M6 18L18 6M6 6l12 12"
                                />
                            </svg>
                        </button>
                    </div>

                    {/* Content */}
                    <div className="mt-3">{children}</div>

                    {/* Footer */}
                    {footer && <div className="mt-5 sm:mt-6">{footer}</div>}
                </div>
            </div>
        </div>
    );
};

// Convenience component for standard modal with confirm/cancel buttons
export interface ConfirmModalProps extends Omit<ModalProps, 'footer'> {
    confirmText?: string;
    cancelText?: string;
    onConfirm: () => void;
    confirmDisabled?: boolean;
    confirmVariant?: 'primary' | 'danger';
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    onConfirm,
    confirmDisabled = false,
    confirmVariant = 'primary',
    ...props
}) => {
    return (
        <Modal
            {...props}
            footer={
                <ModalFooter
                    onConfirm={onConfirm}
                    onCancel={props.onClose}
                    confirmText={confirmText}
                    cancelText={cancelText}
                    isConfirmDisabled={confirmDisabled}
                />
            }
        />
    );
};

export default Modal;
