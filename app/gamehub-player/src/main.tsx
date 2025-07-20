import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.tsx';
import { AccessProvider } from './auth/AccessProvider.tsx';
import { UserProvider } from './auth/UserProvider.tsx';
import './index.css';
import { authProvider, j } from './jinaga-config.ts';
// Import status check to make getConfigured function available globally
import './config/status-check.ts';

createRoot(document.getElementById('root')!).render(
    <StrictMode>
        <AccessProvider>
            <UserProvider j={j} authProvider={authProvider}>
                <BrowserRouter basename={import.meta.env.VITE_BASE_NAME ?? '/'}>
                    <App />
                </BrowserRouter>
            </UserProvider>
        </AccessProvider>
    </StrictMode>
);
