import React from 'react';
import { User, Mail, Shield, Building } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

function ProfilePage() {
  const { user, userRole } = useAuth();

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Profile</h1>
        <p className="text-gray-600 mt-2">Your account information and details</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Full Name */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 bg-sky-100 rounded-full">
              <User className="h-6 w-6 text-sky-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Full Name</p>
              <p className="text-lg font-semibold text-gray-900">{user?.profile?.full_name || '-'}</p>
            </div>
          </div>
        </div>

        {/* Email */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 bg-sky-100 rounded-full">
              <Mail className="h-6 w-6 text-sky-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Email</p>
              <p className="text-lg font-semibold text-gray-900">{user?.email || '-'}</p>
            </div>
          </div>
        </div>

        {/* Role */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 bg-sky-100 rounded-full">
              <Shield className="h-6 w-6 text-sky-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Role</p>
              <p className="text-lg font-semibold text-gray-900 capitalize">{userRole || '-'}</p>
            </div>
          </div>
        </div>

        {/* Organization */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 bg-sky-100 rounded-full">
              <Building className="h-6 w-6 text-sky-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Organization</p>
              <p className="text-lg font-semibold text-gray-900">{user?.profile?.organization || '-'}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProfilePage; 