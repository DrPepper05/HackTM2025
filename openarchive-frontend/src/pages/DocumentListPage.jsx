import React, { useState, useEffect } from 'react';
import { Eye, Edit3, Trash2, CheckSquare, ListFilter, Inbox, FileText } from 'lucide-react';
import { ROLES } from '../utils/constants';
import { mockDocuments } from '../utils/mockData';
import DocumentDetailModal from '../components/DocumentDetailModal';

function DocumentListPage({ role, pageFilter }) {
  const [documents, setDocuments] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDocument, setSelectedDocument] = useState(null);

  useEffect(() => {
    let filteredDocs = mockDocuments;
    if (pageFilter === 'documents_clerk') {
      filteredDocs = mockDocuments.filter(doc => doc.uploader.includes('Clerk User')); 
    } else if (pageFilter === 'documents_ingestion_queue') {
      filteredDocs = mockDocuments.filter(doc => doc.status === 'INGESTING');
    }
    setDocuments(filteredDocs.filter(doc => doc.title.toLowerCase().includes(searchTerm.toLowerCase())));
  }, [searchTerm, pageFilter, role]); // Added role to dependency if filtering depends on it

  const handleAction = (docId, action) => {
    console.log(`Action: ${action} on document ${docId}`);
    if (action === 'view') setSelectedDocument(documents.find(d => d.id === docId));
  };
  
  const getPageTitle = () => {
    if (pageFilter === 'documents_clerk') return "My Uploads";
    if (pageFilter === 'documents_ingestion_queue') return "Ingestion Queue";
    if (pageFilter === 'documents_archivist') return "All Documents";
    return "Documents";
  };

  const getPageIcon = () => {
    if (pageFilter === 'documents_clerk') return <ListFilter className="mr-3 text-sky-600 h-8 w-8" />;
    if (pageFilter === 'documents_ingestion_queue') return <Inbox className="mr-3 text-sky-600 h-8 w-8" />;
    if (pageFilter === 'documents_archivist') return <FileText className="mr-3 text-sky-600 h-8 w-8" />;
    return <FileText className="mr-3 text-sky-600 h-8 w-8" />;
  }

  return (
    <div className="bg-white p-8 rounded-xl shadow-lg">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-3xl font-bold text-slate-800 flex items-center">
            {getPageIcon()}
            {getPageTitle()}
        </h2>
        <div className="w-1/3">
             <input 
                type="text" 
                placeholder="Search documents by title..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
        </div>
      </div>
      
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white border border-slate-200">
          <thead className="bg-slate-50">
            <tr>
              <th className="py-3 px-4 border-b border-slate-200 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Title</th>
              <th className="py-3 px-4 border-b border-slate-200 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Status</th>
              <th className="py-3 px-4 border-b border-slate-200 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Type</th>
              <th className="py-3 px-4 border-b border-slate-200 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Creation Date</th>
              {role === ROLES.ARCHIVIST && <th className="py-3 px-4 border-b border-slate-200 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Uploader</th>}
              <th className="py-3 px-4 border-b border-slate-200 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="text-slate-700">
            {documents.map(doc => (
              <tr key={doc.id} className="hover:bg-slate-50 transition-colors">
                <td className="py-3 px-4 border-b border-slate-200 text-sm">{doc.title}</td>
                <td className="py-3 px-4 border-b border-slate-200 text-sm">
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                        doc.status === 'INGESTING' ? 'bg-yellow-100 text-yellow-800' :
                        doc.status === 'REGISTERED' ? 'bg-green-100 text-green-800' :
                        doc.status === 'ACTIVE_STORAGE' ? 'bg-blue-100 text-blue-800' :
                        doc.status === 'REVIEW' ? 'bg-purple-100 text-purple-800' :
                        doc.status === 'AWAITING_TRANSFER' ? 'bg-orange-100 text-orange-800' :
                        'bg-gray-100 text-gray-800'
                    }`}>
                        {doc.status}
                    </span>
                </td>
                <td className="py-3 px-4 border-b border-slate-200 text-sm">{doc.type}</td>
                <td className="py-3 px-4 border-b border-slate-200 text-sm">{doc.creationDate}</td>
                {role === ROLES.ARCHIVIST && <td className="py-3 px-4 border-b border-slate-200 text-sm">{doc.uploader}</td>}
                <td className="py-3 px-4 border-b border-slate-200 text-sm space-x-1">
                  <button onClick={() => handleAction(doc.id, 'view')} className="p-1 text-sky-600 hover:text-sky-800"><Eye size={18}/></button>
                  {role === ROLES.ARCHIVIST && (
                    <>
                      <button onClick={() => handleAction(doc.id, 'edit')} className="p-1 text-amber-600 hover:text-amber-800"><Edit3 size={18}/></button>
                      {doc.status === 'INGESTING' && <button title="Approve Ingestion" onClick={() => handleAction(doc.id, 'approve_ingestion')} className="p-1 text-green-600 hover:text-green-800"><CheckSquare size={18}/></button>}
                      {doc.status === 'REVIEW' && <button title="Mark Reviewed" onClick={() => handleAction(doc.id, 'approve_review')} className="p-1 text-teal-600 hover:text-teal-800"><CheckSquare size={18}/></button>}
                      <button title="Delete Document" onClick={() => handleAction(doc.id, 'delete')} className="p-1 text-red-600 hover:text-red-800"><Trash2 size={18}/></button>
                    </>
                  )}
                </td>
              </tr>
            ))}
            {documents.length === 0 && (
                <tr><td colSpan={role === ROLES.ARCHIVIST ? 6 : 5} className="text-center py-4 text-slate-500">No documents found.</td></tr>
            )}
          </tbody>
        </table>
      </div>
      {selectedDocument && <DocumentDetailModal doc={selectedDocument} onClose={() => setSelectedDocument(null)} role={role} />}
    </div>
  );
}

export default DocumentListPage;