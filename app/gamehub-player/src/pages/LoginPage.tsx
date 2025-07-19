export default function LoginPage() {
    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
            <div className="max-w-md w-full space-y-8">
                <div className="text-center">
                    <h2 className="text-3xl font-bold text-gray-900">
                        Sign in to GameHub Player
                    </h2>
                    <p className="mt-2 text-gray-600">
                        Join game sessions and start playing
                    </p>
                </div>

                <div className="bg-white py-8 px-6 shadow rounded-lg">
                    <button className="w-full btn-primary">
                        Continue with Player Authentication
                    </button>

                    <div className="mt-6 text-center">
                        <p className="text-sm text-gray-500">
                            You will be redirected to the authentication service
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
} 