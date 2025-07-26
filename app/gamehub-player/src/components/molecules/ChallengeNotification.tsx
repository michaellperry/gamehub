import React from 'react';
import { Button, Typography, CenteredContent } from '../atoms';
import { Modal } from './index';
import { PlaygroundPlayer } from '../../hooks/usePlaygroundPage';

export interface ChallengeNotificationProps {
    isOpen: boolean;
    onClose: () => void;
    onAccept: () => void;
    onReject: () => void;
    challenger: PlaygroundPlayer;
    playgroundCode: string;
    loading?: boolean;
}

export const ChallengeNotification: React.FC<ChallengeNotificationProps> = ({
    isOpen,
    onClose,
    onAccept,
    onReject,
    challenger,
    playgroundCode,
    loading = false,
}) => {
    const handleAccept = () => {
        onAccept();
        onClose();
    };

    const handleReject = () => {
        onReject();
        onClose();
    };

    const canSubmit = !loading;

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Challenge Received"
            size="md"
            closeOnEsc={false}
            closeOnOverlayClick={false}
            footer={
                <div className="sm:grid sm:grid-cols-2 sm:gap-3 sm:grid-flow-row-dense">
                    <Button
                        variant="success"
                        onClick={handleAccept}
                        disabled={!canSubmit}
                        loading={loading}
                        className="sm:col-start-2"
                    >
                        {loading ? 'Accepting...' : 'Accept Challenge'}
                    </Button>
                    <Button
                        variant="danger"
                        onClick={handleReject}
                        disabled={!canSubmit}
                        className="mt-3 sm:mt-0 sm:col-start-1"
                    >
                        Reject Challenge
                    </Button>
                </div>
            }
        >
            <div className="space-y-6">
                {/* Playground Info */}
                <CenteredContent>
                    <Typography variant="body" className="text-gray-600">
                        Playground: {playgroundCode}
                    </Typography>
                </CenteredContent>

                {/* Challenger Info */}
                <CenteredContent>
                    <Typography variant="h3" className="text-sm font-medium mb-2">
                        Challenge from:
                    </Typography>
                    <Typography variant="body" className="text-lg font-semibold">
                        {challenger.name}
                    </Typography>
                </CenteredContent>

                {/* Challenge Message */}
                <CenteredContent>
                    <Typography variant="body" className="text-gray-600">
                        {challenger.name} wants to play a game with you!
                    </Typography>
                    <Typography variant="body" className="text-sm text-gray-500 mt-2">
                        Accept to start playing, or reject to decline the challenge.
                    </Typography>
                </CenteredContent>

                {/* Challenge Details */}
                <div className="bg-gray-50 rounded-lg p-4">
                    <CenteredContent>
                        <Typography variant="h4" className="text-sm font-medium mb-2">
                            Challenge Details
                        </Typography>
                        <div className="space-y-1 text-sm text-gray-600">
                            <div>Challenger: {challenger.name}</div>
                            <div>Playground: {playgroundCode}</div>
                            <div>Received: {challenger.joinedAt.toLocaleTimeString()}</div>
                        </div>
                    </CenteredContent>
                </div>
            </div>
        </Modal>
    );
}; 