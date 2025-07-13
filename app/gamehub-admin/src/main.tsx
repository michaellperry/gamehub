import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.tsx';
import AccessProvider from './auth/AccessProvider.tsx';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
        <AccessProvider>
            <BrowserRouter basename={import.meta.env.VITE_BASE_NAME ?? '/'}>
                <App />
            </BrowserRouter>
        </AccessProvider>
    </React.StrictMode>
);
