import React, { useEffect, useState } from 'react';
import axios from 'axios';

export default function SettingsPage() {
    const [settings, setSettings] = useState([]);
    const backendUrl = import.meta.env.VITE_BACKEND_URL;

    useEffect(() => {
        axios.get(`${backendUrl}/admin/settings`)
            .then(res => {
                const entries = Object.entries(res.data).map(([key, value]) => ({
                    key,
                    value: value?.enabled ?? value?.value ?? JSON.stringify(value),
                }));
                setSettings(entries);
            })
            .catch(err => {
                console.error("❌ Error loading settings:", err);
            });
    }, []);

    const handleToggle = async (settingKey, currentValue) => {
        const isBool = typeof currentValue === 'boolean';
        const newValue = isBool ? !currentValue : prompt('Enter new value:', currentValue);

        if (newValue === null) return; // Cancelled

        try {
            const res = await axios.patch(`${backendUrl}/admin/settings/${settingKey}`, {
                value: isBool ? { enabled: newValue } : { value: newValue }
            });

            setSettings(prev =>
                prev.map(setting =>
                    setting.key === settingKey
                        ? { ...setting, value: isBool ? res.data.value.enabled : res.data.value.value }
                        : setting
                )
            );
        } catch (err) {
            console.error(`Failed to update ${settingKey}`, err);
        }
    };

    return (
        <div className="p-8">
            <h1 className="text-2xl font-bold mb-6">Admin Settings</h1>
            <div className="overflow-x-auto">
                <table className="min-w-full text-left border border-gray-300 bg-white">
                    <thead className="bg-gray-100 border-b">
                    <tr>
                        <th className="p-3 font-medium text-gray-700">Setting</th>
                        <th className="p-3 font-medium text-gray-700">Value</th>
                        <th className="p-3 font-medium text-gray-700">Action</th>
                    </tr>
                    </thead>
                    <tbody>
                    {settings.map(({ key, value }) => (
                        <tr key={key} className="border-b hover:bg-gray-50">
                            <td className="p-3 font-mono text-sm">{key}</td>
                            <td className="p-3">{String(value)}</td>
                            <td className="p-3">
                                <button
                                    onClick={() => handleToggle(key, value)}
                                    className="text-blue-600 hover:underline"
                                >
                                    Edit
                                </button>
                            </td>
                        </tr>
                    ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
