import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../../hooks/useAuth'
import { documentsApi, searchApi } from '../../services/api'
import {
  Calendar,
  Search,
  Filter,
  ArrowUpDown,
  Clock,
  AlertTriangle,
  CheckCircle,
  Eye,
  Archive,
  FileText,
  Download,
  Trash2,
} from 'lucide-react'

function RetentionQueuePage() {
  const { t } = useTranslation()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [isLoading, setIsLoading] = useState(true)
  const [documents, setDocuments] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [dateFilter, setDateFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [sortBy, setSortBy] = useState('dueDate')
  const [sortDirection, setSortDirection] = useState('asc')
  const [showConfirmation, setShowConfirmation] = useState(false)
  const [selectedAction, setSelectedAction] = useState(null)
  const [selectedDocument, setSelectedDocument] = useState(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState(null)

  // Fetch documents from API
  useEffect(() => {
    const fetchDocuments = async () => {
      setIsLoading(true)
      setError(null)
      try {
        let response
        let allDocuments = []
        
        // Try multiple approaches to get all documents for staff
        
        // Approach 1: Try search API first as it should return all documents for staff
        try {
          response = await searchApi.search({ 
            query: '', // Empty query to get all documents
            limit: 1000, // Large limit to get all documents
            offset: 0 
          })
          console.log('Search API Response:', response) // Debug log
          
          if (response.data?.documents) {
            // Extract the actual document objects from the nested structure
            allDocuments = response.data.documents.map(item => item.document)
            console.log('Extracted documents from search API:', allDocuments) // Debug log
          } else if (Array.isArray(response.data)) {
            allDocuments = response.data
          }
        } catch (searchError) {
          console.log('Search API failed:', searchError)
        }
        
        // Approach 2: Try documents API without user filter
        if (allDocuments.length === 0) {
          try {
            response = await documentsApi.getDocuments()
            console.log('Documents API Response:', response) // Debug log
            
            if (response.documents) {
              allDocuments = response.documents
            } else if (response.data) {
              allDocuments = response.data
            } else if (Array.isArray(response)) {
              allDocuments = response
            }
          } catch (docError) {
            console.log('Documents API failed:', docError)
          }
        }
        
        // Approach 3: Try direct API call to get all documents (for staff)
        if (allDocuments.length === 0) {
          try {
            // Try the admin documents endpoint or direct call
            const token = JSON.parse(localStorage.getItem('auth_session'))?.access_token
            const directResponse = await fetch(`${import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001'}/admin/documents`, {
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
              }
            })
            
            if (directResponse.ok) {
              const directData = await directResponse.json()
              console.log('Direct admin API Response:', directData) // Debug log
              allDocuments = Array.isArray(directData) ? directData : []
            }
          } catch (directError) {
            console.log('Direct admin API failed:', directError)
          }
        }

        console.log('All documents found:', allDocuments.length) // Debug log
        
        // Filter documents to only show those requiring retention action
        const allowedStatuses = ['REVIEW', 'NEEDS_CLASSIFICATION', 'DESTROY', 'AWAITING_TRANSFER']
        const filteredDocuments = allDocuments.filter(doc => {
          console.log('Document status:', doc.status, 'Document title:', doc.title) // Debug log
          return allowedStatuses.includes(doc.status)
        })

        console.log('Filtered documents:', filteredDocuments.length, 'out of', allDocuments.length) // Debug log
        
        // Set the filtered documents (remove temporary fallback)
        setDocuments(filteredDocuments)
      } catch (error) {
        console.error('Error fetching documents:', error)
        setError(error.message || 'Failed to fetch documents')
      } finally {
        setIsLoading(false)
      }
    }

    fetchDocuments()
  }, [])

  // Filter documents based on search term, date filter, and status filter
  const filteredDocuments = documents.filter((document) => {
    // Only show documents with specific statuses that require action
    const allowedStatuses = ['REVIEW', 'NEEDS_CLASSIFICATION', 'DESTROY', 'AWAITING_TRANSFER']
    if (!allowedStatuses.includes(document.status)) {
      return false
    }

    // Search filter
    const matchesSearch =
      document.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (document.creator_info?.creator_name || document.creator)?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      document.document_type?.toLowerCase().includes(searchTerm.toLowerCase())

    // Date filter - use retention_end_date or created_at as due date
    let matchesDate = true
    if (document.retention_end_date || document.created_at) {
      const today = new Date()
      const dueDate = new Date(document.retention_end_date || document.created_at)
      const diffTime = dueDate - today
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

      if (dateFilter === 'overdue') {
        matchesDate = diffDays < 0
      } else if (dateFilter === 'today') {
        matchesDate = diffDays === 0
      } else if (dateFilter === 'this_week') {
        matchesDate = diffDays >= 0 && diffDays <= 7
      } else if (dateFilter === 'this_month') {
        matchesDate = diffDays >= 0 && diffDays <= 30
      }
    }

    // Status filter
    const matchesStatus = statusFilter === 'all' || document.status === statusFilter

    return matchesSearch && matchesDate && matchesStatus
  })

  // Sort documents
  const sortedDocuments = [...filteredDocuments].sort((a, b) => {
    let comparison = 0

    if (sortBy === 'title') {
      comparison = (a.title || '').localeCompare(b.title || '')
    } else if (sortBy === 'documentType') {
      comparison = (a.document_type || '').localeCompare(b.document_type || '')
    } else if (sortBy === 'creator') {
      const creatorA = a.creator_info?.creator_name || a.creator || ''
      const creatorB = b.creator_info?.creator_name || b.creator || ''
      comparison = creatorA.localeCompare(creatorB)
    } else if (sortBy === 'dueDate') {
      const dateA = new Date(a.retention_end_date || a.created_at || 0)
      const dateB = new Date(b.retention_end_date || b.created_at || 0)
      comparison = dateA - dateB
    } else if (sortBy === 'status') {
      comparison = (a.status || '').localeCompare(b.status || '')
    }

    return sortDirection === 'asc' ? comparison : -comparison
  })

  // Handle sort change
  const handleSort = (field) => {
    if (sortBy === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(field)
      setSortDirection('asc')
    }
  }

  // Handle document action
  const handleAction = (document, action) => {
    setSelectedDocument(document)
    setSelectedAction(action)
    setShowConfirmation(true)
  }

  // Handle confirmation
  const handleConfirmation = async (confirmed) => {
    if (!confirmed) {
      setShowConfirmation(false)
      setSelectedDocument(null)
      setSelectedAction(null)
      return
    }

    setIsSubmitting(true)
    try {
      // Update document status using the API
      let newStatus = selectedDocument.status
      
      if (selectedAction === 'mark_reviewed') {
        newStatus = 'REGISTERED'
      } else if (selectedAction === 'classify_document') {
        newStatus = 'REGISTERED'
      } else if (selectedAction === 'confirm_transfer') {
        newStatus = 'TRANSFERRED'
      } else if (selectedAction === 'confirm_destruction') {
        newStatus = 'DESTROYED'
      }

      // Update document via API
      await documentsApi.updateDocument(selectedDocument.id, {
        status: newStatus
      })

      // Update local state
      if (selectedAction === 'confirm_destruction') {
        // Remove destroyed document from list
        setDocuments(prevDocs => prevDocs.filter(doc => doc.id !== selectedDocument.id))
      } else {
        // Update document status and remove from retention queue
        setDocuments(prevDocs => prevDocs.filter(doc => doc.id !== selectedDocument.id))
      }

      setShowConfirmation(false)
      setSelectedDocument(null)
      setSelectedAction(null)
    } catch (error) {
      console.error('Error performing action:', error)
      setError(error.message || 'Failed to perform action')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A'
    const date = new Date(dateString)
    return date.toLocaleDateString()
  }

  // Get status badge color
  const getStatusBadgeColor = (status) => {
    switch (status) {
      case 'REVIEW':
        return 'bg-yellow-100 text-yellow-800 border border-yellow-300'
      case 'NEEDS_CLASSIFICATION':
        return 'bg-blue-100 text-blue-800 border border-blue-300'
      case 'DESTROY':
        return 'bg-red-100 text-red-800 border border-red-300'
      case 'AWAITING_TRANSFER':
        return 'bg-purple-100 text-purple-800 border border-purple-300'
      default:
        return 'bg-gray-100 text-gray-800 border border-gray-300'
    }
  }

  // Get status display name
  const getStatusDisplayName = (status) => {
    switch (status) {
      case 'REVIEW':
        return 'Review'
      case 'NEEDS_CLASSIFICATION':
        return 'Needs Classification'
      case 'DESTROY':
        return 'Destroy'
      case 'AWAITING_TRANSFER':
        return 'Awaiting Transfer'
      default:
        return status
    }
  }

  // Get action button based on document status
  const getActionButton = (document) => {
    switch (document.status) {
      case 'REVIEW':
        return (
          <button
            type="button"
            onClick={() => handleAction(document, 'mark_reviewed')}
            className="inline-flex items-center rounded-md bg-yellow-50 px-3 py-1.5 text-xs font-medium text-yellow-700 ring-1 ring-inset ring-yellow-600/20 hover:bg-yellow-100 transition-colors"
            title={t('archivist.mark_reviewed')}
          >
            <CheckCircle className="-ml-0.5 mr-1.5 h-4 w-4" />
            {t('archivist.mark_reviewed')}
          </button>
        )
      case 'NEEDS_CLASSIFICATION':
        return (
          <button
            type="button"
            onClick={() => handleAction(document, 'classify_document')}
            className="inline-flex items-center rounded-md bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-600/20 hover:bg-blue-100 transition-colors"
            title={t('archivist.confirm_release')}
          >
            <CheckCircle className="-ml-0.5 mr-1.5 h-4 w-4" />
            {t('archivist.confirm_release')}
          </button>
        )
      case 'AWAITING_TRANSFER':
        return (
          <button
            type="button"
            onClick={() => handleAction(document, 'confirm_transfer')}
            className="inline-flex items-center rounded-md bg-purple-50 px-3 py-1.5 text-xs font-medium text-purple-700 ring-1 ring-inset ring-purple-600/20 hover:bg-purple-100 transition-colors"
            title={t('archivist.add_to_transfer')}
          >
            <Archive className="-ml-0.5 mr-1.5 h-4 w-4" />
            {t('archivist.add_to_transfer')}
          </button>
        )
      case 'DESTROY':
        return (
          <button
            type="button"
            onClick={() => handleAction(document, 'confirm_destruction')}
            className="inline-flex items-center rounded-md bg-red-50 px-3 py-1.5 text-xs font-medium text-red-700 ring-1 ring-inset ring-red-600/20 hover:bg-red-100 transition-colors"
            title={t('archivist.confirm_destruction')}
          >
            <Trash2 className="-ml-0.5 mr-1.5 h-4 w-4" />
            {t('archivist.confirm_destruction')}
          </button>
        )
      default:
        return null
    }
  }

  // Render loading state
  if (isLoading) {
    return (
      <div className="loading-container h-96">
        <div className="loading-spinner"></div>
        <p className="text-gray-600 text-sm mt-2">{t('common.loading')}</p>
      </div>
    )
  }

  // Render error state
  if (error) {
    return (
      <div className="bg-white">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="text-center">
            <AlertTriangle className="mx-auto h-12 w-12 text-red-500" />
            <h2 className="mt-4 text-lg font-medium text-gray-900">Error Loading Documents</h2>
            <p className="mt-2 text-sm text-gray-500">{error}</p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="mt-4 inline-flex items-center rounded-md bg-primary px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary-dark"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="mb-8 border-b border-gray-200 pb-5">
          <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:text-3xl sm:tracking-tight">
            {t('archivist.retention_alerts')}
          </h2>
          <p className="mt-2 max-w-4xl text-sm text-gray-500">
            {t('archivist.retention_queue_description')}
          </p>
        </div>

        {/* Filters and search */}
        <div className="mb-8 grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-6 bg-gray-50 p-4 rounded-lg shadow-sm">
          {/* Search */}
          <div className="sm:col-span-2">
            <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">
              {t('archivist.search_documents')}
            </label>
            <div className="relative rounded-md shadow-sm">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                <Search className="h-5 w-5 text-gray-400" aria-hidden="true" />
              </div>
              <input
                type="text"
                name="search"
                id="search"
                className="block w-full rounded-md border-0 py-1.5 pl-10 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-primary sm:text-sm"
                placeholder={t('archivist.search_documents')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          {/* Date filter */}
          <div className="sm:col-span-1">
            <label htmlFor="date-filter" className="block text-sm font-medium text-gray-700 mb-1">
              {t('archivist.date_filter')}
            </label>
            <div className="relative rounded-md shadow-sm">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                <Calendar className="h-5 w-5 text-gray-400" aria-hidden="true" />
              </div>
              <select
                id="date-filter"
                name="date-filter"
                className="block w-full rounded-md border-0 py-1.5 pl-10 text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-primary sm:text-sm"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
              >
                <option value="all">{t('archivist.all_dates')}</option>
                <option value="overdue">{t('archivist.overdue')}</option>
                <option value="today">{t('archivist.due_today')}</option>
                <option value="this_week">{t('archivist.due_this_week')}</option>
                <option value="this_month">{t('archivist.due_this_month')}</option>
              </select>
            </div>
          </div>

          {/* Status filter */}
          <div className="sm:col-span-1">
            <label htmlFor="status-filter" className="block text-sm font-medium text-gray-700 mb-1">
              {t('archivist.status_filter')}
            </label>
            <div className="relative rounded-md shadow-sm">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                <Filter className="h-5 w-5 text-gray-400" aria-hidden="true" />
              </div>
              <select
                id="status-filter"
                name="status-filter"
                className="block w-full rounded-md border-0 py-1.5 pl-10 text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-primary sm:text-sm"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="all">{t('archivist.all_statuses')}</option>
                <option value="REVIEW">{t('archivist.status_REVIEW')}</option>
                <option value="NEEDS_CLASSIFICATION">{t('archivist.status_NEEDS_CLASSIFICATION')}</option>
                <option value="DESTROY">{t('archivist.status_DESTROY')}</option>
                <option value="AWAITING_TRANSFER">{t('archivist.status_AWAITING_TRANSFER')}</option>
              </select>
            </div>
          </div>

          {/* Sort */}
          <div className="sm:col-span-1">
            <label htmlFor="sort-by" className="block text-sm font-medium text-gray-700 mb-1">
              {t('archivist.sort_by')}
            </label>
            <div className="relative rounded-md shadow-sm">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                <ArrowUpDown className="h-5 w-5 text-gray-400" aria-hidden="true" />
              </div>
              <select
                id="sort-by"
                name="sort-by"
                className="block w-full rounded-md border-0 py-1.5 pl-10 text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-primary sm:text-sm"
                value={sortBy}
                onChange={(e) => {
                  setSortBy(e.target.value)
                  setSortDirection('asc')
                }}
              >
                <option value="dueDate">{t('archivist.sort_by_due_date')}</option>
                <option value="title">{t('archivist.sort_by_title')}</option>
                <option value="documentType">{t('archivist.sort_by_type')}</option>
                <option value="creator">{t('archivist.sort_by_creator')}</option>
                <option value="status">{t('archivist.sort_by_status')}</option>
              </select>
            </div>
          </div>

          {/* Sort direction */}
          <div className="sm:col-span-1">
            <label htmlFor="sort-direction" className="block text-sm font-medium text-gray-700 mb-1">
              {t('archivist.sort_direction')}
            </label>
            <div className="relative rounded-md shadow-sm">
              <select
                id="sort-direction"
                name="sort-direction"
                className="block w-full rounded-md border-0 py-1.5 pl-3 text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-primary sm:text-sm"
                value={sortDirection}
                onChange={(e) => setSortDirection(e.target.value)}
              >
                <option value="asc">{t('archivist.sort_ascending')}</option>
                <option value="desc">{t('archivist.sort_descending')}</option>
              </select>
            </div>
          </div>
        </div>

        {/* Documents table */}
        <div className="mt-4 flow-root">
          <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
            <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
              <div className="overflow-hidden shadow-md ring-1 ring-black ring-opacity-5 sm:rounded-lg">
                <table className="min-w-full divide-y divide-gray-300 table-fixed">
                  <thead className="bg-gray-50">
                    <tr>
                      <th
                        scope="col"
                        className="w-1/3 py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6"
                      >
                        <button
                          type="button"
                          className="group inline-flex items-center"
                          onClick={() => handleSort('title')}
                        >
                          {t('archivist.document_title')}
                          <span
                            className={`ml-2 flex-none rounded ${sortBy === 'title' ? 'bg-blue-100 text-blue-700' : 'text-gray-400 invisible group-hover:visible'}`}
                          >
                            <ArrowUpDown className="h-5 w-5" aria-hidden="true" />
                          </span>
                        </button>
                      </th>
                      <th
                        scope="col"
                        className="w-1/6 px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                      >
                        <button
                          type="button"
                          className="group inline-flex items-center"
                          onClick={() => handleSort('documentType')}
                        >
                          {t('archivist.document_type')}
                          <span
                            className={`ml-2 flex-none rounded ${sortBy === 'documentType' ? 'bg-blue-100 text-blue-700' : 'text-gray-400 invisible group-hover:visible'}`}
                          >
                            <ArrowUpDown className="h-5 w-5" aria-hidden="true" />
                          </span>
                        </button>
                      </th>
                      <th
                        scope="col"
                        className="w-1/6 px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                      >
                        <button
                          type="button"
                          className="group inline-flex items-center"
                          onClick={() => handleSort('creator')}
                        >
                          {t('archivist.document_creator')}
                          <span
                            className={`ml-2 flex-none rounded ${sortBy === 'creator' ? 'bg-blue-100 text-blue-700' : 'text-gray-400 invisible group-hover:visible'}`}
                          >
                            <ArrowUpDown className="h-5 w-5" aria-hidden="true" />
                          </span>
                        </button>
                      </th>
                      <th
                        scope="col"
                        className="w-1/12 px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                      >
                        <button
                          type="button"
                          className="group inline-flex items-center"
                          onClick={() => handleSort('dueDate')}
                        >
                          {t('archivist.due_date')}
                          <span
                            className={`ml-2 flex-none rounded ${sortBy === 'dueDate' ? 'bg-blue-100 text-blue-700' : 'text-gray-400 invisible group-hover:visible'}`}
                          >
                            <ArrowUpDown className="h-5 w-5" aria-hidden="true" />
                          </span>
                        </button>
                      </th>
                      <th
                        scope="col"
                        className="w-1/6 px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                      >
                        <button
                          type="button"
                          className="group inline-flex items-center"
                          onClick={() => handleSort('status')}
                        >
                          {t('archivist.status')}
                          <span
                            className={`ml-2 flex-none rounded ${sortBy === 'status' ? 'bg-blue-100 text-blue-700' : 'text-gray-400 invisible group-hover:visible'}`}
                          >
                            <ArrowUpDown className="h-5 w-5" aria-hidden="true" />
                          </span>
                        </button>
                      </th>
                      <th scope="col" className="w-1/12 relative py-3.5 pl-3 pr-4 sm:pr-6">
                        <span className="sr-only">{t('archivist.actions')}</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 bg-white">
                    {sortedDocuments.length === 0 ? (
                      <tr>
                        <td
                          colSpan="6"
                          className="py-10 text-center text-sm font-medium text-gray-500"
                        >
                          {t('archivist.no_documents_found')}
                        </td>
                      </tr>
                    ) : (
                      sortedDocuments.map((document) => (
                        <tr key={document.id} className="hover:bg-gray-50">
                          <td className="py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6 break-words">
                            {document.title || 'Untitled'}
                          </td>
                          <td className="px-3 py-4 text-sm text-gray-500 break-words">
                            {document.document_type || 'N/A'}
                          </td>
                          <td className="px-3 py-4 text-sm text-gray-500 break-words">
                            {document.creator_info?.creator_name || document.creator || 'N/A'}
                          </td>
                          <td className="px-3 py-4 text-sm text-gray-500">
                            <div className="flex items-center">
                              <Clock className="mr-1.5 h-4 w-4 flex-shrink-0 text-gray-400" />
                              {formatDate(document.retention_end_date || document.created_at)}
                            </div>
                          </td>
                          <td className="px-3 py-4 text-sm text-gray-500">
                            <span
                              className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${getStatusBadgeColor(document.status)}`}
                            >
                              {getStatusDisplayName(document.status)}
                            </span>
                          </td>
                          <td className="relative py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                            <div className="flex items-center justify-end space-x-2">
                              <button
                                type="button"
                                onClick={() => navigate(`/archivist/document/${document.id}`)}
                                className="rounded-full p-1 text-primary hover:bg-gray-100 hover:text-primary-dark"
                                title={t('common.view')}
                              >
                                <Eye className="h-5 w-5" />
                              </button>
                              {getActionButton(document)}
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        {/* Confirmation modal */}
        {showConfirmation && selectedDocument && (
          <div className="fixed inset-0 z-10 overflow-y-auto bg-gray-500 bg-opacity-75 transition-opacity">
            <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
              <div className="relative transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:p-6">
                <div>
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-yellow-100">
                    {selectedAction === 'mark_reviewed' || selectedAction === 'classify_document' ? (
                      <CheckCircle className="h-6 w-6 text-green-600" aria-hidden="true" />
                    ) : selectedAction === 'confirm_transfer' ? (
                      <Archive className="h-6 w-6 text-purple-600" aria-hidden="true" />
                    ) : (
                      <Trash2 className="h-6 w-6 text-red-600" aria-hidden="true" />
                    )}
                  </div>
                  <div className="mt-3 text-center sm:mt-5">
                    <h3 className="text-lg font-semibold leading-6 text-gray-900">
                      {selectedAction === 'mark_reviewed'
                        ? t('archivist.confirm_mark_reviewed')
                        : selectedAction === 'classify_document'
                        ? t('archivist.confirm_confirm_release')
                        : selectedAction === 'confirm_transfer'
                        ? t('archivist.confirm_add_to_transfer')
                        : t('archivist.confirm_confirm_destruction')}
                    </h3>
                    <div className="mt-2">
                      <p className="text-sm text-gray-500">
                        {selectedAction === 'mark_reviewed'
                          ? t('archivist.confirm_mark_reviewed_description')
                          : selectedAction === 'classify_document'
                          ? t('archivist.confirm_confirm_release_description')
                          : selectedAction === 'confirm_transfer'
                          ? t('archivist.confirm_add_to_transfer_description')
                          : t('archivist.confirm_confirm_destruction_description')}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="mt-5 sm:mt-6 sm:grid sm:grid-flow-row-dense sm:grid-cols-2 sm:gap-3">
                  <button
                    type="button"
                    className="inline-flex w-full justify-center rounded-md bg-primary px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary-dark focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary sm:col-start-2 transition-colors"
                    onClick={() => handleConfirmation(true)}
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                        {t('archivist.submitting')}
                      </>
                    ) : (
                      t('archivist.confirm')
                    )}
                  </button>
                  <button
                    type="button"
                    className="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:col-start-1 sm:mt-0 transition-colors"
                    onClick={() => handleConfirmation(false)}
                    disabled={isSubmitting}
                  >
                    {t('archivist.cancel')}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default RetentionQueuePage