import React, {useEffect, useState} from 'react';
import axios from 'axios';
import EditSettingModal from "../dashboard/components/EditSettingsModal";
import { Link } from 'react-router-dom';


export default function SettingsPage() {
    const [settings, setSettings] = useState([]);
    const [editing, setEditing] = useState(null);
    const [viewing, setViewing] = useState(null); // holds full setting/team object

    const backendUrl = import.meta.env.VITE_BACKEND_URL;

    useEffect(() => {
        axios.get(`${backendUrl}/admin/settings`)
            .then(res => {
                const entries = Object.entries(res.data).map(([key, value]) => ({
                    key,
                    value: value?.enabled ?? value?.value ?? JSON.stringify(value),
                    type: value?.type ?? 'string', // default fallback
                }));
                setSettings(entries);
            })
            .catch(err => {
                console.error("❌ Error loading settings:", err);
            });
    }, []);

    const handleSave = async ({key, value, type}) => {
        try {
            const res = await axios.patch(`${backendUrl}/admin/settings/${editing.key}`, {
                key,
                value,
                type
            });

            setSettings(prev =>
                prev.map((s) =>
                    s.key === editing.key
                        ? {...s, key, value: value.enabled ?? value.value, type}
                        : s
                )
            );
            setEditing(null);
        } catch (err) {
            console.error("❌ Failed to update", err);
            alert("Update failed.");
        }
    };

    const handleEdit = async (originalKey, currentValue, currentType) => {
        const key = prompt("Edit key:", originalKey);
        if (!key) return;

        const type = prompt(
            "Edit type (boolean, number, string, text, json):",
            currentType
        );
        if (!type || !["boolean", "number", "string", "text", "json"].includes(type)) {
            alert("❌ Invalid type");
            return;
        }

        const rawValue = prompt("Edit value:", currentValue);
        if (rawValue === null) return;

        let parsedValue;

        try {
            if (type === "boolean") {
                parsedValue = {enabled: rawValue === "true"};
            } else if (type === "number") {
                const num = Number(rawValue);
                if (isNaN(num)) throw new Error("Invalid number");
                parsedValue = {value: num};
            } else if (type === "json") {
                parsedValue = {value: JSON.parse(rawValue)};
            } else {
                parsedValue = {value: rawValue};
            }
        } catch (err) {
            alert("❌ Invalid value format: " + err.message);
            return;
        }

        try {
            await axios.patch(`${backendUrl}/admin/settings/${originalKey}`, {
                key,   // in case you want to update the key too
                value: parsedValue,
                type,
            });

            setSettings(prev =>
                prev.map(s =>
                    s.key === originalKey
                        ? {
                            ...s,
                            key,
                            value:
                                parsedValue.enabled ?? parsedValue.value ?? parsedValue,
                            type,
                        }
                        : s
                )
            );
        } catch (err) {
            console.error(`❌ Failed to update setting "${originalKey}"`, err);
            alert("Failed to update setting.");
        }
    };


    const handleAddSetting = async () => {
        const key = prompt("Enter the setting key (e.g., my_setting_name):");
        if (!key) return;

        const type = prompt("Is this a boolean (yes/no)? Type 'yes' or 'no':");
        const isBoolean = type.toLowerCase() === 'yes';

        const rawValue = prompt("Enter the value (true/false, or any text/number):");
        if (rawValue === null) return;

        const parsedValue = isBoolean
            ? {enabled: rawValue === 'true'}
            : {value: rawValue};

        try {
            await axios.post(`${backendUrl}/admin/settings`, {
                key,
                value: parsedValue,
            });

            setSettings(prev => [
                ...prev,
                {key, value: isBoolean ? parsedValue.enabled : parsedValue.value}
            ]);
        } catch (err) {
            console.error("Failed to add setting:", err);
            alert("Error creating setting. Maybe the key already exists?");
        }
    };

    const handleDelete = async (key) => {
        if (!confirm(`Are you sure you want to delete setting "${key}"?`)) return;

        try {
            await axios.delete(`${backendUrl}/admin/settings/${key}`);
            setSettings(prev => prev.filter(setting => setting.key !== key));
        } catch (err) {
            console.error(`❌ Failed to delete setting "${key}"`, err);
            alert("Failed to delete setting. See console for details.");
        }
    };


    return (
        <div className="p-8">
            <h1 className="text-2xl font-bold mb-6">Admin Settings</h1>
            <div className="overflow-x-auto">
                <button
                    onClick={handleAddSetting}
                    className="mb-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                    + Add Setting
                </button>

                <table className="min-w-full text-left border border-gray-300 bg-white">
                    <thead className="bg-gray-100 border-b">
                    <tr>
                        <th className="p-3 font-large text-gray-700">Setting Slug</th>
                        <th className="p-3 font-large text-gray-700">Type</th>
                        <th className="p-3 font-large text-gray-700">Value</th>
                        <th className="p-3 font-large text-gray-700">Action</th>
                    </tr>
                    </thead>
                    <tbody>
                    {settings.map(({key, value, type}) => (
                        <tr key={key} className="border-b hover:bg-gray-50">
                            <td className="p-3 font-mono text-sm">{key}</td>
                            <td className="p-3">{String(type)}</td>
                            <td className="p-3">{String(value)}</td>
                            <td className="p-3">
                                <button
                                    onClick={() => setEditing({key, value, type})}
                                    className="text-blue-600 hover:underline"
                                >
                                    Edit
                                </button>
                                <br/>
                                <Link
                                    to={`/admin/settings/${key}`}
                                    className="text-indigo-600 hover:underline"
                                >
                                    Details
                                </Link>
                                <br/>
                                <button
                                    onClick={() => handleDelete(key)}
                                    className="text-red-600 hover:underline"
                                >
                                    Delete
                                </button>
                            </td>
                        </tr>
                    ))}
                    </tbody>
                </table>
            </div>

            {/* ✅ INSERT THIS RIGHT HERE */}
            {editing && (
                <EditSettingModal
                    setting={editing}
                    onSave={handleSave}
                    onClose={() => setEditing(null)}
                />
            )}
            {viewing && (
                <div className="mt-8 p-6 border rounded-lg bg-gray-50">
                    <h2 className="text-xl font-semibold mb-4">Setting: {viewing.key}</h2>

                    <div className="space-y-2 text-sm">
                        <p><strong>Key:</strong> {viewing.key}</p>
                        <p><strong>Type:</strong> {viewing.type}</p>
                        <p>
                            <strong>Value:</strong> {typeof viewing.value === 'object' ? JSON.stringify(viewing.value) : String(viewing.value)}
                        </p>
                    </div>

                    <div className="mt-4 flex gap-4 text-sm">
                        <button
                            onClick={() => setEditing(viewing)}
                            className="text-blue-600 hover:underline"
                        >
                            Edit
                        </button>
                        <button
                            onClick={() => handleDelete(viewing.key)}
                            className="text-red-600 hover:underline"
                        >
                            Delete
                        </button>
                        <button
                            onClick={() => setViewing(null)}
                            className="text-gray-600 hover:underline"
                        >
                            Back to list
                        </button>
                    </div>
                </div>
            )}
        </div>
    );

}
