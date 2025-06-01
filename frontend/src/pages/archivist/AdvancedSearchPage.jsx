import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../../hooks/useAuth'
import { searchApi, semanticSearchApi, documentsApi } from '../../services/api'
import {
  Search,
  Calendar,
  Filter,
  ArrowUpDown,
  Eye,
  Download,
  FileText,
  Tag,
  User,
  Clock,
  Lock,
  Info,
  X,
  Plus,
  RefreshCw,
  AlertCircle,
} from 'lucide-react'

const API_BASE_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001'

function AdvancedSearchPage() {
  const { t } = useTranslation()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [isLoading, setIsLoading] = useState(false)
  const [isSearching, setIsSearching] = useState(false)
  const [searchPerformed, setSearchPerformed] = useState(false)
  const [searchResults, setSearchResults] = useState([])
  const [searchStats, setSearchStats] = useState(null)
  const [searchError, setSearchError] = useState('')
  const [searchParams, setSearchParams] = useState({
    // Basic search
    query: '',
    
    // Advanced boolean search
    mustContainAll: [],
    mustContainAny: [],
    mustNotContain: [],
    exactPhrase: '',
    
    // Filters
    documentType: '',
    creator: '',
    dateFrom: '',
    dateTo: '',
    retentionCategory: '',
    confidentiality: '',
    tags: [],
    status: '',
    
    // Options
    useSemanticSearch: true, // Default to semantic search
  })
  const [tagInput, setTagInput] = useState('')
  const [mustContainAllInput, setMustContainAllInput] = useState('')
  const [mustContainAnyInput, setMustContainAnyInput] = useState('')
  const [mustNotContainInput, setMustNotContainInput] = useState('')
  const [sortBy, setSortBy] = useState('relevance')
  const [sortDirection, setSortDirection] = useState('desc')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  // Document types for dropdown
  const documentTypes = [
    { id: '', name: t('archivist.all_types') },
    { id: 'hotarare', name: 'Hotărâre' },
    { id: 'dispozitie', name: 'Dispoziție' },
    { id: 'contract', name: 'Contract' },
    { id: 'autorizatie', name: 'Autorizație' },
    { id: 'certificat', name: 'Certificat' },
    { id: 'adresa', name: 'Adresă' },
    { id: 'raport', name: 'Raport' },
    { id: 'proces_verbal', name: 'Proces-verbal' },
  ]

  // Retention categories for dropdown
  const retentionCategories = [
    { id: '', name: t('archivist.all_categories') },
    { id: 'permanent', name: t('archivist.retention_permanent'), years: 'Permanent' },
    { id: 'cs', name: t('archivist.retention_cs'), years: '30' },
    { id: 'c', name: t('archivist.retention_c'), years: '10' },
    { id: 'ci', name: t('archivist.retention_ci'), years: '5' },
    { id: 'cf', name: t('archivist.retention_cf'), years: '3' },
  ]

  // Confidentiality levels for dropdown
  const confidentialityLevels = [
    { id: '', name: t('archivist.all_levels') },
    { id: 'public', name: t('archivist.confidentiality_public') },
    { id: 'internal', name: t('archivist.confidentiality_internal') },
    { id: 'confidential', name: t('archivist.confidentiality_confidential') },
    { id: 'restricted', name: t('archivist.confidentiality_restricted') },
  ]

  // Status options for dropdown
  const statusOptions = [
    { id: '', name: t('archivist.all_statuses') },
    { id: 'draft', name: t('archivist.status_draft') },
    { id: 'under_review', name: t('archivist.status_under_review') },
    { id: 'approved', name: t('archivist.status_approved') },
    { id: 'rejected', name: t('archivist.status_rejected') },
    { id: 'archived', name: t('archivist.status_archived') },
  ]

  // Handle input changes
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target
    setSearchParams({
      ...searchParams,
      [name]: type === 'checkbox' ? checked : value,
    })
  }

  // Handle tag input
  const handleTagInputChange = (e) => {
    setTagInput(e.target.value)
  }

  // Handle tag input keydown
  const handleTagInputKeyDown = (e) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      e.preventDefault()
      if (!searchParams.tags.includes(tagInput.trim())) {
        setSearchParams({
          ...searchParams,
          tags: [...searchParams.tags, tagInput.trim()],
        })
      }
      setTagInput('')
    }
  }

  // Add tag
  const handleAddTag = () => {
    if (tagInput.trim() && !searchParams.tags.includes(tagInput.trim())) {
      setSearchParams({
        ...searchParams,
        tags: [...searchParams.tags, tagInput.trim()],
      })
      setTagInput('')
    }
  }

  // Remove tag
  const handleRemoveTag = (tag) => {
    setSearchParams({
      ...searchParams,
      tags: searchParams.tags.filter((t) => t !== tag),
    })
  }

  // Handle advanced search array inputs
  const handleArrayInput = (inputValue, setInputValue, arrayKey, setValue) => {
    if (inputValue.trim()) {
      const terms = inputValue.split(',').map(term => term.trim()).filter(term => term)
      setSearchParams({
        ...searchParams,
        [arrayKey]: [...new Set([...searchParams[arrayKey], ...terms])]
      })
      setInputValue('')
    }
  }

  // Remove item from advanced search array
  const removeFromArray = (item, arrayKey) => {
    setSearchParams({
      ...searchParams,
      [arrayKey]: searchParams[arrayKey].filter(term => term !== item)
    })
  }

  // Handle search
  const handleSearch = async (e) => {
    if (e) e.preventDefault()
    setIsSearching(true)
    setSearchPerformed(true)
    setSearchError('')

    try {
      // Check if any search criteria is provided
      const hasBasicQuery = searchParams.query.trim()
      const hasAdvancedTerms = searchParams.mustContainAll.length > 0 || 
                               searchParams.mustContainAny.length > 0 || 
                               searchParams.mustNotContain.length > 0 ||
                               searchParams.exactPhrase.trim()
      const hasFilters = searchParams.documentType || 
                        searchParams.creator.trim() ||
                        searchParams.dateFrom ||
                        searchParams.dateTo ||
                        searchParams.retentionCategory ||
                        searchParams.confidentiality ||
                        searchParams.status ||
                        searchParams.tags.length > 0

      console.log('Search criteria:', { hasBasicQuery, hasAdvancedTerms, hasFilters, useSemanticSearch: searchParams.useSemanticSearch })

      // Use semantic search if enabled and we have a basic query
      if (searchParams.useSemanticSearch && hasBasicQuery) {
        console.log('Using semantic search')
        
        try {
          // Call the semantic search API
          const semanticResponse = await semanticSearchApi.search(searchParams.query.trim())
          
          if (semanticResponse.results && semanticResponse.results.length > 0) {
            // Get detailed document information for each result
            const documentPromises = semanticResponse.results.map(async (result) => {
              try {
                const docResponse = await documentsApi.getDocument(result.id)
                if (docResponse.success && docResponse.data) {
                  const doc = docResponse.data
                  return {
                    ...doc,
                    semantic_score: result.score, // Add semantic similarity score
                  }
                }
                return null
              } catch (error) {
                console.error(`Error fetching document ${result.id}:`, error)
                return null
              }
            })
            
            let documents = (await Promise.all(documentPromises)).filter(doc => doc !== null)
            
            // Apply additional filters
            if (hasFilters) {
              documents = documents.filter(doc => {
                // Document type filter
                if (searchParams.documentType && doc.document_type !== searchParams.documentType) {
                  return false
                }
                
                // Creator filter
                if (searchParams.creator && !doc.creator_info?.creator_name?.toLowerCase().includes(searchParams.creator.toLowerCase())) {
                  return false
                }
                
                // Date filters
                if (searchParams.dateFrom && new Date(doc.created_at) < new Date(searchParams.dateFrom)) {
                  return false
                }
                if (searchParams.dateTo && new Date(doc.created_at) > new Date(searchParams.dateTo)) {
                  return false
                }
                
                // Retention category filter
                if (searchParams.retentionCategory && doc.retention_category !== searchParams.retentionCategory) {
                  return false
                }
                
                // Status filter
                if (searchParams.status && doc.status !== searchParams.status) {
                  return false
                }
                
                // Tags filter
                if (searchParams.tags.length > 0) {
                  const docTags = doc.tags || []
                  const hasMatchingTag = searchParams.tags.some(tag => 
                    docTags.some(docTag => docTag.toLowerCase().includes(tag.toLowerCase()))
                  )
                  if (!hasMatchingTag) {
                    return false
                  }
                }
                
                return true
              })
            }
            
            setSearchResults(documents)
            setSearchStats({
              total: documents.length,
              queryTime: 0, // Semantic search doesn't provide query time
              facets: {},
              semantic_search: true
            })
            
            // Calculate pagination
            const itemsPerPage = 20
            setTotalPages(Math.ceil(documents.length / itemsPerPage))
            
            return
          } else {
            setSearchError('No documents found matching your search query.')
            setSearchResults([])
            setSearchStats(null)
            return
          }
        } catch (semanticError) {
          console.error('Semantic search failed, falling back to regular search:', semanticError)
          // Fall through to regular search
        }
      }

      // If no criteria provided, use basic search to get all documents
      if (!hasBasicQuery && !hasAdvancedTerms && !hasFilters) {
        console.log('Using basic search for all documents')
        // Use regular search API with empty query to get all documents
        const response = await searchApi.search({
          query: '',
          limit: 50,
          offset: 0
        })
        
        console.log('Basic search response:', response)
        
        if (response.success) {
          // Handle the response structure from searchDocuments
          const documents = response.data.documents || []
          setSearchResults(documents)
          setSearchStats({
            total: response.data.total || 0,
            queryTime: response.data.query_time_ms || 0,
            facets: response.data.facets || {}
          })
          
          // Calculate pagination
          const itemsPerPage = 20
          setTotalPages(Math.ceil((response.data.total || 0) / itemsPerPage))
        } else {
          setSearchError(response.message || 'Search failed')
          setSearchResults([])
          setSearchStats(null)
        }
        return
      }

      console.log('Using advanced search')
      // Prepare search criteria for the backend (advanced search)
      const searchCriteria = {}
      
      // Advanced boolean search
      if (searchParams.mustContainAll.length > 0) {
        searchCriteria.must_contain_all = searchParams.mustContainAll
      }
      
      if (searchParams.mustContainAny.length > 0) {
        searchCriteria.must_contain_any = searchParams.mustContainAny
      }
      
      if (searchParams.mustNotContain.length > 0) {
        searchCriteria.must_not_contain = searchParams.mustNotContain
      }
      
      if (searchParams.exactPhrase) {
        searchCriteria.exact_phrase = searchParams.exactPhrase
      }

      // Basic query
      if (searchParams.query) {
        if (!searchCriteria.must_contain_all) {
          searchCriteria.must_contain_all = []
        }
        searchCriteria.must_contain_all.push(...searchParams.query.split(' ').filter(term => term))
      }

      // Metadata filters
      const metadataFilters = {}
      
      if (searchParams.documentType) {
        metadataFilters.document_type = searchParams.documentType
      }
      
      if (searchParams.creator) {
        metadataFilters.creator = searchParams.creator
      }
      
      if (searchParams.retentionCategory) {
        metadataFilters.retention_category = searchParams.retentionCategory
      }
      
      if (searchParams.confidentiality) {
        // Map confidentiality to database fields
        if (searchParams.confidentiality === 'public') {
          metadataFilters.is_public = true
        } else if (searchParams.confidentiality === 'private') {
          metadataFilters.is_public = false
        }
        // Store the confidentiality_note for non-boolean filtering if needed
        metadataFilters.confidentiality_note = searchParams.confidentiality
      }
      
      if (searchParams.status) {
        metadataFilters.status = searchParams.status
      }
      
      if (searchParams.tags.length > 0) {
        metadataFilters.tags = searchParams.tags
      }
      
      if (searchParams.dateFrom) {
        metadataFilters.created_after = searchParams.dateFrom
      }
      
      if (searchParams.dateTo) {
        metadataFilters.created_before = searchParams.dateTo
      }

      if (Object.keys(metadataFilters).length > 0) {
        searchCriteria.metadata_filters = metadataFilters
      }

      console.log('Advanced search criteria:', searchCriteria)

      // Make API call
      const response = await searchApi.advancedSearch(searchCriteria)
      
      console.log('Advanced search response:', response)
      
      if (response.success) {
        setSearchResults(response.data.documents || [])
        setSearchStats({
          total: response.data.total || 0,
          queryTime: response.data.query_time_ms || 0,
          facets: response.data.facets || {}
        })
        
        // Calculate pagination
        const itemsPerPage = 20
        setTotalPages(Math.ceil((response.data.total || 0) / itemsPerPage))
      } else {
        setSearchError(response.message || 'Search failed')
        setSearchResults([])
        setSearchStats(null)
      }
    } catch (error) {
      console.error('Error searching documents:', error)
      setSearchError(error.message || 'An error occurred during search')
      setSearchResults([])
      setSearchStats(null)
    } finally {
      setIsSearching(false)
    }
  }

  // Load all documents on component mount
  useEffect(() => {
    handleSearch()
  }, [])

  // Reset search form
  const handleReset = () => {
    setSearchParams({
      query: '',
      mustContainAll: [],
      mustContainAny: [],
      mustNotContain: [],
      exactPhrase: '',
      documentType: '',
      creator: '',
      dateFrom: '',
      dateTo: '',
      retentionCategory: '',
      confidentiality: '',
      tags: [],
      status: '',
      useSemanticSearch: true,
    })
    setTagInput('')
    setMustContainAllInput('')
    setMustContainAnyInput('')
    setMustNotContainInput('')
    setSearchError('')
    setCurrentPage(1)
    
    // Automatically search again to show all documents
    setTimeout(() => {
      handleSearch()
    }, 100)
  }

  // Sort search results
  const sortedResults = [...searchResults].sort((a, b) => {
    let comparison = 0

    // Handle both result.document and direct document structures
    const docA = a.document || a
    const docB = b.document || b

    if (sortBy === 'relevance') {
      const scoreA = a.relevance_score || 0
      const scoreB = b.relevance_score || 0
      comparison = scoreB - scoreA
    } else if (sortBy === 'title') {
      comparison = (docA?.title || '').localeCompare(docB?.title || '')
    } else if (sortBy === 'documentType') {
      comparison = (docA?.document_type || '').localeCompare(docB?.document_type || '')
    } else if (sortBy === 'creator') {
      comparison = (docA?.created_by || '').localeCompare(docB?.created_by || '')
    } else if (sortBy === 'creationDate') {
      const dateA = new Date(docA?.created_at || 0)
      const dateB = new Date(docB?.created_at || 0)
      comparison = dateA - dateB
    }

    return sortDirection === 'asc' ? comparison : -comparison
  })

  // Handle sort change
  const handleSort = (field) => {
    if (sortBy === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(field)
      setSortDirection('desc')
    }
  }

  // Format date helper
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A'
    try {
      return new Date(dateString).toLocaleDateString()
    } catch {
      return 'Invalid Date'
    }
  }

  // Get document type name with fallback
  const getDocumentTypeName = (type) => {
    const typeMap = {
      'hotarare': 'Hotărâre',
      'dispozitie': 'Dispoziție', 
      'contract': 'Contract',
      'autorizatie': 'Autorizație',
      'certificat': 'Certificat',
      'adresa': 'Adresă',
      'raport': 'Raport',
      'proces_verbal': 'Proces-verbal'
    }
    return typeMap[type] || type || 'Document'
  }

  // Get confidentiality badge color
  const getConfidentialityBadgeColor = (level) => {
    switch (level) {
      case 'public':
        return 'bg-green-100 text-green-800'
      case 'internal':
        return 'bg-yellow-100 text-yellow-800'
      case 'confidential':
        return 'bg-orange-100 text-orange-800'
      case 'restricted':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="bg-transparent">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:text-3xl sm:tracking-tight">
            {t('archivist.advanced_search')}
          </h2>
          <p className="mt-2 max-w-4xl text-sm text-gray-500">
            {t('archivist.advanced_search_description')}
          </p>
        </div>

        {/* Search Error */}
        {searchError && (
          <div className="mb-6 rounded-md bg-red-50 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <AlertCircle className="h-5 w-5 text-red-400" aria-hidden="true" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-red-800">{searchError}</p>
              </div>
            </div>
          </div>
        )}

        {/* Search form */}
        <form onSubmit={handleSearch} className="mb-12">
          <div className="space-y-12">
            {/* Basic Search */}
            <div className="border-b border-gray-900/10 pb-12">
              <h2 className="text-base font-semibold leading-7 text-gray-900">
                {t('archivist.basic_search')}
              </h2>
              <p className="mt-1 text-sm leading-6 text-gray-600">
                {t('archivist.basic_search_description')}
              </p>

              <div className="mt-6 grid grid-cols-1 gap-x-4 gap-y-4 sm:grid-cols-12 items-center bg-gray-50 p-4 rounded-lg shadow-sm">
                {/* Search */}
                <div className="relative sm:col-span-12">
                  <label htmlFor="query" className="block text-sm font-medium text-gray-700 mb-1">
                    {t('archivist.search_query')}
                  </label>
                  <div className="relative">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                      <Search className="h-5 w-5 text-gray-400" aria-hidden="true" />
                    </div>
                    <input
                      type="text"
                      name="query"
                      id="query"
                      className="block w-full rounded-md border-0 py-1.5 pl-10 pr-3 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-primary sm:text-sm sm:leading-6"
                      placeholder={t('archivist.search_query_placeholder')}
                      value={searchParams.query}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Advanced Boolean Search */}
            <div className="border-b border-gray-900/10 pb-12">
              <h2 className="text-base font-semibold leading-7 text-gray-900">
                {t('archivist.boolean_search')}
              </h2>
              <p className="mt-1 text-sm leading-6 text-gray-600">
                {t('archivist.boolean_search_description')}
              </p>

              <div className="mt-6 grid grid-cols-1 gap-x-4 gap-y-4 sm:grid-cols-2">
                {/* Must contain all */}
                <div>
                  <label htmlFor="mustContainAll" className="block text-sm font-medium text-gray-700 mb-1">
                    {t('archivist.must_contain_all')}
                  </label>
                  <div className="mt-2">
                    <div className="flex gap-x-1">
                      <div className="relative flex-1">
                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                          <Plus className="h-5 w-5 text-gray-400" aria-hidden="true" />
                        </div>
                        <input
                          type="text"
                          value={mustContainAllInput}
                          onChange={(e) => setMustContainAllInput(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault()
                              handleArrayInput(mustContainAllInput, setMustContainAllInput, 'mustContainAll')
                            }
                          }}
                          className="block w-full rounded-md border-0 py-1.5 pl-10 pr-3 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-primary sm:text-sm sm:leading-6"
                          placeholder={t('archivist.enter_terms_comma_separated')}
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => handleArrayInput(mustContainAllInput, setMustContainAllInput, 'mustContainAll')}
                        className="inline-flex items-center rounded-md bg-white px-2.5 py-1.5 text-sm font-semibold text-gray-500 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {searchParams.mustContainAll.map((term, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center rounded-full bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-600/20"
                        >
                          {term}
                          <button
                            type="button"
                            onClick={() => removeFromArray(term, 'mustContainAll')}
                            className="ml-1 inline-flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full text-blue-400 hover:bg-blue-200 hover:text-blue-500 focus:bg-blue-500 focus:text-white focus:outline-none"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Must contain any */}
                <div>
                  <label htmlFor="mustContainAny" className="block text-sm font-medium text-gray-700 mb-1">
                    {t('archivist.must_contain_any')}
                  </label>
                  <div className="mt-2">
                    <div className="flex gap-x-1">
                      <div className="relative flex-1">
                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                          <Plus className="h-5 w-5 text-gray-400" aria-hidden="true" />
                        </div>
                        <input
                          type="text"
                          value={mustContainAnyInput}
                          onChange={(e) => setMustContainAnyInput(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault()
                              handleArrayInput(mustContainAnyInput, setMustContainAnyInput, 'mustContainAny')
                            }
                          }}
                          className="block w-full rounded-md border-0 py-1.5 pl-10 pr-3 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-primary sm:text-sm sm:leading-6"
                          placeholder={t('archivist.enter_terms_comma_separated')}
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => handleArrayInput(mustContainAnyInput, setMustContainAnyInput, 'mustContainAny')}
                        className="inline-flex items-center rounded-md bg-white px-2.5 py-1.5 text-sm font-semibold text-gray-500 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {searchParams.mustContainAny.map((term, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center rounded-full bg-green-50 px-2 py-1 text-xs font-medium text-green-700 ring-1 ring-inset ring-green-600/20"
                        >
                          {term}
                          <button
                            type="button"
                            onClick={() => removeFromArray(term, 'mustContainAny')}
                            className="ml-1 inline-flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full text-green-400 hover:bg-green-200 hover:text-green-500 focus:bg-green-500 focus:text-white focus:outline-none"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Must not contain */}
                <div>
                  <label htmlFor="mustNotContain" className="block text-sm font-medium text-gray-700 mb-1">
                    {t('archivist.must_not_contain')}
                  </label>
                  <div className="mt-2">
                    <div className="flex gap-x-1">
                      <div className="relative flex-1">
                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                          <Plus className="h-5 w-5 text-gray-400" aria-hidden="true" />
                        </div>
                        <input
                          type="text"
                          value={mustNotContainInput}
                          onChange={(e) => setMustNotContainInput(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault()
                              handleArrayInput(mustNotContainInput, setMustNotContainInput, 'mustNotContain')
                            }
                          }}
                          className="block w-full rounded-md border-0 py-1.5 pl-10 pr-3 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-primary sm:text-sm sm:leading-6"
                          placeholder={t('archivist.enter_terms_comma_separated')}
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => handleArrayInput(mustNotContainInput, setMustNotContainInput, 'mustNotContain')}
                        className="inline-flex items-center rounded-md bg-white px-2.5 py-1.5 text-sm font-semibold text-gray-500 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {searchParams.mustNotContain.map((term, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center rounded-full bg-red-50 px-2 py-1 text-xs font-medium text-red-700 ring-1 ring-inset ring-red-600/20"
                        >
                          {term}
                          <button
                            type="button"
                            onClick={() => removeFromArray(term, 'mustNotContain')}
                            className="ml-1 inline-flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full text-red-400 hover:bg-red-200 hover:text-red-500 focus:bg-red-500 focus:text-white focus:outline-none"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Exact phrase */}
                <div>
                  <label htmlFor="exactPhrase" className="block text-sm font-medium text-gray-700 mb-1">
                    {t('archivist.exact_phrase')}
                  </label>
                  <div className="relative mt-2">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                      <FileText className="h-5 w-5 text-gray-400" aria-hidden="true" />
                    </div>
                    <input
                      type="text"
                      name="exactPhrase"
                      id="exactPhrase"
                      className="block w-full rounded-md border-0 py-1.5 pl-10 pr-3 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-primary sm:text-sm sm:leading-6"
                      placeholder={t('archivist.exact_phrase_placeholder')}
                      value={searchParams.exactPhrase}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Filters */}
            <div className="border-b border-gray-900/10 pb-12">
              <h2 className="text-base font-semibold leading-7 text-gray-900">
                {t('archivist.filters')}
              </h2>
              <p className="mt-1 text-sm leading-6 text-gray-600">
                {t('archivist.filters_description')}
              </p>

              <div className="mt-10 grid grid-cols-1 gap-x-4 gap-y-4 sm:grid-cols-6">
                {/* Document Type */}
                <div className="sm:col-span-3">
                  <label htmlFor="documentType" className="block text-sm font-medium text-gray-700 mb-1">
                    {t('archivist.document_type')}
                  </label>
                  <div className="relative">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                      <FileText className="h-5 w-5 text-gray-400" aria-hidden="true" />
                    </div>
                    <select
                      id="documentType"
                      name="documentType"
                      className="block w-full rounded-md border-0 py-1.5 pl-10 pr-10 text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-primary sm:text-sm sm:leading-6"
                      value={searchParams.documentType}
                      onChange={handleInputChange}
                    >
                      {documentTypes.map((type) => (
                        <option key={type.id} value={type.id}>
                          {type.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Creator */}
                <div className="sm:col-span-3">
                  <label htmlFor="creator" className="block text-sm font-medium text-gray-700 mb-1">
                    {t('archivist.document_creator')}
                  </label>
                  <div className="relative">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                      <User className="h-5 w-5 text-gray-400" aria-hidden="true" />
                    </div>
                    <input
                      type="text"
                      name="creator"
                      id="creator"
                      className="block w-full rounded-md border-0 py-1.5 pl-10 pr-3 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-primary sm:text-sm sm:leading-6"
                      placeholder={t('archivist.document_creator_placeholder')}
                      value={searchParams.creator}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>

                {/* Date From */}
                <div className="sm:col-span-3">
                  <label htmlFor="dateFrom" className="block text-sm font-medium text-gray-700 mb-1">
                    {t('archivist.date_from')}
                  </label>
                  <div className="relative">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                      <Calendar className="h-5 w-5 text-gray-400" aria-hidden="true" />
                    </div>
                    <input
                      type="date"
                      name="dateFrom"
                      id="dateFrom"
                      className="block w-full rounded-md border-0 py-1.5 pl-10 pr-3 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-primary sm:text-sm sm:leading-6"
                      value={searchParams.dateFrom}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>

                {/* Date To */}
                <div className="sm:col-span-3">
                  <label htmlFor="dateTo" className="block text-sm font-medium text-gray-700 mb-1">
                    {t('archivist.date_to')}
                  </label>
                  <div className="relative">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                      <Calendar className="h-5 w-5 text-gray-400" aria-hidden="true" />
                    </div>
                    <input
                      type="date"
                      name="dateTo"
                      id="dateTo"
                      className="block w-full rounded-md border-0 py-1.5 pl-10 pr-3 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-primary sm:text-sm sm:leading-6"
                      value={searchParams.dateTo}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>

                {/* Retention Category */}
                <div className="sm:col-span-3">
                  <label htmlFor="retentionCategory" className="block text-sm font-medium text-gray-700 mb-1">
                    {t('archivist.retention_category')}
                  </label>
                  <div className="relative">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                      <Clock className="h-5 w-5 text-gray-400" aria-hidden="true" />
                    </div>
                    <select
                      id="retentionCategory"
                      name="retentionCategory"
                      className="block w-full rounded-md border-0 py-1.5 pl-10 pr-10 text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-primary sm:text-sm sm:leading-6"
                      value={searchParams.retentionCategory}
                      onChange={handleInputChange}
                    >
                      {retentionCategories.map((category) => (
                        <option key={category.id} value={category.id}>
                          {category.name}
                          {category.years && category.id !== '' ? ` (${category.years} ${t('archivist.years')})` : ''}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Confidentiality */}
                <div className="sm:col-span-3">
                  <label htmlFor="confidentiality" className="block text-sm font-medium text-gray-700 mb-1">
                    {t('archivist.confidentiality')}
                  </label>
                  <div className="relative">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                      <Lock className="h-5 w-5 text-gray-400" aria-hidden="true" />
                    </div>
                    <select
                      id="confidentiality"
                      name="confidentiality"
                      className="block w-full rounded-md border-0 py-1.5 pl-10 pr-10 text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-primary sm:text-sm sm:leading-6"
                      value={searchParams.confidentiality}
                      onChange={handleInputChange}
                    >
                      {confidentialityLevels.map((level) => (
                        <option key={level.id} value={level.id}>
                          {level.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Status */}
                <div className="sm:col-span-3">
                  <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
                    {t('archivist.status')}
                  </label>
                  <div className="relative">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                      <Info className="h-5 w-5 text-gray-400" aria-hidden="true" />
                    </div>
                    <select
                      id="status"
                      name="status"
                      className="block w-full rounded-md border-0 py-1.5 pl-10 pr-10 text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-primary sm:text-sm sm:leading-6"
                      value={searchParams.status}
                      onChange={handleInputChange}
                    >
                      {statusOptions.map((status) => (
                        <option key={status.id} value={status.id}>
                          {status.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Tags */}
                <div className="sm:col-span-6">
                  <label htmlFor="tags" className="block text-sm font-medium text-gray-700 mb-1">
                    {t('archivist.tags')}
                  </label>
                  <div className="relative">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                      <Tag className="h-5 w-5 text-gray-400" aria-hidden="true" />
                    </div>
                    <input
                      type="text"
                      name="tags"
                      id="tags"
                      className="block w-full rounded-md border-0 py-1.5 pl-10 pr-3 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-primary sm:text-sm sm:leading-6"
                      placeholder={t('archivist.add_tag_placeholder')}
                      value={tagInput}
                      onChange={handleTagInputChange}
                      onKeyDown={handleTagInputKeyDown}
                    />
                  </div>
                    
                  {/* Display added tags */}
                  {searchParams.tags.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {searchParams.tags.map((tag, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center rounded-md bg-gray-50 px-2 py-1 text-xs font-medium text-gray-600 ring-1 ring-inset ring-gray-300"
                        >
                          {tag}
                          <button
                            type="button"
                            onClick={() => handleRemoveTag(tag)}
                            className="ml-1 inline-flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full text-gray-400 hover:bg-gray-200 hover:text-gray-500"
                          >
                            <span className="sr-only">{t('archivist.remove_tag')}</span>
                            <X className="h-3 w-3" aria-hidden="true" />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Semantic search toggle */}
                <div className="sm:col-span-6">
                  <div className="relative flex items-center">
                    <div className="flex h-6 items-center">
                      <input
                        id="useSemanticSearch"
                        name="useSemanticSearch"
                        type="checkbox"
                        className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                        checked={searchParams.useSemanticSearch}
                        onChange={handleInputChange}
                      />
                    </div>
                    <div className="ml-2">
                      <label htmlFor="useSemanticSearch" className="text-sm font-medium text-gray-700">
                        {t('archivist.use_semantic_search')}
                      </label>
                      <p className="text-sm text-gray-500">{t('archivist.use_semantic_search_help')}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Form actions */}
          <div className="mt-6 flex items-center justify-end gap-x-6">
            <button
              type="button"
              onClick={handleReset}
              className="inline-flex items-center rounded-md bg-white px-2.5 py-1.5 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
            >
              {t('archivist.reset')}
            </button>
            <button
              type="submit"
              disabled={isSearching}
              className="inline-flex items-center rounded-md bg-white px-2.5 py-1.5 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
            >
              {isSearching ? (
                <>
                  <RefreshCw className="inline-block w-4 h-4 mr-2 animate-spin" />
                  {t('archivist.searching')}
                </>
              ) : (
                <>
                  <Search className="inline-block w-4 h-4 mr-2" />
                  {t('archivist.search')}
                </>
              )}
            </button>
          </div>
        </form>

        {/* Search Results */}
        {(searchPerformed || searchResults.length > 0) && (
          <div className="mt-8">
            <div className="sm:flex sm:items-center">
              <div className="sm:flex-auto">
            <h3 className="text-lg font-medium leading-6 text-gray-900">
                  {(() => {
                    const hasSearchCriteria = searchParams.query.trim() || 
                                            searchParams.mustContainAll.length > 0 || 
                                            searchParams.mustContainAny.length > 0 || 
                                            searchParams.mustNotContain.length > 0 ||
                                            searchParams.exactPhrase.trim() ||
                                            searchParams.documentType || 
                                            searchParams.creator.trim() ||
                                            searchParams.dateFrom ||
                                            searchParams.dateTo ||
                                            searchParams.retentionCategory ||
                                            searchParams.confidentiality ||
                                            searchParams.status ||
                                            searchParams.tags.length > 0

                    return hasSearchCriteria 
                      ? t('archivist.search_results')
                      : t('archivist.all_documents')
                  })()}
            </h3>
                {searchStats && (
                  <p className="mt-2 text-sm text-gray-700">
                    {(() => {
                      const hasSearchCriteria = searchParams.query.trim() || 
                                              searchParams.mustContainAll.length > 0 || 
                                              searchParams.mustContainAny.length > 0 || 
                                              searchParams.mustNotContain.length > 0 ||
                                              searchParams.exactPhrase.trim() ||
                                              searchParams.documentType || 
                                              searchParams.creator.trim() ||
                                              searchParams.dateFrom ||
                                              searchParams.dateTo ||
                                              searchParams.retentionCategory ||
                                              searchParams.confidentiality ||
                                              searchParams.status ||
                                              searchParams.tags.length > 0

                      return hasSearchCriteria 
                        ? t('archivist.showing_results', { count: searchStats.total })
                        : t('archivist.showing_all_documents', { count: searchStats.total })
                    })()}
                    {searchStats.queryTime && (
                      <span className="text-gray-500">
                        {' '}• {t('archivist.search_time', { time: searchStats.queryTime })}ms
                      </span>
                    )}
                  </p>
                )}
              </div>
              
              {/* Sort options */}
              {sortedResults.length > 0 && (
                <div className="mt-4 sm:ml-16 sm:mt-0 sm:flex-none">
                  <div className="flex items-center space-x-2">
                    <label htmlFor="sort" className="text-sm font-medium text-gray-700">
                  {t('archivist.sort_by')}:
                </label>
                <select
                      id="sort"
                      value={`${sortBy}-${sortDirection}`}
                  onChange={(e) => {
                        const [field, direction] = e.target.value.split('-')
                        setSortBy(field)
                        setSortDirection(direction)
                      }}
                      className="rounded-md border-gray-300 text-sm focus:border-primary focus:ring-primary"
                    >
                      <option value="relevance-desc">{t('archivist.sort_relevance')}</option>
                      <option value="title-asc">{t('archivist.sort_title_asc')}</option>
                      <option value="title-desc">{t('archivist.sort_title_desc')}</option>
                      <option value="creationDate-desc">{t('archivist.sort_date_newest')}</option>
                      <option value="creationDate-asc">{t('archivist.sort_date_oldest')}</option>
                      <option value="documentType-asc">{t('archivist.sort_type_asc')}</option>
                      <option value="creator-asc">{t('archivist.sort_creator_asc')}</option>
                </select>
              </div>
                </div>
              )}
            </div>

            {/* Results */}
            <div className="mt-6">
              {isSearching ? (
                <div className="text-center py-12">
                  <RefreshCw className="mx-auto h-8 w-8 animate-spin text-primary" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">
                    {t('archivist.loading_documents')}
                  </h3>
                  <p className="mt-1 text-sm text-gray-500">
                    {t('archivist.please_wait')}
                  </p>
                  </div>
              ) : sortedResults.length === 0 ? (
                <div className="text-center py-12">
                  <FileText className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">
                      {t('archivist.no_documents_found')}
                    </h3>
                  <p className="mt-1 text-sm text-gray-500">
                    {t('archivist.no_results_description')}
                  </p>
              </div>
            ) : (
                <div className="space-y-6">
                  {sortedResults.map((result, index) => {
                    // Handle both result.document and direct document structures
                    const doc = result.document || result
                    const relevanceScore = result.relevance_score
                    const highlight = result.highlight

                    return (
                      <div
                        key={doc?.id || index}
                        className="relative rounded-lg border border-gray-200 bg-white p-6 shadow-sm hover:shadow-md transition-shadow"
                      >
                        <div className="flex items-start justify-between">
                          <div className="min-w-0 flex-1">
                            <div className="focus:outline-none">
                              <div className="flex items-center space-x-3">
                                <h4 className="text-lg font-medium text-gray-900 truncate">
                                  {doc?.title || 'Untitled Document'}
                                </h4>
                                
                                {/* Show semantic score if available */}
                                {doc?.semantic_score && (
                                  <span className="inline-flex items-center rounded-full bg-purple-100 px-2.5 py-0.5 text-xs font-medium text-purple-800">
                                    Similarity: {Math.round(doc.semantic_score * 100)}%
                                  </span>
                                )}
                                
                                {/* Show regular relevance score if available */}
                                {relevanceScore && !doc?.semantic_score && (
                                  <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800">
                                    Relevance: {Math.round(relevanceScore * 100)}%
                                  </span>
                                )}
                                
                                {/* Show semantic search indicator */}
                                {searchStats?.semantic_search && (
                                  <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
                                    Semantic
                                  </span>
                                )}
                            </div>
                              
                              <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-2">
                                <div className="flex items-center text-sm text-gray-500">
                                  <FileText className="mr-1.5 h-4 w-4 flex-shrink-0" />
                                  {getDocumentTypeName(doc?.document_type)}
                          </div>
                                
                              <div className="flex items-center text-sm text-gray-500">
                                  <User className="mr-1.5 h-4 w-4 flex-shrink-0" />
                                  {doc?.creator_info?.creator_name || doc?.created_by || doc?.uploaded_by || 'Unknown Creator'}
                              </div>
                                
                                <div className="flex items-center text-sm text-gray-500">
                                  <Calendar className="mr-1.5 h-4 w-4 flex-shrink-0" />
                                  {formatDate(doc?.created_at)}
                              </div>
                                
                                {(doc?.confidentiality_note || doc?.is_public !== undefined) && (
                                  <span
                                    className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${getConfidentialityBadgeColor(
                                      doc.confidentiality_note || (doc.is_public ? 'public' : 'private')
                                    )}`}
                                  >
                                    <Lock className="mr-1 h-3 w-3" />
                                    {doc.confidentiality_note || (doc.is_public ? 'public' : 'private')}
                                  </span>
                                )}
                            </div>
                              
                              {doc?.description && (
                                <p className="mt-3 text-sm text-gray-600 line-clamp-2">
                                  {doc.description}
                                </p>
                              )}
                              
                              {/* Highlight matches */}
                              {highlight && (
                                <div className="mt-3 space-y-1">
                                  {highlight.title && (
                                    <div className="text-sm">
                                      <span className="font-medium text-gray-700">{t('archivist.title_match')}:</span>
                                      <span 
                                        className="ml-1 text-gray-600"
                                        dangerouslySetInnerHTML={{ __html: highlight.title }}
                                      />
                            </div>
                                  )}
                                  {highlight.content && (
                                    <div className="text-sm">
                                      <span className="font-medium text-gray-700">{t('archivist.content_match')}:</span>
                                      <span 
                                        className="ml-1 text-gray-600"
                                        dangerouslySetInnerHTML={{ __html: highlight.content }}
                                      />
                          </div>
                                  )}
                                </div>
                              )}
                              
                              {/* Tags */}
                              {doc?.tags && doc.tags.length > 0 && (
                                <div className="mt-3 flex flex-wrap gap-1">
                                  {doc.tags.slice(0, 5).map((tag, tagIndex) => (
                                <span
                                      key={tagIndex}
                                  className="inline-flex items-center rounded-md bg-gray-50 px-2 py-1 text-xs font-medium text-gray-600 ring-1 ring-inset ring-gray-500/10"
                                >
                                  {tag}
                                </span>
                              ))}
                                  {doc.tags.length > 5 && (
                                    <span className="inline-flex items-center rounded-md bg-gray-50 px-2 py-1 text-xs font-medium text-gray-600 ring-1 ring-inset ring-gray-500/10">
                                      +{doc.tags.length - 5} {t('archivist.more')}
                                    </span>
                                  )}
                            </div>
                              )}
                            </div>
                          </div>
                          
                          {/* Actions */}
                          <div className="ml-6 flex flex-shrink-0 items-center space-x-2">
                              <button
                                type="button"
                              onClick={() => navigate(`/archivist/document/${doc?.id}`)}
                              className="inline-flex items-center rounded-md bg-white px-2.5 py-1.5 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
                              >
                              <Eye className="h-4 w-4 mr-1" />
                              {t('archivist.view')}
                              </button>
                            
                            {doc?.file_path && (
                              <button
                                type="button"
                                onClick={() => window.open(`${API_BASE_URL}/api/v1/documents/${doc.id}/download`, '_blank')}
                                className="inline-flex items-center rounded-md bg-primary px-2.5 py-1.5 text-sm font-semibold text-white shadow-sm hover:bg-primary-dark"
                              >
                                <Download className="h-4 w-4 mr-1" />
                                {t('archivist.download')}
                              </button>
                            )}
                            </div>
                          </div>
                        </div>
                    )
                  })}
                      </div>
              )}
            </div>

            {/* Search facets/stats */}
            {searchStats?.facets && Object.keys(searchStats.facets).length > 0 && (
              <div className="mt-8 border-t border-gray-200 pt-8">
                <h4 className="text-sm font-medium text-gray-900 mb-4">
                  {t('archivist.search_facets')}
                </h4>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Document Types */}
                  {searchStats.facets.document_types?.length > 0 && (
                    <div>
                      <h5 className="text-xs font-medium text-gray-700 uppercase tracking-wide mb-2">
                        {t('archivist.document_types')}
                      </h5>
                      <ul className="space-y-1">
                        {searchStats.facets.document_types.slice(0, 5).map((facet) => (
                          <li key={facet.value} className="flex justify-between text-sm">
                            <span className="text-gray-600">{getDocumentTypeName(facet.value)}</span>
                            <span className="text-gray-900 font-medium">{facet.count}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
                  
                  {/* Retention Categories */}
                  {searchStats.facets.retention_categories?.length > 0 && (
                    <div>
                      <h5 className="text-xs font-medium text-gray-700 uppercase tracking-wide mb-2">
                        {t('archivist.retention_categories')}
                      </h5>
                      <ul className="space-y-1">
                        {searchStats.facets.retention_categories.slice(0, 5).map((facet) => (
                          <li key={facet.value} className="flex justify-between text-sm">
                            <span className="text-gray-600">{facet.value}</span>
                            <span className="text-gray-900 font-medium">{facet.count}</span>
                          </li>
                        ))}
                      </ul>
          </div>
        )}
                  
                  {/* Tags */}
                  {searchStats.facets.tags?.length > 0 && (
                    <div>
                      <h5 className="text-xs font-medium text-gray-700 uppercase tracking-wide mb-2">
                        {t('archivist.popular_tags')}
                      </h5>
                      <ul className="space-y-1">
                        {searchStats.facets.tags.slice(0, 5).map((facet) => (
                          <li key={facet.value} className="flex justify-between text-sm">
                            <span className="text-gray-600">{facet.value}</span>
                            <span className="text-gray-900 font-medium">{facet.count}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default AdvancedSearchPage