export default function HomePage() {
    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="text-center">
                    <h1 className="text-4xl font-bold text-gray-900 mb-8">
                        Welcome to GameHub Player
                    </h1>
                    <p className="text-xl text-gray-600 mb-8">
                        Join game sessions and participate in multiplayer experiences
                    </p>

                    <div className="space-y-4">
                        <p className="text-gray-500">
                            Please log in to access game sessions
                        </p>
                        <button className="btn-primary">
                            Log In
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
} 