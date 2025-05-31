import React, { useState } from 'react';
import { FileSearch, Search, Clock } from 'lucide-react';
import { mockDocuments } from '../utils/mockData.jsx'; // For mock search

function PublicSearchPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchTerm.trim()) {
        setResults([]); // Clear results if search term is empty
        return;
    }
    setIsLoading(true);
    await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
    const filteredResults = mockDocuments.filter(
      doc => doc.isPublic && 
             (doc.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
              (doc.type && doc.type.toLowerCase().includes(searchTerm.toLowerCase())))
    );
    setResults(filteredResults);
    setIsLoading(false);
  };

  return (
    <div className="bg-white p-8 rounded-xl shadow-lg">
      <h2 className="text-3xl font-bold text-slate-800 mb-6 flex items-center"><FileSearch className="mr-3 text-sky-600 h-8 w-8"/>Search Public Documents</h2>
      <form onSubmit={handleSearch} className="flex gap-2 mb-6">
        <input 
          type="text" 
          value={searchTerm} 
          onChange={(e) => setSearchTerm(e.target.value)} 
          placeholder="Enter keywords, title, type etc."
          className="flex-grow px-4 py-2 border border-slate-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
        />
        <button 
          type="submit"
          disabled={isLoading}
          className="bg-sky-600 hover:bg-sky-700 text-white font-semibold py-2 px-4 rounded-lg shadow flex items-center disabled:opacity-50"
        >
          {isLoading ? <Clock className="animate-spin mr-2 h-5 w-5" /> : <Search className="mr-2 h-5 w-5" />}
          Search
        </button>
      </form>

      {isLoading && <p className="text-slate-600 text-center py-4">Searching...</p>}
      
      {!isLoading && results.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-xl font-semibold text-slate-700 mb-3">Search Results ({results.length})</h3>
          {results.map(doc => (
            <div key={doc.id} className="p-4 border border-slate-200 rounded-lg hover:shadow-md transition-shadow bg-slate-50">
              <h4 className="text-lg font-semibold text-sky-700">{doc.title}</h4>
              <p className="text-sm text-slate-600">Type: {doc.type} | Creation Date: {doc.creationDate} | Release Date: {doc.releaseDate || 'N/A'}</p>
              <button 
                onClick={() => {/* TODO: Implement view details for public doc, maybe reuse DocumentDetailModal with limited info or a specific public view */ console.log("View public doc:", doc.id)}}
                className="text-sm text-sky-600 hover:underline mt-1"
              >
                View Details
              </button>
            </div>
          ))}
        </div>
      )}
      {!isLoading && results.length === 0 && searchTerm && (
        <p className="text-slate-600 text-center py-4">No public documents found matching your search criteria.</p>
      )}
       {!isLoading && results.length === 0 && !searchTerm && (
        <p className="text-slate-500 text-center py-4">Enter a search term to find public documents.</p>
      )}
    </div>
  );
}

export default PublicSearchPage;
