import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../../hooks/useAuth'
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
} from 'lucide-react'

function AuditLogPage() {
  const { t } = useTranslation()
  const { user } = useAuth()
  const [isLoading, setIsLoading] = useState(true)
  const [logs, setLogs] = useState([])
  const [filteredLogs, setFilteredLogs] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [itemsPerPage] = useState(10)
  const [dateRange, setDateRange] = useState({ from: '', to: '' })
  const [selectedUser, setSelectedUser] = useState('')
  const [selectedAction, setSelectedAction] = useState('')
  const [selectedEntity, setSelectedEntity] = useState('')
  const [users, setUsers] = useState([])
  const [actions, setActions] = useState([])
  const [entities, setEntities] = useState([])
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [selectedLog, setSelectedLog] = useState(null)

  // Fetch audit logs
  useEffect(() => {
    const fetchAuditLogs = async () => {
      setIsLoading(true)
      try {
        // In a real app, this would be an API call
        // For the hackathon, we'll use mock data
        await new Promise((resolve) => setTimeout(resolve, 1000))

        // Generate mock audit logs
        const mockLogs = generateMockAuditLogs(100)
        setLogs(mockLogs)

        // Extract unique users, actions, and entities for filters
        const uniqueUsers = [...new Set(mockLogs.map((log) => log.userName))]
        const uniqueActions = [...new Set(mockLogs.map((log) => log.action))]
        const uniqueEntities = [...new Set(mockLogs.map((log) => log.entityType))]

        setUsers(uniqueUsers)
        setActions(uniqueActions)
        setEntities(uniqueEntities)

        // Apply initial filtering
        applyFilters(mockLogs)
      } catch (error) {
        console.error('Error fetching audit logs:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchAuditLogs()
  }, [])

  // Apply filters when search term or filters change
  useEffect(() => {
    applyFilters(logs)
  }, [searchTerm, dateRange, selectedUser, selectedAction, selectedEntity, logs])

  // Generate mock audit logs
  const generateMockAuditLogs = (count) => {
    const actionTypes = [
      { id: 'document_upload', name: t('inspector.action_document_upload') },
      { id: 'document_view', name: t('inspector.action_document_view') },
      { id: 'document_download', name: t('inspector.action_document_download') },
      { id: 'document_update', name: t('inspector.action_document_update') },
      { id: 'document_delete', name: t('inspector.action_document_delete') },
      { id: 'document_approve', name: t('inspector.action_document_approve') },
      { id: 'document_reject', name: t('inspector.action_document_reject') },
      { id: 'document_redact', name: t('inspector.action_document_redact') },
      { id: 'user_login', name: t('inspector.action_user_login') },
      { id: 'user_logout', name: t('inspector.action_user_logout') },
      { id: 'user_create', name: t('inspector.action_user_create') },
      { id: 'user_update', name: t('inspector.action_user_update') },
      { id: 'user_delete', name: t('inspector.action_user_delete') },
      { id: 'system_config', name: t('inspector.action_system_config') },
    ]

    const entityTypes = [
      { id: 'document', name: t('inspector.entity_document') },
      { id: 'user', name: t('inspector.entity_user') },
      { id: 'system', name: t('inspector.entity_system') },
    ]

    const users = [
      { id: 'user1', name: 'Ion Popescu', role: 'clerk' },
      { id: 'user2', name: 'Maria Ionescu', role: 'archivist' },
      { id: 'user3', name: 'Alexandru Popa', role: 'admin' },
      { id: 'user4', name: 'Elena Dumitrescu', role: 'clerk' },
      { id: 'user5', name: 'Andrei Radu', role: 'inspector' },
    ]

    const mockLogs = []

    for (let i = 0; i < count; i++) {
      const actionType = actionTypes[Math.floor(Math.random() * actionTypes.length)]
      const entityType = entityTypes.find((entity) =>
        actionType.id.startsWith(entity.id) ? entity : entityTypes[0]
      )
      const user = users[Math.floor(Math.random() * users.length)]

      // Generate a random date within the last 30 days
      const date = new Date()
      date.setDate(date.getDate() - Math.floor(Math.random() * 30))

      mockLogs.push({
        id: `log-${i + 1}`,
        timestamp: date.toISOString(),
        userId: user.id,
        userName: user.name,
        userRole: user.role,
        action: actionType.id,
        actionName: actionType.name,
        entityId: `entity-${Math.floor(Math.random() * 1000) + 1}`,
        entityType: entityType.id,
        entityName: entityType.name,
        ipAddress: `192.168.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
        details: generateLogDetails(actionType.id, entityType.id),
        status: Math.random() > 0.1 ? 'success' : 'failure',
      })
    }

    // Sort by timestamp (newest first)
    return mockLogs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
  }

  // Generate log details based on action and entity type
  const generateLogDetails = (action, entityType) => {
    if (entityType === 'document') {
      const documentTypes = ['Hotărâre', 'Dispoziție', 'Contract', 'Autorizație', 'Certificat']
      const documentType = documentTypes[Math.floor(Math.random() * documentTypes.length)]
      const documentId = Math.floor(Math.random() * 1000) + 1

      switch (action) {
        case 'document_upload':
          return t('inspector.details_document_upload', {
            type: documentType,
            id: documentId,
          })
        case 'document_view':
          return t('inspector.details_document_view', {
            type: documentType,
            id: documentId,
          })
        case 'document_download':
          return t('inspector.details_document_download', {
            type: documentType,
            id: documentId,
          })
        case 'document_update':
          return t('inspector.details_document_update', {
            type: documentType,
            id: documentId,
          })
        case 'document_delete':
          return t('inspector.details_document_delete', {
            type: documentType,
            id: documentId,
          })
        case 'document_approve':
          return t('inspector.details_document_approve', {
            type: documentType,
            id: documentId,
          })
        case 'document_reject':
          return t('inspector.details_document_reject', {
            type: documentType,
            id: documentId,
          })
        case 'document_redact':
          return t('inspector.details_document_redact', {
            type: documentType,
            id: documentId,
          })
        default:
          return t('inspector.details_document_generic', {
            type: documentType,
            id: documentId,
          })
      }
    } else if (entityType === 'user') {
      const userNames = ['Ion Popescu', 'Maria Ionescu', 'Alexandru Popa', 'Elena Dumitrescu']
      const userName = userNames[Math.floor(Math.random() * userNames.length)]

      switch (action) {
        case 'user_login':
          return t('inspector.details_user_login', { name: userName })
        case 'user_logout':
          return t('inspector.details_user_logout', { name: userName })
        case 'user_create':
          return t('inspector.details_user_create', { name: userName })
        case 'user_update':
          return t('inspector.details_user_update', { name: userName })
        case 'user_delete':
          return t('inspector.details_user_delete', { name: userName })
        default:
          return t('inspector.details_user_generic', { name: userName })
      }
    } else {
      // System entity
      switch (action) {
        case 'system_config':
          return t('inspector.details_system_config')
        default:
          return t('inspector.details_system_generic')
      }
    }
  }

  // Apply filters to logs
  const applyFilters = (allLogs) => {
    if (!allLogs || allLogs.length === 0) return

    let filtered = [...allLogs]

    // Apply search term filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      filtered = filtered.filter(
        (log) =>
          log.userName.toLowerCase().includes(term) ||
          log.actionName.toLowerCase().includes(term) ||
          log.details.toLowerCase().includes(term) ||
          log.entityName.toLowerCase().includes(term)
      )
    }

    // Apply date range filter
    if (dateRange.from) {
      const fromDate = new Date(dateRange.from)
      fromDate.setHours(0, 0, 0, 0)
      filtered = filtered.filter((log) => new Date(log.timestamp) >= fromDate)
    }

    if (dateRange.to) {
      const toDate = new Date(dateRange.to)
      toDate.setHours(23, 59, 59, 999)
      filtered = filtered.filter((log) => new Date(log.timestamp) <= toDate)
    }

    // Apply user filter
    if (selectedUser) {
      filtered = filtered.filter((log) => log.userName === selectedUser)
    }

    // Apply action filter
    if (selectedAction) {
      filtered = filtered.filter((log) => log.action === selectedAction)
    }

    // Apply entity filter
    if (selectedEntity) {
      filtered = filtered.filter((log) => log.entityType === selectedEntity)
    }

    // Update filtered logs and pagination
    setFilteredLogs(filtered)
    setTotalPages(Math.ceil(filtered.length / itemsPerPage))
    setCurrentPage(1) // Reset to first page when filters change
  }

  // Handle search input change
  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value)
  }

  // Handle date range change
  const handleDateChange = (e) => {
    const { name, value } = e.target
    setDateRange((prev) => ({ ...prev, [name]: value }))
  }

  // Handle user filter change
  const handleUserChange = (e) => {
    setSelectedUser(e.target.value)
  }

  // Handle action filter change
  const handleActionChange = (e) => {
    setSelectedAction(e.target.value)
  }

  // Handle entity filter change
  const handleEntityChange = (e) => {
    setSelectedEntity(e.target.value)
  }

  // Handle page change
  const handlePageChange = (page) => {
    setCurrentPage(page)
  }

  // Reset all filters
  const handleResetFilters = () => {
    setSearchTerm('')
    setDateRange({ from: '', to: '' })
    setSelectedUser('')
    setSelectedAction('')
    setSelectedEntity('')
  }

  // Handle log detail view
  const handleViewLogDetail = (log) => {
    setSelectedLog(log)
    setShowDetailModal(true)
  }

  // Format date for display
  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleDateString()
  }

  // Format time for display
  const formatTime = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleTimeString()
  }

  // Get action icon based on action type
  const getActionIcon = (action) => {
    switch (action) {
      case 'document_upload':
        return <FileText className="h-5 w-5 text-green-500" />
      case 'document_view':
        return <Eye className="h-5 w-5 text-blue-500" />
      case 'document_download':
        return <Download className="h-5 w-5 text-blue-500" />
      case 'document_update':
        return <Pencil className="h-5 w-5 text-yellow-500" />
      case 'document_delete':
        return <Trash2 className="h-5 w-5 text-red-500" />
      case 'document_approve':
        return <Check className="h-5 w-5 text-green-500" />
      case 'document_reject':
        return <X className="h-5 w-5 text-red-500" />
      case 'document_redact':
        return <Lock className="h-5 w-5 text-yellow-500" />
      case 'user_login':
        return <Unlock className="h-5 w-5 text-green-500" />
      case 'user_logout':
        return <Lock className="h-5 w-5 text-gray-500" />
      case 'user_create':
        return <User className="h-5 w-5 text-green-500" />
      case 'user_update':
        return <Pencil className="h-5 w-5 text-yellow-500" />
      case 'user_delete':
        return <Trash2 className="h-5 w-5 text-red-500" />
      case 'system_config':
        return <Info className="h-5 w-5 text-blue-500" />
      default:
        return <Info className="h-5 w-5 text-gray-500" />
    }
  }

  // Get status badge color
  const getStatusBadgeColor = (status) => {
    switch (status) {
      case 'success':
        return 'bg-green-100 text-green-800'
      case 'failure':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  // Get current page items
  const getCurrentPageItems = () => {
    const startIndex = (currentPage - 1) * itemsPerPage
    const endIndex = startIndex + itemsPerPage
    return filteredLogs.slice(startIndex, endIndex)
  }

  // Export logs as CSV
  const handleExportLogs = () => {
    // In a real app, this would generate a CSV file with the filtered logs
    // For the hackathon, we'll just log to console
    console.log('Exporting logs:', filteredLogs)
    alert(t('inspector.export_success'))
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
          <div className="mb-4 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
            {/* Search */}
            <div>
              <label htmlFor="search" className="block text-sm font-medium text-gray-700">
                {t('inspector.search')}
              </label>
              <div className="relative mt-1 rounded-md shadow-sm">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <Search className="h-5 w-5 text-gray-400" aria-hidden="true" />
                </div>
                <input
                  type="text"
                  name="search"
                  id="search"
                  className="block w-full rounded-md border-gray-300 pl-10 focus:border-primary focus:ring-primary sm:text-sm"
                  placeholder={t('inspector.search_placeholder')}
                  value={searchTerm}
                  onChange={handleSearchChange}
                />
              </div>
            </div>

            {/* Date From */}
            <div>
              <label htmlFor="dateFrom" className="block text-sm font-medium text-gray-700">
                {t('inspector.date_from')}
              </label>
              <div className="relative mt-1 rounded-md shadow-sm">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <Calendar className="h-5 w-5 text-gray-400" aria-hidden="true" />
                </div>
                <input
                  type="date"
                  name="from"
                  id="dateFrom"
                  className="block w-full rounded-md border-gray-300 pl-10 focus:border-primary focus:ring-primary sm:text-sm"
                  value={dateRange.from}
                  onChange={handleDateChange}
                />
              </div>
            </div>

            {/* Date To */}
            <div>
              <label htmlFor="dateTo" className="block text-sm font-medium text-gray-700">
                {t('inspector.date_to')}
              </label>
              <div className="relative mt-1 rounded-md shadow-sm">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <Calendar className="h-5 w-5 text-gray-400" aria-hidden="true" />
                </div>
                <input
                  type="date"
                  name="to"
                  id="dateTo"
                  className="block w-full rounded-md border-gray-300 pl-10 focus:border-primary focus:ring-primary sm:text-sm"
                  value={dateRange.to}
                  onChange={handleDateChange}
                />
              </div>
            </div>

            {/* User Filter */}
            <div>
              <label htmlFor="userFilter" className="block text-sm font-medium text-gray-700">
                {t('inspector.filter_by_user')}
              </label>
              <select
                id="userFilter"
                name="userFilter"
                className="mt-1 block w-full rounded-md border-gray-300 py-2 pl-3 pr-10 text-base focus:border-primary focus:outline-none focus:ring-primary sm:text-sm"
                value={selectedUser}
                onChange={handleUserChange}
              >
                <option value="">{t('inspector.all_users')}</option>
                {users.map((user) => (
                  <option key={user} value={user}>
                    {user}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
            {/* Action Filter */}
            <div>
              <label htmlFor="actionFilter" className="block text-sm font-medium text-gray-700">
                {t('inspector.filter_by_action')}
              </label>
              <select
                id="actionFilter"
                name="actionFilter"
                className="mt-1 block w-full rounded-md border-gray-300 py-2 pl-3 pr-10 text-base focus:border-primary focus:outline-none focus:ring-primary sm:text-sm"
                value={selectedAction}
                onChange={handleActionChange}
              >
                <option value="">{t('inspector.all_actions')}</option>
                {actions.map((action) => (
                  <option key={action} value={action}>
                    {action}
                  </option>
                ))}
              </select>
            </div>

            {/* Entity Filter */}
            <div>
              <label htmlFor="entityFilter" className="block text-sm font-medium text-gray-700">
                {t('inspector.filter_by_entity')}
              </label>
              <select
                id="entityFilter"
                name="entityFilter"
                className="mt-1 block w-full rounded-md border-gray-300 py-2 pl-3 pr-10 text-base focus:border-primary focus:outline-none focus:ring-primary sm:text-sm"
                value={selectedEntity}
                onChange={handleEntityChange}
              >
                <option value="">{t('inspector.all_entities')}</option>
                {entities.map((entity) => (
                  <option key={entity} value={entity}>
                    {entity}
                  </option>
                ))}
              </select>
            </div>

            {/* Reset Filters */}
            <div className="flex items-end">
              <button
                type="button"
                onClick={handleResetFilters}
                className="inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
              >
                <RefreshCw className="-ml-1 mr-2 h-5 w-5 text-gray-400" aria-hidden="true" />
                {t('inspector.reset_filters')}
              </button>
            </div>

            {/* Results Count */}
            <div className="flex items-end justify-end">
              <span className="text-sm text-gray-500">
                {t('inspector.showing_results', {
                  count: filteredLogs.length,
                  total: logs.length,
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
        ) : filteredLogs.length === 0 ? (
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
                {getCurrentPageItems().map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50">
                    <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm sm:pl-6">
                      <div className="font-medium text-gray-900">{formatDate(log.timestamp)}</div>
                      <div className="text-gray-500">{formatTime(log.timestamp)}</div>
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                      <div className="font-medium text-gray-900">{log.userName}</div>
                      <div className="text-gray-500">{log.userRole}</div>
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                      <div className="flex items-center">
                        {getActionIcon(log.action)}
                        <span className="ml-2">{log.actionName}</span>
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                      <div className="font-medium text-gray-900">{log.entityName}</div>
                      <div className="text-gray-500">{log.entityId}</div>
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                      <span
                        className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${getStatusBadgeColor(
                          log.status
                        )}`}
                      >
                        {log.status}
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
        {filteredLogs.length > 0 && (
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
                    {Math.min(currentPage * itemsPerPage, filteredLogs.length)}
                  </span>{' '}
                  {t('inspector.of')}{' '}
                  <span className="font-medium">{filteredLogs.length}</span>{' '}
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
                              {selectedLog.userName} ({selectedLog.userRole})
                            </dd>
                          </div>
                          <div className="sm:col-span-1">
                            <dt className="text-sm font-medium text-gray-500">
                              {t('inspector.action')}
                            </dt>
                            <dd className="mt-1 text-sm text-gray-900">{selectedLog.actionName}</dd>
                          </div>
                          <div className="sm:col-span-1">
                            <dt className="text-sm font-medium text-gray-500">
                              {t('inspector.entity')}
                            </dt>
                            <dd className="mt-1 text-sm text-gray-900">
                              {selectedLog.entityName} ({selectedLog.entityId})
                            </dd>
                          </div>
                          <div className="sm:col-span-1">
                            <dt className="text-sm font-medium text-gray-500">
                              {t('inspector.ip_address')}
                            </dt>
                            <dd className="mt-1 text-sm text-gray-900">{selectedLog.ipAddress}</dd>
                          </div>
                          <div className="sm:col-span-1">
                            <dt className="text-sm font-medium text-gray-500">
                              {t('inspector.status')}
                            </dt>
                            <dd className="mt-1 text-sm text-gray-900">
                              <span
                                className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${getStatusBadgeColor(
                                  selectedLog.status
                                )}`}
                              >
                                {selectedLog.status}
                              </span>
                            </dd>
                          </div>
                          <div className="sm:col-span-2">
                            <dt className="text-sm font-medium text-gray-500">
                              {t('inspector.details')}
                            </dt>
                            <dd className="mt-1 text-sm text-gray-900">{selectedLog.details}</dd>
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