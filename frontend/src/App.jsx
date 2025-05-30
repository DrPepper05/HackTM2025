import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import SettingsPage from './admin/settings/Settings';
import Dashboard from "./admin/dashboard/Dashboard";
import SettingDetails from "./admin/settings/components/SettingDetails";

function App() {
    return (
        <Router>
            <Routes>
                <Route path="/admin" element={<Dashboard />} />
                <Route path="/admin/settings" element={<SettingsPage />} />
                <Route path="/admin/settings/:key" element={<SettingDetails />} />
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
