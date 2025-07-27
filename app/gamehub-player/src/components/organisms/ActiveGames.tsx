import { ActiveGamesViewModel } from '../../hooks/useActiveGames';
import { Card, CenteredContent, Icon, Typography } from '../atoms';

export interface ActiveGamesProps {
    viewModel: ActiveGamesViewModel;
}

export function ActiveGames({ viewModel }: ActiveGamesProps) {
    if (!viewModel.hasGames) {
        return null;
    }

    return (
        <Card variant="game" size="lg">
            <div className="space-y-4">
                <CenteredContent>
                    <Typography variant="h2" className="text-xl font-semibold text-gray-900">
                        Active Games ({viewModel.gameCount})
                    </Typography>
                </CenteredContent>

                <div className="space-y-2">
                    {viewModel.games.map((game) => (
                        <div
                            key={game.id}
                            className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                        >
                            <div className="flex items-center space-x-3">
                                <Icon name="play" size="sm" className="text-gray-500" />
                                <div>
                                    <Typography variant="body" className="font-medium">
                                        {game.playerX} vs {game.playerO}
                                    </Typography>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </Card>
    );
} 