import { useEffect } from 'react';
import { Route, Routes, useNavigate } from 'react-router-dom';
import NavigationMenu from './frame/NavigationMenu';
import Tenants from './tenants/Tenants';
import ServicePrincipals from './service-principals/ServicePrincipals';
import StyleGuide from './components/StyleGuide';
import Invitations from './invitations/Invitations';
import { AcceptInvitation } from './invitations/AcceptInvitation';
import { ThemeProvider } from './theme/ThemeProvider';
import { ProtectedRoute } from './auth/ProtectedRoute';

function App() {
    return (
        <ThemeProvider>
            <div className="min-h-screen bg-gray-100 dark:bg-gray-900 transition-colors duration-200">
                <NavigationMenu />

                <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
                    <div className="px-4 py-6 sm:px-0">
                        <div className="bg-white dark:bg-dark-surface shadow rounded-lg p-6 dark:shadow-lg dark:shadow-gray-900/20">
                            <Routes>
                                <Route
                                    path="/"
                                    element={
                                        <ProtectedRoute>
                                            <Home />
                                        </ProtectedRoute>
                                    }
                                />
                                <Route
                                    path="/tenants"
                                    element={
                                        <ProtectedRoute>
                                            <Tenants />
                                        </ProtectedRoute>
                                    }
                                />
                                <Route path="/callback" element={<AuthCallback />} />
                                <Route
                                    path="/service-principals"
                                    element={
                                        <ProtectedRoute>
                                            <ServicePrincipals />
                                        </ProtectedRoute>
                                    }
                                />
                                <Route
                                    path="/invitations"
                                    element={
                                        <ProtectedRoute>
                                            <Invitations />
                                        </ProtectedRoute>
                                    }
                                />
                                <Route
                                    path="/invitations/accept/:code"
                                    element={
                                        <ProtectedRoute>
                                            <AcceptInvitation />
                                        </ProtectedRoute>
                                    }
                                />
                                <Route
                                    path="/invitations/accept"
                                    element={
                                        <ProtectedRoute>
                                            <AcceptInvitation />
                                        </ProtectedRoute>
                                    }
                                />
                                <Route path="/style-guide" element={<StyleGuide />} />
                            </Routes>
                        </div>
                    </div>
                </main>
            </div>
        </ThemeProvider>
    );
}

// This component handles the OAuth callback
function AuthCallback() {
    const navigate = useNavigate();

    useEffect(() => {
        // Check if there's a stored redirect URL in session storage
        const redirectUrl = sessionStorage.getItem('redirectUrl');

        const timeout = setTimeout(() => {
            if (redirectUrl) {
                // Clear the stored URL
                sessionStorage.removeItem('redirectUrl');
                // Navigate to the stored URL
                navigate(redirectUrl);
            } else {
                // If no stored URL, redirect to the home page
                navigate('/');
            }
        }, 1000);

        return () => clearTimeout(timeout);
    }, [navigate]);

    return (
        <div className="flex flex-col items-center justify-center">
            <h1 className="text-2xl font-semibold text-gray-800 dark:text-gray-100 mb-2">
                Authentication in progress...
            </h1>
            <p className="text-gray-600 dark:text-gray-400">You will be redirected shortly.</p>
        </div>
    );
}

function Home() {
    return (
        <div className="px-4 py-5 sm:px-6">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">GameHub Admin</h1>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                Welcome to the GameHub administration portal. Use the navigation menu above to
                manage your events and tenants.
            </p>
        </div>
    );
}

export default App;
