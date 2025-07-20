import { Button, Icon, Card } from '../components/atoms';
import { HeroSection, FeatureGrid, FeatureCard } from '../components/molecules';
import { PageLayout, Container } from '../components/atoms';

export default function HomePage() {
    return (
        <PageLayout variant="default">
            <Container variant="hero">
                <div className="text-center">
                    <HeroSection
                        icon="home"
                        title="Welcome to GameHub Player"
                        subtitle="Join game sessions and participate in multiplayer experiences"
                    />

                    <div className="space-y-6">
                        <Card variant="game" size="lg" className="max-w-md mx-auto">
                            <div className="text-center">
                                <div className="flex items-center justify-center space-x-2 mb-4">
                                    <Icon name="friends" size="md" className="text-gray-500" />
                                    <span className="text-sm text-gray-500">Ready to play?</span>
                                </div>

                                <Button
                                    variant="primary"
                                    size="lg"
                                    fullWidth
                                    icon={<Icon name="join" size="md" />}
                                >
                                    Log In to Start Playing
                                </Button>
                            </div>
                        </Card>

                        <FeatureGrid columns={3} className="max-w-2xl mx-auto">
                            <FeatureCard
                                icon="play"
                                title="Join Games"
                                description="Find and join exciting multiplayer games"
                            />
                            <FeatureCard
                                icon="friends"
                                title="Connect"
                                description="Play with friends and make new ones"
                            />
                            <FeatureCard
                                icon="leaderboard"
                                title="Compete"
                                description="Climb leaderboards and earn achievements"
                            />
                        </FeatureGrid>
                    </div>
                </div>
            </Container>
        </PageLayout>
    );
}
