import { useState, useEffect } from 'react'
import { useLocation, Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Search, FileText, Filter, Calendar, X } from 'lucide-react'

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

  // Get search query from URL parameters
  useEffect(() => {
    const params = new URLSearchParams(location.search)
    const query = params.get('q') || ''
    setSearchQuery(query)

    if (query) {
      performSearch(query)
    }
  }, [location.search])

  // Perform search
  const performSearch = async (query, page = 1) => {
    setIsLoading(true)
    try {
      // In a real app, this would be an API call
      // For the hackathon, we'll use mock data
      setTimeout(() => {
        const mockResults = [
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

        setSearchResults(mockResults)
        setTotalResults(mockResults.length)
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
    if (searchQuery.trim()) {
      // Update URL with search query
      const searchParams = new URLSearchParams()
      searchParams.set('q', searchQuery)
      window.history.pushState({}, '', `${location.pathname}?${searchParams.toString()}`)
      performSearch(searchQuery)
    }
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
    // In a real app, this would update the search with filters
    // For the hackathon, we'll just close the filters panel
    setFiltersOpen(false)
    performSearch(searchQuery)
  }

  // Reset filters
  const resetFilters = () => {
    setFilters({
      dateFrom: '',
      dateTo: '',
      documentType: '',
      institution: '',
    })
  }

  return (
    <div className="public-home-page">
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
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setFiltersOpen(!filtersOpen)}
                >
                  <Filter className="icon" aria-hidden="true" />
                  {t('public.filters')}
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                >
                  <Search className="icon" aria-hidden="true" />
                  {t('public.search')}
                </button>
              </div>
            </form>
          </div>

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
                  <X className="icon" aria-hidden="true" />
                </button>
              </div>
              <div className="filter-panel-content">
                <div className="filter-group">
                  <label htmlFor="dateFrom" className="form-label">
                    {t('public.date_from')}
                  </label>
                  <div className="input-group">
                    <span className="input-group-text">
                      <Calendar className="icon" aria-hidden="true" />
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
                      <Calendar className="icon" aria-hidden="true" />
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
                  <select
                    id="documentType"
                    name="documentType"
                    className="form-select"
                    value={filters.documentType}
                    onChange={handleFilterChange}
                  >
                    <option value="">{t('public.all_types')}</option>
                    <option value="hotarare">Hotărâre</option>
                    <option value="dispozitie">Dispoziție</option>
                    <option value="contract">Contract</option>
                    <option value="autorizatie">Autorizație</option>
                    <option value="certificat">Certificat</option>
                  </select>
                </div>
                <div className="filter-group">
                  <label htmlFor="institution" className="form-label">
                    {t('public.institution')}
                  </label>
                  <select
                    id="institution"
                    name="institution"
                    className="form-select"
                    value={filters.institution}
                    onChange={handleFilterChange}
                  >
                    <option value="">{t('public.all_institutions')}</option>
                    <option value="primaria_timisoara">Primăria Municipiului Timișoara</option>
                    <option value="consiliul_local_timisoara">Consiliul Local Timișoara</option>
                    <option value="consiliul_judetean_timis">Consiliul Județean Timiș</option>
                    <option value="primaria_dumbravita">Primăria Comunei Dumbrăvița</option>
                  </select>
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
          ) : searchQuery && searchResults.length > 0 ? (
            <div>
              <div className="search-results-count">
                {t('public.search_results_count', { count: totalResults })}
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
                          <span className="search-result-meta-label">{t('public.document_type')}:</span>
                          <span>{result.documentType}</span>
                        </span>
                        <span className="search-result-meta-item">
                          <span className="search-result-meta-label">{t('public.institution')}:</span>
                          <span>{result.institution}</span>
                        </span>
                        <span className="search-result-meta-item">
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
                    >
                      {page}
                    </button>
                  ))}
                </div>
                <div className="pagination-next">
                  <button
                    disabled={true} // Only one page in our mock data
                    className="btn btn-text"
                  >
                    {t('public.next')}
                  </button>
                </div>
              </nav>
            </div>
          ) : searchQuery ? (
            <div className="alert alert-warning">
              <div className="alert-content">
                <h3 className="alert-title">{t('public.no_results')}</h3>
                <div className="alert-description">
                  <p>{t('public.no_results_description')}</p>
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