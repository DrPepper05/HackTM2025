import { useState, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Search, FileText, Building, FileType, Calendar } from 'lucide-react'
import { semanticSearchApi, documentsApi } from '../../services/api'
import Footer from '../../components/navigation/Footer'

function PublicSearchPage() {
  const { t } = useTranslation()
  const location = useLocation()
  const navigate = useNavigate()
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [totalResults, setTotalResults] = useState(0)
  const [currentPage, setCurrentPage] = useState(1)
  const [searchError, setSearchError] = useState('')

  // Get search query from URL parameters and load initial documents
  useEffect(() => {
    const params = new URLSearchParams(location.search)
    const query = params.get('q') || ''
    setSearchQuery(query)

    if (query) {
      performSemanticSearch(query)
    } else {
      // Load initial frequently accessed documents
      loadFrequentDocuments()
    }
  }, [])

  // Load frequently accessed public documents
  const loadFrequentDocuments = async () => {
    setIsLoading(true)
    setCurrentPage(1)
    setSearchError('')
    try {
      // Use public API endpoint for unlogged users
      const SERVER_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001'
      const response = await fetch(`${SERVER_URL}/api/v1/public/documents?limit=10&offset=0`)
      const data = await response.json()

      if (response.ok && data.success && data.data && data.data.documents) {
        const documents = data.data.documents.map(doc => ({
          id: doc.id,
          title: doc.title,
          summary: doc.description || doc.ai_suggested_title || 'No description available',
          documentType: doc.document_type || 'Document',
          institution: doc.creator_info?.creator_institution || 'Unknown Institution',
          releaseDate: doc.release_date || doc.created_at,
          isPublic: doc.is_public
        }))
        
        setSearchResults(documents)
        setTotalResults(data.data.total || documents.length)
      } else {
        setSearchResults([])
        setTotalResults(0)
      }
    } catch (error) {
      console.error('Error loading frequent documents:', error)
      setSearchError('Failed to load documents. Please try again.')
      setSearchResults([])
      setTotalResults(0)
    } finally {
      setIsLoading(false)
    }
  }

  // Perform semantic search using the APIs/semantic-sort service
  const performSemanticSearch = async (query, page = 1) => {
    if (!query || query.trim() === '') {
      loadFrequentDocuments()
      return
    }

    setIsLoading(true)
    setCurrentPage(page)
    setSearchError('')
    
    try {
      // Call the semantic search API
      const semanticResponse = await semanticSearchApi.search(query.trim())
      
      if (semanticResponse.results && semanticResponse.results.length > 0) {
        // Get detailed document information for each result
        const documentPromises = semanticResponse.results.map(async (result) => {
          try {
            const docResponse = await documentsApi.getDocument(result.id)
            if (docResponse.success && docResponse.data) {
              const doc = docResponse.data
              return {
                id: doc.id,
                title: doc.title,
                summary: doc.description || result.description || 'No description available',
                documentType: doc.document_type || 'Document',
                institution: doc.creator_info?.creator_institution || 'Unknown Institution',
                releaseDate: doc.release_date || doc.created_at,
                score: result.score, // Semantic similarity score
                isPublic: doc.is_public
              }
            }
            return null
          } catch (error) {
            console.error(`Error fetching document ${result.id}:`, error)
            // Return basic info from semantic search if detailed fetch fails
            return {
              id: result.id,
              title: result.description.substring(0, 100) + '...',
              summary: result.description,
              documentType: 'Document',
              institution: 'Unknown Institution',
              releaseDate: new Date().toISOString(),
              score: result.score,
              isPublic: false // Default to private if we can't fetch details
            }
          }
        })
        
        const documents = (await Promise.all(documentPromises)).filter(doc => doc !== null)
        
        // Apply additional filters if any
        let filteredResults = documents
        
        // Paginate results (10 per page)
        const resultsPerPage = 10
        const startIndex = (page - 1) * resultsPerPage
        const paginatedResults = filteredResults.slice(startIndex, startIndex + resultsPerPage)
        
        setSearchResults(paginatedResults)
        setTotalResults(filteredResults.length)
      } else {
        setSearchResults([])
        setTotalResults(0)
        setSearchError('No documents found matching your search query.')
      }
    } catch (error) {
      console.error('Error performing semantic search:', error)
      setSearchError('Search failed. Please try again.')
      setSearchResults([])
      setTotalResults(0)
    } finally {
      setIsLoading(false)
    }
  }

  // Handle search form submission
  const handleSearch = (e) => {
    e.preventDefault()
    performSemanticSearch(searchQuery, 1)
  }

  // Handle document click - download if public, redirect to request form if private
  const handleDocumentClick = (document) => {
    if (document.isPublic) {
      // Download the public document
      const SERVER_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001'
      window.open(`${SERVER_URL}/api/v1/public/documents/${document.id}/download`, '_blank')
    } else {
      // Redirect to access request form with document ID prefilled
      navigate(`/request-access?documentId=${document.id}`)
    }
  }

  return (
    <div className="public-search-page min-h-screen flex flex-col">
      <div className="flex-grow">
        <section className="search-header">
          <div className="content-container">
            <div className="section-header">
              <h1 className="section-title">
                {t('public.search_archives')}
              </h1>
              <p className="section-subtitle">
                {t('public.search_description')}
              </p>
            </div>

            {/* Search form */}
            <div className="search-container">
              <form onSubmit={handleSearch} className="search-form">
                <div className="input-group">
                  <input
                    type="text"
                    name="search"
                    id="search"
                    className="form-input"
                    placeholder={t('public.search_placeholder')}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  <div className="flex">
                    <button
                      type="submit"
                      className="btn btn-primary"
                      onClick={handleSearch}
                    >
                      <Search className="icon" aria-hidden="true" />
                      <span className="hidden sm:inline">{t('public.search_button')}</span>
                    </button>
                  </div>
                </div>
              </form>
            </div>

          </div>
        </section>

        {/* Search results */}
        <section className="search-results">
          <div className="content-container">
            {isLoading ? (
              <div className="loading-container">
                <div className="loading-spinner"></div>
              </div>
            ) : searchResults.length > 0 ? (
              <div>
                <div className="search-results-count">
                  {searchQuery ? t('public.search_results_count', { count: totalResults }) : t('public.frequent_documents')}
                </div>
                <ul className="search-results-list">
                  {searchResults.map((result) => (
                    <li key={result.id} className="search-result-item">
                      <div className="search-result-content">
                        <div className="search-result-header">
                          <FileText className="icon" />
                          <button
                            onClick={() => handleDocumentClick(result)}
                            className="search-result-title"
                            style={{ 
                              background: 'none', 
                              border: 'none', 
                              padding: 0, 
                              cursor: 'pointer',
                              textAlign: 'left',
                              color: 'inherit',
                              textDecoration: 'none'
                            }}
                          >
                            {result.title}
                          </button>
                        </div>
                        <p className="search-result-description">{result.summary}</p>
                        <div className="search-result-meta">
                          <span className="search-result-meta-item">
                            <FileType className="icon h-3 w-3 mr-1" />
                            <span className="search-result-meta-label">{t('public.document_type')}:</span>
                            <span>{result.documentType}</span>
                          </span>
                          <span className="search-result-meta-item">
                            <Building className="icon h-3 w-3 mr-1" />
                            <span className="search-result-meta-label">{t('public.institution')}:</span>
                            <span>{result.institution}</span>
                          </span>
                          <span className="search-result-meta-item">
                            <Calendar className="icon h-3 w-3 mr-1" />
                            <span className="search-result-meta-label">{t('public.release_date')}:</span>
                            <span>{new Date(result.releaseDate).toLocaleDateString()}</span>
                          </span>
                          {/* Show public/private indicator */}
                          <span className="search-result-meta-item">
                            <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                              result.isPublic 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-yellow-100 text-yellow-800'
                            }`}>
                              {result.isPublic ? t('public.public_document') : t('public.access_required')}
                            </span>
                          </span>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>

                {/* Pagination */}
                <nav className="pagination">
                  <div className="pagination-prev">
                    <button
                      disabled={currentPage === 1}
                      className="btn btn-text"
                      onClick={() => {
                        if (currentPage > 1) {
                          setCurrentPage(currentPage - 1);
                          performSemanticSearch(searchQuery, currentPage - 1);
                        }
                      }}
                    >
                      {t('public.previous')}
                    </button>
                  </div>
                  <div className="pagination-pages">
                    {[1].map((page) => (
                      <button
                        key={page}
                        className="pagination-page pagination-page-active"
                        aria-current="page"
                        onClick={() => {
                          setCurrentPage(page);
                          performSemanticSearch(searchQuery, page);
                        }}
                      >
                        {page}
                      </button>
                    ))}
                  </div>
                  <div className="pagination-next">
                    <button
                      disabled={currentPage >= Math.ceil(totalResults / 10)} // Assuming 10 results per page
                      className="btn btn-text"
                      onClick={() => {
                        setCurrentPage(currentPage + 1);
                        performSemanticSearch(searchQuery, currentPage + 1);
                      }}
                    >
                      {t('public.next')}
                    </button>
                  </div>
                </nav>
              </div>
            ) : searchResults.length === 0 && searchQuery ? (
              <div className="alert alert-warning">
                <div className="alert-content">
                  <h3 className="alert-title">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-8 h-8 text-amber-500 mb-2">
                      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                      <line x1="12" y1="9" x2="12" y2="13"></line>
                      <line x1="12" y1="17" x2="12.01" y2="17"></line>
                    </svg>
                    {t('public.no_results')}
                  </h3>
                  <div className="alert-description">
                    <p>{t('public.no_results_description')}</p>
                    <p className="mt-2 text-amber-600">
                      {searchQuery && <span className="font-medium">{t('public.search_term')}: "{searchQuery}"</span>}
                    </p>
                    <div className="mt-4">
                      <button 
                        onClick={() => {
                          setSearchQuery('');
                          // Reset URL by removing query parameters
                          window.history.pushState({}, '', `${location.pathname}`);
                          // Load initial documents
                          loadFrequentDocuments();
                        }}
                        className="btn btn-sm btn-primary mt-2"
                      >
                        {t('public.try_again')}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        </section>
      </div>
      
      {/* Footer */}
      <Footer />
    </div>
  )
}

export default PublicSearchPage