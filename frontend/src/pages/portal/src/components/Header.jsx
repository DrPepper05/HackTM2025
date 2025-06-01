import React from 'react';
import { LogOut } from 'lucide-react';

function Header({ user, onLogout }) {
  return (
    <header className="bg-white shadow-md p-4 flex justify-between items-center">
      <h1 className="text-xl font-semibold text-slate-700">Welcome, {user.name} ({user.role})</h1>
      <button
        onClick={onLogout}
        className="flex items-center bg-red-500 hover:bg-red-600 text-white py-2 px-4 rounded-lg shadow transition-colors"
      >
        <LogOut className="mr-2 h-5 w-5" /> Logout
      </button>
    </header>
  );
}

export default Header;