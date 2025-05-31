import { useState, useEffect } from 'react'
import { useLocation, Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Search, FileText, Filter, Calendar, X, Building, FileType } from 'lucide-react'

function PublicSearchPage() {
  const { t } = useTranslation()
  const location = useLocation()
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [totalResults, setTotalResults] = useState(0)
  const [currentPage, setCurrentPage] = useState(1)
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [filters, setFilters] = useState({
    dateFrom: '',
    dateTo: '',
    documentType: '',
    institution: '',
  })

  // Get search query from URL parameters and load initial documents
  useEffect(() => {
    const params = new URLSearchParams(location.search)
    const query = params.get('q') || ''
    setSearchQuery(query)

    // Load initial frequently accessed documents
    loadFrequentDocuments()
  }, [])

  // Load frequently accessed documents
  const loadFrequentDocuments = () => {
    setIsLoading(true)
    setCurrentPage(1)
    try {
      // In a real app, this would be an API call to get most frequently accessed documents
      // For the hackathon, we'll use mock data
      setTimeout(() => {
        const allMockResults = [
          {
            id: '1',
            title: 'Hotărâre privind aprobarea bugetului local pe anul 2024',
            summary: 'Hotărâre a Consiliului Local privind aprobarea bugetului local al municipiului pentru anul fiscal 2024.',
            documentType: 'Hotărâre',
            institution: 'Consiliul Local Timișoara',
            releaseDate: '2024-01-15',
          },
          {
            id: '2',
            title: 'Dispoziție organizare concurs pentru ocuparea funcției publice de execuție vacante',
            summary: 'Dispoziție privind organizarea concursului pentru ocuparea funcției publice de execuție vacante de consilier, clasa I, grad profesional superior.',
            documentType: 'Dispoziție',
            institution: 'Primăria Municipiului Timișoara',
            releaseDate: '2024-02-20',
          },
          {
            id: '3',
            title: 'Contract de achiziție publică pentru servicii de mentenanță',
            summary: 'Contract de achiziție publică pentru servicii de mentenanță a sistemelor informatice din cadrul instituției.',
            documentType: 'Contract',
            institution: 'Consiliul Județean Timiș',
            releaseDate: '2024-03-10',
          },
          {
            id: '4',
            title: 'Autorizație de construire pentru imobil de locuințe colective',
            summary: 'Autorizație de construire pentru imobil de locuințe colective S+P+4E+Er, împrejmuire și branșamente la utilități.',
            documentType: 'Autorizație',
            institution: 'Primăria Municipiului Timișoara',
            releaseDate: '2024-02-05',
          },
          {
            id: '5',
            title: 'Certificat de urbanism pentru construire locuință unifamilială',
            summary: 'Certificat de urbanism pentru construire locuință unifamilială P+1E, împrejmuire și branșamente la utilități.',
            documentType: 'Certificat',
            institution: 'Primăria Comunei Dumbrăvița',
            releaseDate: '2024-01-30',
          },
        ]
        
        // Paginate results (5 per page)
        const resultsPerPage = 5
        const paginatedResults = allMockResults.slice(0, resultsPerPage)

        setSearchResults(paginatedResults)
        setTotalResults(allMockResults.length)
        setIsLoading(false)
      }, 500)
    } catch (error) {
      console.error('Error loading frequent documents:', error)
      setIsLoading(false)
    }
  }

  // Perform search
  const performSearch = async (query, page = 1) => {
    setIsLoading(true)
    setCurrentPage(page)
    try {
      // In a real app, this would be an API call
      // For the hackathon, we'll use mock data
      setTimeout(() => {
        const allMockResults = [
          {
            id: '1',
            title: 'Hotărâre privind aprobarea bugetului local pe anul 2024',
            summary: 'Hotărâre a Consiliului Local privind aprobarea bugetului local al municipiului pentru anul fiscal 2024.',
            documentType: 'Hotărâre',
            institution: 'Consiliul Local Timișoara',
            releaseDate: '2024-01-15',
          },
          {
            id: '2',
            title: 'Dispoziție organizare concurs pentru ocuparea funcției publice de execuție vacante',
            summary: 'Dispoziție privind organizarea concursului pentru ocuparea funcției publice de execuție vacante de consilier, clasa I, grad profesional superior.',
            documentType: 'Dispoziție',
            institution: 'Primăria Municipiului Timișoara',
            releaseDate: '2024-02-20',
          },
          {
            id: '3',
            title: 'Contract de achiziție publică pentru servicii de mentenanță',
            summary: 'Contract de achiziție publică pentru servicii de mentenanță a sistemelor informatice din cadrul instituției.',
            documentType: 'Contract',
            institution: 'Consiliul Județean Timiș',
            releaseDate: '2024-03-10',
          },
          {
            id: '4',
            title: 'Autorizație de construire pentru imobil de locuințe colective',
            summary: 'Autorizație de construire pentru imobil de locuințe colective S+P+4E+Er, împrejmuire și branșamente la utilități.',
            documentType: 'Autorizație',
            institution: 'Primăria Municipiului Timișoara',
            releaseDate: '2024-02-05',
          },
          {
            id: '5',
            title: 'Certificat de urbanism pentru construire locuință unifamilială',
            summary: 'Certificat de urbanism pentru construire locuință unifamilială P+1E, împrejmuire și branșamente la utilități.',
            documentType: 'Certificat',
            institution: 'Primăria Comunei Dumbrăvița',
            releaseDate: '2024-01-30',
          },
          {
            id: '6',
            title: 'Hotărâre privind aprobarea taxelor locale pentru anul 2024',
            summary: 'Hotărâre a Consiliului Local privind aprobarea taxelor și impozitelor locale pentru anul fiscal 2024.',
            documentType: 'Hotărâre',
            institution: 'Consiliul Local Timișoara',
            releaseDate: '2024-01-20',
          },
          {
            id: '7',
            title: 'Dispoziție privind constituirea comisiei de evaluare',
            summary: 'Dispoziție privind constituirea comisiei de evaluare pentru achiziția de servicii de consultanță.',
            documentType: 'Dispoziție',
            institution: 'Primăria Municipiului Timișoara',
            releaseDate: '2024-02-25',
          },
        ]
        
        // Filter results based on filters
        let filteredResults = allMockResults
        
        // Filter by search query text
        if (query && query.trim() !== '') {
          const searchTerms = query.toLowerCase().trim()
          filteredResults = filteredResults.filter(item => 
            item.title.toLowerCase().includes(searchTerms) || 
            item.summary.toLowerCase().includes(searchTerms) ||
            item.documentType.toLowerCase().includes(searchTerms) ||
            item.institution.toLowerCase().includes(searchTerms)
          )
        }
        
        // Apply additional filters
        if (filters.dateFrom) {
          filteredResults = filteredResults.filter(item => 
            new Date(item.releaseDate) >= new Date(filters.dateFrom)
          )
        }
        if (filters.dateTo) {
          filteredResults = filteredResults.filter(item => 
            new Date(item.releaseDate) <= new Date(filters.dateTo)
          )
        }
        if (filters.documentType) {
          filteredResults = filteredResults.filter(item => 
            item.documentType.toLowerCase().includes(filters.documentType.toLowerCase())
          )
        }
        if (filters.institution) {
          filteredResults = filteredResults.filter(item => 
            item.institution.toLowerCase().includes(filters.institution.toLowerCase())
          )
        }
        
        // Paginate results (5 per page)
        const resultsPerPage = 5
        const startIndex = (page - 1) * resultsPerPage
        const paginatedResults = filteredResults.slice(startIndex, startIndex + resultsPerPage)

        setSearchResults(paginatedResults)
        setTotalResults(filteredResults.length)
        setIsLoading(false)
      }, 500)
    } catch (error) {
      console.error('Error performing search:', error)
      setIsLoading(false)
    }
  }

  // Handle search form submission
  const handleSearch = (e) => {
    e.preventDefault()
    // Update URL with search query (even if empty to clear previous search)
    const searchParams = new URLSearchParams()
    if (searchQuery.trim()) {
      searchParams.set('q', searchQuery)
    }
    window.history.pushState({}, '', `${location.pathname}${searchQuery.trim() ? '?' + searchParams.toString() : ''}`)
    
    // Always perform search when button is clicked, even with empty query
    // This will either show filtered results or reset to show all documents
    performSearch(searchQuery)
  }

  // Handle filter changes
  const handleFilterChange = (e) => {
    const { name, value } = e.target
    setFilters({
      ...filters,
      [name]: value,
    })
  }

  // Apply filters
  const applyFilters = () => {
    // Apply filters and perform search with the current query
    setFiltersOpen(false)
    setCurrentPage(1) // Reset to first page when applying filters
    performSearch(searchQuery, 1)
  }

  // Reset filters
  const resetFilters = () => {
    setFilters({
      dateFrom: '',
      dateTo: '',
      documentType: '',
      institution: '',
    })
    // Perform search with reset filters
    setCurrentPage(1) // Reset to first page when resetting filters
    performSearch(searchQuery, 1)
  }

  return (
    <div className="public-search-page">
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
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setFiltersOpen(!filtersOpen)}
                  >
                    <Filter className="icon" aria-hidden="true" />
                    <span className="hidden sm:inline">{t('public.filters')}</span>
                  </button>
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

{/* TODO: make the advanced filters look usable! */}

          {/* Filters panel */}
          {filtersOpen && (
            <div className="filter-panel">
              <div className="filter-panel-header">
                <h3 className="filter-panel-title">{t('public.refine_search')}</h3>
                <button
                  type="button"
                  className="btn-icon"
                  onClick={() => setFiltersOpen(false)}
                >
                  <span className="sr-only">{t('common.close')}</span>
                  <X className="icon" size={18} aria-hidden="true" />
                </button>
              </div>
              <div className="filter-panel-content">
                <div className="filter-group">
                  <label htmlFor="dateFrom" className="form-label">
                    {t('public.date_from')}
                  </label>
                  <div className="input-group">
                    <span className="input-group-text">
                      <Calendar className="icon" size={16} aria-hidden="true" />
                    </span>
                    <input
                      type="date"
                      name="dateFrom"
                      id="dateFrom"
                      className="form-input"
                      value={filters.dateFrom}
                      onChange={handleFilterChange}
                    />
                  </div>
                </div>
                <div className="filter-group">
                  <label htmlFor="dateTo" className="form-label">
                    {t('public.date_to')}
                  </label>
                  <div className="input-group">
                    <span className="input-group-text">
                      <Calendar className="icon" size={16} aria-hidden="true" />
                    </span>
                    <input
                      type="date"
                      name="dateTo"
                      id="dateTo"
                      className="form-input"
                      value={filters.dateTo}
                      onChange={handleFilterChange}
                    />
                  </div>
                </div>
                <div className="filter-group">
                  <label htmlFor="documentType" className="form-label">
                    {t('public.document_type')}
                  </label>
                  <div className="input-group">
                    <span className="input-group-text">
                      <FileType className="icon" size={16} aria-hidden="true" />
                    </span>
                    <select
                      id="documentType"
                      name="documentType"
                      className="form-select"
                      value={filters.documentType}
                      onChange={handleFilterChange}
                    >
                      <option value="">{t('public.all_types')}</option>
                      <option value="hotarare">{t('public.document_types.decision')}</option>
                      <option value="dispozitie">{t('public.document_types.disposition')}</option>
                      <option value="contract">{t('public.document_types.contract')}</option>
                      <option value="autorizatie">{t('public.document_types.authorization')}</option>
                      <option value="certificat">{t('public.document_types.certificate')}</option>
                    </select>
                  </div>
                </div>
                <div className="filter-group">
                  <label htmlFor="institution" className="form-label">
                    {t('public.institution')}
                  </label>
                  <div className="input-group">
                    <span className="input-group-text">
                      <Building className="icon" size={16} aria-hidden="true" />
                    </span>
                    <select
                      id="institution"
                      name="institution"
                      className="form-select"
                      value={filters.institution}
                      onChange={handleFilterChange}
                    >
                      <option value="">{t('public.all_institutions')}</option>
                      <option value="primaria_timisoara">{t('public.institutions.timisoara_city_hall')}</option>
                      <option value="consiliul_local_timisoara">{t('public.institutions.timisoara_local_council')}</option>
                      <option value="consiliul_judetean_timis">{t('public.institutions.timis_county_council')}</option>
                      <option value="primaria_dumbravita">{t('public.institutions.dumbravita_city_hall')}</option>
                    </select>
                  </div>
                </div>
              </div>
              <div className="filter-panel-footer">
                <button
                  type="button"
                  className="btn btn-text"
                  onClick={resetFilters}
                >
                  {t('public.reset_filters')}
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={applyFilters}
                >
                  {t('public.apply_filters')}
                </button>
              </div>
            </div>
          )}
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
                        <Link
                          to={`/public/documents/${result.id}`}
                          className="search-result-title"
                        >
                          {result.title}
                        </Link>
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
                        performSearch(searchQuery, currentPage - 1);
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
                        performSearch(searchQuery, page);
                      }}
                    >
                      {page}
                    </button>
                  ))}
                </div>
                <div className="pagination-next">
                  <button
                    disabled={currentPage >= Math.ceil(totalResults / 5)} // Assuming 5 results per page
                    className="btn btn-text"
                    onClick={() => {
                      setCurrentPage(currentPage + 1);
                      performSearch(searchQuery, currentPage + 1);
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
                    {(filters.dateFrom || filters.dateTo || filters.documentType || filters.institution) && (
                      <span className="block mt-1 text-sm">
                        {filters.documentType && <span className="inline-block mr-2">{t('public.document_type')}: {filters.documentType}</span>}
                        {filters.institution && <span className="inline-block mr-2">{t('public.institution')}: {filters.institution}</span>}
                        {filters.dateFrom && <span className="inline-block mr-2">{t('public.date_from')}: {filters.dateFrom}</span>}
                        {filters.dateTo && <span className="inline-block">{t('public.date_to')}: {filters.dateTo}</span>}
                      </span>
                    )}
                  </p>
                  <div className="mt-4">
                    <button 
                      onClick={() => {
                        resetFilters();
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
  )
}

export default PublicSearchPage