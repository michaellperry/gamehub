import { Button, Icon } from '../components';

export default function HomePage() {
    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="text-center">
                    <div className="mb-8">
                        <Icon name="home" size="xl" className="text-primary-600 mx-auto mb-4" />
                        <h1 className="text-4xl font-bold text-gray-900 mb-4">
                            Welcome to GameHub Player
                        </h1>
                        <p className="text-xl text-gray-600">
                            Join game sessions and participate in multiplayer experiences
                        </p>
                    </div>

                    <div className="space-y-6">
                        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 max-w-md mx-auto">
                            <div className="flex items-center justify-center space-x-2 mb-4">
                                <Icon name="friends" size="md" className="text-gray-500" />
                                <span className="text-sm text-gray-500">Ready to play?</span>
                            </div>

                            <Button
                                variant="primary"
                                size="lg"
                                fullWidth
                                icon="join"
                            >
                                Log In to Start Playing
                            </Button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-2xl mx-auto">
                            <div className="text-center p-4">
                                <Icon name="play" size="lg" className="text-primary-600 mx-auto mb-2" />
                                <h3 className="font-medium text-gray-900">Join Games</h3>
                                <p className="text-sm text-gray-600">Find and join exciting multiplayer games</p>
                            </div>

                            <div className="text-center p-4">
                                <Icon name="friends" size="lg" className="text-primary-600 mx-auto mb-2" />
                                <h3 className="font-medium text-gray-900">Connect</h3>
                                <p className="text-sm text-gray-600">Play with friends and make new ones</p>
                            </div>

                            <div className="text-center p-4">
                                <Icon name="leaderboard" size="lg" className="text-primary-600 mx-auto mb-2" />
                                <h3 className="font-medium text-gray-900">Compete</h3>
                                <p className="text-sm text-gray-600">Climb leaderboards and earn achievements</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
