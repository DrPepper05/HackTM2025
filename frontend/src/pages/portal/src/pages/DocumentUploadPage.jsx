import React, { useState } from 'react';
import { UploadCloud, Clock } from 'lucide-react';

function DocumentUploadPage() {
  const [file, setFile] = useState(null);
  const [metadata, setMetadata] = useState({ title: '', documentType: '', creatorInfo: '', creationDate: new Date().toISOString().split('T')[0] });
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState('');

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      // Check if the file is a PDF
      if (selectedFile.type !== 'application/pdf') {
        setUploadStatus('Error: Only PDF files are allowed.');
        e.target.value = ''; // Reset the file input
        setFile(null);
        return;
      }
      setFile(selectedFile);
      setUploadStatus('');
    }
  };

  const handleMetadataChange = (e) => {
    setMetadata({ ...metadata, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file || !metadata.title || !metadata.documentType) {
        setUploadStatus('Error: File, Title, and Document Type are required.');
        return;
    }
    setIsUploading(true);
    setUploadStatus('Uploading...');
    await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate API call
    console.log('Uploading file:', file.name, 'with metadata:', metadata);
    setUploadStatus(`Success: Document "${metadata.title}" uploaded!`);
    setFile(null);
    if (e.target.file) e.target.file.value = null; // More reliable way to reset file input
    setMetadata({ title: '', documentType: '', creatorInfo: '', creationDate: new Date().toISOString().split('T')[0] });
    setIsUploading(false);
  };

  return (
    <div className="bg-white p-8 rounded-xl shadow-lg max-w-2xl mx-auto">
      <h2 className="text-3xl font-bold text-slate-800 mb-8 flex items-center"><UploadCloud className="mr-3 text-sky-600 h-8 w-8" /> Upload New Document</h2>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="file" className="block text-sm font-medium text-slate-700 mb-1">Document File</label>
          <input 
            type="file" 
            id="file" 
            name="file" // Added name for reset if needed
            accept=".pdf,application/pdf"
            onChange={handleFileChange} 
            required 
            className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-sky-50 file:text-sky-700 hover:file:bg-sky-100 border border-slate-300 rounded-lg cursor-pointer"
          />
        </div>
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-slate-700 mb-1">Title</label>
          <input type="text" name="title" id="title" value={metadata.title} onChange={handleMetadataChange} required className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm" />
        </div>
        <div>
          <label htmlFor="documentType" className="block text-sm font-medium text-slate-700 mb-1">Document Type</label>
          <input type="text" name="documentType" id="documentType" value={metadata.documentType} onChange={handleMetadataChange} required className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm" />
        </div>
        <div>
          <label htmlFor="creatorInfo" className="block text-sm font-medium text-slate-700 mb-1">Creator Information</label>
          <input type="text" name="creatorInfo" id="creatorInfo" value={metadata.creatorInfo} onChange={handleMetadataChange} className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm" />
        </div>
         <div>
          <label htmlFor="creationDate" className="block text-sm font-medium text-slate-700 mb-1">Creation Date</label>
          <input type="date" name="creationDate" id="creationDate" value={metadata.creationDate} onChange={handleMetadataChange} className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm" />
        </div>
        <button 
            type="submit" 
            disabled={isUploading}
            className="w-full flex items-center justify-center py-3 px-4 bg-sky-600 hover:bg-sky-700 text-white font-semibold rounded-lg shadow-md transition duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-opacity-50 disabled:opacity-50"
        >
          {isUploading ? <Clock className="animate-spin mr-2 h-5 w-5" /> : <UploadCloud className="mr-2 h-5 w-5" />}
          {isUploading ? 'Uploading...' : 'Upload Document'}
        </button>
        {uploadStatus && <p className={`mt-4 text-sm ${uploadStatus.startsWith('Error') ? 'text-red-600' : 'text-green-600'}`}>{uploadStatus}</p>}
      </form>
    </div>
  );
}

export default DocumentUploadPage;