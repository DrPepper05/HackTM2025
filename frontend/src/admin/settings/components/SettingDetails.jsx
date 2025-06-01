import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';

export default function SettingDetails() {
    const { key } = useParams();
    const [setting, setSetting] = useState(null);
    const backendUrl = import.meta.env.VITE_BACKEND_URL;

    useEffect(() => {
        axios.get(`${backendUrl}/admin/settings`)
            .then(res => {
                const settingValue = res.data[key];
                if (!settingValue) {
                    setSetting(null);
                } else {
                    setSetting({
                        key,
                        type: settingValue.type ?? 'string',
                        value: settingValue.enabled ?? settingValue.value ?? settingValue,
                    });
                }
            })
            .catch(err => {
                console.error("Error loading setting:", err);
                setSetting(null);
            });
    }, [key]);

    if (!setting) {
        return <div className="p-8">Setting not found or still loading...</div>;
    }

    return (
        <div className="p-8">
            <h1 className="text-2xl font-bold mb-4">Setting: {setting.key}</h1>
            <div className="space-y-2 text-sm">
                <p><strong>Key:</strong> {setting.key}</p>
                <p><strong>Type:</strong> {setting.type}</p>
                <p><strong>Value:</strong> {typeof setting.value === 'object' ? JSON.stringify(setting.value) : String(setting.value)}</p>
            </div>

            <div className="mt-6">
                <Link to="/admin/settings" className="text-blue-600 hover:underline">← Back to list</Link>
            </div>
        </div>
    );
}
