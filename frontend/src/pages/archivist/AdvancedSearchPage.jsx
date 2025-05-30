import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../../hooks/useAuth'
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
} from 'lucide-react'

function AdvancedSearchPage() {
  const { t } = useTranslation()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [isLoading, setIsLoading] = useState(false)
  const [isSearching, setIsSearching] = useState(false)
  const [searchPerformed, setSearchPerformed] = useState(false)
  const [searchResults, setSearchResults] = useState([])
  const [searchParams, setSearchParams] = useState({
    query: '',
    documentType: '',
    creator: '',
    dateFrom: '',
    dateTo: '',
    retentionCategory: '',
    confidentiality: '',
    tags: [],
    useSemanticSearch: false,
  })
  const [tagInput, setTagInput] = useState('')
  const [sortBy, setSortBy] = useState('relevance')
  const [sortDirection, setSortDirection] = useState('desc')

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

  // Handle search
  const handleSearch = async (e) => {
    e.preventDefault()
    setIsSearching(true)
    setSearchPerformed(true)

    try {
      // In a real app, this would be an API call to search for documents
      // For the hackathon, we'll simulate a search with mock data
      await new Promise((resolve) => setTimeout(resolve, 1500))

      // Mock search results
      const mockResults = [
        {
          id: '1',
          title: 'Hotărâre privind aprobarea bugetului local pe anul 2023',
          documentType: 'hotarare',
          documentTypeName: 'Hotărâre',
          creator: 'Consiliul Local',
          creationDate: '2023-01-15',
          uploadDate: '2023-01-20',
          uploadedBy: 'Ion Popescu',
          status: 'approved',
          statusName: t('archivist.status_approved'),
          retentionCategory: 'c',
          retentionYears: '10',
          retentionEndDate: '2033-01-15',
          confidentiality: 'public',
          tags: ['buget', 'hotărâre', '2023', 'consiliu local'],
          relevanceScore: 0.95,
        },
        {
          id: '2',
          title: 'Contract de achiziție publică pentru servicii de mentenanță',
          documentType: 'contract',
          documentTypeName: 'Contract',
          creator: 'Direcția Achiziții Publice',
          creationDate: '2022-10-20',
          uploadDate: '2022-10-22',
          uploadedBy: 'Maria Popescu',
          status: 'approved',
          statusName: t('archivist.status_approved'),
          retentionCategory: 'cf',
          retentionYears: '3',
          retentionEndDate: '2025-10-20',
          confidentiality: 'internal',
          tags: ['contract', 'achiziții', 'mentenanță', 'servicii'],
          relevanceScore: 0.82,
        },
        {
          id: '3',
          title: 'Autorizație de construire nr. 123/2020',
          documentType: 'autorizatie',
          documentTypeName: 'Autorizație',
          creator: 'Direcția Urbanism',
          creationDate: '2020-05-10',
          uploadDate: '2020-05-15',
          uploadedBy: 'Ana Ionescu',
          status: 'approved',
          statusName: t('archivist.status_approved'),
          retentionCategory: 'cs',
          retentionYears: '30',
          retentionEndDate: '2050-05-10',
          confidentiality: 'public',
          tags: ['autorizație', 'construire', 'urbanism'],
          relevanceScore: 0.78,
        },
        {
          id: '4',
          title: 'Proces verbal de recepție lucrări de renovare sediu primărie',
          documentType: 'proces_verbal',
          documentTypeName: 'Proces-verbal',
          creator: 'Direcția Tehnică',
          creationDate: '2020-08-15',
          uploadDate: '2020-08-20',
          uploadedBy: 'Mihai Dumitrescu',
          status: 'approved',
          statusName: t('archivist.status_approved'),
          retentionCategory: 'cf',
          retentionYears: '3',
          retentionEndDate: '2023-08-15',
          confidentiality: 'internal',
          tags: ['proces-verbal', 'recepție', 'renovare', 'primărie'],
          relevanceScore: 0.65,
        },
        {
          id: '5',
          title: 'Raport de activitate anual 2022 - Direcția de Asistență Socială',
          documentType: 'raport',
          documentTypeName: 'Raport',
          creator: 'Direcția de Asistență Socială',
          creationDate: '2023-01-30',
          uploadDate: '2023-02-05',
          uploadedBy: 'Elena Stanciu',
          status: 'approved',
          statusName: t('archivist.status_approved'),
          retentionCategory: 'c',
          retentionYears: '10',
          retentionEndDate: '2033-01-30',
          confidentiality: 'public',
          tags: ['raport', 'activitate', '2022', 'asistență socială'],
          relevanceScore: 0.60,
        },
      ]

      // Filter results based on search parameters
      const filteredResults = mockResults.filter((doc) => {
        // Filter by document type
        if (searchParams.documentType && doc.documentType !== searchParams.documentType) {
          return false
        }

        // Filter by creator
        if (
          searchParams.creator &&
          !doc.creator.toLowerCase().includes(searchParams.creator.toLowerCase())
        ) {
          return false
        }

        // Filter by date range
        if (searchParams.dateFrom) {
          const dateFrom = new Date(searchParams.dateFrom)
          const creationDate = new Date(doc.creationDate)
          if (creationDate < dateFrom) {
            return false
          }
        }

        if (searchParams.dateTo) {
          const dateTo = new Date(searchParams.dateTo)
          const creationDate = new Date(doc.creationDate)
          if (creationDate > dateTo) {
            return false
          }
        }

        // Filter by retention category
        if (searchParams.retentionCategory && doc.retentionCategory !== searchParams.retentionCategory) {
          return false
        }

        // Filter by confidentiality
        if (searchParams.confidentiality && doc.confidentiality !== searchParams.confidentiality) {
          return false
        }

        // Filter by tags
        if (searchParams.tags.length > 0) {
          const hasAllTags = searchParams.tags.every((tag) =>
            doc.tags.some((docTag) => docTag.toLowerCase().includes(tag.toLowerCase()))
          )
          if (!hasAllTags) {
            return false
          }
        }

        // Filter by query (text search)
        if (searchParams.query) {
          const query = searchParams.query.toLowerCase()
          const matchesTitle = doc.title.toLowerCase().includes(query)
          const matchesCreator = doc.creator.toLowerCase().includes(query)
          const matchesType = doc.documentTypeName.toLowerCase().includes(query)
          const matchesTags = doc.tags.some((tag) => tag.toLowerCase().includes(query))

          if (!(matchesTitle || matchesCreator || matchesType || matchesTags)) {
            return false
          }
        }

        return true
      })

      setSearchResults(filteredResults)
    } catch (error) {
      console.error('Error searching documents:', error)
    } finally {
      setIsSearching(false)
    }
  }

  // Reset search form
  const handleReset = () => {
    setSearchParams({
      query: '',
      documentType: '',
      creator: '',
      dateFrom: '',
      dateTo: '',
      retentionCategory: '',
      confidentiality: '',
      tags: [],
      useSemanticSearch: false,
    })
    setTagInput('')
    setSearchResults([])
    setSearchPerformed(false)
  }

  // Sort search results
  const sortedResults = [...searchResults].sort((a, b) => {
    let comparison = 0

    if (sortBy === 'relevance') {
      comparison = b.relevanceScore - a.relevanceScore
    } else if (sortBy === 'title') {
      comparison = a.title.localeCompare(b.title)
    } else if (sortBy === 'documentType') {
      comparison = a.documentTypeName.localeCompare(b.documentTypeName)
    } else if (sortBy === 'creator') {
      comparison = a.creator.localeCompare(b.creator)
    } else if (sortBy === 'creationDate') {
      comparison = new Date(a.creationDate) - new Date(b.creationDate)
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

  // Format date for display
  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleDateString()
  }

  // Get confidentiality badge color
  const getConfidentialityBadgeColor = (confidentiality) => {
    switch (confidentiality) {
      case 'public':
        return 'bg-green-100 text-green-800'
      case 'internal':
        return 'bg-blue-100 text-blue-800'
      case 'confidential':
        return 'bg-yellow-100 text-yellow-800'
      case 'restricted':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="bg-white">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:text-3xl sm:tracking-tight">
            {t('archivist.advanced_search')}
          </h2>
          <p className="mt-2 max-w-4xl text-sm text-gray-500">
            {t('archivist.advanced_search_description')}
          </p>
        </div>

        {/* Search form */}
        <form onSubmit={handleSearch} className="mb-12">
          <div className="space-y-12">
            <div className="border-b border-gray-900/10 pb-12">
              <h2 className="text-base font-semibold leading-7 text-gray-900">
                {t('archivist.search_criteria')}
              </h2>
              <p className="mt-1 text-sm leading-6 text-gray-600">
                {t('archivist.search_criteria_description')}
              </p>

              <div className="mt-10 grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-6">
                {/* Text search */}
                <div className="sm:col-span-4">
                  <label
                    htmlFor="query"
                    className="block text-sm font-medium leading-6 text-gray-900"
                  >
                    {t('archivist.search_query')}
                  </label>
                  <div className="relative mt-2 rounded-md shadow-sm">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                      <Search className="h-5 w-5 text-gray-400" aria-hidden="true" />
                    </div>
                    <input
                      type="text"
                      name="query"
                      id="query"
                      className="block w-full rounded-md border-0 py-1.5 pl-10 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-primary sm:text-sm"
                      placeholder={t('archivist.search_query_placeholder')}
                      value={searchParams.query}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>

                {/* Semantic search toggle */}
                <div className="sm:col-span-2">
                  <div className="flex h-full items-end">
                    <div className="relative flex items-start pt-4">
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
                      <div className="ml-3 text-sm leading-6">
                        <label htmlFor="useSemanticSearch" className="font-medium text-gray-900">
                          {t('archivist.use_semantic_search')}
                        </label>
                        <p className="text-gray-500">{t('archivist.use_semantic_search_help')}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Document Type */}
                <div className="sm:col-span-3">
                  <label
                    htmlFor="documentType"
                    className="block text-sm font-medium leading-6 text-gray-900"
                  >
                    {t('archivist.document_type')}
                  </label>
                  <div className="mt-2">
                    <select
                      id="documentType"
                      name="documentType"
                      className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-primary sm:text-sm"
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
                  <label
                    htmlFor="creator"
                    className="block text-sm font-medium leading-6 text-gray-900"
                  >
                    {t('archivist.document_creator')}
                  </label>
                  <div className="relative mt-2 rounded-md shadow-sm">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                      <User className="h-5 w-5 text-gray-400" aria-hidden="true" />
                    </div>
                    <input
                      type="text"
                      name="creator"
                      id="creator"
                      className="block w-full rounded-md border-0 py-1.5 pl-10 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-primary sm:text-sm"
                      placeholder={t('archivist.document_creator_placeholder')}
                      value={searchParams.creator}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>

                {/* Date From */}
                <div className="sm:col-span-3">
                  <label
                    htmlFor="dateFrom"
                    className="block text-sm font-medium leading-6 text-gray-900"
                  >
                    {t('archivist.date_from')}
                  </label>
                  <div className="relative mt-2 rounded-md shadow-sm">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                      <Calendar className="h-5 w-5 text-gray-400" aria-hidden="true" />
                    </div>
                    <input
                      type="date"
                      name="dateFrom"
                      id="dateFrom"
                      className="block w-full rounded-md border-0 py-1.5 pl-10 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-primary sm:text-sm"
                      value={searchParams.dateFrom}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>

                {/* Date To */}
                <div className="sm:col-span-3">
                  <label
                    htmlFor="dateTo"
                    className="block text-sm font-medium leading-6 text-gray-900"
                  >
                    {t('archivist.date_to')}
                  </label>
                  <div className="relative mt-2 rounded-md shadow-sm">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                      <Calendar className="h-5 w-5 text-gray-400" aria-hidden="true" />
                    </div>
                    <input
                      type="date"
                      name="dateTo"
                      id="dateTo"
                      className="block w-full rounded-md border-0 py-1.5 pl-10 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-primary sm:text-sm"
                      value={searchParams.dateTo}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>

                {/* Retention Category */}
                <div className="sm:col-span-3">
                  <label
                    htmlFor="retentionCategory"
                    className="block text-sm font-medium leading-6 text-gray-900"
                  >
                    {t('archivist.retention_category')}
                  </label>
                  <div className="mt-2">
                    <select
                      id="retentionCategory"
                      name="retentionCategory"
                      className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-primary sm:text-sm"
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
                  <label
                    htmlFor="confidentiality"
                    className="block text-sm font-medium leading-6 text-gray-900"
                  >
                    {t('archivist.confidentiality')}
                  </label>
                  <div className="mt-2">
                    <select
                      id="confidentiality"
                      name="confidentiality"
                      className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-primary sm:text-sm"
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

                {/* Tags */}
                <div className="sm:col-span-6">
                  <label
                    htmlFor="tags"
                    className="block text-sm font-medium leading-6 text-gray-900"
                  >
                    {t('archivist.document_tags')}
                  </label>
                  <div className="mt-2">
                    <div className="flex rounded-md shadow-sm ring-1 ring-inset ring-gray-300 focus-within:ring-2 focus-within:ring-inset focus-within:ring-primary">
                      <div className="pointer-events-none flex items-center pl-3">
                        <Tag className="h-5 w-5 text-gray-400" aria-hidden="true" />
                      </div>
                      <input
                        type="text"
                        name="tagInput"
                        id="tagInput"
                        className="block flex-1 border-0 bg-transparent py-1.5 pl-2 text-gray-900 placeholder:text-gray-400 focus:ring-0 sm:text-sm"
                        placeholder={t('archivist.document_tags_placeholder')}
                        value={tagInput}
                        onChange={handleTagInputChange}
                        onKeyDown={handleTagInputKeyDown}
                      />
                      <button
                        type="button"
                        onClick={handleAddTag}
                        className="m-1 inline-flex items-center rounded-md bg-primary px-2 py-1 text-sm font-semibold text-white shadow-sm hover:bg-primary-dark focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                      >
                        <Plus className="-ml-0.5 mr-1.5 h-4 w-4" aria-hidden="true" />
                        {t('archivist.add')}
                      </button>
                    </div>
                    <p className="mt-2 text-sm text-gray-500">{t('archivist.document_tags_help')}</p>
                  </div>
                  {searchParams.tags.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {searchParams.tags.map((tag) => (
                        <span
                          key={tag}
                          className="inline-flex items-center rounded-md bg-primary-50 px-2 py-1 text-sm font-medium text-primary-700 ring-1 ring-inset ring-primary-600/20"
                        >
                          {tag}
                          <button
                            type="button"
                            onClick={() => handleRemoveTag(tag)}
                            className="ml-1 inline-flex h-4 w-4 items-center justify-center rounded-full text-primary-400 hover:bg-primary-200 hover:text-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
                          >
                            <span className="sr-only">{t('archivist.remove_tag')}</span>
                            <X className="h-3 w-3" aria-hidden="true" />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 flex items-center justify-end gap-x-6">
            <button
              type="button"
              onClick={handleReset}
              className="text-sm font-semibold leading-6 text-gray-900"
            >
              {t('archivist.reset')}
            </button>
            <button
              type="submit"
              disabled={isSearching}
              className="rounded-md bg-primary px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary-dark focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:opacity-50"
            >
              {isSearching ? t('archivist.searching') : t('archivist.search')}
            </button>
          </div>
        </form>

        {/* Search results */}
        {searchPerformed && (
          <div className="mt-8">
            <h3 className="text-lg font-medium leading-6 text-gray-900">
              {t('archivist.search_results')}
            </h3>

            {/* Results count and sort options */}
            <div className="mt-4 flex flex-col justify-between space-y-4 sm:flex-row sm:items-center sm:space-y-0">
              <p className="text-sm text-gray-500">
                {t('archivist.showing_results', { count: sortedResults.length })}
              </p>

              <div className="flex items-center space-x-4">
                <label htmlFor="sort-by" className="text-sm font-medium text-gray-700">
                  {t('archivist.sort_by')}:
                </label>
                <select
                  id="sort-by"
                  name="sort-by"
                  className="rounded-md border-gray-300 py-1 pl-2 pr-8 text-sm focus:border-primary focus:ring-primary"
                  value={sortBy}
                  onChange={(e) => {
                    setSortBy(e.target.value)
                    setSortDirection('desc')
                  }}
                >
                  <option value="relevance">{t('archivist.sort_by_relevance')}</option>
                  <option value="title">{t('archivist.sort_by_title')}</option>
                  <option value="documentType">{t('archivist.sort_by_type')}</option>
                  <option value="creator">{t('archivist.sort_by_creator')}</option>
                  <option value="creationDate">{t('archivist.sort_by_date')}</option>
                </select>

                <select
                  id="sort-direction"
                  name="sort-direction"
                  className="rounded-md border-gray-300 py-1 pl-2 pr-8 text-sm focus:border-primary focus:ring-primary"
                  value={sortDirection}
                  onChange={(e) => setSortDirection(e.target.value)}
                >
                  <option value="desc">{t('archivist.sort_descending')}</option>
                  <option value="asc">{t('archivist.sort_ascending')}</option>
                </select>
              </div>
            </div>

            {/* Results list */}
            {sortedResults.length === 0 ? (
              <div className="mt-6 rounded-md bg-yellow-50 p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <Info className="h-5 w-5 text-yellow-400" aria-hidden="true" />
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-yellow-800">
                      {t('archivist.no_results_found')}
                    </h3>
                    <div className="mt-2 text-sm text-yellow-700">
                      <p>{t('archivist.no_results_found_description')}</p>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="mt-6 overflow-hidden shadow ring-1 ring-black ring-opacity-5 sm:rounded-md">
                <ul role="list" className="divide-y divide-gray-200">
                  {sortedResults.map((document) => (
                    <li key={document.id}>
                      <div className="block hover:bg-gray-50">
                        <div className="px-4 py-4 sm:px-6">
                          <div className="flex items-center justify-between">
                            <div className="truncate text-sm font-medium text-primary">
                              {document.title}
                            </div>
                            <div className="ml-2 flex flex-shrink-0">
                              <span
                                className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ${getConfidentialityBadgeColor(document.confidentiality)}`}
                              >
                                <Lock className="-ml-0.5 mr-1.5 h-4 w-4" />
                                {confidentialityLevels.find((level) => level.id === document.confidentiality)?.name}
                              </span>
                            </div>
                          </div>
                          <div className="mt-2 sm:flex sm:justify-between">
                            <div className="sm:flex">
                              <div className="flex items-center text-sm text-gray-500">
                                <FileText className="mr-1.5 h-5 w-5 flex-shrink-0 text-gray-400" />
                                {document.documentTypeName}
                              </div>
                              <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0 sm:ml-6">
                                <User className="mr-1.5 h-5 w-5 flex-shrink-0 text-gray-400" />
                                {document.creator}
                              </div>
                            </div>
                            <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
                              <Calendar className="mr-1.5 h-5 w-5 flex-shrink-0 text-gray-400" />
                              <p>
                                {t('archivist.created_on')} {formatDate(document.creationDate)}
                              </p>
                            </div>
                          </div>
                          <div className="mt-2 sm:flex sm:justify-between">
                            <div className="flex flex-wrap gap-2">
                              {document.tags.map((tag) => (
                                <span
                                  key={tag}
                                  className="inline-flex items-center rounded-md bg-gray-50 px-2 py-1 text-xs font-medium text-gray-600 ring-1 ring-inset ring-gray-500/10"
                                >
                                  {tag}
                                </span>
                              ))}
                            </div>
                            <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
                              <button
                                type="button"
                                onClick={() => navigate(`/dashboard/archivist/document/${document.id}`)}
                                className="inline-flex items-center rounded-md bg-white px-2.5 py-1.5 text-sm font-semibold text-primary shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
                              >
                                <Eye className="-ml-0.5 mr-1.5 h-4 w-4" aria-hidden="true" />
                                {t('archivist.view_document')}
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default AdvancedSearchPage