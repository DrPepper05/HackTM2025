import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { documentsApi } from '../../services/api'
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
    { id: 'all', name: 'All Statuses' },
    { id: 'draft', name: 'Draft' },
    { id: 'INGESTING', name: 'Ingesting' },
    { id: 'pending', name: 'Pending Review' },
    { id: 'under_review', name: 'Under Review' },
    { id: 'approved', name: 'Approved' },
    { id: 'rejected', name: 'Rejected' },
    { id: 'published', name: 'Published' },
    { id: 'ACTIVE_STORAGE', name: 'Active Storage' },
    { id: 'archived', name: 'Archived' },
  ]

  // Date options for filtering
  const dateOptions = [
    { id: 'all', name: 'All Dates' },
    { id: 'today', name: 'Today' },
    { id: 'this_week', name: 'This Week' },
    { id: 'this_month', name: 'This Month' },
    { id: 'this_year', name: 'This Year' },
  ]

  // Sort options
  const sortOptions = [
    { id: 'date_desc', name: 'Newest First' },
    { id: 'date_asc', name: 'Oldest First' },
    { id: 'title_asc', name: 'Title A-Z' },
    { id: 'title_desc', name: 'Title Z-A' },
  ]

  // Document type mapping
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

  // Status mapping
  const getStatusName = (status) => {
    const statusMap = {
      'draft': 'Draft',
      'INGESTING': 'Ingesting',
      'pending': 'Pending Review',
      'under_review': 'Under Review',
      'approved': 'Approved',
      'rejected': 'Rejected',
      'published': 'Published',
      'ACTIVE_STORAGE': 'Active Storage',
      'active_storage': 'Active Storage',
      'archived': 'Archived'
    }
    return statusMap[status] || status || 'Unknown'
  }

  // Fetch user's documents
  useEffect(() => {
    const fetchDocuments = async () => {
      setIsLoading(true)
      try {
        console.log('Fetching user documents...')
        console.log('Current user:', user)
        
        // Check authentication token
        const authSession = localStorage.getItem('auth_session')
        console.log('Auth session from localStorage:', authSession)
        if (authSession) {
          try {
            const parsedSession = JSON.parse(authSession)
            console.log('Parsed auth session:', {
              hasAccessToken: !!parsedSession.access_token,
              tokenStart: parsedSession.access_token ? parsedSession.access_token.substring(0, 20) + '...' : 'No token',
              user: parsedSession.user
            })
          } catch (e) {
            console.log('Error parsing auth session:', e)
          }
        }
        
        const response = await documentsApi.getUserUploads()
        console.log('Documents API response:', response)
        console.log('Response type:', typeof response)
        console.log('Response keys:', response ? Object.keys(response) : 'No response')
        
        if (response) {
          console.log('Found documents array:', response.data.documents)
          console.log('Documents count:', response.data.documents.length)
          
          // Transform the API response to match the component's expected format
          const transformedDocuments = response.data.documents.map(doc => {
            console.log('Processing document:', doc)
            return {
              id: doc.id,
              title: doc.title || 'Untitled Document',
              documentType: doc.document_type || '',
              documentTypeName: getDocumentTypeName(doc.document_type || ''),
              creator: doc.creator_info?.creator_name || doc.created_by || doc.uploaded_by || 'Unknown',
              creationDate: doc.created_at?.split('T')[0] || '',
              uploadDate: doc.uploaded_at?.split('T')[0] || doc.upload_timestamp?.split('T')[0] || doc.created_at?.split('T')[0] || '',
              status: doc.status || 'draft',
              statusName: getStatusName(doc.status || 'draft'),
              retentionCategory: doc.retention_category || '',
              confidentiality: doc.is_public ? 'public' : 'private',
              description: doc.description || '',
              uploader_user_id: doc.uploader_user_id
            }
          })
          
          console.log('Transformed documents:', transformedDocuments)
          console.log('Current user ID for filtering:', user?.id)
          console.log('Sample document uploader IDs:', transformedDocuments.slice(0, 3).map(d => d.uploader_user_id))
          setDocuments(transformedDocuments)
        } else {
          console.error('Invalid response format:', response)
          console.log('Expected: {documents: []} or [], but got:', response)
          setDocuments([])
        }
      } catch (error) {
        console.error('Error fetching documents:', error)
        console.log('Error details:', {
          message: error.message,
          stack: error.stack,
          name: error.name
        })
        setDocuments([])
      } finally {
        setIsLoading(false)
      }
    }

    if (user) {
      console.log('User is available, fetching documents for user:', user.id || user.email)
      fetchDocuments()
    } else {
      console.log('No user available, skipping document fetch')
      setIsLoading(false)
    }
  }, [user])

  // Filter and sort documents
  const filteredDocuments = documents
    .filter((doc) => {
      // First filter: Only show documents uploaded by the current user
      const isUserDocument = user && doc.uploader_user_id === user.id
      
      if (!isUserDocument) {
        return false
      }
      
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

  console.log('Frontend filtering results:', {
    totalDocuments: documents.length,
    filteredDocuments: filteredDocuments.length,
    currentUserId: user?.id,
    documentsWithMatchingUserId: documents.filter(d => d.uploader_user_id === user?.id).length
  })

  // Sort documents
  const sortedDocuments = [...filteredDocuments].sort((a, b) => {
    if (sortBy === 'date_desc') {
      const dateA = new Date(a.uploadDate)
      const dateB = new Date(b.uploadDate)
      
      // Handle invalid dates by putting them at the end
      if (isNaN(dateA.getTime()) && isNaN(dateB.getTime())) return 0
      if (isNaN(dateA.getTime())) return 1
      if (isNaN(dateB.getTime())) return -1
      
      return dateB - dateA
    } else if (sortBy === 'date_asc') {
      const dateA = new Date(a.uploadDate)
      const dateB = new Date(b.uploadDate)
      
      // Handle invalid dates by putting them at the end
      if (isNaN(dateA.getTime()) && isNaN(dateB.getTime())) return 0
      if (isNaN(dateA.getTime())) return 1
      if (isNaN(dateB.getTime())) return -1
      
      return dateA - dateB
    } else if (sortBy === 'title_asc') {
      const titleA = (a.title || '').toLowerCase()
      const titleB = (b.title || '').toLowerCase()
      return titleA.localeCompare(titleB)
    } else if (sortBy === 'title_desc') {
      const titleA = (a.title || '').toLowerCase()
      const titleB = (b.title || '').toLowerCase()
      return titleB.localeCompare(titleA)
    }
    return 0
  })

  console.log('Sorting debug:', {
    sortBy,
    originalCount: filteredDocuments.length,
    sortedCount: sortedDocuments.length,
    firstFewTitles: sortedDocuments.slice(0, 3).map(d => d.title),
    firstFewDates: sortedDocuments.slice(0, 3).map(d => d.uploadDate)
  })

  // Get status badge color and icon
  const getStatusBadge = (status) => {
    switch (status) {
      case 'draft':
      case 'pending':
        return {
          color: 'bg-blue-50 text-blue-700 ring-blue-600/20',
          icon: <Clock className="mr-1 h-4 w-4" />,
        }
      case 'INGESTING':
        return {
          color: 'bg-purple-50 text-purple-700 ring-purple-600/20',
          icon: <Clock className="mr-1 h-4 w-4" />,
        }
      case 'under_review':
        return {
          color: 'bg-yellow-50 text-yellow-700 ring-yellow-600/20',
          icon: <Clock className="mr-1 h-4 w-4" />,
        }
      case 'approved':
      case 'published':
      case 'ACTIVE_STORAGE':
      case 'active_storage':
        return {
          color: 'bg-green-50 text-green-700 ring-green-600/20',
          icon: <CheckCircle className="mr-1 h-4 w-4" />,
        }
      case 'rejected':
        return {
          color: 'bg-red-50 text-red-700 ring-red-600/20',
          icon: <XCircle className="mr-1 h-4 w-4" />,
        }
      case 'archived':
        return {
          color: 'bg-gray-50 text-gray-700 ring-gray-600/20',
          icon: <AlertTriangle className="mr-1 h-4 w-4" />,
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
            <h1 className="text-2xl font-semibold leading-6 text-gray-900">My Uploads</h1>
            <p className="mt-2 text-sm text-gray-700">View and manage all your uploaded documents</p>
          </div>
          <div className="mt-4 sm:ml-16 sm:mt-0 sm:flex-none">
            <Link
              to="/dashboard/clerk/add-document"
              className="block rounded-md bg-primary px-3 py-2 text-center text-sm font-semibold text-white shadow-sm hover:bg-primary-dark focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            >
              Add Document
            </Link>
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
              placeholder="Search documents..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="mt-4 flex sm:ml-4 sm:mt-0">
            <div className="relative flex-grow">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                <Filter className="h-5 w-5 text-gray-400" aria-hidden="true" />
              </div>
              <select
                id="status-filter"
                name="status-filter"
                className="block w-full rounded-md border-0 py-1.5 pl-10 pr-10 text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-primary sm:text-sm"
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

            <div className="relative ml-4 flex-grow">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                <Filter className="h-5 w-5 text-gray-400" aria-hidden="true" />
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
                  <h3 className="mt-2 text-sm font-semibold text-gray-900">No documents found</h3>
                  <p className="mt-1 text-sm text-gray-500">You haven't uploaded any documents yet or no documents match your search criteria.</p>
                  <div className="mt-6">
                    <Link
                      to="/dashboard/clerk/add-document"
                      className="inline-flex items-center rounded-md bg-primary px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary-dark focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                    >
                      <FileText className="-ml-0.5 mr-1.5 h-5 w-5" aria-hidden="true" />
                      Add Document
                    </Link>
                  </div>
                </div>
              ) : (
                <table className="min-w-full divide-y divide-gray-300">
                  <thead>
                    <tr>
                      <th
                        scope="col"
                        className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-0"
                      >
                        Document Title
                      </th>
                      <th
                        scope="col"
                        className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                      >
                        Document Type
                      </th>
                      <th
                        scope="col"
                        className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                      >
                        Upload Date
                      </th>
                      <th
                        scope="col"
                        className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                      >
                        Status
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
                            {formatDate(document.uploadDate)}
                          </td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                            <span
                              className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${statusBadge.color}`}
                            >
                              {statusBadge.icon}
                              {document.statusName}
                            </span>
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