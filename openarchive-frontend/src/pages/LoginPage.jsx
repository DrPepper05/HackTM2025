import React from 'react';
import { FolderArchive, User, Archive, Users, Shield, Settings } from 'lucide-react';
import { ROLES } from '../utils/constants';

function LoginPage({ onLogin }) {
  return (
    <div className="flex items-center justify-center h-screen bg-gradient-to-br from-slate-900 to-slate-700">
      <div className="bg-white p-10 rounded-xl shadow-2xl w-full max-w-md">
        <div className="text-center mb-8">
          <FolderArchive className="mx-auto text-sky-600 h-16 w-16" />
          <h1 className="text-4xl font-bold text-slate-800 mt-4">Project OpenArchive</h1>
          <p className="text-slate-600 mt-2">Digital Archiving Platform</p>
        </div>
        <div className="space-y-6">
          {Object.values(ROLES).map(role => (
            <button
              key={role}
              onClick={() => onLogin(role)}
              className="w-full flex items-center justify-center py-3 px-4 bg-sky-600 hover:bg-sky-700 text-white font-semibold rounded-lg shadow-md transition duration-150 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-opacity-50"
            >
              {role === ROLES.CLERK && <User className="mr-2 h-5 w-5" />}
              {role === ROLES.ARCHIVIST && <Archive className="mr-2 h-5 w-5" />}
              {role === ROLES.CITIZEN_MEDIA && <Users className="mr-2 h-5 w-5" />}
              {role === ROLES.INSPECTOR_AUDITOR && <Shield className="mr-2 h-5 w-5" />}
              {role === ROLES.ADMIN && <Settings className="mr-2 h-5 w-5" />}
              Login as {role}
            </button>
          ))}
        </div>
         <p className="text-xs text-center text-slate-500 mt-8">
            Select a role to simulate login. For a real application, this would be a username/password form.
        </p>
      </div>
    </div>
  );
}

export default LoginPage;