import React, { useState, useEffect } from 'react';
import { History } from 'lucide-react';
import { mockAuditLogs } from '../utils/mockData.jsx';

function AuditLogPage() {
  const [logs, setLogs] = useState([]);
  const [filters, setFilters] = useState({ userId: '', action: '', dateStart: '', dateEnd: '' });

  useEffect(() => {
    let filteredLogs = mockAuditLogs;
    if (filters.userId) {
        filteredLogs = filteredLogs.filter(log => log.userId.toLowerCase().includes(filters.userId.toLowerCase()));
    }
    if (filters.action) {
        filteredLogs = filteredLogs.filter(log => log.action.toLowerCase().includes(filters.action.toLowerCase()));
    }
    // Basic date filtering (can be improved with date-fns or moment)
    if (filters.dateStart) {
        filteredLogs = filteredLogs.filter(log => new Date(log.timestamp.split(' ')[0]) >= new Date(filters.dateStart));
    }
    if (filters.dateEnd) {
        filteredLogs = filteredLogs.filter(log => new Date(log.timestamp.split(' ')[0]) <= new Date(filters.dateEnd));
    }
    setLogs(filteredLogs);
  }, [filters]);

  const handleFilterChange = (e) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
  };

  return (
    <div className="bg-white p-8 rounded-xl shadow-lg">
      <h2 className="text-3xl font-bold text-slate-800 mb-6 flex items-center"><History className="mr-3 text-sky-600 h-8 w-8"/>Audit Logs</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6 p-4 border border-slate-200 rounded-lg bg-slate-50">
        <div>
            <label htmlFor="userIdFilter" className="block text-sm font-medium text-slate-700">User ID</label>
            <input type="text" name="userId" id="userIdFilter" value={filters.userId} onChange={handleFilterChange} placeholder="e.g., clerk_user_1" className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm" />
        </div>
        <div>
            <label htmlFor="actionFilter" className="block text-sm font-medium text-slate-700">Action</label>
            <input type="text" name="action" id="actionFilter" value={filters.action} onChange={handleFilterChange} placeholder="e.g., DOCUMENT_UPLOADED" className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm" />
        </div>
        <div>
            <label htmlFor="dateStartFilter" className="block text-sm font-medium text-slate-700">Date Start</label>
            <input type="date" name="dateStart" id="dateStartFilter" value={filters.dateStart} onChange={handleFilterChange} className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm" />
        </div>
        <div>
            <label htmlFor="dateEndFilter" className="block text-sm font-medium text-slate-700">Date End</label>
            <input type="date" name="dateEnd" id="dateEndFilter" value={filters.dateEnd} onChange={handleFilterChange} className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm" />
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full bg-white border border-slate-200">
          <thead className="bg-slate-50">
            <tr>
              <th className="py-3 px-4 border-b border-slate-200 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Timestamp</th>
              <th className="py-3 px-4 border-b border-slate-200 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">User ID</th>
              <th className="py-3 px-4 border-b border-slate-200 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Action</th>
              <th className="py-3 px-4 border-b border-slate-200 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Entity Type</th>
              <th className="py-3 px-4 border-b border-slate-200 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Entity ID</th>
              <th className="py-3 px-4 border-b border-slate-200 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Details</th>
            </tr>
          </thead>
          <tbody className="text-slate-700">
            {logs.map(log => (
              <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                <td className="py-3 px-4 border-b border-slate-200 text-sm">{log.timestamp}</td>
                <td className="py-3 px-4 border-b border-slate-200 text-sm">{log.userId}</td>
                <td className="py-3 px-4 border-b border-slate-200 text-sm">{log.action}</td>
                <td className="py-3 px-4 border-b border-slate-200 text-sm">{log.entityType}</td>
                <td className="py-3 px-4 border-b border-slate-200 text-sm">{log.entityId}</td>
                <td className="py-3 px-4 border-b border-slate-200 text-sm"><pre className="text-xs whitespace-pre-wrap bg-slate-50 p-1 rounded">{JSON.stringify(log.details, null, 2)}</pre></td>
              </tr>
            ))}
             {logs.length === 0 && (
                <tr><td colSpan="6" className="text-center py-4 text-slate-500">No audit logs found matching your criteria.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default AuditLogPage;
