import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../../hooks/useAuth'
import { auditApi } from '../../services/api'
import {
  Search,
  Calendar,
  User,
  FileText,
  Filter,
  Download,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Info,
  AlertTriangle,
  Check,
  X,
  Lock,
  Unlock,
  Trash2,
  Pencil,
  Eye,
  Clock,
  ChevronDown,
} from 'lucide-react'

function AuditLogPage() {
  const { t } = useTranslation()
  const { user } = useAuth()
  const [isLoading, setIsLoading] = useState(true)
  const [logs, setLogs] = useState([])
  const [totalLogs, setTotalLogs] = useState(0)
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(20)
  const [dateRange, setDateRange] = useState({ from: '', to: '' })
  const [selectedUser, setSelectedUser] = useState('')
  const [selectedAction, setSelectedAction] = useState('')
  const [selectedEntity, setSelectedEntity] = useState('')
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [selectedLog, setSelectedLog] = useState(null)
  const [isExporting, setIsExporting] = useState(false)

  // Available filter options (will be populated from API data)
  const [filterOptions, setFilterOptions] = useState({
    users: [],
    actions: [],
    entities: []
  })

  // Fetch audit logs from API
  const fetchAuditLogs = async (page = 1) => {
    setIsLoading(true)
    try {
      const params = {
        limit: itemsPerPage,
        offset: (page - 1) * itemsPerPage
      }

      // Add filters if they exist
      if (searchTerm) {
        // Use search endpoint for text search
        const searchResult = await auditApi.searchAuditLogs({ 
          q: searchTerm, 
          limit: itemsPerPage 
        })
        setLogs(searchResult.data.logs || [])
        setTotalLogs(searchResult.data.logs?.length || 0)
        return
      }

      // Add other filters
      if (selectedUser) params.user_email = selectedUser
      if (selectedAction) params.action = selectedAction
      if (selectedEntity) params.entity_type = selectedEntity
      if (dateRange.from) params.from_date = dateRange.from
      if (dateRange.to) params.to_date = dateRange.to

      const response = await auditApi.getAuditLogs(params)
      
      if (response.success) {
        setLogs(response.data.logs || [])
        setTotalLogs(response.data.total || 0)
        
        // Extract unique values for filter dropdowns
        const logs = response.data.logs || []
        const uniqueUsers = [...new Set(logs.map(log => log.user_email).filter(Boolean))]
        const uniqueActions = [...new Set(logs.map(log => log.action).filter(Boolean))]
        const uniqueEntities = [...new Set(logs.map(log => log.entity_type).filter(Boolean))]
        
        setFilterOptions({
          users: uniqueUsers,
          actions: uniqueActions,
          entities: uniqueEntities
        })
      }
    } catch (error) {
      console.error('Error fetching audit logs:', error)
      setLogs([])
      setTotalLogs(0)
    } finally {
      setIsLoading(false)
    }
  }

  // Initial load
  useEffect(() => {
    fetchAuditLogs(currentPage)
  }, [currentPage])

  // Refetch when filters change
  useEffect(() => {
    if (currentPage === 1) {
      fetchAuditLogs(1)
    } else {
      setCurrentPage(1) // This will trigger fetchAuditLogs via the useEffect above
    }
  }, [searchTerm, dateRange, selectedUser, selectedAction, selectedEntity])

  // Calculate pagination
  const totalPages = Math.ceil(totalLogs / itemsPerPage)

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value)
  }

  const handleDateChange = (e) => {
    const { name, value } = e.target
    setDateRange(prev => ({ ...prev, [name]: value }))
  }

  const handleUserChange = (e) => {
    setSelectedUser(e.target.value)
  }

  const handleActionChange = (e) => {
    setSelectedAction(e.target.value)
  }

  const handleEntityChange = (e) => {
    setSelectedEntity(e.target.value)
  }

  const handlePageChange = (page) => {
    setCurrentPage(page)
  }

  const handleResetFilters = () => {
    setSearchTerm('')
    setDateRange({ from: '', to: '' })
    setSelectedUser('')
    setSelectedAction('')
    setSelectedEntity('')
    setCurrentPage(1)
  }

  const handleViewLogDetail = (log) => {
    setSelectedLog(log)
    setShowDetailModal(true)
  }

  const handleExportLogs = async () => {
    setIsExporting(true)
    try {
      const params = {
        format: 'json'
      }
      
      // Add current filters to export
      if (selectedUser) params.user_email = selectedUser
      if (selectedAction) params.action = selectedAction
      if (selectedEntity) params.entity_type = selectedEntity
      if (dateRange.from) params.from_date = dateRange.from
      if (dateRange.to) params.to_date = dateRange.to
      
      const response = await auditApi.exportAuditLogs(params)
      
      // Create download link
      const blob = new Blob([JSON.stringify(response, null, 2)], { type: 'application/json' })
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `audit_logs_${new Date().toISOString().split('T')[0]}.json`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Error exporting audit logs:', error)
    } finally {
      setIsExporting(false)
    }
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('ro-RO')
  }

  const formatTime = (dateString) => {
    return new Date(dateString).toLocaleTimeString('ro-RO')
  }

  const getActionIcon = (action) => {
    switch (action) {
      case 'USER_LOGIN':
      case 'user_login':
        return <User className="h-4 w-4 text-green-500" />
      case 'USER_LOGOUT':
      case 'user_logout':
        return <User className="h-4 w-4 text-gray-500" />
      case 'DOCUMENT_UPLOAD':
      case 'document_upload':
        return <FileText className="h-4 w-4 text-blue-500" />
      case 'DOCUMENT_VIEW':
      case 'document_view':
        return <Eye className="h-4 w-4 text-purple-500" />
      case 'DOCUMENT_DOWNLOAD':
      case 'document_download':
        return <Download className="h-4 w-4 text-indigo-500" />
      case 'DOCUMENT_UPDATE':
      case 'document_update':
        return <Pencil className="h-4 w-4 text-yellow-500" />
      case 'DOCUMENT_DELETE':
      case 'document_delete':
        return <Trash2 className="h-4 w-4 text-red-500" />
      case 'DOCUMENT_APPROVE':
      case 'document_approve':
        return <Check className="h-4 w-4 text-green-500" />
      case 'DOCUMENT_REJECT':
      case 'document_reject':
        return <X className="h-4 w-4 text-red-500" />
      case 'USER_REGISTERED':
      case 'user_create':
        return <User className="h-4 w-4 text-blue-500" />
      case 'PROFILE_UPDATED':
      case 'user_update':
        return <Pencil className="h-4 w-4 text-yellow-500" />
      case 'USER_DELETED':
      case 'user_delete':
        return <Trash2 className="h-4 w-4 text-red-500" />
      default:
        return <Info className="h-4 w-4 text-gray-500" />
    }
  }

  const getActionLabel = (action) => {
    // Convert action to human readable format
    return action.toLowerCase().replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
  }

  const getStatusBadgeColor = (status) => {
    switch (status) {
      case 'success':
        return 'bg-green-100 text-green-800'
      case 'failure':
      case 'error':
        return 'bg-red-100 text-red-800'
      case 'warning':
        return 'bg-yellow-100 text-yellow-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="bg-white">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="mb-8 md:flex md:items-center md:justify-between">
          <div className="min-w-0 flex-1">
            <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:text-3xl sm:tracking-tight">
              {t('inspector.audit_logs')}
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              {t('inspector.audit_logs_description')}
            </p>
          </div>
          <div className="mt-4 flex md:ml-4 md:mt-0">
            <button
              type="button"
              onClick={handleExportLogs}
              className="ml-3 inline-flex items-center rounded-md bg-primary px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
            >
              <Download className="-ml-0.5 mr-1.5 h-5 w-5" aria-hidden="true" />
              {t('inspector.export_logs')}
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="mb-8 rounded-lg bg-white p-6 shadow">
          <div className="mb-6 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
            {/* Search */}
            <div>
              <label htmlFor="search" className="mb-2 block text-sm font-medium text-gray-700">
                {t('inspector.search')}
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <Search className="h-5 w-5 text-gray-400" aria-hidden="true" />
                </div>
                <input
                  type="text"
                  name="search"
                  id="search"
                  className="block h-10 w-full rounded-md border border-gray-300 bg-white pl-10 pr-3 text-sm shadow-sm focus:border-primary focus:ring-primary hover:border-gray-400"
                  placeholder={t('inspector.search_placeholder')}
                  value={searchTerm}
                  onChange={handleSearchChange}
                />
              </div>
            </div>

            {/* Date From */}
            <div>
              <label htmlFor="dateFrom" className="mb-2 block text-sm font-medium text-gray-700">
                {t('inspector.date_from')}
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <Calendar className="h-5 w-5 text-gray-400" aria-hidden="true" />
                </div>
                <input
                  type="date"
                  name="from"
                  id="dateFrom"
                  className="block h-10 w-full appearance-none rounded-md border border-gray-300 bg-white pl-10 pr-3 text-sm shadow-sm focus:border-primary focus:ring-primary hover:border-gray-400"
                  value={dateRange.from}
                  onChange={handleDateChange}
                />
              </div>
            </div>

            {/* Date To */}
            <div>
              <label htmlFor="dateTo" className="mb-2 block text-sm font-medium text-gray-700">
                {t('inspector.date_to')}
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <Calendar className="h-5 w-5 text-gray-400" aria-hidden="true" />
                </div>
                <input
                  type="date"
                  name="to"
                  id="dateTo"
                  className="block h-10 w-full appearance-none rounded-md border border-gray-300 bg-white pl-10 pr-3 text-sm shadow-sm focus:border-primary focus:ring-primary hover:border-gray-400"
                  value={dateRange.to}
                  onChange={handleDateChange}
                />
              </div>
            </div>

            {/* User Filter */}
            <div>
              <label htmlFor="userFilter" className="mb-2 block text-sm font-medium text-gray-700">
                {t('inspector.filter_by_user')}
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <User className="h-5 w-5 text-gray-400" aria-hidden="true" />
                </div>
                <select
                  id="userFilter"
                  name="userFilter"
                  className="block h-10 w-full appearance-none rounded-md border border-gray-300 bg-white pl-10 pr-10 text-sm shadow-sm focus:border-primary focus:outline-none focus:ring-primary hover:border-gray-400"
                  value={selectedUser}
                  onChange={handleUserChange}
                >
                  <option value="">{t('inspector.all_users')}</option>
                  {filterOptions.users.map((user) => (
                    <option key={user} value={user}>
                      {user}
                    </option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                  <ChevronDown className="h-5 w-5 text-gray-400" aria-hidden="true" />
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
            {/* Action Filter */}
            <div>
              <label htmlFor="actionFilter" className="mb-2 block text-sm font-medium text-gray-700">
                {t('inspector.filter_by_action')}
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <Filter className="h-5 w-5 text-gray-400" aria-hidden="true" />
                </div>
                <select
                  id="actionFilter"
                  name="actionFilter"
                  className="block h-10 w-full appearance-none rounded-md border border-gray-300 bg-white pl-10 pr-10 text-sm shadow-sm focus:border-primary focus:outline-none focus:ring-primary hover:border-gray-400"
                  value={selectedAction}
                  onChange={handleActionChange}
                >
                  <option value="">{t('inspector.all_actions')}</option>
                  {filterOptions.actions.map((action) => (
                    <option key={action} value={action}>
                      {getActionLabel(action)}
                    </option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                  <ChevronDown className="h-5 w-5 text-gray-400" aria-hidden="true" />
                </div>
              </div>
            </div>

            {/* Entity Filter */}
            <div>
              <label htmlFor="entityFilter" className="mb-2 block text-sm font-medium text-gray-700">
                {t('inspector.filter_by_entity')}
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <FileText className="h-5 w-5 text-gray-400" aria-hidden="true" />
                </div>
                <select
                  id="entityFilter"
                  name="entityFilter"
                  className="block h-10 w-full appearance-none rounded-md border border-gray-300 bg-white pl-10 pr-10 text-sm shadow-sm focus:border-primary focus:outline-none focus:ring-primary hover:border-gray-400"
                  value={selectedEntity}
                  onChange={handleEntityChange}
                >
                  <option value="">{t('inspector.all_entities')}</option>
                  {filterOptions.entities.map((entity) => (
                    <option key={entity} value={entity}>
                      {entity}
                    </option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                  <ChevronDown className="h-5 w-5 text-gray-400" aria-hidden="true" />
                </div>
              </div>
            </div>

            {/* Reset Filters */}
            <div className="flex items-end">
              <button
                type="button"
                onClick={handleResetFilters}
                className="inline-flex h-10 w-full items-center justify-center rounded-md border border-gray-300 bg-white px-4 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
              >
                <RefreshCw className="-ml-1 mr-2 h-5 w-5 text-gray-400" aria-hidden="true" />
                {t('inspector.reset_filters')}
              </button>
            </div>

            {/* Results Count */}
            <div className="flex items-end justify-end">
              <span className="text-sm text-gray-500">
                {t('inspector.showing_results', {
                  count: logs.length,
                  total: totalLogs,
                })}
              </span>
            </div>
          </div>
        </div>

        {/* Logs Table */}
        {isLoading ? (
          <div className="flex h-64 items-center justify-center">
            <div className="h-32 w-32 animate-spin rounded-full border-b-2 border-t-2 border-primary"></div>
          </div>
        ) : logs.length === 0 ? (
          <div className="rounded-md bg-yellow-50 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <AlertTriangle className="h-5 w-5 text-yellow-400" aria-hidden="true" />
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-yellow-800">
                  {t('inspector.no_logs_found')}
                </h3>
                <div className="mt-2 text-sm text-yellow-700">
                  <p>{t('inspector.no_logs_found_description')}</p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
            <table className="min-w-full divide-y divide-gray-300">
              <thead className="bg-gray-50">
                <tr>
                  <th
                    scope="col"
                    className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6"
                  >
                    {t('inspector.timestamp')}
                  </th>
                  <th
                    scope="col"
                    className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                  >
                    {t('inspector.user')}
                  </th>
                  <th
                    scope="col"
                    className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                  >
                    {t('inspector.action')}
                  </th>
                  <th
                    scope="col"
                    className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                  >
                    {t('inspector.entity')}
                  </th>
                  <th
                    scope="col"
                    className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                  >
                    {t('inspector.status')}
                  </th>
                  <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                    <span className="sr-only">{t('inspector.view')}</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50">
                    <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm sm:pl-6">
                      <div className="font-medium text-gray-900">{formatDate(log.timestamp)}</div>
                      <div className="text-gray-500">{formatTime(log.timestamp)}</div>
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                      <div className="font-medium text-gray-900">{log.user_email || 'System'}</div>
                      <div className="text-gray-500">{log.user_id ? `ID: ${log.user_id}` : 'N/A'}</div>
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                      <div className="flex items-center">
                        {getActionIcon(log.action)}
                        <span className="ml-2">{getActionLabel(log.action)}</span>
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                      <div className="font-medium text-gray-900">{log.entity_type || 'N/A'}</div>
                      <div className="text-gray-500">{log.entity_id ? `ID: ${log.entity_id}` : 'N/A'}</div>
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                      <span
                        className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${getStatusBadgeColor(
                          'success' // Default to success since audit logs are typically successful
                        )}`}
                      >
                        Success
                      </span>
                    </td>
                    <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                      <button
                        type="button"
                        onClick={() => handleViewLogDetail(log)}
                        className="text-primary hover:text-primary-dark"
                      >
                        {t('inspector.view_details')}
                        <span className="sr-only">, {log.id}</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {logs.length > 0 && (
          <div className="mt-4 flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 sm:px-6">
            <div className="flex flex-1 justify-between sm:hidden">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="relative inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                {t('inspector.previous')}
              </button>
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="relative ml-3 inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                {t('inspector.next')}
              </button>
            </div>
            <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  {t('inspector.showing')}{' '}
                  <span className="font-medium">
                    {(currentPage - 1) * itemsPerPage + 1}
                  </span>{' '}
                  {t('inspector.to')}{' '}
                  <span className="font-medium">
                    {Math.min(currentPage * itemsPerPage, logs.length)}
                  </span>{' '}
                  {t('inspector.of')}{' '}
                  <span className="font-medium">{totalLogs}</span>{' '}
                  {t('inspector.results')}
                </p>
              </div>
              <div>
                <nav
                  className="isolate inline-flex -space-x-px rounded-md shadow-sm"
                  aria-label="Pagination"
                >
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0"
                  >
                    <span className="sr-only">{t('inspector.previous')}</span>
                    <ChevronLeft className="h-5 w-5" aria-hidden="true" />
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <button
                      key={page}
                      onClick={() => handlePageChange(page)}
                      className={`relative inline-flex items-center px-4 py-2 text-sm font-semibold ${currentPage === page
                        ? 'z-10 bg-primary text-white focus:z-20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary'
                        : 'text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0'
                        }`}
                    >
                      {page}
                    </button>
                  ))}
                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0"
                  >
                    <span className="sr-only">{t('inspector.next')}</span>
                    <ChevronRight className="h-5 w-5" aria-hidden="true" />
                  </button>
                </nav>
              </div>
            </div>
          </div>
        )}

        {/* Log Detail Modal */}
        {showDetailModal && selectedLog && (
          <div className="fixed inset-0 z-10 overflow-y-auto">
            <div className="flex min-h-screen items-end justify-center px-4 pb-20 pt-4 text-center sm:block sm:p-0">
              <div className="fixed inset-0 transition-opacity" aria-hidden="true">
                <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
              </div>

              <span
                className="hidden sm:inline-block sm:h-screen sm:align-middle"
                aria-hidden="true"
              >
                &#8203;
              </span>

              <div className="inline-block transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-left align-bottom shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:p-6 sm:align-middle">
                <div>
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary-100">
                    {getActionIcon(selectedLog.action)}
                  </div>
                  <div className="mt-3 text-center sm:mt-5">
                    <h3 className="text-lg font-medium leading-6 text-gray-900">
                      {t('inspector.log_details')}
                    </h3>
                    <div className="mt-2">
                      <div className="mt-4 text-left">
                        <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
                          <div className="sm:col-span-1">
                            <dt className="text-sm font-medium text-gray-500">
                              {t('inspector.timestamp')}
                            </dt>
                            <dd className="mt-1 text-sm text-gray-900">
                              {formatDate(selectedLog.timestamp)} {formatTime(selectedLog.timestamp)}
                            </dd>
                          </div>
                          <div className="sm:col-span-1">
                            <dt className="text-sm font-medium text-gray-500">
                              {t('inspector.user')}
                            </dt>
                            <dd className="mt-1 text-sm text-gray-900">
                              {selectedLog.user_email} ({selectedLog.user_id ? `ID: ${selectedLog.user_id}` : 'N/A'})
                            </dd>
                          </div>
                          <div className="sm:col-span-1">
                            <dt className="text-sm font-medium text-gray-500">
                              {t('inspector.action')}
                            </dt>
                            <dd className="mt-1 text-sm text-gray-900">{getActionLabel(selectedLog.action)}</dd>
                          </div>
                          <div className="sm:col-span-1">
                            <dt className="text-sm font-medium text-gray-500">
                              {t('inspector.entity')}
                            </dt>
                            <dd className="mt-1 text-sm text-gray-900">
                              {selectedLog.entity_type} ({selectedLog.entity_id ? `ID: ${selectedLog.entity_id}` : 'N/A'})
                            </dd>
                          </div>
                          <div className="sm:col-span-1">
                            <dt className="text-sm font-medium text-gray-500">
                              {t('inspector.ip_address')}
                            </dt>
                            <dd className="mt-1 text-sm text-gray-900">{selectedLog.ip_address || 'N/A'}</dd>
                          </div>
                          <div className="sm:col-span-1">
                            <dt className="text-sm font-medium text-gray-500">
                              {t('inspector.status')}
                            </dt>
                            <dd className="mt-1 text-sm text-gray-900">
                              <span
                                className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${getStatusBadgeColor(
                                  'success' // Default to success since audit logs are typically successful
                                )}`}
                              >
                                Success
                              </span>
                            </dd>
                          </div>
                          <div className="sm:col-span-2">
                            <dt className="text-sm font-medium text-gray-500">
                              {t('inspector.details')}
                            </dt>
                            <dd className="mt-1 text-sm text-gray-900">
                              {selectedLog.details ? (
                                typeof selectedLog.details === 'object' ? 
                                  JSON.stringify(selectedLog.details, null, 2) : 
                                  selectedLog.details
                              ) : 'No additional details'}
                            </dd>
                          </div>
                        </dl>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="mt-5 sm:mt-6">
                  <button
                    type="button"
                    className="inline-flex w-full justify-center rounded-md border border-transparent bg-primary px-4 py-2 text-base font-medium text-white shadow-sm hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 sm:text-sm"
                    onClick={() => setShowDetailModal(false)}
                  >
                    {t('inspector.close')}
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

export default AuditLogPage