import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../../hooks/useAuth'
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

  // Mock data for documents
  useEffect(() => {
    // In a real app, this would be an API call to fetch documents
    const fetchDocuments = async () => {
      setIsLoading(true)
      try {
        // Simulate API call delay
        await new Promise((resolve) => setTimeout(resolve, 1000))

        // Mock data
        const mockDocuments = [
          {
            id: '1',
            title: 'Hotărâre privind aprobarea bugetului local pe anul 2023',
            documentType: 'hotarare',
            documentTypeName: 'Hotărâre',
            creator: 'Consiliul Local',
            creationDate: '2023-01-15',
            uploadDate: '2023-01-20',
            uploadedBy: 'Ion Popescu',
            status: 'due_for_review',
            statusName: t('archivist.status_due_for_review'),
            retentionCategory: 'c',
            retentionYears: '10',
            retentionEndDate: '2033-01-15',
            dueDate: '2023-07-15',
            confidentiality: 'public',
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
            status: 'due_for_release',
            statusName: t('archivist.status_due_for_release'),
            retentionCategory: 'cf',
            retentionYears: '3',
            retentionEndDate: '2025-10-20',
            dueDate: '2023-07-22',
            confidentiality: 'internal',
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
            status: 'due_for_transfer',
            statusName: t('archivist.status_due_for_transfer'),
            retentionCategory: 'cs',
            retentionYears: '30',
            retentionEndDate: '2050-05-10',
            dueDate: '2023-07-10',
            confidentiality: 'public',
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
            status: 'due_for_destruction',
            statusName: t('archivist.status_due_for_destruction'),
            retentionCategory: 'cf',
            retentionYears: '3',
            retentionEndDate: '2023-08-15',
            dueDate: '2023-07-15',
            confidentiality: 'internal',
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
            status: 'due_for_review',
            statusName: t('archivist.status_due_for_review'),
            retentionCategory: 'c',
            retentionYears: '10',
            retentionEndDate: '2033-01-30',
            dueDate: '2023-08-05',
            confidentiality: 'public',
          },
        ]

        setDocuments(mockDocuments)
      } catch (error) {
        console.error('Error fetching documents:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchDocuments()
  }, [])

  // Filter documents based on search term, date filter, and status filter
  const filteredDocuments = documents.filter((document) => {
    // Search filter
    const matchesSearch =
      document.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      document.creator.toLowerCase().includes(searchTerm.toLowerCase()) ||
      document.documentTypeName.toLowerCase().includes(searchTerm.toLowerCase())

    // Date filter
    let matchesDate = true
    const today = new Date()
    const dueDate = new Date(document.dueDate)
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

    // Status filter
    const matchesStatus = statusFilter === 'all' || document.status === statusFilter

    return matchesSearch && matchesDate && matchesStatus
  })

  // Sort documents
  const sortedDocuments = [...filteredDocuments].sort((a, b) => {
    let comparison = 0

    if (sortBy === 'title') {
      comparison = a.title.localeCompare(b.title)
    } else if (sortBy === 'documentType') {
      comparison = a.documentTypeName.localeCompare(b.documentTypeName)
    } else if (sortBy === 'creator') {
      comparison = a.creator.localeCompare(b.creator)
    } else if (sortBy === 'dueDate') {
      comparison = new Date(a.dueDate) - new Date(b.dueDate)
    } else if (sortBy === 'status') {
      comparison = a.statusName.localeCompare(b.statusName)
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
      // In a real app, this would be an API call to perform the action
      // For the hackathon, we'll simulate a successful action
      await new Promise((resolve) => setTimeout(resolve, 1500))

      // Update the document status based on the action
      const updatedDocuments = documents.map((doc) => {
        if (doc.id === selectedDocument.id) {
          let newStatus = doc.status
          let newStatusName = doc.statusName

          if (selectedAction === 'mark_reviewed') {
            newStatus = 'reviewed'
            newStatusName = t('archivist.status_reviewed')
          } else if (selectedAction === 'confirm_release') {
            newStatus = 'released'
            newStatusName = t('archivist.status_released')
          } else if (selectedAction === 'add_to_transfer') {
            newStatus = 'transfer_queue'
            newStatusName = t('archivist.status_transfer_queue')
          } else if (selectedAction === 'confirm_destruction') {
            newStatus = 'destroyed'
            newStatusName = t('archivist.status_destroyed')
          }

          return {
            ...doc,
            status: newStatus,
            statusName: newStatusName,
          }
        }
        return doc
      })

      setDocuments(updatedDocuments)
      setShowConfirmation(false)
      setSelectedDocument(null)
      setSelectedAction(null)
    } catch (error) {
      console.error('Error performing action:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  // Format date for display
  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleDateString()
  }

  // Get status badge color
  const getStatusBadgeColor = (status) => {
    switch (status) {
      case 'due_for_review':
        return 'bg-yellow-100 text-yellow-800'
      case 'due_for_release':
        return 'bg-blue-100 text-blue-800'
      case 'due_for_transfer':
        return 'bg-purple-100 text-purple-800'
      case 'due_for_destruction':
        return 'bg-red-100 text-red-800'
      case 'reviewed':
        return 'bg-green-100 text-green-800'
      case 'released':
        return 'bg-green-100 text-green-800'
      case 'transfer_queue':
        return 'bg-indigo-100 text-indigo-800'
      case 'destroyed':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  // Get action button based on document status
  const getActionButton = (document) => {
    switch (document.status) {
      case 'due_for_review':
        return (
          <button
            type="button"
            onClick={() => handleAction(document, 'mark_reviewed')}
            className="inline-flex items-center rounded-md bg-yellow-50 px-2 py-1 text-xs font-medium text-yellow-700 ring-1 ring-inset ring-yellow-600/20 hover:bg-yellow-100"
          >
            <CheckCircle className="-ml-0.5 mr-1.5 h-4 w-4" />
            {t('archivist.mark_reviewed')}
          </button>
        )
      case 'due_for_release':
        return (
          <button
            type="button"
            onClick={() => handleAction(document, 'confirm_release')}
            className="inline-flex items-center rounded-md bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-600/20 hover:bg-blue-100"
          >
            <CheckCircle className="-ml-0.5 mr-1.5 h-4 w-4" />
            {t('archivist.confirm_release')}
          </button>
        )
      case 'due_for_transfer':
        return (
          <button
            type="button"
            onClick={() => handleAction(document, 'add_to_transfer')}
            className="inline-flex items-center rounded-md bg-purple-50 px-2 py-1 text-xs font-medium text-purple-700 ring-1 ring-inset ring-purple-600/20 hover:bg-purple-100"
          >
            <Archive className="-ml-0.5 mr-1.5 h-4 w-4" />
            {t('archivist.add_to_transfer')}
          </button>
        )
      case 'due_for_destruction':
        return (
          <button
            type="button"
            onClick={() => handleAction(document, 'confirm_destruction')}
            className="inline-flex items-center rounded-md bg-red-50 px-2 py-1 text-xs font-medium text-red-700 ring-1 ring-inset ring-red-600/20 hover:bg-red-100"
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
      <div className="flex h-96 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="bg-white">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:text-3xl sm:tracking-tight">
            {t('archivist.retention_queue')}
          </h2>
          <p className="mt-2 max-w-4xl text-sm text-gray-500">
            {t('archivist.retention_queue_description')}
          </p>
        </div>

        {/* Filters and search */}
        <div className="mb-8 grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-6">
          {/* Search */}
          <div className="sm:col-span-2">
            <div className="relative mt-2 rounded-md shadow-sm">
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
            <label htmlFor="date-filter" className="sr-only">
              {t('archivist.date_filter')}
            </label>
            <div className="relative mt-2 rounded-md shadow-sm">
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
            <label htmlFor="status-filter" className="sr-only">
              {t('archivist.status_filter')}
            </label>
            <div className="relative mt-2 rounded-md shadow-sm">
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
                <option value="due_for_review">{t('archivist.status_due_for_review')}</option>
                <option value="due_for_release">{t('archivist.status_due_for_release')}</option>
                <option value="due_for_transfer">{t('archivist.status_due_for_transfer')}</option>
                <option value="due_for_destruction">{t('archivist.status_due_for_destruction')}</option>
              </select>
            </div>
          </div>

          {/* Sort */}
          <div className="sm:col-span-1">
            <label htmlFor="sort-by" className="sr-only">
              {t('archivist.sort_by')}
            </label>
            <div className="relative mt-2 rounded-md shadow-sm">
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
            <label htmlFor="sort-direction" className="sr-only">
              {t('archivist.sort_direction')}
            </label>
            <div className="relative mt-2 rounded-md shadow-sm">
              <select
                id="sort-direction"
                name="sort-direction"
                className="block w-full rounded-md border-0 py-1.5 text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-primary sm:text-sm"
                value={sortDirection}
                onChange={(e) => setSortDirection(e.target.value)}
              >
                <option value="asc">{t('archivist.sort_ascending')}</option>
                <option value="desc">{t('archivist.sort_descending')}</option>
              </select>
            </div>
          </div>
        </div>

        {/* Results count */}
        <div className="mb-4 text-sm text-gray-500">
          {t('archivist.showing_results', { count: sortedDocuments.length })}
        </div>

        {/* Documents table */}
        <div className="mt-8 flow-root">
          <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
            <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
              <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg">
                <table className="min-w-full divide-y divide-gray-300">
                  <thead className="bg-gray-50">
                    <tr>
                      <th
                        scope="col"
                        className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6"
                      >
                        <button
                          type="button"
                          className="group inline-flex"
                          onClick={() => handleSort('title')}
                        >
                          {t('archivist.document_title')}
                          <span
                            className={`ml-2 flex-none rounded ${sortBy === 'title' ? 'bg-gray-200 text-gray-900' : 'text-gray-400 invisible group-hover:visible'}`}
                          >
                            {sortBy === 'title' && sortDirection === 'asc' ? (
                              <ArrowUpDown className="h-5 w-5" aria-hidden="true" />
                            ) : (
                              <ArrowUpDown className="h-5 w-5" aria-hidden="true" />
                            )}
                          </span>
                        </button>
                      </th>
                      <th
                        scope="col"
                        className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                      >
                        <button
                          type="button"
                          className="group inline-flex"
                          onClick={() => handleSort('documentType')}
                        >
                          {t('archivist.document_type')}
                          <span
                            className={`ml-2 flex-none rounded ${sortBy === 'documentType' ? 'bg-gray-200 text-gray-900' : 'text-gray-400 invisible group-hover:visible'}`}
                          >
                            {sortBy === 'documentType' && sortDirection === 'asc' ? (
                              <ArrowUpDown className="h-5 w-5" aria-hidden="true" />
                            ) : (
                              <ArrowUpDown className="h-5 w-5" aria-hidden="true" />
                            )}
                          </span>
                        </button>
                      </th>
                      <th
                        scope="col"
                        className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                      >
                        <button
                          type="button"
                          className="group inline-flex"
                          onClick={() => handleSort('creator')}
                        >
                          {t('archivist.document_creator')}
                          <span
                            className={`ml-2 flex-none rounded ${sortBy === 'creator' ? 'bg-gray-200 text-gray-900' : 'text-gray-400 invisible group-hover:visible'}`}
                          >
                            {sortBy === 'creator' && sortDirection === 'asc' ? (
                              <ArrowUpDown className="h-5 w-5" aria-hidden="true" />
                            ) : (
                              <ArrowUpDown className="h-5 w-5" aria-hidden="true" />
                            )}
                          </span>
                        </button>
                      </th>
                      <th
                        scope="col"
                        className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                      >
                        <button
                          type="button"
                          className="group inline-flex"
                          onClick={() => handleSort('dueDate')}
                        >
                          {t('archivist.due_date')}
                          <span
                            className={`ml-2 flex-none rounded ${sortBy === 'dueDate' ? 'bg-gray-200 text-gray-900' : 'text-gray-400 invisible group-hover:visible'}`}
                          >
                            {sortBy === 'dueDate' && sortDirection === 'asc' ? (
                              <ArrowUpDown className="h-5 w-5" aria-hidden="true" />
                            ) : (
                              <ArrowUpDown className="h-5 w-5" aria-hidden="true" />
                            )}
                          </span>
                        </button>
                      </th>
                      <th
                        scope="col"
                        className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                      >
                        <button
                          type="button"
                          className="group inline-flex"
                          onClick={() => handleSort('status')}
                        >
                          {t('archivist.status')}
                          <span
                            className={`ml-2 flex-none rounded ${sortBy === 'status' ? 'bg-gray-200 text-gray-900' : 'text-gray-400 invisible group-hover:visible'}`}
                          >
                            {sortBy === 'status' && sortDirection === 'asc' ? (
                              <ArrowUpDown className="h-5 w-5" aria-hidden="true" />
                            ) : (
                              <ArrowUpDown className="h-5 w-5" aria-hidden="true" />
                            )}
                          </span>
                        </button>
                      </th>
                      <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6">
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
                        <tr key={document.id}>
                          <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
                            {document.title}
                          </td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                            {document.documentTypeName}
                          </td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                            {document.creator}
                          </td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                            <div className="flex items-center">
                              <Clock className="mr-1.5 h-4 w-4 text-gray-400" />
                              {formatDate(document.dueDate)}
                            </div>
                          </td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                            <span
                              className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ${getStatusBadgeColor(document.status)}`}
                            >
                              {document.statusName}
                            </span>
                          </td>
                          <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                            <div className="flex items-center justify-end space-x-2">
                              <button
                                type="button"
                                onClick={() => navigate(`/dashboard/archivist/document/${document.id}`)}
                                className="text-primary hover:text-primary-dark"
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
          <div className="fixed inset-0 z-10 overflow-y-auto">
            <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
              <div className="relative transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:p-6">
                <div>
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-yellow-100">
                    {selectedAction === 'mark_reviewed' || selectedAction === 'confirm_release' ? (
                      <CheckCircle className="h-6 w-6 text-green-600" aria-hidden="true" />
                    ) : selectedAction === 'add_to_transfer' ? (
                      <Archive className="h-6 w-6 text-purple-600" aria-hidden="true" />
                    ) : (
                      <Trash2 className="h-6 w-6 text-red-600" aria-hidden="true" />
                    )}
                  </div>
                  <div className="mt-3 text-center sm:mt-5">
                    <h3 className="text-base font-semibold leading-6 text-gray-900">
                      {selectedAction === 'mark_reviewed'
                        ? t('archivist.confirm_mark_reviewed')
                        : selectedAction === 'confirm_release'
                        ? t('archivist.confirm_confirm_release')
                        : selectedAction === 'add_to_transfer'
                        ? t('archivist.confirm_add_to_transfer')
                        : t('archivist.confirm_confirm_destruction')}
                    </h3>
                    <div className="mt-2">
                      <p className="text-sm text-gray-500">
                        {selectedAction === 'mark_reviewed'
                          ? t('archivist.confirm_mark_reviewed_description')
                          : selectedAction === 'confirm_release'
                          ? t('archivist.confirm_confirm_release_description')
                          : selectedAction === 'add_to_transfer'
                          ? t('archivist.confirm_add_to_transfer_description')
                          : t('archivist.confirm_confirm_destruction_description')}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="mt-5 sm:mt-6 sm:grid sm:grid-flow-row-dense sm:grid-cols-2 sm:gap-3">
                  <button
                    type="button"
                    className="inline-flex w-full justify-center rounded-md bg-primary px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary-dark focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary sm:col-start-2"
                    onClick={() => handleConfirmation(true)}
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? t('archivist.submitting') : t('archivist.confirm')}
                  </button>
                  <button
                    type="button"
                    className="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:col-start-1 sm:mt-0"
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