import { useNavigate, useParams } from 'react-router-dom';
import { ActiveGamesViewModel } from '../../hooks/useActiveGames';
import { Avatar, Badge, Card, Icon, Typography } from '../atoms';

export interface ActiveGamesProps {
    viewModel: ActiveGamesViewModel;
}

export function ActiveGames({ viewModel }: ActiveGamesProps) {
    const navigate = useNavigate();
    const { code } = useParams<{ code: string }>();

    if (!viewModel.hasGames) {
        return null;
    }

    const handleGameClick = (gameId: string) => {
        if (code) {
            // Encode the game ID to handle special characters
            const encodedGameId = encodeURIComponent(gameId);
            navigate(`/playground/${code}/game/${encodedGameId}`);
        }
    };

    return (
        <Card variant="game" size="lg">
            <div className="space-y-6">
                {/* Header with enhanced styling */}
                <div className="text-center">
                    <div className="flex items-center justify-center space-x-2 mb-2">
                        <Icon name="active" size="md" className="text-primary-600" />
                        <Typography variant="h2" className="text-xl font-semibold text-gray-900">
                            Active Games
                        </Typography>
                        <Badge variant="primary" size="sm">
                            {viewModel.gameCount}
                        </Badge>
                    </div>
                    <Typography variant="body-sm" className="text-gray-600">
                        Click on a game to join or continue playing
                    </Typography>
                </div>

                {/* Games list with enhanced styling */}
                <div className="space-y-3">
                    {viewModel.games.map((game) => (
                        <Card
                            key={game.id}
                            variant="player"
                            size="md"
                            interactive={true}
                            onClick={() => handleGameClick(game.id)}
                            className="hover:border-primary-300 hover:shadow-lg transition-all duration-200"
                        >
                            <div className="flex items-center justify-between">
                                {/* Game info with avatars */}
                                <div className="flex items-center space-x-4">
                                    <div className="flex items-center space-x-2">
                                        <Avatar
                                            playerName={game.playerX}
                                            size="sm"
                                            className="border-2 border-white"
                                        />
                                        <Icon name="minus" size="sm" className="text-gray-400" />
                                        <Avatar
                                            playerName={game.playerO}
                                            size="sm"
                                            className="border-2 border-white"
                                        />
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <Typography variant="body" className="font-medium text-gray-900 truncate">
                                            {game.playerX} vs {game.playerO}
                                        </Typography>
                                        <Typography variant="body-sm" className="text-gray-500">
                                            Tic-tac-toe game
                                        </Typography>
                                    </div>
                                </div>

                                {/* Status indicators */}
                                <div className="flex items-center space-x-2">
                                    {game.isActivePlayer && (
                                        <Badge variant="primary" size="sm" icon="user">
                                            You
                                        </Badge>
                                    )}
                                    <Badge variant="success" size="sm" icon="active">
                                        Active
                                    </Badge>
                                    <Icon
                                        name="arrow-right"
                                        size="sm"
                                        className="text-gray-400 group-hover:text-primary-600 transition-colors duration-200"
                                    />
                                </div>
                            </div>
                        </Card>
                    ))}
                </div>

                {/* Footer with additional info */}
                <div className="text-center pt-4 border-t border-gray-200">
                    <Typography variant="body-sm" className="text-gray-500">
                        Games are updated in real-time
                    </Typography>
                </div>
            </div>
        </Card>
    );
} 