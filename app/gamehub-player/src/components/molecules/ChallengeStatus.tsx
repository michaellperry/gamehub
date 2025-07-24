import React from 'react';
import { Badge } from '../atoms';

export type ChallengeStatusType = 'pending' | 'sent' | 'received' | 'accepted' | 'rejected' | 'expired';

export interface ChallengeStatusProps {
    type: ChallengeStatusType;
    count?: number;
    size?: 'sm' | 'md' | 'lg';
    className?: string;
    onClick?: () => void;
    showCount?: boolean;
    pulse?: boolean;
}

const statusConfig = {
    pending: {
        variant: 'warning' as const,
        icon: 'clock' as const,
        text: 'Pending',
        color: 'text-yellow-600',
    },
    sent: {
        variant: 'info' as const,
        icon: 'arrow-right' as const,
        text: 'Sent',
        color: 'text-blue-600',
    },
    received: {
        variant: 'primary' as const,
        icon: 'notifications' as const,
        text: 'Received',
        color: 'text-primary-600',
    },
    accepted: {
        variant: 'success' as const,
        icon: 'check' as const,
        text: 'Accepted',
        color: 'text-green-600',
    },
    rejected: {
        variant: 'danger' as const,
        icon: 'x' as const,
        text: 'Rejected',
        color: 'text-red-600',
    },
    expired: {
        variant: 'default' as const,
        icon: 'clock' as const,
        text: 'Expired',
        color: 'text-gray-600',
    },
};

export const ChallengeStatus: React.FC<ChallengeStatusProps> = ({
    type,
    count = 1,
    size = 'md',
    className = '',
    onClick,
    showCount = true,
    pulse = false,
}) => {
    const config = statusConfig[type];
    const isInteractive = Boolean(onClick);

    // Don't render if count is 0 and we're showing count
    if (count === 0 && showCount) {
        return null;
    }

    const displayText = showCount && count > 1 ? `${config.text} (${count})` : config.text;

    return (
        <Badge
            variant={config.variant}
            size={size}
            icon={config.icon}
            className={className}
            onClick={onClick}
            interactive={isInteractive}
            pulse={pulse}
        >
            {displayText}
        </Badge>
    );
};

// Convenience components for specific challenge statuses
export const PendingChallengeStatus: React.FC<Omit<ChallengeStatusProps, 'type'>> = (props) => (
    <ChallengeStatus type="pending" {...props} />
);

export const SentChallengeStatus: React.FC<Omit<ChallengeStatusProps, 'type'>> = (props) => (
    <ChallengeStatus type="sent" {...props} />
);

export const ReceivedChallengeStatus: React.FC<Omit<ChallengeStatusProps, 'type'>> = (props) => (
    <ChallengeStatus type="received" {...props} />
);

export const AcceptedChallengeStatus: React.FC<Omit<ChallengeStatusProps, 'type'>> = (props) => (
    <ChallengeStatus type="accepted" {...props} />
);

export const RejectedChallengeStatus: React.FC<Omit<ChallengeStatusProps, 'type'>> = (props) => (
    <ChallengeStatus type="rejected" {...props} />
);

export const ExpiredChallengeStatus: React.FC<Omit<ChallengeStatusProps, 'type'>> = (props) => (
    <ChallengeStatus type="expired" {...props} />
); 