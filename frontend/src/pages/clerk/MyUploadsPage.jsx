import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { Search, Filter, FileText, Eye, Clock, CheckCircle, AlertTriangle, XCircle } from 'lucide-react'

function MyUploadsPage() {
  const { t } = useTranslation()
  const { user } = useAuth()
  const [isLoading, setIsLoading] = useState(true)
  const [documents, setDocuments] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [dateFilter, setDateFilter] = useState('all')
  const [sortBy, setSortBy] = useState('date_desc')

  // Status options for filtering
  const statusOptions = [
    { id: 'all', name: t('clerk.filter_all_statuses') },
    { id: 'registered', name: t('clerk.status_registered') },
    { id: 'pending_review', name: t('clerk.status_pending_review') },
    { id: 'approved', name: t('clerk.status_approved') },
    { id: 'rejected', name: t('clerk.status_rejected') },
  ]

  // Date options for filtering
  const dateOptions = [
    { id: 'all', name: t('clerk.filter_all_dates') },
    { id: 'today', name: t('clerk.filter_today') },
    { id: 'this_week', name: t('clerk.filter_this_week') },
    { id: 'this_month', name: t('clerk.filter_this_month') },
    { id: 'this_year', name: t('clerk.filter_this_year') },
  ]

  // Sort options
  const sortOptions = [
    { id: 'date_desc', name: t('clerk.sort_newest') },
    { id: 'date_asc', name: t('clerk.sort_oldest') },
    { id: 'title_asc', name: t('clerk.sort_title_az') },
    { id: 'title_desc', name: t('clerk.sort_title_za') },
  ]

  // Mock data for documents
  useEffect(() => {
    // In a real app, this would be an API call to fetch user's documents
    const fetchDocuments = async () => {
      setIsLoading(true)
      try {
        // Simulate API call delay
        await new Promise((resolve) => setTimeout(resolve, 1000))

        // Mock data
        const mockDocuments = [
          {
            id: '1',
            title: 'Hotărâre privind aprobarea bugetului local',
            documentType: 'hotarare',
            documentTypeName: 'Hotărâre',
            creationDate: '2023-11-15',
            uploadDate: '2023-11-16',
            status: 'approved',
            retentionCategory: 'cs',
            confidentiality: 'public',
          },
          {
            id: '2',
            title: 'Contract de achiziție publică pentru servicii de mentenanță',
            documentType: 'contract',
            documentTypeName: 'Contract',
            creationDate: '2023-10-20',
            uploadDate: '2023-10-22',
            status: 'registered',
            retentionCategory: 'c',
            confidentiality: 'internal',
          },
          {
            id: '3',
            title: 'Dispoziție privind constituirea comisiei de inventariere',
            documentType: 'dispozitie',
            documentTypeName: 'Dispoziție',
            creationDate: '2023-11-01',
            uploadDate: '2023-11-02',
            status: 'pending_review',
            retentionCategory: 'ci',
            confidentiality: 'internal',
          },
          {
            id: '4',
            title: 'Certificat de urbanism pentru construire locuință',
            documentType: 'certificat',
            documentTypeName: 'Certificat',
            creationDate: '2023-09-10',
            uploadDate: '2023-09-12',
            status: 'approved',
            retentionCategory: 'cs',
            confidentiality: 'public',
          },
          {
            id: '5',
            title: 'Raport de evaluare a performanțelor profesionale',
            documentType: 'raport',
            documentTypeName: 'Raport',
            creationDate: '2023-10-05',
            uploadDate: '2023-10-06',
            status: 'rejected',
            retentionCategory: 'cf',
            confidentiality: 'confidential',
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
      doc.documentTypeName.toLowerCase().includes(searchTerm.toLowerCase())

    // Status filter
    const matchesStatus = statusFilter === 'all' || doc.status === statusFilter

    // Date filter
    let matchesDate = true
    const uploadDate = new Date(doc.uploadDate)
    const today = new Date()
    const thisWeekStart = new Date(today.getFullYear(), today.getMonth(), today.getDate() - today.getDay())
    const thisMonthStart = new Date(today.getFullYear(), today.getMonth(), 1)
    const thisYearStart = new Date(today.getFullYear(), 0, 1)

    if (dateFilter === 'today') {
      matchesDate =
        uploadDate.getDate() === today.getDate() &&
        uploadDate.getMonth() === today.getMonth() &&
        uploadDate.getFullYear() === today.getFullYear()
    } else if (dateFilter === 'this_week') {
      matchesDate = uploadDate >= thisWeekStart
    } else if (dateFilter === 'this_month') {
      matchesDate = uploadDate >= thisMonthStart
    } else if (dateFilter === 'this_year') {
      matchesDate = uploadDate >= thisYearStart
    }

    return matchesSearch && matchesStatus && matchesDate
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
            <h1 className="text-2xl font-semibold leading-6 text-gray-900">{t('clerk.my_uploads')}</h1>
            <p className="mt-2 text-sm text-gray-700">{t('clerk.my_uploads_description')}</p>
          </div>
          <div className="mt-4 sm:ml-16 sm:mt-0 sm:flex-none">
            <Link
              to="/dashboard/clerk/add-document"
              className="block rounded-md bg-primary px-3 py-2 text-center text-sm font-semibold text-white shadow-sm hover:bg-primary-dark focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            >
              {t('clerk.add_document')}
            </Link>
          </div>
        </div>

        {/* Search and filters */}
        <div className="mt-8 grid grid-cols-1 gap-x-4 gap-y-4 sm:grid-cols-12 items-center">
          {/* Search */}
          <div className="relative sm:col-span-4">
            <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">
              {t('clerk.search_documents')}
            </label>
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                <Search className="h-5 w-5 text-gray-400" aria-hidden="true" />
              </div>
              <input
                type="text"
                name="search"
                id="search"
                className="block w-full rounded-md border-0 py-1.5 pl-10 pr-3 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-primary sm:text-sm sm:leading-6"
                placeholder={t('clerk.search_documents')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          {/* Status filter */}
          <div className="relative sm:col-span-2">
            <label htmlFor="status-filter" className="block text-sm font-medium text-gray-700 mb-1">
              {t('clerk.status_filter')}
            </label>
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                <Filter className="h-5 w-5 text-gray-400" aria-hidden="true" />
              </div>
              <select
                id="status-filter"
                name="status-filter"
                className="block w-full rounded-md border-0 py-1.5 pl-10 pr-10 text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-primary sm:text-sm sm:leading-6"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                {statusOptions.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Date filter */}
          <div className="relative sm:col-span-3">
            <label htmlFor="date-filter" className="block text-sm font-medium text-gray-700 mb-1">
              {t('clerk.date_filter')}
            </label>
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                <Filter className="h-5 w-5 text-gray-400" aria-hidden="true" />
              </div>
              <select
                id="date-filter"
                name="date-filter"
                className="block w-full rounded-md border-0 py-1.5 pl-10 pr-10 text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-primary sm:text-sm sm:leading-6"
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
          </div>

          {/* Sort by */}
          <div className="relative sm:col-span-3">
            <label htmlFor="sort-by" className="block text-sm font-medium text-gray-700 mb-1">
              {t('clerk.sort_by')}
            </label>
            <div className="relative">
              <select
                id="sort-by"
                name="sort-by"
                className="block w-full rounded-md border-0 py-1.5 pl-3 pr-10 text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-primary sm:text-sm sm:leading-6"
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
                  <h3 className="mt-2 text-sm font-semibold text-gray-900">{t('clerk.no_documents')}</h3>
                  <p className="mt-1 text-sm text-gray-500">{t('clerk.no_documents_description')}</p>
                  <div className="mt-6">
                    <Link
                      to="/dashboard/clerk/add-document"
                      className="inline-flex items-center rounded-md bg-primary px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary-dark focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                    >
                      <FileText className="-ml-0.5 mr-1.5 h-5 w-5" aria-hidden="true" />
                      {t('clerk.add_document')}
                    </Link>
                  </div>
                </div>
              ) : (
                <table className="min-w-full divide-y divide-gray-300 table-fixed">
                  <thead>
                    <tr>
                      <th
                        scope="col"
                        className="w-2/5 py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-0"
                      >
                        {t('clerk.document_title')}
                      </th>
                      <th
                        scope="col"
                        className="w-1/5 px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                      >
                        {t('clerk.document_type')}
                      </th>
                      <th
                        scope="col"
                        className="w-1/6 px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                      >
                        {t('clerk.upload_date')}
                      </th>
                      <th
                        scope="col"
                        className="w-1/6 px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                      >
                        {t('clerk.status')}
                      </th>
                      <th scope="col" className="w-1/12 relative py-3.5 pl-3 pr-4 sm:pr-0">
                        <span className="sr-only">{t('clerk.view')}</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {sortedDocuments.map((document) => {
                      const statusBadge = getStatusBadge(document.status)
                      return (
                        <tr key={document.id} className="hover:bg-gray-50">
                          <td className="py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-0 break-words">
                            {document.title}
                          </td>
                          <td className="px-3 py-4 text-sm text-gray-500 break-words">
                            {document.documentTypeName}
                          </td>
                          <td className="px-3 py-4 text-sm text-gray-500">
                            {formatDate(document.uploadDate)}
                          </td>
                          <td className="px-3 py-4 text-sm text-gray-500">
                            <span
                              className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${statusBadge.color}`}
                            >
                              {statusBadge.icon}
                              {t(`clerk.status_${document.status}`)}
                            </span>
                          </td>
                          <td className="relative py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-0">
                            <Link
                              to={`/dashboard/clerk/document/${document.id}`}
                              className="text-primary hover:text-primary-dark inline-flex items-center"
                            >
                              <Eye className="mr-1 h-4 w-4" />
                              {t('clerk.view')}
                            </Link>
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

export default MyUploadsPage