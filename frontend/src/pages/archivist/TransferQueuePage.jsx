import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../../hooks/useAuth'
import {
  Calendar,
  Search,
  Filter,
  ArrowUpDown,
  Archive,
  CheckCircle,
  Eye,
  Download,
  FileText,
  FileDown,
  FileUp,
  FileCheck,
  AlertTriangle,
  Printer,
  Clock,
} from 'lucide-react'

function TransferQueuePage() {
  const { t } = useTranslation()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [isLoading, setIsLoading] = useState(true)
  const [documents, setDocuments] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')
  const [sortBy, setSortBy] = useState('addedDate')
  const [sortDirection, setSortDirection] = useState('desc')
  const [showExportModal, setShowExportModal] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const [exportSuccess, setExportSuccess] = useState(false)
  const [selectedDocuments, setSelectedDocuments] = useState([])
  const [selectAll, setSelectAll] = useState(false)

  // Get status badge color based on status
  const getStatusBadgeColor = (status) => {
    switch (status) {
      case 'transfer_queue':
        return 'bg-blue-100 text-blue-800'
      case 'archived':
        return 'bg-green-100 text-green-800'
      case 'pending':
        return 'bg-yellow-100 text-yellow-800'
      case 'rejected':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  // Get action button based on document status
  const getActionButton = (document) => {
    switch (document.status) {
      case 'transfer_queue':
        return (
          <button
            type="button"
            onClick={() => alert(t('archivist.transfer_document_alert'))}
            className="rounded-full p-1 text-blue-600 hover:bg-blue-100"
            title={t('archivist.transfer')}
          >
            <Archive className="h-5 w-5" />
          </button>
        )
      default:
        return null
    }
  }

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
            title: 'Hotărâre privind aprobarea bugetului local pe anul 2020',
            documentType: 'hotarare',
            documentTypeName: 'Hotărâre',
            creator: 'Consiliul Local',
            creationDate: '2020-01-15',
            uploadDate: '2020-01-20',
            addedDate: '2023-07-10',
            uploadedBy: 'Ion Popescu',
            status: 'transfer_queue',
            statusName: t('archivist.status_transfer_queue'),
            retentionCategory: 'c',
            retentionYears: '10',
            retentionEndDate: '2030-01-15',
            confidentiality: 'public',
            fileCount: 2,
            totalSize: 3245678,
          },
          {
            id: '2',
            title: 'Contract de achiziție publică pentru servicii de mentenanță 2019',
            documentType: 'contract',
            documentTypeName: 'Contract',
            creator: 'Direcția Achiziții Publice',
            creationDate: '2019-10-20',
            uploadDate: '2019-10-22',
            addedDate: '2023-07-12',
            uploadedBy: 'Maria Popescu',
            status: 'transfer_queue',
            statusName: t('archivist.status_transfer_queue'),
            retentionCategory: 'cf',
            retentionYears: '3',
            retentionEndDate: '2022-10-20',
            confidentiality: 'internal',
            fileCount: 3,
            totalSize: 5478932,
          },
          {
            id: '3',
            title: 'Autorizație de construire nr. 123/2018',
            documentType: 'autorizatie',
            documentTypeName: 'Autorizație',
            creator: 'Direcția Urbanism',
            creationDate: '2018-05-10',
            uploadDate: '2018-05-15',
            addedDate: '2023-07-15',
            uploadedBy: 'Ana Ionescu',
            status: 'transfer_queue',
            statusName: t('archivist.status_transfer_queue'),
            retentionCategory: 'cs',
            retentionYears: '30',
            retentionEndDate: '2048-05-10',
            confidentiality: 'public',
            fileCount: 1,
            totalSize: 2345678,
          },
          {
            id: '4',
            title: 'Proces verbal de recepție lucrări de renovare sediu primărie 2019',
            documentType: 'proces_verbal',
            documentTypeName: 'Proces-verbal',
            creator: 'Direcția Tehnică',
            creationDate: '2019-08-15',
            uploadDate: '2019-08-20',
            addedDate: '2023-07-18',
            uploadedBy: 'Mihai Dumitrescu',
            status: 'transfer_queue',
            statusName: t('archivist.status_transfer_queue'),
            retentionCategory: 'cf',
            retentionYears: '3',
            retentionEndDate: '2022-08-15',
            confidentiality: 'internal',
            fileCount: 2,
            totalSize: 1245678,
          },
          {
            id: '5',
            title: 'Raport de activitate anual 2019 - Direcția de Asistență Socială',
            documentType: 'raport',
            documentTypeName: 'Raport',
            creator: 'Direcția de Asistență Socială',
            creationDate: '2020-01-30',
            uploadDate: '2020-02-05',
            addedDate: '2023-07-20',
            uploadedBy: 'Elena Stanciu',
            status: 'transfer_queue',
            statusName: t('archivist.status_transfer_queue'),
            retentionCategory: 'c',
            retentionYears: '10',
            retentionEndDate: '2030-01-30',
            confidentiality: 'public',
            fileCount: 1,
            totalSize: 3456789,
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

  // Effect to handle select all checkbox
  useEffect(() => {
    if (selectAll) {
      setSelectedDocuments(filteredDocuments.map((doc) => doc.id))
    } else if (selectedDocuments.length === filteredDocuments.length) {
      // If all documents are selected but selectAll is false, update selectAll
      setSelectAll(true)
    }
  }, [selectAll])

  // Filter documents based on search term and type filter
  const filteredDocuments = documents.filter((document) => {
    // Search filter
    const matchesSearch =
      document.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      document.creator.toLowerCase().includes(searchTerm.toLowerCase()) ||
      document.documentTypeName.toLowerCase().includes(searchTerm.toLowerCase())

    // Type filter
    const matchesType = typeFilter === 'all' || document.documentType === typeFilter

    return matchesSearch && matchesType
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
    } else if (sortBy === 'addedDate') {
      comparison = new Date(a.addedDate) - new Date(b.addedDate)
    } else if (sortBy === 'retentionEndDate') {
      comparison = new Date(a.retentionEndDate) - new Date(b.retentionEndDate)
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

  // Handle document selection
  const handleSelectDocument = (documentId) => {
    setSelectedDocuments((prev) => {
      if (prev.includes(documentId)) {
        // If document is already selected, remove it
        const newSelected = prev.filter((id) => id !== documentId)
        // Update selectAll state
        if (newSelected.length === 0) {
          setSelectAll(false)
        }
        return newSelected
      } else {
        // If document is not selected, add it
        const newSelected = [...prev, documentId]
        // Update selectAll state
        if (newSelected.length === filteredDocuments.length) {
          setSelectAll(true)
        }
        return newSelected
      }
    })
  }

  // Handle select all
  const handleSelectAll = () => {
    setSelectAll(!selectAll)
    if (!selectAll) {
      // Select all documents
      setSelectedDocuments(filteredDocuments.map((doc) => doc.id))
    } else {
      // Deselect all documents
      setSelectedDocuments([])
    }
  }

  // Handle export
  const handleExport = () => {
    if (selectedDocuments.length === 0) {
      // If no documents are selected, show an alert
      alert(t('archivist.no_documents_selected'))
      return
    }

    setShowExportModal(true)
  }

  // Handle export confirmation
  const handleExportConfirmation = async (confirmed) => {
    if (!confirmed) {
      setShowExportModal(false)
      return
    }

    setIsExporting(true)
    try {
      // In a real app, this would be an API call to export the documents
      // For the hackathon, we'll simulate a successful export
      await new Promise((resolve) => setTimeout(resolve, 2000))

      // Set export success
      setExportSuccess(true)

      // After 3 seconds, close the modal and reset the state
      setTimeout(() => {
        setShowExportModal(false)
        setIsExporting(false)
        setExportSuccess(false)
        // In a real app, we might want to remove the exported documents from the list
        // or mark them as exported
      }, 3000)
    } catch (error) {
      console.error('Error exporting documents:', error)
      setIsExporting(false)
    }
  }

  // Format date for display
  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleDateString()
  }

  // Format file size for display
  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  // Get document types for filter
  const documentTypes = [
    { id: 'hotarare', name: 'Hotărâre' },
    { id: 'dispozitie', name: 'Dispoziție' },
    { id: 'contract', name: 'Contract' },
    { id: 'autorizatie', name: 'Autorizație' },
    { id: 'certificat', name: 'Certificat' },
    { id: 'adresa', name: 'Adresă' },
    { id: 'raport', name: 'Raport' },
    { id: 'proces_verbal', name: 'Proces-verbal' },
  ]

  // Render loading state
  if (isLoading) {
    return (
      <div className="flex h-96 items-center justify-center bg-white">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-gray-200 border-t-primary"></div>
          <p className="mt-4 text-lg font-medium text-gray-700">{t('common.loading')}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="mb-8 border-b border-gray-200 pb-5">
          <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:text-3xl sm:tracking-tight">
            {t('archivist.transfer_queue')}
          </h2>
          <p className="mt-2 max-w-4xl text-sm text-gray-500">
            {t('archivist.transfer_queue_description')}
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

          {/* Type filter */}
          <div className="sm:col-span-2">
            <label htmlFor="type-filter" className="block text-sm font-medium text-gray-700 mb-1">
              {t('archivist.type_filter')}
            </label>
            <div className="relative rounded-md shadow-sm">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                <Filter className="h-5 w-5 text-gray-400" aria-hidden="true" />
              </div>
              <select
                id="type-filter"
                name="type-filter"
                className="block w-full rounded-md border-0 py-1.5 pl-10 text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-primary sm:text-sm"
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
              >
                <option value="all">{t('archivist.all_types')}</option>
                {documentTypes.map((type) => (
                  <option key={type.id} value={type.id}>
                    {type.name}
                  </option>
                ))}
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
                <option value="addedDate">{t('archivist.sort_by_added_date')}</option>
                <option value="title">{t('archivist.sort_by_title')}</option>
                <option value="documentType">{t('archivist.sort_by_type')}</option>
                <option value="creator">{t('archivist.sort_by_creator')}</option>
                <option value="retentionEndDate">{t('archivist.sort_by_retention_end')}</option>
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

        {/* Documents table */}
        <div className="mt-4 flow-root">
          <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
            <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
              <div className="overflow-hidden shadow-md ring-1 ring-black ring-opacity-5 sm:rounded-lg">
                <table className="min-w-full divide-y divide-gray-300">
                  <thead className="bg-gray-50">
                    <tr>
                      <th
                        scope="col"
                        className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6"
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
                          className="group inline-flex items-center"
                          onClick={() => handleSort('documentType')}
                        >
                          {t('archivist.document_type')}
                          <span
                            className={`ml-2 flex-none rounded ${sortBy === 'documentType' ? 'bg-blue-100 text-blue-700' : 'text-gray-400 invisible group-hover:visible'}`}
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
                          className="group inline-flex items-center"
                          onClick={() => handleSort('creator')}
                        >
                          {t('archivist.document_creator')}
                          <span
                            className={`ml-2 flex-none rounded ${sortBy === 'creator' ? 'bg-blue-100 text-blue-700' : 'text-gray-400 invisible group-hover:visible'}`}
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
                          className="group inline-flex items-center"
                          onClick={() => handleSort('dueDate')}
                        >
                          {t('archivist.due_date')}
                          <span
                            className={`ml-2 flex-none rounded ${sortBy === 'dueDate' ? 'bg-blue-100 text-blue-700' : 'text-gray-400 invisible group-hover:visible'}`}
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
                          className="group inline-flex items-center"
                          onClick={() => handleSort('status')}
                        >
                          {t('archivist.status')}
                          <span
                            className={`ml-2 flex-none rounded ${sortBy === 'status' ? 'bg-blue-100 text-blue-700' : 'text-gray-400 invisible group-hover:visible'}`}
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
                        <tr key={document.id} className="hover:bg-gray-50">
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
                              className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${getStatusBadgeColor(document.status)}`}
                            >
                              {document.statusName}
                            </span>
                          </td>
                          <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                            <div className="flex items-center justify-end space-x-2">
                              <button
                                type="button"
                                onClick={() => navigate(`/dashboard/archivist/document/${document.id}`)}
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

        {/* Export modal */}
        {showExportModal && (
          <div className="fixed inset-0 z-10 overflow-y-auto bg-gray-500 bg-opacity-75 transition-opacity">
            <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
              <div className="relative transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:p-6">
                {!exportSuccess ? (
                  <>
                    <div>
                      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-yellow-100">
                        <Archive className="h-6 w-6 text-yellow-600" aria-hidden="true" />
                      </div>
                      <div className="mt-3 text-center sm:mt-5">
                        <h3 className="text-lg font-semibold leading-6 text-gray-900">
                        {t('archivist.confirm_export')}
                      </h3>
                        <div className="mt-2">
                          <p className="text-sm text-gray-500">
                            {t('archivist.confirm_export_description', {
                              count: selectedDocuments.length,
                            })}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="mt-5 sm:mt-6 sm:grid sm:grid-flow-row-dense sm:grid-cols-2 sm:gap-3">
                      <button
                        type="button"
                        className="inline-flex w-full justify-center rounded-md bg-primary px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary-dark focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary sm:col-start-2 transition-colors"
                        onClick={() => handleExportConfirmation(true)}
                        disabled={isExporting}
                      >
                        {isExporting ? (
                          <>
                            <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                            {t('archivist.exporting')}
                          </>
                        ) : (
                          t('archivist.confirm')
                        )}
                      </button>
                      <button
                        type="button"
                        className="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:col-start-1 sm:mt-0 transition-colors"
                        onClick={() => handleExportConfirmation(false)}
                        disabled={isExporting}
                      >
                        {t('archivist.cancel')}
                      </button>
                    </div>
                  </>
                ) : (
                  <div>
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
                      <CheckCircle className="h-6 w-6 text-green-600" aria-hidden="true" />
                    </div>
                    <div className="mt-3 text-center sm:mt-5">
                      <h3 className="text-lg font-semibold leading-6 text-gray-900">
                        {t('archivist.export_success')}
                      </h3>
                      <div className="mt-2">
                        <p className="text-sm text-gray-500">
                          {t('archivist.export_success_description')}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default TransferQueuePage