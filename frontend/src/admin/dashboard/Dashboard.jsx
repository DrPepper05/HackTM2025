import React from 'react';
import { useNavigate } from 'react-router-dom';

const sections = [
    {
        title: 'Common',
        links: [
            { label: 'Settings', path: '/admin/settings' },
            { label: 'Translations', path: '/admin/translations' },
            { label: 'Files', path: '/admin/files' },
        ],
    },
    {
        title: 'Content',
        links: [
            { label: 'Partners', path: '/admin/partners' },
            { label: 'Tracking', path: '/admin/tracking' },
            { label: 'Subscribers', path: '/admin/subscribers' },
            { label: 'FAQs', path: '/admin/faqs' },
            { label: 'OG Metadata', path: '/admin/metadata' },
        ],
    },
    {
        title: 'Base',
        links: [
            { label: 'Users', path: '/admin/users' },
        ],
    },
];

export default function Dashboard() {
    const navigate = useNavigate();

    return (
        <div className="p-8">
            <h1 className="text-3xl font-bold mb-8">Admin Dashboard</h1>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {sections.map((section) => (
                    <div key={section.title} className="border rounded-md p-4 shadow-sm">
                        <h2 className="text-lg font-semibold mb-4">{section.title}</h2>
                        <div className="flex flex-wrap gap-2">
                            {section.links.map((link) => (
                                <button
                                    key={link.label}
                                    onClick={() => navigate(link.path)}
                                    className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-100 text-sm"
                                >
                                    {link.label}
                                </button>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
