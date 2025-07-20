import { Route, Routes } from 'react-router-dom';
import './App.css';

// Import pages
import Callback from './auth/Callback';
import { StyleGuide } from './components/StyleGuide';
import HomePage from './pages/HomePage';
import PlaygroundPage from './pages/PlaygroundPage';

function App() {
    return (
        <div className="min-h-screen bg-gray-50">
            <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/callback" element={<Callback />} />
                <Route path="/style-guide" element={<StyleGuide />} />
                <Route path="/playground/:code" element={<PlaygroundPage />} />
                <Route path="/game/:gameId" element={<div>Game Page (Coming Soon)</div>} />
            </Routes>
        </div>
    );
}

export default App;
