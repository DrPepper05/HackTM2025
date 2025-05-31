import React from 'react';
import { ROLES } from '../utils/constants.jsx';
import DashboardPage from '../pages/DashboardPage.jsx';
import DocumentUploadPage from '../pages/DocumentUploadPage.jsx';
import DocumentListPage from '../pages/DocumentListPage.jsx';
import AccessRequestPage from '../pages/AccessRequestPage.jsx';
import PublicSearchPage from '../pages/PublicSearchPage.jsx';
import AuditLogPage from '../pages/AuditLogPage.jsx';
import LifecycleManagementPage from '../pages/LifecycleManagementPage.jsx';
import UserManagementPage from '../pages/UserManagementPage.jsx';
import SystemSettingsPage from '../pages/SystemSettingsPage.jsx';


function MainContent({ page, role, setCurrentPage }) { // Added setCurrentPage if needed by any child
  return (
    <main className="flex-1 p-6 overflow-y-auto bg-gray-100">
      {page === 'dashboard' && <DashboardPage role={role} />}
      {page === 'upload' && role === ROLES.CLERK && <DocumentUploadPage />}
      {(page === 'documents_clerk' || page === 'documents_archivist' || page === 'documents_ingestion_queue') && <DocumentListPage role={role} pageFilter={page} />}
      {(page === 'requests_archivist' || page === 'requests_citizen') && <AccessRequestPage role={role} pageFilter={page} />}
      {page === 'search_public' && role === ROLES.CITIZEN_MEDIA && <PublicSearchPage />}
      {page === 'audit_inspector' && role === ROLES.INSPECTOR_AUDITOR && <AuditLogPage />}
      {page === 'lifecycle_archivist' && role === ROLES.ARCHIVIST && <LifecycleManagementPage />}
      {page === 'admin_users' && (role === ROLES.ADMIN || role === ROLES.ARCHIVIST) && <UserManagementPage />}
      {page === 'admin_settings' && role === ROLES.ADMIN && <SystemSettingsPage />}
    </main>
  );
}

export default MainContent;
