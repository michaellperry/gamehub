import { Routes, Route } from 'react-router-dom'
import './App.css'

// Import pages
import HomePage from '@/pages/HomePage'
import LoginPage from '@/pages/LoginPage'
import GameSessionPage from '@/pages/GameSessionPage'

function App() {
    return (
        <div className="min-h-screen bg-gray-50">
            <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/game/:sessionId" element={<GameSessionPage />} />
            </Routes>
        </div>
    )
}

export default App
