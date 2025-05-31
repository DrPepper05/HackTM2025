import React, { useState, useEffect } from 'react';

export default function EditSettingModal({ setting, onSave, onClose }) {
    const [key, setKey] = useState(setting.key);
    const [type, setType] = useState(setting.type || 'string');
    const [value, setValue] = useState(setting.value);

    useEffect(() => {
        setKey(setting.key);
        setType(setting.type || 'string');
        setValue(setting.value);
    }, [setting]);

    const handleSubmit = () => {
        let parsedValue;

        try {
            if (type === 'boolean') {
                parsedValue = { enabled: value === true || value === 'true' };
            } else if (type === 'number') {
                const num = Number(value);
                if (isNaN(num)) throw new Error('Invalid number');
                parsedValue = { value: num };
            } else if (type === 'json') {
                parsedValue = { value: JSON.parse(value) };
            } else {
                parsedValue = { value };
            }

            onSave({ key, value: parsedValue, type });
        } catch (err) {
            alert(`Invalid value: ${err.message}`);
        }
    };

    return (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-30 flex items-center justify-center">
            <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
                <h2 className="text-xl font-semibold mb-4">Edit Setting</h2>

                <label className="block text-sm mb-1">Key</label>
                <input
                    value={key}
                    onChange={(e) => setKey(e.target.value)}
                    className="w-full mb-4 px-3 py-2 border rounded"
                />

                <label className="block text-sm mb-1">Type</label>
                <select
                    value={type}
                    onChange={(e) => setType(e.target.value)}
                    className="w-full mb-4 px-3 py-2 border rounded"
                >
                    <option value="boolean">boolean</option>
                    <option value="number">number</option>
                    <option value="string">string</option>
                    <option value="text">text</option>
                    <option value="json">json</option>
                </select>

                <label className="block text-sm mb-1">Value</label>
                <input
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    className="w-full mb-6 px-3 py-2 border rounded"
                />

                <div className="flex justify-end gap-2">
                    <button onClick={onClose} className="px-4 py-2 rounded bg-gray-200">
                        Cancel
                    </button>
                    <button onClick={handleSubmit} className="px-4 py-2 rounded bg-blue-600 text-white">
                        Save
                    </button>
                </div>
            </div>
        </div>
    );
}
