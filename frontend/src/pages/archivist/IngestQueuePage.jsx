import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import {
  Search,
  Filter,
  FileText,
  Eye,
  Clock,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Calendar,
  User,
} from 'lucide-react'

function IngestQueuePage() {
  const { t } = useTranslation()
  const { user } = useAuth()
  const [isLoading, setIsLoading] = useState(true)
  const [documents, setDocuments] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [dateFilter, setDateFilter] = useState('all')
  const [typeFilter, setTypeFilter] = useState('all')
  const [sortBy, setSortBy] = useState('date_desc')

  // Date options for filtering
  const dateOptions = [
    { id: 'all', name: t('archivist.filter_all_dates') },
    { id: 'today', name: t('archivist.filter_today') },
    { id: 'this_week', name: t('archivist.filter_this_week') },
    { id: 'this_month', name: t('archivist.filter_this_month') },
  ]

  // Document type options for filtering
  const typeOptions = [
    { id: 'all', name: t('archivist.filter_all_types') },
    { id: 'hotarare', name: 'Hotărâre' },
    { id: 'dispozitie', name: 'Dispoziție' },
    { id: 'contract', name: 'Contract' },
    { id: 'autorizatie', name: 'Autorizație' },
    { id: 'certificat', name: 'Certificat' },
    { id: 'adresa', name: 'Adresă' },
    { id: 'raport', name: 'Raport' },
    { id: 'proces_verbal', name: 'Proces-verbal' },
  ]

  // Sort options
  const sortOptions = [
    { id: 'date_desc', name: t('archivist.sort_newest') },
    { id: 'date_asc', name: t('archivist.sort_oldest') },
    { id: 'title_asc', name: t('archivist.sort_title_az') },
    { id: 'title_desc', name: t('archivist.sort_title_za') },
  ]

  // Mock data for documents
  useEffect(() => {
    // In a real app, this would be an API call to fetch documents in the ingest queue
    const fetchDocuments = async () => {
      setIsLoading(true)
      try {
        // Simulate API call delay
        await new Promise((resolve) => setTimeout(resolve, 1000))

        // Mock data
        const mockDocuments = [
          {
            id: '1',
            title: 'Contract de achiziție publică pentru servicii de mentenanță',
            documentType: 'contract',
            documentTypeName: 'Contract',
            creationDate: '2023-10-20',
            uploadDate: '2023-10-22',
            uploadedBy: 'Maria Popescu',
            status: 'registered',
            retentionCategory: 'c',
            confidentiality: 'internal',
          },
          {
            id: '2',
            title: 'Dispoziție privind constituirea comisiei de inventariere',
            documentType: 'dispozitie',
            documentTypeName: 'Dispoziție',
            creationDate: '2023-11-01',
            uploadDate: '2023-11-02',
            uploadedBy: 'Ion Ionescu',
            status: 'registered',
            retentionCategory: 'ci',
            confidentiality: 'internal',
          },
          {
            id: '3',
            title: 'Certificat de urbanism pentru construire locuință',
            documentType: 'certificat',
            documentTypeName: 'Certificat',
            creationDate: '2023-09-10',
            uploadDate: '2023-09-12',
            uploadedBy: 'Ana Popescu',
            status: 'registered',
            retentionCategory: 'cs',
            confidentiality: 'public',
          },
          {
            id: '4',
            title: 'Autorizație de construire pentru imobil rezidențial',
            documentType: 'autorizatie',
            documentTypeName: 'Autorizație',
            creationDate: '2023-11-10',
            uploadDate: '2023-11-12',
            uploadedBy: 'Mihai Popa',
            status: 'registered',
            retentionCategory: 'cs',
            confidentiality: 'public',
          },
          {
            id: '5',
            title: 'Proces-verbal de recepție lucrări de infrastructură',
            documentType: 'proces_verbal',
            documentTypeName: 'Proces-verbal',
            creationDate: '2023-11-15',
            uploadDate: '2023-11-16',
            uploadedBy: 'Elena Dumitrescu',
            status: 'registered',
            retentionCategory: 'c',
            confidentiality: 'internal',
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

  // Filter and sort documents
  const filteredDocuments = documents.filter((doc) => {
    // Search term filter
    const matchesSearch =
      searchTerm === '' ||
      doc.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.documentTypeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.uploadedBy.toLowerCase().includes(searchTerm.toLowerCase())

    // Type filter
    const matchesType = typeFilter === 'all' || doc.documentType === typeFilter

    // Date filter
    let matchesDate = true
    const uploadDate = new Date(doc.uploadDate)
    const today = new Date()
    const thisWeekStart = new Date(today.getFullYear(), today.getMonth(), today.getDate() - today.getDay())
    const thisMonthStart = new Date(today.getFullYear(), today.getMonth(), 1)

    if (dateFilter === 'today') {
      matchesDate =
        uploadDate.getDate() === today.getDate() &&
        uploadDate.getMonth() === today.getMonth() &&
        uploadDate.getFullYear() === today.getFullYear()
    } else if (dateFilter === 'this_week') {
      matchesDate = uploadDate >= thisWeekStart
    } else if (dateFilter === 'this_month') {
      matchesDate = uploadDate >= thisMonthStart
    }

    return matchesSearch && matchesType && matchesDate
  })

  // Sort documents
  const sortedDocuments = [...filteredDocuments].sort((a, b) => {
    if (sortBy === 'date_desc') {
      return new Date(b.uploadDate) - new Date(a.uploadDate)
    } else if (sortBy === 'date_asc') {
      return new Date(a.uploadDate) - new Date(b.uploadDate)
    } else if (sortBy === 'title_asc') {
      return a.title.localeCompare(b.title)
    } else if (sortBy === 'title_desc') {
      return b.title.localeCompare(a.title)
    }
    return 0
  })

  // Get status badge color and icon
  const getStatusBadge = (status) => {
    switch (status) {
      case 'registered':
        return {
          color: 'bg-blue-50 text-blue-700 ring-blue-600/20',
          icon: <Clock className="mr-1 h-4 w-4" />,
        }
      case 'pending_review':
        return {
          color: 'bg-yellow-50 text-yellow-700 ring-yellow-600/20',
          icon: <Clock className="mr-1 h-4 w-4" />,
        }
      case 'approved':
        return {
          color: 'bg-green-50 text-green-700 ring-green-600/20',
          icon: <CheckCircle className="mr-1 h-4 w-4" />,
        }
      case 'rejected':
        return {
          color: 'bg-red-50 text-red-700 ring-red-600/20',
          icon: <XCircle className="mr-1 h-4 w-4" />,
        }
      default:
        return {
          color: 'bg-gray-50 text-gray-700 ring-gray-600/20',
          icon: <AlertTriangle className="mr-1 h-4 w-4" />,
        }
    }
  }

  // Format date for display
  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleDateString()
  }

  return (
    <div className="bg-white">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="sm:flex sm:items-center">
          <div className="sm:flex-auto">
            <h1 className="text-2xl font-semibold leading-6 text-gray-900">
              {t('archivist.ingest_queue')}
            </h1>
            <p className="mt-2 text-sm text-gray-700">{t('archivist.ingest_queue_description')}</p>
          </div>
        </div>

        {/* Search and filters */}
        <div className="mt-8 sm:flex sm:items-center">
          <div className="relative flex-grow">
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

          <div className="mt-4 flex sm:ml-4 sm:mt-0">
            <div className="relative flex-grow">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                <Calendar className="h-5 w-5 text-gray-400" aria-hidden="true" />
              </div>
              <select
                id="date-filter"
                name="date-filter"
                className="block w-full rounded-md border-0 py-1.5 pl-10 pr-10 text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-primary sm:text-sm"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
              >
                {dateOptions.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="relative ml-4 flex-grow">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                <FileText className="h-5 w-5 text-gray-400" aria-hidden="true" />
              </div>
              <select
                id="type-filter"
                name="type-filter"
                className="block w-full rounded-md border-0 py-1.5 pl-10 pr-10 text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-primary sm:text-sm"
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
              >
                {typeOptions.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="relative ml-4 flex-grow">
              <select
                id="sort-by"
                name="sort-by"
                className="block w-full rounded-md border-0 py-1.5 pr-10 text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-primary sm:text-sm"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
              >
                {sortOptions.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Documents table */}
        <div className="mt-8 flow-root">
          <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
            <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
              {isLoading ? (
                <div className="flex justify-center py-8">
                  <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary"></div>
                </div>
              ) : sortedDocuments.length === 0 ? (
                <div className="py-8 text-center">
                  <FileText className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-semibold text-gray-900">
                    {t('archivist.no_documents')}
                  </h3>
                  <p className="mt-1 text-sm text-gray-500">
                    {t('archivist.no_documents_description')}
                  </p>
                </div>
              ) : (
                <table className="min-w-full divide-y divide-gray-300">
                  <thead>
                    <tr>
                      <th
                        scope="col"
                        className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-0"
                      >
                        {t('archivist.document_title')}
                      </th>
                      <th
                        scope="col"
                        className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                      >
                        {t('archivist.document_type')}
                      </th>
                      <th
                        scope="col"
                        className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                      >
                        {t('archivist.uploaded_by')}
                      </th>
                      <th
                        scope="col"
                        className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                      >
                        {t('archivist.upload_date')}
                      </th>
                      <th
                        scope="col"
                        className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                      >
                        {t('archivist.status')}
                      </th>
                      <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-0">
                        <span className="sr-only">{t('archivist.actions')}</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {sortedDocuments.map((document) => {
                      const statusBadge = getStatusBadge(document.status)
                      return (
                        <tr key={document.id}>
                          <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-0">
                            {document.title}
                          </td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                            {document.documentTypeName}
                          </td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                            <div className="flex items-center">
                              <User className="mr-1.5 h-4 w-4 text-gray-400" />
                              {document.uploadedBy}
                            </div>
                          </td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                            {formatDate(document.uploadDate)}
                          </td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                            <span
                              className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${statusBadge.color}`}
                            >
                              {statusBadge.icon}
                              {t(`archivist.status_${document.status}`)}
                            </span>
                          </td>
                          <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-0">
                            <div className="flex justify-end space-x-4">
                              <Link
                                to={`/dashboard/archivist/document/${document.id}`}
                                className="text-primary hover:text-primary-dark"
                              >
                                <span className="flex items-center">
                                  <Eye className="mr-1 h-4 w-4" />
                                  {t('archivist.view')}
                                </span>
                              </Link>
                              <Link
                                to={`/dashboard/archivist/document/${document.id}/review`}
                                className="text-primary hover:text-primary-dark"
                              >
                                <span className="flex items-center">
                                  <CheckCircle className="mr-1 h-4 w-4" />
                                  {t('archivist.review')}
                                </span>
                              </Link>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default IngestQueuePage