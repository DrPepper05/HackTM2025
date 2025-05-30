import React, { useState, useEffect } from 'react';
import { UserCheck, Send, FilePlus, CheckSquare, Trash2, Eye } from 'lucide-react';
import { ROLES } from '../utils/constants';
import { mockAccessRequests } from '../utils/mockData';
import NewAccessRequestModal from '../components/NewAccessRequestModal';

function AccessRequestPage({ role, pageFilter }) {
  const [requests, setRequests] = useState([]);
  const [showRequestModal, setShowRequestModal] = useState(false);

  useEffect(() => {
    if (role === ROLES.ARCHIVIST) {
      setRequests(mockAccessRequests);
    } else if (role === ROLES.CITIZEN_MEDIA) {
      setRequests(mockAccessRequests.filter(r => r.requesterInfo.includes('Cetatean') || r.requesterInfo.includes('Jurnalist')));
    }
  }, [role]);

  const handleAction = (reqId, action) => {
    console.log(`Action: ${action} on request ${reqId}`);
  };
  
  const getPageTitle = () => {
    if (role === ROLES.ARCHIVIST) return "Manage Access Requests";
    if (role === ROLES.CITIZEN_MEDIA) return "My Access Requests";
    return "Access Requests";
  };

  const getPageIcon = () => {
    if (role === ROLES.ARCHIVIST) return <UserCheck className="mr-3 text-sky-600 h-8 w-8" />;
    if (role === ROLES.CITIZEN_MEDIA) return <Send className="mr-3 text-sky-600 h-8 w-8" />;
    return <UserCheck className="mr-3 text-sky-600 h-8 w-8" />;
  };


  return (
    <div className="bg-white p-8 rounded-xl shadow-lg">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-3xl font-bold text-slate-800 flex items-center">
            {getPageIcon()}
            {getPageTitle()}
        </h2>
        {role === ROLES.CITIZEN_MEDIA && (
          <button 
            onClick={() => setShowRequestModal(true)}
            className="bg-sky-600 hover:bg-sky-700 text-white font-semibold py-2 px-4 rounded-lg shadow flex items-center"
          >
            <FilePlus className="mr-2 h-5 w-5" /> New Request
          </button>
        )}
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white border border-slate-200">
          <thead className="bg-slate-50">
            <tr>
              <th className="py-3 px-4 border-b border-slate-200 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Document Title</th>
              <th className="py-3 px-4 border-b border-slate-200 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Requester Info</th>
              <th className="py-3 px-4 border-b border-slate-200 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Justification</th>
              <th className="py-3 px-4 border-b border-slate-200 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Status</th>
              <th className="py-3 px-4 border-b border-slate-200 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Created At</th>
              {role === ROLES.ARCHIVIST && <th className="py-3 px-4 border-b border-slate-200 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Actions</th>}
            </tr>
          </thead>
          <tbody className="text-slate-700">
            {requests.map(req => (
              <tr key={req.id} className="hover:bg-slate-50 transition-colors">
                <td className="py-3 px-4 border-b border-slate-200 text-sm">{req.documentTitle}</td>
                <td className="py-3 px-4 border-b border-slate-200 text-sm">{req.requesterInfo}</td>
                <td className="py-3 px-4 border-b border-slate-200 text-sm max-w-xs truncate" title={req.justification}>{req.justification}</td>
                <td className="py-3 px-4 border-b border-slate-200 text-sm">
                     <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                        req.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        req.status === 'approved' ? 'bg-green-100 text-green-800' :
                        req.status === 'rejected' ? 'bg-red-100 text-red-800' :
                        'bg-gray-100 text-gray-800'
                    }`}>
                        {req.status}
                    </span>
                </td>
                <td className="py-3 px-4 border-b border-slate-200 text-sm">{req.createdAt}</td>
                {role === ROLES.ARCHIVIST && (
                  <td className="py-3 px-4 border-b border-slate-200 text-sm space-x-1">
                    {req.status === 'pending' && (
                      <>
                        <button title="Approve Request" onClick={() => handleAction(req.id, 'approve')} className="p-1 text-green-600 hover:text-green-800"><CheckSquare size={18}/></button>
                        <button title="Reject Request" onClick={() => handleAction(req.id, 'reject')} className="p-1 text-red-600 hover:text-red-800"><Trash2 size={18}/></button>
                      </>
                    )}
                     <button title="View Details" onClick={() => handleAction(req.id, 'view_details')} className="p-1 text-sky-600 hover:text-sky-800"><Eye size={18}/></button>
                  </td>
                )}
              </tr>
            ))}
            {requests.length === 0 && (
                <tr><td colSpan={role === ROLES.ARCHIVIST ? 6 : 5} className="text-center py-4 text-slate-500">No access requests found.</td></tr>
            )}
          </tbody>
        </table>
      </div>
      {showRequestModal && <NewAccessRequestModal onClose={() => setShowRequestModal(false)} />}
    </div>
  );
}

export default AccessRequestPage;