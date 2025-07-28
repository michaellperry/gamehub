import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export interface LeavePlaygroundViewModel {
    isLeaving: boolean;
    showLeaveConfirmation: boolean;
    handleLeaveClick: () => void;
    handleLeaveConfirm: () => Promise<void>;
    handleLeaveCancel: () => void;
}

export function useLeavePlayground(
    handleLeavePlayground: (() => Promise<void>) | null
): LeavePlaygroundViewModel {
    const [isLeaving, setIsLeaving] = useState(false);
    const [showLeaveConfirmation, setShowLeaveConfirmation] = useState(false);
    const navigate = useNavigate();

    const handleLeaveClick = () => {
        setShowLeaveConfirmation(true);
    };

    const handleLeaveConfirm = async () => {
        if (!handleLeavePlayground) return;

        setIsLeaving(true);
        try {
            await handleLeavePlayground();
            setShowLeaveConfirmation(false);
            navigate('/', {
                state: {
                    message: 'Successfully left playground',
                    type: 'success'
                }
            });
        } catch (error) {
            console.error('Error leaving playground:', error);
            alert('Failed to leave playground. Please try again.');
        } finally {
            setIsLeaving(false);
        }
    };

    const handleLeaveCancel = () => {
        setShowLeaveConfirmation(false);
    };

    return {
        isLeaving,
        showLeaveConfirmation,
        handleLeaveClick,
        handleLeaveConfirm,
        handleLeaveCancel,
    };
} 