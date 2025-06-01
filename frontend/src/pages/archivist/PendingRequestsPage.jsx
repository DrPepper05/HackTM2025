import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../../hooks/useAuth'
import { documentsApi } from '../../services/api'
import {
  Search,
  Filter,
  ArrowUpDown,
  Clock,
  AlertTriangle,
  CheckCircle,
  Eye,
  Check,
  X,
  User,
  Calendar,
  Mail,
  FileText,
} from 'lucide-react'

function PendingRequestsPage() {
  const { t } = useTranslation()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [isLoading, setIsLoading] = useState(true)
  const [requests, setRequests] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [dateFilter, setDateFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('pending')
  const [sortBy, setSortBy] = useState('createdAt')
  const [sortDirection, setSortDirection] = useState('desc')
  const [showConfirmation, setShowConfirmation] = useState(false)
  const [selectedAction, setSelectedAction] = useState(null)
  const [selectedRequest, setSelectedRequest] = useState(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetchRequests()
  }, [])

  const fetchRequests = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const response = await documentsApi.getAccessRequests()
      // Backend returns { success: true, data: { requests: [...], total: number } }
      if (response.success && response.data) {
        setRequests(response.data.requests || [])
      } else {
        setRequests([])
      }
    } catch (err) {
      console.error('Error fetching requests:', err)
      setError(t('archivist.error_fetching_requests'))
    } finally {
      setIsLoading(false)
    }
  }

  // Filter requests based on search term, date filter, and status filter
  const filteredRequests = requests.filter((request) => {
    // Search filter
    const matchesSearch =
      request.document_title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.requester_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.requester_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.justification?.toLowerCase().includes(searchTerm.toLowerCase())

    // Date filter
    let matchesDate = true
    if (request.created_at) {
      const today = new Date()
      const requestDate = new Date(request.created_at)
      const diffTime = today - requestDate
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

      if (dateFilter === 'today') {
        matchesDate = diffDays === 0
      } else if (dateFilter === 'this_week') {
        matchesDate = diffDays >= 0 && diffDays <= 7
      } else if (dateFilter === 'this_month') {
        matchesDate = diffDays >= 0 && diffDays <= 30
      }
    }

    // Status filter
    const matchesStatus = statusFilter === 'all' || request.status === statusFilter

    return matchesSearch && matchesDate && matchesStatus
  })

  // Sort requests
  const sortedRequests = [...filteredRequests].sort((a, b) => {
    let comparison = 0

    if (sortBy === 'documentTitle') {
      comparison = (a.document_title || '').localeCompare(b.document_title || '')
    } else if (sortBy === 'requesterInfo') {
      comparison = (a.requester_name || '').localeCompare(b.requester_name || '')
    } else if (sortBy === 'createdAt') {
      const dateA = new Date(a.created_at || 0)
      const dateB = new Date(b.created_at || 0)
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

  // Handle request action
  const handleAction = (request, action) => {
    setSelectedRequest(request)
    setSelectedAction(action)
    setShowConfirmation(true)
  }

  // Handle confirmation
  const handleConfirmation = async (confirmed) => {
    if (!confirmed) {
      setShowConfirmation(false)
      setSelectedRequest(null)
      setSelectedAction(null)
      return
    }

    setIsSubmitting(true)
    try {
      await documentsApi.updateAccessRequest(selectedRequest.id, {
        status: selectedAction === 'approve' ? 'approved' : 'rejected',
        rejectionReason: selectedAction === 'reject' ? 'Request denied by archivist' : undefined,
        notes: `${selectedAction === 'approve' ? 'Approved' : 'Rejected'} by ${user.profile.full_name || user.email}`
      })

      // Refresh the requests list
      await fetchRequests()
      setShowConfirmation(false)
      setSelectedRequest(null)
      setSelectedAction(null)
    } catch (err) {
      console.error('Error updating request:', err)
      setError(t('archivist.error_updating_request'))
    } finally {
      setIsSubmitting(false)
    }
  }

  // Get status badge color
  const getStatusBadgeColor = (status) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border border-yellow-300'
      case 'approved':
        return 'bg-green-100 text-green-800 border border-green-300'
      case 'rejected':
        return 'bg-red-100 text-red-800 border border-red-300'
      default:
        return 'bg-gray-100 text-gray-800 border border-gray-300'
    }
  }

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A'
    return new Date(dateString).toLocaleDateString()
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
            <h2 className="mt-4 text-lg font-medium text-gray-900">{t('archivist.error_loading_requests')}</h2>
            <p className="mt-2 text-sm text-gray-500">{error}</p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="mt-4 inline-flex items-center rounded-md bg-primary px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary-dark"
            >
              {t('common.retry')}
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
            {t('nav.pending_requests')}
          </h2>
          <p className="mt-2 max-w-4xl text-sm text-gray-500">
            {t('archivist.pending_requests_description')}
          </p>
        </div>

        {/* Filters and search */}
        <div className="mb-8 grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-6 bg-gray-50 p-4 rounded-lg shadow-sm">
          {/* Search */}
          <div className="sm:col-span-2">
            <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">
              {t('archivist.search_requests')}
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
                placeholder={t('archivist.search_requests')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          {/* Date filter */}
          <div className="sm:col-span-2">
            <label htmlFor="dateFilter" className="block text-sm font-medium text-gray-700 mb-1">
              {t('archivist.filter_by_date')}
            </label>
            <select
              id="dateFilter"
              name="dateFilter"
              className="block w-full rounded-md border-0 py-1.5 pl-3 pr-10 text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-primary sm:text-sm"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
            >
              <option value="all">{t('archivist.all_dates')}</option>
              <option value="today">{t('archivist.today')}</option>
              <option value="this_week">{t('archivist.this_week')}</option>
              <option value="this_month">{t('archivist.this_month')}</option>
            </select>
          </div>

          {/* Status filter */}
          <div className="sm:col-span-2">
            <label htmlFor="statusFilter" className="block text-sm font-medium text-gray-700 mb-1">
              {t('archivist.filter_by_status')}
            </label>
            <select
              id="statusFilter"
              name="statusFilter"
              className="block w-full rounded-md border-0 py-1.5 pl-3 pr-10 text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-primary sm:text-sm"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">{t('archivist.all_statuses')}</option>
              <option value="pending">{t('archivist.status_pending')}</option>
              <option value="approved">{t('archivist.status_approved')}</option>
              <option value="rejected">{t('archivist.status_rejected')}</option>
            </select>
          </div>
        </div>

        {/* Requests table */}
        <div className="mt-8 flow-root">
          <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
            <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
              <table className="min-w-full divide-y divide-gray-300">
                <thead>
                  <tr>
                    <th
                      scope="col"
                      className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-0 cursor-pointer"
                      onClick={() => handleSort('documentTitle')}
                    >
                      <div className="group inline-flex">
                        {t('archivist.document_title')}
                        <span className="ml-2 flex-none rounded text-gray-400">
                          <ArrowUpDown className="h-4 w-4" aria-hidden="true" />
                        </span>
                      </div>
                    </th>
                    <th
                      scope="col"
                      className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 cursor-pointer"
                      onClick={() => handleSort('requesterInfo')}
                    >
                      <div className="group inline-flex">
                        {t('archivist.requester_info')}
                        <span className="ml-2 flex-none rounded text-gray-400">
                          <ArrowUpDown className="h-4 w-4" aria-hidden="true" />
                        </span>
                      </div>
                    </th>
                    <th
                      scope="col"
                      className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                    >
                      {t('archivist.justification')}
                    </th>
                    <th
                      scope="col"
                      className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 cursor-pointer"
                      onClick={() => handleSort('createdAt')}
                    >
                      <div className="group inline-flex">
                        {t('archivist.created_at')}
                        <span className="ml-2 flex-none rounded text-gray-400">
                          <ArrowUpDown className="h-4 w-4" aria-hidden="true" />
                        </span>
                      </div>
                    </th>
                    <th
                      scope="col"
                      className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 cursor-pointer"
                      onClick={() => handleSort('status')}
                    >
                      <div className="group inline-flex">
                        {t('archivist.status')}
                        <span className="ml-2 flex-none rounded text-gray-400">
                          <ArrowUpDown className="h-4 w-4" aria-hidden="true" />
                        </span>
                      </div>
                    </th>
                    <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-0">
                      <span className="sr-only">{t('archivist.actions')}</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {sortedRequests.length === 0 ? (
                    <tr>
                      <td
                        colSpan="6"
                        className="py-10 text-center text-sm font-medium text-gray-500"
                      >
                        {t('archivist.no_requests_found')}
                      </td>
                    </tr>
                  ) : (
                    sortedRequests.map((request) => (
                      <tr key={request.id} className="hover:bg-gray-50">
                        <td className="py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-0">
                          <div className="flex items-center">
                            <FileText className="mr-2 h-5 w-5 text-gray-400" />
                            {request.document_title || t('archivist.untitled')}
                          </div>
                        </td>
                        <td className="px-3 py-4 text-sm text-gray-500">
                          <div className="flex flex-col">
                            <div className="flex items-center">
                              <User className="mr-1.5 h-4 w-4 text-gray-400" />
                              {request.requester_name}
                            </div>
                            <div className="flex items-center mt-1">
                              <Mail className="mr-1.5 h-4 w-4 text-gray-400" />
                              {request.requester_email}
                            </div>
                          </div>
                        </td>
                        <td className="px-3 py-4 text-sm text-gray-500 max-w-xs truncate">
                          {request.justification}
                        </td>
                        <td className="px-3 py-4 text-sm text-gray-500">
                          <div className="flex items-center">
                            <Calendar className="mr-1.5 h-4 w-4 text-gray-400" />
                            {formatDate(request.created_at)}
                          </div>
                        </td>
                        <td className="px-3 py-4 text-sm text-gray-500">
                          <span
                            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${getStatusBadgeColor(
                              request.status
                            )}`}
                          >
                            {request.status}
                          </span>
                        </td>
                        <td className="relative py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-0">
                          <div className="flex items-center justify-end space-x-2">
                            <button
                              type="button"
                              onClick={() => navigate(`/archivist/document/${request.document_id}`)}
                              className="rounded-full p-1 text-primary hover:bg-gray-100 hover:text-primary-dark"
                              title={t('common.view_document')}
                            >
                              <Eye className="h-5 w-5" />
                            </button>
                            {request.status === 'pending' && (
                              <>
                                <button
                                  type="button"
                                  onClick={() => handleAction(request, 'approve')}
                                  className="rounded-full p-1 text-green-600 hover:bg-green-50"
                                  title={t('archivist.approve_request')}
                                >
                                  <Check className="h-5 w-5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleAction(request, 'reject')}
                                  className="rounded-full p-1 text-red-600 hover:bg-red-50"
                                  title={t('archivist.reject_request')}
                                >
                                  <X className="h-5 w-5" />
                                </button>
                              </>
                            )}
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

        {/* Confirmation modal */}
        {showConfirmation && selectedRequest && (
          <div className="fixed inset-0 z-10 overflow-y-auto bg-gray-500 bg-opacity-75 transition-opacity">
            <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
              <div className="relative transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:p-6">
                <div>
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-yellow-100">
                    {selectedAction === 'approve' ? (
                      <CheckCircle className="h-6 w-6 text-green-600" aria-hidden="true" />
                    ) : (
                      <X className="h-6 w-6 text-red-600" aria-hidden="true" />
                    )}
                  </div>
                  <div className="mt-3 text-center sm:mt-5">
                    <h3 className="text-base font-semibold leading-6 text-gray-900">
                      {selectedAction === 'approve'
                        ? t('archivist.confirm_approve_request')
                        : t('archivist.confirm_reject_request')}
                    </h3>
                    <div className="mt-2">
                      <p className="text-sm text-gray-500">
                        {selectedAction === 'approve'
                          ? t('archivist.approve_request_description')
                          : t('archivist.reject_request_description')}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="mt-5 sm:mt-6 sm:grid sm:grid-flow-row-dense sm:grid-cols-2 sm:gap-3">
                  <button
                    type="button"
                    className="inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-300 sm:col-start-2 transition-colors"
                    onClick={() => handleConfirmation(true)}
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-gray-900 border-t-transparent"></div>
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

export default PendingRequestsPage 