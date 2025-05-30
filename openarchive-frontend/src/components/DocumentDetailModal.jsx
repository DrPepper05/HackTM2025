import React from 'react';
import { ROLES } from '../utils/constants'; // Assuming ROLES might be used for conditional rendering inside modal

function DocumentDetailModal({ doc, onClose, role }) {
    if (!doc) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white p-8 rounded-xl shadow-2xl max-w-2xl w-full overflow-y-auto max-h-[90vh]">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-2xl font-bold text-slate-800">{doc.title}</h3>
                    <button onClick={onClose} className="text-slate-500 hover:text-slate-700 text-3xl leading-none">&times;</button>
                </div>
                <div className="space-y-3 text-sm text-slate-600">
                    <p><strong>ID:</strong> {doc.id}</p>
                    <p><strong>Status:</strong> <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                        doc.status === 'INGESTING' ? 'bg-yellow-100 text-yellow-800' :
                        doc.status === 'REGISTERED' ? 'bg-green-100 text-green-800' :
                        doc.status === 'ACTIVE_STORAGE' ? 'bg-blue-100 text-blue-800' :
                        doc.status === 'REVIEW' ? 'bg-purple-100 text-purple-800' :
                         doc.status === 'AWAITING_TRANSFER' ? 'bg-orange-100 text-orange-800' :
                        'bg-gray-100 text-gray-800'
                    }`}>{doc.status}</span></p>
                    <p><strong>Type:</strong> {doc.type}</p>
                    <p><strong>Creation Date:</strong> {doc.creationDate}</p>
                    <p><strong>Uploader:</strong> {doc.uploader}</p>
                    <p><strong>Public:</strong> {doc.isPublic ? 'Yes' : 'No'}</p>
                    {doc.releaseDate && <p><strong>Release Date:</strong> {doc.releaseDate}</p>}
                    {doc.aiSuggestedTitle && <p><strong>AI Suggested Title:</strong> {doc.aiSuggestedTitle}</p>}
                    {doc.aiPredictedRetention && <p><strong>AI Predicted Retention:</strong> {doc.aiPredictedRetention}</p>}
                    
                    <div className="mt-4 pt-4 border-t border-slate-200">
                        <h4 className="font-semibold text-slate-700 mb-2">Files:</h4>
                        <ul className="list-disc list-inside space-y-1">
                            <li>original_document.pdf (Original) <button className="text-xs text-sky-600 hover:underline ml-2">(Download)</button></li>
                            {doc.status !== 'INGESTING' && <li>ocr_output.txt (OCR Text) <button className="text-xs text-sky-600 hover:underline ml-2">(View)</button></li>}
                            {doc.status !== 'INGESTING' && !doc.isPublic && (role === ROLES.ARCHIVIST) && <li>redacted_document.pdf (Redacted) <button className="text-xs text-sky-600 hover:underline ml-2">(Download)</button></li>}
                        </ul>
                    </div>
                </div>
                <div className="mt-8 flex justify-end space-x-3">
                    {role === ROLES.ARCHIVIST && doc.status === 'INGESTING' && (
                        <button className="py-2 px-4 bg-green-600 hover:bg-green-700 text-white rounded-lg shadow">Approve Ingestion</button>
                    )}
                     {role === ROLES.ARCHIVIST && doc.status === 'REVIEW' && (
                        <button className="py-2 px-4 bg-teal-600 hover:bg-teal-700 text-white rounded-lg shadow">Mark as Reviewed</button>
                    )}
                    <button onClick={onClose} className="py-2 px-4 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg shadow">Close</button>
                </div>
            </div>
        </div>
    );
}

export default DocumentDetailModal;