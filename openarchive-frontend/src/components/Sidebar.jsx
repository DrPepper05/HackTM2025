import React from 'react';
import { Home, UploadCloud, ListFilter, Inbox, FileText, UserCheck, FileClock, FileSearch, Send, History, UserCog, Settings, Users as HelpUsersIcon, FolderArchive } from 'lucide-react'; // Renamed Users to HelpUsersIcon to avoid conflict
import { ROLES } from '../utils/constants';

function Sidebar({ role, setCurrentPage, currentPage }) {
  const getNavItems = () => {
    let items = [{ name: 'Dashboard', icon: Home, page: 'dashboard' }];
    switch (role) {
      case ROLES.CLERK:
        items.push({ name: 'Upload Document', icon: UploadCloud, page: 'upload' });
        items.push({ name: 'My Uploads', icon: ListFilter, page: 'documents_clerk' });
        break;
      case ROLES.ARCHIVIST:
        items.push({ name: 'Ingestion Queue', icon: Inbox, page: 'documents_ingestion_queue' });
        items.push({ name: 'All Documents', icon: FileText, page: 'documents_archivist' });
        items.push({ name: 'Access Requests', icon: UserCheck, page: 'requests_archivist' });
        items.push({ name: 'Lifecycle Tasks', icon: FileClock, page: 'lifecycle_archivist' });
        break;
      case ROLES.CITIZEN_MEDIA:
        items.push({ name: 'Search Public Documents', icon: FileSearch, page: 'search_public' });
        items.push({ name: 'My Access Requests', icon: Send, page: 'requests_citizen' });
        break;
      case ROLES.INSPECTOR_AUDITOR:
        items.push({ name: 'Audit Logs', icon: History, page: 'audit_inspector' });
        break;
      case ROLES.ADMIN:
         items.push({ name: 'User Management', icon: UserCog, page: 'admin_users' });
         items.push({ name: 'System Settings', icon: Settings, page: 'admin_settings' });
        break;
      default:
        break;
    }
    return items;
  };

  const navItems = getNavItems();

  return (
    <div className="w-64 bg-slate-800 text-slate-100 p-5 space-y-2 flex flex-col">
      <div className="text-2xl font-semibold mb-6 flex items-center">
        <FolderArchive className="text-sky-400 mr-3 h-8 w-8" /> OpenArchive
      </div>
      <nav className="flex-grow">
        {navItems.map(item => (
          <button
            key={item.name}
            onClick={() => setCurrentPage(item.page)}
            className={`w-full flex items-center space-x-3 p-3 rounded-lg hover:bg-slate-700 transition-colors ${currentPage === item.page ? 'bg-sky-600 text-white' : 'text-slate-300 hover:text-white'}`}
          >
            <item.icon className="h-5 w-5" />
            <span>{item.name}</span>
          </button>
        ))}
      </nav>
      <div className="mt-auto">
         <button
            onClick={() => {/* Show help modal or navigate to help page */}}
            className="w-full flex items-center space-x-3 p-3 rounded-lg text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
          >
            <HelpUsersIcon className="h-5 w-5" />
            <span>Help & Support</span>
          </button>
      </div>
    </div>
  );
}

export default Sidebar;