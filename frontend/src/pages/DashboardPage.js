import React from 'react';
import { ListFilter, Clock, FilePlus, Inbox, CheckSquare, UserCheck, FileSearch, Send, History } from 'lucide-react';
import DashboardCard from '../components/DashboardCard';
import { ROLES } from '../utils/constants';
import { mockDocuments, mockAccessRequests, mockAuditLogs } from '../utils/mockData';


function DashboardPage({ role }) {
  return (
    <div className="bg-white p-8 rounded-xl shadow-lg">
      <h2 className="text-3xl font-bold text-slate-800 mb-6">Dashboard</h2>
      <p className="text-slate-600 mb-4">Welcome to Project OpenArchive. Here's a quick overview for your role: <span className="font-semibold text-sky-600">{role}</span>.</p>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {role === ROLES.CLERK && (
          <>
            <DashboardCard title="Recent Uploads" value={mockDocuments.filter(doc => doc.uploader.includes('Clerk User')).length} icon={<ListFilter className="text-indigo-500" />} />
            <DashboardCard title="Pending OCR (Mock)" value={mockDocuments.filter(d => d.status === 'INGESTING').length} icon={<Clock className="text-amber-500" />} />
            <DashboardCard title="Upload New" value="Action" icon={<FilePlus className="text-green-500" />} action={() => {/* navigate to upload, managed by App.js state */ console.log("Navigate to upload")}} />
          </>
        )}
        {role === ROLES.ARCHIVIST && (
          <>
            <DashboardCard title="Ingestion Queue" value={mockDocuments.filter(d => d.status === 'INGESTING').length} icon={<Inbox className="text-blue-500" />} />
            <DashboardCard title="Pending Review" value={mockDocuments.filter(d => d.status === 'REVIEW').length} icon={<CheckSquare className="text-teal-500" />} />
            <DashboardCard title="Access Requests" value={mockAccessRequests.filter(r => r.status === 'pending').length} icon={<UserCheck className="text-purple-500" />} />
          </>
        )}
         {role === ROLES.CITIZEN_MEDIA && (
          <>
            <DashboardCard title="Public Documents" value={mockDocuments.filter(d => d.isPublic).length} icon={<FileSearch className="text-cyan-500" />} />
            <DashboardCard title="My Pending Requests" value={mockAccessRequests.filter(r => r.status === 'pending' && (r.requesterInfo.includes('Cetatean') || r.requesterInfo.includes('Jurnalist'))).length} icon={<Send className="text-rose-500" />} />
          </>
        )}
        {role === ROLES.INSPECTOR_AUDITOR && (
          <>
            <DashboardCard title="Total Audit Logs" value={mockAuditLogs.length} icon={<History className="text-slate-500" />} />
            <DashboardCard title="Logs Today (Mock)" value={mockAuditLogs.filter(l => l.timestamp.startsWith(new Date().toISOString().split('T')[0])).length} icon={<Clock className="text-lime-500" />} />
          </>
        )}
      </div>
    </div>
  );
}

export default DashboardPage;