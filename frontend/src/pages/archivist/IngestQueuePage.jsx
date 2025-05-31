import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import {
  Search,
  FileText,
  Eye,
  Clock,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Calendar,
  User,
  ArrowUpDown,
  Inbox,
} from 'lucide-react'

function IngestQueuePage() {
  const { t } = useTranslation()
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

  // Get status badge icon
  const getStatusBadge = (status) => {
    switch (status) {
      case 'registered':
        return { icon: <Clock className="h-5 w-5 text-amber-500" /> }
      case 'approved':
        return { icon: <CheckCircle className="h-5 w-5 text-green-500" /> }
      case 'rejected':
        return { icon: <XCircle className="h-5 w-5 text-red-500" /> }
      default:
        return { icon: <AlertTriangle className="h-5 w-5 text-gray-500" /> }
    }
  }

  // Format date for display
  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleDateString()
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="mb-8">
        <div className="flex items-center mb-4">
          <Inbox className="h-8 w-8 text-purple-500 mr-3" />
          <h1 className="text-2xl font-bold text-gray-900">{t('archivist.ingest_queue')}</h1>
        </div>
        <p className="text-gray-600 max-w-3xl">{t('archivist.ingest_queue_description')}</p>
      </div>

      {/* Search and filters */}
      <div className="bg-white rounded-lg shadow mb-6 p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" aria-hidden="true" />
            </div>
            <input
              type="text"
              name="search"
              id="search"
              className="block w-full rounded-md border border-gray-300 bg-white py-2 pl-10 pr-3 text-gray-900 placeholder:text-gray-400 focus:border-sky-500 focus:ring-1 focus:ring-sky-500 sm:text-sm"
              placeholder={t('archivist.search_documents')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Calendar className="h-5 w-5 text-gray-400" aria-hidden="true" />
            </div>
            <select
              id="date-filter"
              name="date-filter"
              className="block w-full rounded-md border border-gray-300 bg-white py-2 pl-10 pr-3 text-gray-900 focus:border-sky-500 focus:ring-1 focus:ring-sky-500 sm:text-sm"
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

          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <FileText className="h-5 w-5 text-gray-400" aria-hidden="true" />
            </div>
            <select
              id="type-filter"
              name="type-filter"
              className="block w-full rounded-md border border-gray-300 bg-white py-2 pl-10 pr-3 text-gray-900 focus:border-sky-500 focus:ring-1 focus:ring-sky-500 sm:text-sm"
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

          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <ArrowUpDown className="h-5 w-5 text-gray-400" aria-hidden="true" />
            </div>
            <select
              id="sort-by"
              name="sort-by"
              className="block w-full rounded-md border border-gray-300 bg-white py-2 pl-10 pr-3 text-gray-900 focus:border-sky-500 focus:ring-1 focus:ring-sky-500 sm:text-sm"
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
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sky-500"></div>
          </div>
        ) : sortedDocuments.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
            <FileText className="h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">{t('archivist.no_documents')}</h3>
            <p className="text-gray-500 max-w-md">{t('archivist.no_documents_description')}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('archivist.document_title')}
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('archivist.document_type')}
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('archivist.uploaded_by')}
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('archivist.upload_date')}
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('archivist.status')}
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('archivist.actions')}
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {sortedDocuments.map((document) => {
                  const statusBadge = getStatusBadge(document.status)
                  return (
                    <tr key={document.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {document.title}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {document.documentTypeName}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div className="flex items-center">
                          <User className="h-4 w-4 text-gray-400 mr-2" />
                          {document.uploadedBy}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(document.uploadDate)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div className="flex items-center">
                          {statusBadge.icon}
                          <span className="ml-2">{t(`archivist.status_${document.status}`)}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end space-x-3">
                          <Link 
                            to={`/dashboard/archivist/document/${document.id}`}
                            className="text-sky-600 hover:text-sky-900 flex items-center"
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            {t('archivist.view')}
                          </Link>
                          <Link 
                            to={`/dashboard/archivist/document/${document.id}/review`}
                            className="text-green-600 hover:text-green-900 flex items-center"
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            {t('archivist.review')}
                          </Link>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

export default IngestQueuePage