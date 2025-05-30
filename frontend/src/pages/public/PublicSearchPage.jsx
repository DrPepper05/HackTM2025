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
    <div className="bg-white">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl">
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">
            {t('public.search_archives')}
          </h1>
          <p className="mt-2 text-lg text-gray-600">
            {t('public.search_description')}
          </p>

          {/* Search form */}
          <div className="mt-8">
            <form onSubmit={handleSearch} className="flex w-full">
              <div className="relative flex flex-grow items-stretch">
                <input
                  type="text"
                  name="search"
                  id="search"
                  className="block w-full rounded-l-md border-0 py-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-primary sm:text-sm"
                  placeholder={t('public.search_placeholder')}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <button
                  type="button"
                  className="relative -ml-px inline-flex items-center gap-x-1.5 rounded-none bg-gray-50 px-3 py-2 text-sm font-semibold text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-100"
                  onClick={() => setFiltersOpen(!filtersOpen)}
                >
                  <Filter className="h-5 w-5 text-gray-400" aria-hidden="true" />
                  {t('public.filters')}
                </button>
              </div>
              <button
                type="submit"
                className="relative -ml-px inline-flex items-center gap-x-1.5 rounded-r-md bg-primary px-3 py-2 text-sm font-semibold text-white hover:bg-primary-dark"
              >
                <Search className="h-5 w-5" aria-hidden="true" />
                {t('public.search')}
              </button>
            </form>
          </div>

          {/* Filters panel */}
          {filtersOpen && (
            <div className="mt-4 rounded-md border border-gray-300 bg-white p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900">{t('public.refine_search')}</h3>
                <button
                  type="button"
                  className="text-gray-400 hover:text-gray-500"
                  onClick={() => setFiltersOpen(false)}
                >
                  <span className="sr-only">{t('common.close')}</span>
                  <X className="h-5 w-5" aria-hidden="true" />
                </button>
              </div>
              <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="dateFrom" className="block text-sm font-medium text-gray-700">
                    {t('public.date_from')}
                  </label>
                  <div className="mt-1 flex rounded-md shadow-sm">
                    <span className="inline-flex items-center rounded-l-md border border-r-0 border-gray-300 bg-gray-50 px-3 text-gray-500">
                      <Calendar className="h-4 w-4" aria-hidden="true" />
                    </span>
                    <input
                      type="date"
                      name="dateFrom"
                      id="dateFrom"
                      className="block w-full rounded-none rounded-r-md border-0 py-1.5 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-primary sm:text-sm"
                      value={filters.dateFrom}
                      onChange={handleFilterChange}
                    />
                  </div>
                </div>
                <div>
                  <label htmlFor="dateTo" className="block text-sm font-medium text-gray-700">
                    {t('public.date_to')}
                  </label>
                  <div className="mt-1 flex rounded-md shadow-sm">
                    <span className="inline-flex items-center rounded-l-md border border-r-0 border-gray-300 bg-gray-50 px-3 text-gray-500">
                      <Calendar className="h-4 w-4" aria-hidden="true" />
                    </span>
                    <input
                      type="date"
                      name="dateTo"
                      id="dateTo"
                      className="block w-full rounded-none rounded-r-md border-0 py-1.5 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-primary sm:text-sm"
                      value={filters.dateTo}
                      onChange={handleFilterChange}
                    />
                  </div>
                </div>
                <div>
                  <label htmlFor="documentType" className="block text-sm font-medium text-gray-700">
                    {t('public.document_type')}
                  </label>
                  <select
                    id="documentType"
                    name="documentType"
                    className="mt-1 block w-full rounded-md border-0 py-1.5 text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-primary sm:text-sm"
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
                <div>
                  <label htmlFor="institution" className="block text-sm font-medium text-gray-700">
                    {t('public.institution')}
                  </label>
                  <select
                    id="institution"
                    name="institution"
                    className="mt-1 block w-full rounded-md border-0 py-1.5 text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-primary sm:text-sm"
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
              <div className="mt-4 flex justify-end space-x-3">
                <button
                  type="button"
                  className="rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
                  onClick={resetFilters}
                >
                  {t('public.reset_filters')}
                </button>
                <button
                  type="button"
                  className="rounded-md bg-primary px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary-dark"
                  onClick={applyFilters}
                >
                  {t('public.apply_filters')}
                </button>
              </div>
            </div>
          )}

          {/* Search results */}
          <div className="mt-8">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="loading-spinner"></div>
              </div>
            ) : searchQuery && searchResults.length > 0 ? (
              <div>
                <div className="mb-4 text-sm text-gray-500">
                  {t('public.search_results_count', { count: totalResults })}
                </div>
                <ul className="divide-y divide-gray-200">
                  {searchResults.map((result) => (
                    <li key={result.id} className="py-4">
                      <div className="flex flex-col space-y-2">
                        <div className="flex items-center space-x-2">
                          <FileText className="h-5 w-5 text-gray-400" />
                          <Link
                            to={`/public/documents/${result.id}`}
                            className="text-lg font-medium text-primary hover:underline"
                          >
                            {result.title}
                          </Link>
                        </div>
                        <p className="text-sm text-gray-600">{result.summary}</p>
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-gray-500">
                          <span className="flex items-center gap-x-1">
                            <span className="font-medium">{t('public.document_type')}:</span>
                            <span>{result.documentType}</span>
                          </span>
                          <span className="flex items-center gap-x-1">
                            <span className="font-medium">{t('public.institution')}:</span>
                            <span>{result.institution}</span>
                          </span>
                          <span className="flex items-center gap-x-1">
                            <span className="font-medium">{t('public.release_date')}:</span>
                            <span>{new Date(result.releaseDate).toLocaleDateString()}</span>
                          </span>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>

                {/* Pagination */}
                <nav className="mt-8 flex items-center justify-between border-t border-gray-200 px-4 sm:px-0">
                  <div className="-mt-px flex w-0 flex-1">
                    <button
                      disabled={currentPage === 1}
                      className="inline-flex items-center border-t-2 border-transparent pr-1 pt-4 text-sm font-medium text-gray-500 hover:border-gray-300 hover:text-gray-700 disabled:opacity-50"
                    >
                      {t('public.previous')}
                    </button>
                  </div>
                  <div className="hidden md:-mt-px md:flex">
                    {[1].map((page) => (
                      <button
                        key={page}
                        className="inline-flex items-center border-t-2 border-primary px-4 pt-4 text-sm font-medium text-primary"
                        aria-current="page"
                      >
                        {page}
                      </button>
                    ))}
                  </div>
                  <div className="-mt-px flex w-0 flex-1 justify-end">
                    <button
                      disabled={true} // Only one page in our mock data
                      className="inline-flex items-center border-t-2 border-transparent pl-1 pt-4 text-sm font-medium text-gray-500 hover:border-gray-300 hover:text-gray-700 disabled:opacity-50"
                    >
                      {t('public.next')}
                    </button>
                  </div>
                </nav>
              </div>
            ) : searchQuery ? (
              <div className="rounded-md bg-yellow-50 p-4">
                <div className="flex">
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-yellow-800">{t('public.no_results')}</h3>
                    <div className="mt-2 text-sm text-yellow-700">
                      <p>{t('public.no_results_description')}</p>
                    </div>
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  )
}

export default PublicSearchPage