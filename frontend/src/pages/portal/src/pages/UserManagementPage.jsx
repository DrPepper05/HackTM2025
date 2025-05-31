import React, { useState } from 'react';
import { UserCog, UserPlus, Edit3, Trash2 } from 'lucide-react';
import { ROLES } from '../utils/constants.jsx'; // Ensure ROLES is available

function UserManagementPage() {
    const [users, setUsers] = useState([
        {id: 'user1', name: 'Clerk User 1', email: 'clerk1@institution.ro', role: ROLES.CLERK, status: 'Active'},
        {id: 'user2', name: 'Archivist Main', email: 'archivist@institution.ro', role: ROLES.ARCHIVIST, status: 'Active'},
        {id: 'user3', name: 'Citizen Test', email: 'citizen.test@email.com', role: ROLES.CITIZEN_MEDIA, status: 'Disabled'},
        {id: 'user4', name: 'Inspector Gadget', email: 'inspector@control.ro', role: ROLES.INSPECTOR_AUDITOR, status: 'Active'},
    ]);

    const handleUserAction = (userId, action) => {
        console.log(`Action: ${action} for user ${userId}`);
        // Mock actions:
        if (action === 'delete') {
            setUsers(users.filter(u => u.id !== userId));
        } else if (action === 'toggle_status') {
            setUsers(users.map(u => u.id === userId ? {...u, status: u.status === 'Active' ? 'Disabled' : 'Active'} : u));
        }
        // Add API calls here for real application
    };

    return (
        <div className="bg-white p-8 rounded-xl shadow-lg">
            <h2 className="text-3xl font-bold text-slate-800 mb-6 flex items-center"><UserCog className="mr-3 text-sky-600 h-8 w-8"/>User Management</h2>
            <p className="text-slate-600 mb-6">Manage user accounts and roles within the platform (mocked functionalities).</p>
            
            <button className="mb-6 bg-sky-600 hover:bg-sky-700 text-white font-semibold py-2 px-4 rounded-lg shadow flex items-center">
                <UserPlus className="mr-2 h-5 w-5" /> Add New User (Mock)
            </button>

            <div className="overflow-x-auto">
                <table className="min-w-full bg-white border border-slate-200">
                    <thead className="bg-slate-50">
                        <tr>
                            <th className="py-3 px-4 border-b text-left text-xs font-semibold text-slate-600 uppercase">Name</th>
                            <th className="py-3 px-4 border-b text-left text-xs font-semibold text-slate-600 uppercase">Email</th>
                            <th className="py-3 px-4 border-b text-left text-xs font-semibold text-slate-600 uppercase">Role</th>
                            <th className="py-3 px-4 border-b text-left text-xs font-semibold text-slate-600 uppercase">Status</th>
                            <th className="py-3 px-4 border-b text-left text-xs font-semibold text-slate-600 uppercase">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="text-slate-700">
                        {users.map(user => (
                            <tr key={user.id} className="hover:bg-slate-50">
                                <td className="py-3 px-4 border-b text-sm">{user.name}</td>
                                <td className="py-3 px-4 border-b text-sm">{user.email}</td>
                                <td className="py-3 px-4 border-b text-sm">{user.role}</td>
                                <td className="py-3 px-4 border-b text-sm">
                                    <button 
                                        onClick={() => handleUserAction(user.id, 'toggle_status')}
                                        className={`px-2 py-1 text-xs font-semibold rounded-full cursor-pointer
                                            ${user.status === 'Active' ? 'bg-green-100 text-green-800 hover:bg-green-200' : 'bg-red-100 text-red-800 hover:bg-red-200'}`}
                                    >
                                        {user.status}
                                    </button>
                                </td>
                                <td className="py-3 px-4 border-b text-sm space-x-1">
                                    <button title="Edit User" onClick={() => handleUserAction(user.id, 'edit')} className="p-1 text-sky-600 hover:text-sky-800"><Edit3 size={18}/></button>
                                    <button title="Delete User" onClick={() => handleUserAction(user.id, 'delete')} className="p-1 text-red-600 hover:text-red-800"><Trash2 size={18}/></button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

export default UserManagementPage;
