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
import { documentsApi, searchApi } from '../../services/api'

function IngestQueuePage() {
  const { t } = useTranslation()
  const [isLoading, setIsLoading] = useState(true)
  const [documents, setDocuments] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [dateFilter, setDateFilter] = useState('all')
  const [sortBy, setSortBy] = useState('date_desc')

  // Date options for filtering
  const dateOptions = [
    { id: 'all', name: t('archivist.filter_all_dates') },
    { id: 'today', name: t('archivist.filter_today') },
    { id: 'this_week', name: t('archivist.filter_this_week') },
    { id: 'this_month', name: t('archivist.filter_this_month') },
  ]

  // Sort options
  const sortOptions = [
    { id: 'date_desc', name: t('archivist.sort_newest') },
    { id: 'date_asc', name: t('archivist.sort_oldest') },
    { id: 'title_asc', name: t('archivist.sort_title_az') },
    { id: 'title_desc', name: t('archivist.sort_title_za') },
  ]

  // Fetch documents from API
  useEffect(() => {
    const fetchDocuments = async () => {
      setIsLoading(true)
      try {
        console.log('Fetching documents with INGESTING status...')
        
        let allDocuments = []
        
        // Approach 1: Try search API first as it should return all documents for staff
        try {
          const response = await searchApi.search({ 
            query: '', // Empty query to get all documents
            limit: 1000, // Large limit to get all ingesting documents
            offset: 0 
          })
          console.log('Search API Response:', response)
          
          if (response.data?.documents) {
            // Extract the actual document objects from the nested structure
            allDocuments = response.data.documents.map(item => item.document)
            console.log('Extracted documents from search API:', allDocuments.length)
          } else if (Array.isArray(response.data)) {
            allDocuments = response.data
          }
        } catch (searchError) {
          console.log('Search API failed:', searchError)
        }
        
        // Approach 2: Try documents API without user filter
        if (allDocuments.length === 0) {
          try {
            const response = await documentsApi.getDocuments({ limit: 1000 })
            console.log('Documents API Response:', response)
            
            if (response && response.documents) {
              allDocuments = response.documents
            } else if (response && response.data) {
              if (response.data.documents) {
                allDocuments = response.data.documents
              } else if (Array.isArray(response.data)) {
                allDocuments = response.data
              }
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
            const token = JSON.parse(localStorage.getItem('auth_session'))?.access_token
            const directResponse = await fetch(`${import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001'}/admin/documents`, {
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
              }
            })
            
            if (directResponse.ok) {
              const directData = await directResponse.json()
              console.log('Direct admin API Response:', directData.length, 'documents')
              allDocuments = Array.isArray(directData) ? directData : []
            }
          } catch (directError) {
            console.log('Direct admin API failed:', directError)
          }
        }
        
        console.log('All documents found:', allDocuments.length)
        
        // Filter documents to only show those with INGESTING status
        const ingestingDocuments = allDocuments.filter(doc => {
          console.log('Document status:', doc.status, 'Document title:', doc.title?.substring(0, 50))
          return doc.status === 'INGESTING'
        })
        
        console.log('Filtered ingesting documents:', ingestingDocuments.length, 'out of', allDocuments.length)
        
        // Transform the API response to match the expected format
        const transformedDocuments = ingestingDocuments.map(doc => ({
          id: doc.id,
          title: doc.title || 'Untitled Document',
          documentType: doc.document_type || 'unknown',
          documentTypeName: doc.document_type || 'Unknown',
          creationDate: doc.created_at ? doc.created_at.split('T')[0] : new Date().toISOString().split('T')[0],
          uploadDate: doc.created_at ? doc.created_at.split('T')[0] : new Date().toISOString().split('T')[0],
          uploadedBy: doc.uploader_user_id || 'Unknown User',
          status: 'ingesting', // Ensure consistent lowercase status for UI
          retentionCategory: doc.retention_category || 'unknown',
          confidentiality: doc.is_public ? 'public' : 'internal',
        }))
        
        setDocuments(transformedDocuments)
      } catch (error) {
        console.error('Error fetching documents:', error)
        // Fallback to empty array on error
        setDocuments([])
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

    return matchesSearch && matchesDate
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
      case 'ingesting':
        return { icon: <Clock className="h-5 w-5 text-blue-500 animate-spin" /> }
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
    <div className="bg-white">
      <div className="container mx-auto px-4 py-6">
        <div className="mb-8">
          <div className="flex items-center mb-4">
            <Inbox className="h-8 w-8 text-purple-500 mr-3" />
            <h1 className="text-2xl font-bold text-gray-900">{t('archivist.ingest_queue')}</h1>
          </div>
          <p className="text-gray-600 max-w-3xl">{t('archivist.ingest_queue_description')}</p>
        </div>

        {/* Search and filters */}
        <div className="mt-8 grid grid-cols-1 gap-x-4 gap-y-4 sm:grid-cols-8 items-center bg-gray-50 p-4 rounded-lg shadow-sm">
          {/* Search */}
          <div className="relative sm:col-span-4">
            <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">
              {t('archivist.search_documents')}
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
                placeholder={t('archivist.search_documents')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          {/* Date filter */}
          <div className="relative sm:col-span-2">
            <label htmlFor="date-filter" className="block text-sm font-medium text-gray-700 mb-1">
              {t('archivist.date_filter')}
            </label>
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                <Calendar className="h-5 w-5 text-gray-400" aria-hidden="true" />
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
          <div className="relative sm:col-span-2">
            <label htmlFor="sort-by" className="block text-sm font-medium text-gray-700 mb-1">
              {t('archivist.sort_by')}
            </label>
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                <ArrowUpDown className="h-5 w-5 text-gray-400" aria-hidden="true" />
              </div>
              <select
                id="sort-by"
                name="sort-by"
                className="block w-full rounded-md border-0 py-1.5 pl-10 pr-10 text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-primary sm:text-sm sm:leading-6"
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
            <div className="loading-container h-64">
              <div className="loading-spinner"></div>
              <p className="text-gray-600 text-sm mt-2">{t('common.loading')}</p>
            </div>
          ) : sortedDocuments.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
              <FileText className="h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">{t('archivist.no_documents')}</h3>
              <p className="text-gray-500 max-w-md">{t('archivist.no_documents_description')}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-300 table-fixed">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="w-2/5 px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('archivist.document_title')}
                    </th>
                    <th scope="col" className="w-1/5 px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('archivist.document_type')}
                    </th>
                    <th scope="col" className="w-1/5 px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('archivist.uploaded_by')}
                    </th>
                    <th scope="col" className="w-1/6 px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('archivist.upload_date')}
                    </th>
                    <th scope="col" className="w-1/6 px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('archivist.status')}
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {sortedDocuments.map((document) => {
                    const statusBadge = getStatusBadge(document.status)
                    return (
                      <tr key={document.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 text-sm font-medium text-gray-900 break-words">
                          {document.title}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500 break-words">
                          {document.documentTypeName}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500 break-words">
                          <div className="flex items-center">
                            <User className="h-4 w-4 text-gray-400 flex-shrink-0 mr-2" />
                            {document.uploadedBy}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">
                          {formatDate(document.uploadDate)}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">
                          <div className="flex items-center">
                            {statusBadge.icon}
                            <span className="ml-2">Ingesting</span>
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
    </div>
  )
}

export default IngestQueuePage