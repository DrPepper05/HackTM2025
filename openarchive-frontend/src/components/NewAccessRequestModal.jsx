import React, { useState } from 'react';
import { Send, Clock } from 'lucide-react';

function NewAccessRequestModal({ onClose }) {
    const [documentTitle, setDocumentTitle] = useState('');
    const [justification, setJustification] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitStatus, setSubmitStatus] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!documentTitle || !justification) {
            setSubmitStatus('Error: Document Title and Justification are required.');
            return;
        }
        setIsSubmitting(true);
        setSubmitStatus('Submitting request...');
        await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate API call
        console.log('New Access Request:', { documentTitle, justification });
        setSubmitStatus('Success: Your access request has been submitted.');
        setTimeout(() => {
            setIsSubmitting(false);
            onClose(); 
        }, 2000);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white p-8 rounded-xl shadow-2xl max-w-lg w-full">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-2xl font-bold text-slate-800">New Access Request</h3>
                    <button onClick={onClose} className="text-slate-500 hover:text-slate-700 text-3xl leading-none">&times;</button>
                </div>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label htmlFor="documentTitleModal" className="block text-sm font-medium text-slate-700 mb-1">Document Title or ID</label>
                        <input 
                            type="text" 
                            id="documentTitleModal" 
                            value={documentTitle} 
                            onChange={(e) => setDocumentTitle(e.target.value)} 
                            required 
                            className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm"
                        />
                    </div>
                    <div>
                        <label htmlFor="justificationModal" className="block text-sm font-medium text-slate-700 mb-1">Justification for Access</label>
                        <textarea 
                            id="justificationModal" 
                            value={justification} 
                            onChange={(e) => setJustification(e.target.value)} 
                            required 
                            rows="4"
                            className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm"
                        />
                    </div>
                    <div className="flex justify-end space-x-3 pt-4">
                        <button 
                            type="button" 
                            onClick={onClose}
                            className="py-2 px-4 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg shadow"
                            disabled={isSubmitting}
                        >
                            Cancel
                        </button>
                        <button 
                            type="submit" 
                            className="py-2 px-4 bg-sky-600 hover:bg-sky-700 text-white font-semibold rounded-lg shadow flex items-center disabled:opacity-50"
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? <Clock className="animate-spin mr-2 h-5 w-5" /> : <Send className="mr-2 h-5 w-5" />}
                            {isSubmitting ? 'Submitting...' : 'Submit Request'}
                        </button>
                    </div>
                    {submitStatus && <p className={`mt-4 text-sm ${submitStatus.startsWith('Error') ? 'text-red-600' : 'text-green-600'}`}>{submitStatus}</p>}
                </form>
            </div>
        </div>
    );
}

export default NewAccessRequestModal;