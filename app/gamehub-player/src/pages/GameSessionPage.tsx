import { useParams } from 'react-router-dom'

export default function GameSessionPage() {
    const { sessionId } = useParams<{ sessionId: string }>()

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="bg-white shadow rounded-lg p-6">
                    <h1 className="text-3xl font-bold text-gray-900 mb-4">
                        Game Session: {sessionId}
                    </h1>

                    <div className="space-y-6">
                        <div className="border-t border-gray-200 pt-6">
                            <h2 className="text-xl font-semibold text-gray-900 mb-4">
                                Session Information
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">
                                        Session ID
                                    </label>
                                    <p className="mt-1 text-sm text-gray-900">{sessionId}</p>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">
                                        Status
                                    </label>
                                    <p className="mt-1 text-sm text-gray-900">Active</p>
                                </div>
                            </div>
                        </div>

                        <div className="border-t border-gray-200 pt-6">
                            <h2 className="text-xl font-semibold text-gray-900 mb-4">
                                Game Interface
                            </h2>
                            <div className="bg-gray-100 rounded-lg p-8 text-center">
                                <p className="text-gray-600">
                                    Game interface will be implemented here
                                </p>
                                <p className="text-sm text-gray-500 mt-2">
                                    This will include real-time gameplay features
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
} 