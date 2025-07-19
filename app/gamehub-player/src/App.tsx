import { Route, Routes } from 'react-router-dom';
import './App.css';

// Import pages
import HomePage from '@/pages/HomePage';
import Callback from './auth/Callback';

function App() {
    return (
        <div className="min-h-screen bg-gray-50">
            <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/callback" element={<Callback />} />
            </Routes>
        </div>
    );
}

export default App;
