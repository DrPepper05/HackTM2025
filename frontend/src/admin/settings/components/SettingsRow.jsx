import React from 'react';

export default function SettingsRow({ label, enabled, onToggle }) {
    return (
        <div className="flex justify-between items-center border-b py-4">
            <span className="text-lg font-medium">{label}</span>
            <button
                onClick={onToggle}
                className={`w-14 h-7 rounded-full relative transition ${
                    enabled ? 'bg-green-500' : 'bg-gray-400'
                }`}
            >
        <span
            className={`absolute top-0.5 left-0.5 w-6 h-6 bg-white rounded-full shadow transition-transform ${
                enabled ? 'translate-x-7' : 'translate-x-0'
            }`}
        ></span>
            </button>
        </div>
    );
}
