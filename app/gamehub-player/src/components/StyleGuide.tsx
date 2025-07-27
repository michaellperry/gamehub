import React from 'react';
import { Button } from './atoms/Button';
import { Icon, type IconName } from './atoms/Icon';
import { Card } from './atoms/Card';
import { Avatar } from './atoms/Avatar';
import { Badge } from './atoms/Badge';
import { Alert } from './atoms/Alert';
import { GameCard } from './molecules/GameCard';
import { PlayerAvatar } from './molecules/PlayerAvatar';
import { GameStatus } from './molecules/GameStatus';
import { GameSession } from './organisms/GameSession';

export const StyleGuide: React.FC = () => {
    const samplePlayers = [
        {
            id: '1',
            name: 'Player One',
            avatar: undefined,
            status: 'online' as const,
            level: 15,
            rank: 'Gold',
            isHost: true,
            isReady: true,
            isSpectating: false,
            score: 1250,
        },
        {
            id: '2',
            name: 'Player Two',
            avatar: undefined,
            status: 'ready' as const,
            level: 8,
            rank: 'Silver',
            isHost: false,
            isReady: true,
            isSpectating: false,
            score: 850,
        },
        {
            id: '3',
            name: 'Player Three',
            avatar: undefined,
            status: 'away' as const,
            level: 22,
            rank: 'Platinum',
            isHost: false,
            isReady: false,
            isSpectating: false,
            score: 2100,
        },
    ];

    const sampleGame = {
        id: 'game-1',
        title: 'Epic Battle Royale',
        description: 'An intense multiplayer battle where only the strongest survive. Join forces or fight alone in this epic showdown.',
        image: undefined,
        players: samplePlayers,
        maxPlayers: 8,
        gameStatus: 'waiting' as const,
        gameType: 'Battle Royale',
        difficulty: 'medium' as const,
        estimatedDuration: '15-20 min',
        tags: ['Action', 'Strategy', 'Multiplayer'],
    };

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <div className="max-w-7xl mx-auto">
                <div className="mb-8">
                    <h1 className="text-4xl font-bold text-gray-900 mb-4">GameHub Player Design System</h1>
                    <p className="text-lg text-gray-600">
                        A comprehensive design system built for gaming applications with real-time interactions.
                    </p>
                </div>

                {/* Atoms */}
                <section className="mb-12">
                    <h2 className="text-2xl font-bold text-gray-900 mb-6">Atoms</h2>

                    {/* Buttons */}
                    <div className="mb-8">
                        <h3 className="text-xl font-semibold text-gray-900 mb-4">Buttons</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            <div className="space-y-2">
                                <h4 className="font-medium text-gray-700">Variants</h4>
                                <div className="space-y-2">
                                    <Button variant="primary">Primary</Button>
                                    <Button variant="secondary">Secondary</Button>
                                    <Button variant="success">Success</Button>
                                    <Button variant="warning">Warning</Button>
                                    <Button variant="danger">Danger</Button>
                                    <Button variant="ghost">Ghost</Button>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <h4 className="font-medium text-gray-700">Sizes</h4>
                                <div className="space-y-2">
                                    <Button size="sm">Small</Button>
                                    <Button size="md">Medium</Button>
                                    <Button size="lg">Large</Button>
                                    <Button size="xl">Extra Large</Button>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <h4 className="font-medium text-gray-700">States</h4>
                                <div className="space-y-2">
                                    <Button loading>Loading</Button>
                                    <Button disabled>Disabled</Button>
                                    <Button icon="play">With Icon</Button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Icons */}
                    <div className="mb-8">
                        <h3 className="text-xl font-semibold text-gray-900 mb-4">Icons</h3>
                        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                            {['play', 'pause', 'stop', 'join', 'leave', 'ready', 'chat', 'friends', 'notifications', 'home', 'settings', 'close'].map((icon) => (
                                <div key={icon} className="flex flex-col items-center p-3 bg-white rounded-lg border border-gray-200">
                                    <Icon name={icon as IconName} size="md" className="mb-2" />
                                    <span className="text-xs text-gray-600">{icon}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Cards */}
                    <div className="mb-8">
                        <h3 className="text-xl font-semibold text-gray-900 mb-4">Cards</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            <Card variant="default" header={<h4 className="font-medium">Default Card</h4>}>
                                <p className="text-sm text-gray-600">This is a default card with some content.</p>
                            </Card>

                            <Card variant="game" header={<h4 className="font-medium">Game Card</h4>}>
                                <p className="text-sm text-gray-600">This is a game-specific card with enhanced styling.</p>
                            </Card>

                            <Card variant="player" header={<h4 className="font-medium">Player Card</h4>}>
                                <p className="text-sm text-gray-600">This is a player-specific card.</p>
                            </Card>
                        </div>
                    </div>

                    {/* Avatars */}
                    <div className="mb-8">
                        <h3 className="text-xl font-semibold text-gray-900 mb-4">Avatars</h3>
                        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                            <Avatar playerName="Player" status="online" size="sm" />
                            <Avatar playerName="Player" status="ready" size="md" />
                            <Avatar playerName="Player" status="away" size="lg" />
                            <Avatar playerName="Player" status="busy" size="xl" level={15} />
                            <Avatar playerName="Player" status="in-game" size="md" rank="Gold" />
                            <Avatar playerName="Player" status="spectating" size="md" />
                        </div>
                    </div>

                    {/* Badges */}
                    <div className="mb-8">
                        <h3 className="text-xl font-semibold text-gray-900 mb-4">Badges</h3>
                        <div className="flex flex-wrap gap-2">
                            <Badge variant="default">Default</Badge>
                            <Badge variant="success">Success</Badge>
                            <Badge variant="warning">Warning</Badge>
                            <Badge variant="danger">Danger</Badge>
                            <Badge variant="info">Info</Badge>
                            <Badge variant="primary">Primary</Badge>
                            <Badge variant="achievement" glow>Achievement</Badge>
                            <Badge variant="rank" pulse>Rank</Badge>
                        </div>
                    </div>

                    {/* Alerts */}
                    <div className="mb-8">
                        <h3 className="text-xl font-semibold text-gray-900 mb-4">Alerts</h3>
                        <div className="space-y-4">
                            <Alert variant="info" title="Information">
                                This is an informational alert.
                            </Alert>
                            <Alert variant="success" title="Success">
                                This is a success alert.
                            </Alert>
                            <Alert variant="warning" title="Warning">
                                This is a warning alert.
                            </Alert>
                            <Alert variant="error" title="Error">
                                This is an error alert.
                            </Alert>
                            <Alert variant="game-event" title="Game Event">
                                This is a game event alert.
                            </Alert>
                        </div>
                    </div>
                </section>

                {/* Molecules */}
                <section className="mb-12">
                    <h2 className="text-2xl font-bold text-gray-900 mb-6">Molecules</h2>

                    {/* Game Cards */}
                    <div className="mb-8">
                        <h3 className="text-xl font-semibold text-gray-900 mb-4">Game Cards</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            <GameCard {...sampleGame} />
                            <GameCard {...sampleGame} gameStatus="active" />
                            <GameCard {...sampleGame} gameStatus="finished" />
                        </div>
                    </div>

                    {/* Player Avatars */}
                    <div className="mb-8">
                        <h3 className="text-xl font-semibold text-gray-900 mb-4">Player Avatars</h3>
                        <div className="space-y-4">
                            {samplePlayers.map((player) => (
                                <PlayerAvatar key={player.id} {...player} />
                            ))}
                        </div>
                    </div>

                    {/* Game Status */}
                    <div className="mb-8">
                        <h3 className="text-xl font-semibold text-gray-900 mb-4">Game Status</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <GameStatus
                                status="waiting"
                                players={samplePlayers.map(p => ({
                                    id: p.id,
                                    name: p.name,
                                    ready: p.isReady,
                                    connected: true,
                                }))}
                                maxPlayers={8}
                            />
                            <GameStatus
                                status="active"
                                players={samplePlayers.map(p => ({
                                    id: p.id,
                                    name: p.name,
                                    ready: p.isReady,
                                    connected: true,
                                }))}
                                maxPlayers={8}
                                gameTime={1250}
                                roundNumber={3}
                                totalRounds={5}
                            />
                        </div>
                    </div>
                </section>

                {/* Organisms */}
                <section className="mb-12">
                    <h2 className="text-2xl font-bold text-gray-900 mb-6">Organisms</h2>

                    {/* Game Session */}
                    <div className="mb-8">
                        <h3 className="text-xl font-semibold text-gray-900 mb-4">Game Session</h3>
                        <GameSession
                            id="session-1"
                            title="Epic Battle Royale"
                            status="waiting"
                            players={samplePlayers}
                            maxPlayers={8}
                            isHost={true}
                            currentPlayerId="1"
                            onReady={() => console.log('Ready clicked')}
                            onLeave={() => console.log('Leave clicked')}
                            onStart={() => console.log('Start clicked')}
                            onKickPlayer={(playerId) => console.log('Kick player:', playerId)}
                        />
                    </div>
                </section>

                {/* Color System */}
                <section className="mb-12">
                    <h2 className="text-2xl font-bold text-gray-900 mb-6">Color System</h2>
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                        <div className="text-center">
                            <div className="w-16 h-16 bg-primary-600 rounded-lg mx-auto mb-2"></div>
                            <span className="text-sm text-gray-600">Primary</span>
                        </div>
                        <div className="text-center">
                            <div className="w-16 h-16 bg-green-600 rounded-lg mx-auto mb-2"></div>
                            <span className="text-sm text-gray-600">Success</span>
                        </div>
                        <div className="text-center">
                            <div className="w-16 h-16 bg-yellow-600 rounded-lg mx-auto mb-2"></div>
                            <span className="text-sm text-gray-600">Warning</span>
                        </div>
                        <div className="text-center">
                            <div className="w-16 h-16 bg-red-600 rounded-lg mx-auto mb-2"></div>
                            <span className="text-sm text-gray-600">Danger</span>
                        </div>
                        <div className="text-center">
                            <div className="w-16 h-16 bg-blue-600 rounded-lg mx-auto mb-2"></div>
                            <span className="text-sm text-gray-600">Info</span>
                        </div>
                        <div className="text-center">
                            <div className="w-16 h-16 bg-purple-600 rounded-lg mx-auto mb-2"></div>
                            <span className="text-sm text-gray-600">Game Event</span>
                        </div>
                    </div>
                </section>

                {/* Typography */}
                <section className="mb-12">
                    <h2 className="text-2xl font-bold text-gray-900 mb-6">Typography</h2>
                    <div className="space-y-4">
                        <h1 className="text-4xl font-bold text-gray-900">Game Title (text-4xl font-bold)</h1>
                        <h2 className="text-2xl font-semibold text-gray-900">Section Headers (text-2xl font-semibold)</h2>
                        <h3 className="text-lg font-medium text-gray-900">Card Titles (text-lg font-medium)</h3>
                        <p className="text-base text-gray-700">Body Text (text-base text-gray-700)</p>
                        <p className="text-sm text-gray-600">Game Text (text-sm text-gray-600)</p>
                        <p className="text-xs text-gray-500">Status Text (text-xs text-gray-500)</p>
                    </div>
                </section>
            </div>
        </div>
    );
}; 