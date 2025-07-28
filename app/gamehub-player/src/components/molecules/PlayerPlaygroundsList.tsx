import { useNavigate } from 'react-router-dom';
import { PlayerPlayground } from '../../hooks/usePlayerPlaygrounds';
import { Button, Card, Icon, LoadingIndicator, Typography, CenteredContent } from '../atoms';
import { getFriendlyDate } from '../../utils/dateUtils';

export interface PlayerPlaygroundsListProps {
    playgrounds: PlayerPlayground[] | null;
    loading: boolean;
    error: string | null;
    onClearError: () => void;
    className?: string;
}

export function PlayerPlaygroundsList({
    playgrounds,
    loading,
    error,
    onClearError,
    className = ''
}: PlayerPlaygroundsListProps) {
    const navigate = useNavigate();

    const handlePlaygroundClick = (playgroundCode: string) => {
        navigate(`/playground/${playgroundCode}`);
    };

    if (loading) {
        return (
            <Card variant="game" size="lg" className={`max-w-md mx-auto ${className}`}>
                <CenteredContent className="py-8">
                    <LoadingIndicator size="md" variant="spinner" text="Loading your playgrounds..." />
                </CenteredContent>
            </Card>
        );
    }

    if (error) {
        return (
            <Card variant="game" size="lg" className={`max-w-md mx-auto ${className}`}>
                <CenteredContent className="py-4">
                    <Typography variant="body" className="text-red-600">
                        {error}
                    </Typography>
                    <Button
                        variant="secondary"
                        size="sm"
                        onClick={onClearError}
                        className="mt-2"
                    >
                        Try Again
                    </Button>
                </CenteredContent>
            </Card>
        );
    }

    if (!playgrounds || playgrounds.length === 0) {
        return (
            <Card variant="game" size="lg" className={`max-w-md mx-auto ${className}`}>
                <CenteredContent className="py-8">
                    <Icon name="friends" size="lg" className="text-gray-400 mx-auto mb-4" />
                    <Typography variant="h3" className="text-lg font-semibold text-gray-900 mb-2">
                        No Playgrounds Yet
                    </Typography>
                    <Typography variant="body-sm" className="text-gray-600">
                        Start a new playground or join one to get started!
                    </Typography>
                </CenteredContent>
            </Card>
        );
    }

    return (
        <Card variant="game" size="lg" className={`max-w-md mx-auto ${className}`}>
            <div className="space-y-4">
                <CenteredContent>
                    <Icon name="friends" size="md" className="text-primary-600 mx-auto mb-2" />
                    <Typography variant="h2" className="text-xl font-semibold text-gray-900">
                        Your Playgrounds ({playgrounds.length})
                    </Typography>
                    <Typography variant="body-sm" className="text-gray-600">
                        Playgrounds you've joined recently
                    </Typography>
                </CenteredContent>

                <div className="space-y-3">
                    {playgrounds.map((playground) => (
                        <div
                            key={playground.playgroundCode}
                            className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                            onClick={() => handlePlaygroundClick(playground.playgroundCode)}
                        >
                            <div className="flex items-center space-x-3">
                                <Icon name="play" size="sm" className="text-primary-600" />
                                <div>
                                    <Typography variant="body" className="font-medium text-gray-900">
                                        {playground.playgroundCode}
                                    </Typography>
                                    <Typography variant="body-sm" className="text-gray-500">
                                        Joined {getFriendlyDate(playground.joinedAt)}
                                    </Typography>
                                </div>
                            </div>
                            <div className="flex items-center space-x-2">
                                <Typography variant="body-sm" className="text-gray-500">
                                    {playground.playerCount} players
                                </Typography>
                                <Icon name="arrow-right" size="sm" className="text-gray-400" />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </Card>
    );
} 