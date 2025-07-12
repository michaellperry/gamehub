import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'

import { AuthProvider } from "react-oauth2-code-pkce"
import { BrowserRouter } from 'react-router-dom'
import { UserProvider } from "./auth/UserProvider.tsx"
import { authConfig } from "./auth/auth-config.ts"
import { authProvider, j } from "./jinaga-config.ts"

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AuthProvider authConfig={authConfig}>
      <UserProvider j={j} authProvider={authProvider}>
        <BrowserRouter basename={import.meta.env.VITE_BASE_NAME ?? '/'}>
          <App />
        </BrowserRouter>
      </UserProvider>
    </AuthProvider>
  </React.StrictMode>,
)