import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import SettingsPage from './admin/pages/Settings';

function App() {
    return (
        <Router>
            <Routes>
                <Route path="/admin/settings" element={<SettingsPage />} />
                <Route
                    path="*"
                    element={
                        <div className="p-8">
                            <h1 className="text-2xl font-bold">muie cosmine</h1>
                        </div>
                    }
                />
            </Routes>
        </Router>
    );
}

export default App;
