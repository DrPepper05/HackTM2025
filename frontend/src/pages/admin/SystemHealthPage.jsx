import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../../hooks/useAuth'
import {
  Server,
  Database,
  HardDrive,
  Cpu,
  Activity,
  AlertTriangle,
  CheckCircle,
  RefreshCw,
  Clock,
  Users,
  FileText,
  BarChart,
  LineChart,
  PieChart,
} from 'lucide-react'

function SystemHealthPage() {
  const { t } = useTranslation()
  const { user } = useAuth()
  const [isLoading, setIsLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [lastUpdated, setLastUpdated] = useState(new Date())
  const [systemStatus, setSystemStatus] = useState({
    overall: 'healthy', // healthy, warning, critical
    components: [],
    resources: {},
    alerts: [],
    metrics: {},
  })

  // Fetch system health data
  const fetchSystemHealth = async () => {
    setRefreshing(true)
    try {
      // In a real app, this would be an API call
      // For the hackathon, we'll use mock data
      await new Promise((resolve) => setTimeout(resolve, 1500))

      // Mock system health data
      const mockSystemStatus = {
        overall: Math.random() > 0.8 ? 'warning' : 'healthy',
        components: [
          {
            id: 'web_server',
            name: t('admin.web_server'),
            status: Math.random() > 0.9 ? 'warning' : 'healthy',
            uptime: '15d 7h 23m',
            icon: <Server className="h-5 w-5" />,
          },
          {
            id: 'database',
            name: t('admin.database'),
            status: Math.random() > 0.95 ? 'critical' : 'healthy',
            uptime: '30d 12h 45m',
            icon: <Database className="h-5 w-5" />,
          },
          {
            id: 'storage',
            name: t('admin.storage'),
            status: 'healthy',
            uptime: '30d 12h 45m',
            icon: <HardDrive className="h-5 w-5" />,
          },
          {
            id: 'auth_service',
            name: t('admin.auth_service'),
            status: 'healthy',
            uptime: '10d 5h 17m',
            icon: <Users className="h-5 w-5" />,
          },
          {
            id: 'search_service',
            name: t('admin.search_service'),
            status: Math.random() > 0.85 ? 'warning' : 'healthy',
            uptime: '5d 18h 32m',
            icon: <FileText className="h-5 w-5" />,
          },
        ],
        resources: {
          cpu: Math.floor(Math.random() * 30) + 10, // 10-40%
          memory: Math.floor(Math.random() * 40) + 30, // 30-70%
          disk: Math.floor(Math.random() * 20) + 60, // 60-80%
          network: {
            in: Math.floor(Math.random() * 100) + 50, // 50-150 Mbps
            out: Math.floor(Math.random() * 80) + 20, // 20-100 Mbps
          },
        },
        alerts: [
          {
            id: 'alert1',
            severity: 'warning',
            message: t('admin.high_cpu_usage'),
            component: 'web_server',
            timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(), // 30 minutes ago
          },
          {
            id: 'alert2',
            severity: 'info',
            message: t('admin.scheduled_maintenance'),
            component: 'all',
            timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2 hours ago
          },
          {
            id: 'alert3',
            severity: Math.random() > 0.7 ? 'critical' : 'warning',
            message: t('admin.database_connection_issues'),
            component: 'database',
            timestamp: new Date(Date.now() - 1000 * 60 * 10).toISOString(), // 10 minutes ago
          },
        ],
        metrics: {
          documentsProcessed: {
            today: Math.floor(Math.random() * 100) + 50,
            week: Math.floor(Math.random() * 500) + 300,
            month: Math.floor(Math.random() * 2000) + 1000,
          },
          activeUsers: {
            now: Math.floor(Math.random() * 20) + 5,
            today: Math.floor(Math.random() * 50) + 30,
            week: Math.floor(Math.random() * 200) + 100,
          },
          apiRequests: {
            hour: Math.floor(Math.random() * 1000) + 500,
            day: Math.floor(Math.random() * 10000) + 5000,
          },
          searchQueries: {
            hour: Math.floor(Math.random() * 200) + 100,
            day: Math.floor(Math.random() * 2000) + 1000,
          },
        },
      }

      setSystemStatus(mockSystemStatus)
      setLastUpdated(new Date())
    } catch (error) {
      console.error('Error fetching system health:', error)
    } finally {
      setIsLoading(false)
      setRefreshing(false)
    }
  }

  // Initial data fetch
  useEffect(() => {
    fetchSystemHealth()

    // Set up auto-refresh every 5 minutes
    const intervalId = setInterval(() => {
      fetchSystemHealth()
    }, 5 * 60 * 1000)

    return () => clearInterval(intervalId)
  }, [])

  // Handle manual refresh
  const handleRefresh = () => {
    fetchSystemHealth()
  }

  // Format date for display
  const formatDateTime = (date) => {
    return date.toLocaleString()
  }

  // Format time ago
  const formatTimeAgo = (dateString) => {
    const date = new Date(dateString)
    const seconds = Math.floor((new Date() - date) / 1000)

    let interval = seconds / 31536000
    if (interval > 1) return Math.floor(interval) + ' ' + t('admin.years_ago')

    interval = seconds / 2592000
    if (interval > 1) return Math.floor(interval) + ' ' + t('admin.months_ago')

    interval = seconds / 86400
    if (interval > 1) return Math.floor(interval) + ' ' + t('admin.days_ago')

    interval = seconds / 3600
    if (interval > 1) return Math.floor(interval) + ' ' + t('admin.hours_ago')

    interval = seconds / 60
    if (interval > 1) return Math.floor(interval) + ' ' + t('admin.minutes_ago')

    return Math.floor(seconds) + ' ' + t('admin.seconds_ago')
  }

  // Get status color
  const getStatusColor = (status) => {
    switch (status) {
      case 'healthy':
        return 'text-green-500'
      case 'warning':
        return 'text-yellow-500'
      case 'critical':
        return 'text-red-500'
      default:
        return 'text-gray-500'
    }
  }

  // Get status icon
  const getStatusIcon = (status) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle className={`h-5 w-5 text-green-500`} />
      case 'warning':
        return <AlertTriangle className={`h-5 w-5 text-yellow-500`} />
      case 'critical':
        return <AlertTriangle className={`h-5 w-5 text-red-500`} />
      default:
        return <Activity className={`h-5 w-5 text-gray-500`} />
    }
  }

  // Get severity icon
  const getSeverityIcon = (severity) => {
    switch (severity) {
      case 'critical':
        return <AlertTriangle className="h-5 w-5 text-red-500" />
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />
      case 'info':
        return <Activity className="h-5 w-5 text-blue-500" />
      default:
        return <Activity className="h-5 w-5 text-gray-500" />
    }
  }

  // Get resource usage color
  const getResourceColor = (percentage) => {
    if (percentage >= 80) return 'text-red-500'
    if (percentage >= 60) return 'text-yellow-500'
    return 'text-green-500'
  }

  return (
    <div className="bg-white">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="mb-8 md:flex md:items-center md:justify-between">
          <div className="min-w-0 flex-1">
            <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:text-3xl sm:tracking-tight">
              {t('admin.system_health')}
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              {t('admin.system_health_description')}
            </p>
          </div>
          <div className="mt-4 flex md:ml-4 md:mt-0">
            <span className="ml-3 inline-flex items-center text-sm text-gray-500">
              <Clock className="mr-1 h-4 w-4 text-gray-400" />
              {t('admin.last_updated')}: {formatDateTime(lastUpdated)}
            </span>
            <button
              type="button"
              onClick={handleRefresh}
              disabled={refreshing}
              className="ml-3 inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:opacity-50"
            >
              <RefreshCw
                className={`-ml-1 mr-2 h-5 w-5 text-gray-400 ${refreshing ? 'animate-spin' : ''}`}
                aria-hidden="true"
              />
              {refreshing ? t('admin.refreshing') : t('admin.refresh')}
            </button>
          </div>
        </div>

        {isLoading ? (
          <div className="flex h-64 items-center justify-center">
            <RefreshCw className="h-8 w-8 animate-spin text-primary" />
            <span className="ml-2 text-lg font-medium text-gray-700">
              {t('admin.loading_system_health')}
            </span>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
            {/* System Status Overview */}
            <div className="lg:col-span-1">
              <div className="rounded-lg bg-white p-6 shadow">
                <h3 className="text-lg font-medium leading-6 text-gray-900">
                  {t('admin.system_status')}
                </h3>

                <div className="mt-6">
                  <div className="flex items-center">
                    <div
                      className={`flex h-12 w-12 items-center justify-center rounded-md ${getStatusColor(
                        systemStatus.overall
                      )} bg-opacity-10`}
                    >
                      {getStatusIcon(systemStatus.overall)}
                    </div>
                    <div className="ml-4">
                      <h4 className="text-lg font-medium text-gray-900">
                        {systemStatus.overall === 'healthy'
                          ? t('admin.system_healthy')
                          : systemStatus.overall === 'warning'
                          ? t('admin.system_warning')
                          : t('admin.system_critical')}
                      </h4>
                      <p className="text-sm text-gray-500">
                        {systemStatus.overall === 'healthy'
                          ? t('admin.system_healthy_description')
                          : systemStatus.overall === 'warning'
                          ? t('admin.system_warning_description')
                          : t('admin.system_critical_description')}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-6">
                  <h4 className="text-sm font-medium text-gray-700">
                    {t('admin.component_status')}
                  </h4>
                  <ul role="list" className="mt-3 divide-y divide-gray-200">
                    {systemStatus.components.map((component) => (
                      <li key={component.id} className="py-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <div
                              className={`flex h-8 w-8 items-center justify-center rounded-md ${getStatusColor(
                                component.status
                              )} bg-opacity-10`}
                            >
                              {component.icon}
                            </div>
                            <div className="ml-3">
                              <p className="text-sm font-medium text-gray-900">{component.name}</p>
                              <p className="text-xs text-gray-500">
                                {t('admin.uptime')}: {component.uptime}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center">
                            <span
                              className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${getStatusColor(
                                component.status
                              )} bg-opacity-10`}
                            >
                              {getStatusIcon(component.status)}
                              <span className="ml-1">
                                {component.status === 'healthy'
                                  ? t('admin.healthy')
                                  : component.status === 'warning'
                                  ? t('admin.warning')
                                  : t('admin.critical')}
                              </span>
                            </span>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Alerts */}
              <div className="mt-8 rounded-lg bg-white p-6 shadow">
                <h3 className="text-lg font-medium leading-6 text-gray-900">
                  {t('admin.alerts')}
                </h3>
                <div className="mt-6 flow-root">
                  {systemStatus.alerts.length > 0 ? (
                    <ul role="list" className="-my-5 divide-y divide-gray-200">
                      {systemStatus.alerts.map((alert) => (
                        <li key={alert.id} className="py-4">
                          <div className="flex items-center space-x-4">
                            <div className="flex-shrink-0">
                              {getSeverityIcon(alert.severity)}
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-sm font-medium text-gray-900">
                                {alert.message}
                              </p>
                              <p className="truncate text-sm text-gray-500">
                                {formatTimeAgo(alert.timestamp)}
                              </p>
                            </div>
                          </div>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <div className="rounded-md bg-green-50 p-4">
                      <div className="flex">
                        <div className="flex-shrink-0">
                          <CheckCircle
                            className="h-5 w-5 text-green-400"
                            aria-hidden="true"
                          />
                        </div>
                        <div className="ml-3">
                          <p className="text-sm font-medium text-green-800">
                            {t('admin.no_alerts')}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Resource Usage */}
            <div className="lg:col-span-2">
              <div className="rounded-lg bg-white p-6 shadow">
                <h3 className="text-lg font-medium leading-6 text-gray-900">
                  {t('admin.resource_usage')}
                </h3>

                <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
                  {/* CPU Usage */}
                  <div className="overflow-hidden rounded-lg bg-white px-4 py-5 shadow sm:p-6">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <Cpu
                          className={`h-6 w-6 ${getResourceColor(
                            systemStatus.resources.cpu
                          )}`}
                          aria-hidden="true"
                        />
                      </div>
                      <div className="ml-5 w-0 flex-1">
                        <dl>
                          <dt className="truncate text-sm font-medium text-gray-500">
                            {t('admin.cpu_usage')}
                          </dt>
                          <dd>
                            <div className="flex items-baseline">
                              <div
                                className={`text-2xl font-semibold ${getResourceColor(
                                  systemStatus.resources.cpu
                                )}`}
                              >
                                {systemStatus.resources.cpu}%
                              </div>
                            </div>
                          </dd>
                        </dl>
                      </div>
                    </div>
                    <div className="mt-4">
                      <div className="relative h-2 overflow-hidden rounded-full bg-gray-200">
                        <div
                          className={`absolute h-full rounded-full ${systemStatus.resources.cpu >= 80
                            ? 'bg-red-500'
                            : systemStatus.resources.cpu >= 60
                            ? 'bg-yellow-500'
                            : 'bg-green-500'
                            }`}
                          style={{ width: `${systemStatus.resources.cpu}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Memory Usage */}
                  <div className="overflow-hidden rounded-lg bg-white px-4 py-5 shadow sm:p-6">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <Server
                          className={`h-6 w-6 ${getResourceColor(
                            systemStatus.resources.memory
                          )}`}
                          aria-hidden="true"
                        />
                      </div>
                      <div className="ml-5 w-0 flex-1">
                        <dl>
                          <dt className="truncate text-sm font-medium text-gray-500">
                            {t('admin.memory_usage')}
                          </dt>
                          <dd>
                            <div className="flex items-baseline">
                              <div
                                className={`text-2xl font-semibold ${getResourceColor(
                                  systemStatus.resources.memory
                                )}`}
                              >
                                {systemStatus.resources.memory}%
                              </div>
                            </div>
                          </dd>
                        </dl>
                      </div>
                    </div>
                    <div className="mt-4">
                      <div className="relative h-2 overflow-hidden rounded-full bg-gray-200">
                        <div
                          className={`absolute h-full rounded-full ${systemStatus.resources.memory >= 80
                            ? 'bg-red-500'
                            : systemStatus.resources.memory >= 60
                            ? 'bg-yellow-500'
                            : 'bg-green-500'
                            }`}
                          style={{ width: `${systemStatus.resources.memory}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Disk Usage */}
                  <div className="overflow-hidden rounded-lg bg-white px-4 py-5 shadow sm:p-6">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <HardDrive
                          className={`h-6 w-6 ${getResourceColor(
                            systemStatus.resources.disk
                          )}`}
                          aria-hidden="true"
                        />
                      </div>
                      <div className="ml-5 w-0 flex-1">
                        <dl>
                          <dt className="truncate text-sm font-medium text-gray-500">
                            {t('admin.disk_usage')}
                          </dt>
                          <dd>
                            <div className="flex items-baseline">
                              <div
                                className={`text-2xl font-semibold ${getResourceColor(
                                  systemStatus.resources.disk
                                )}`}
                              >
                                {systemStatus.resources.disk}%
                              </div>
                            </div>
                          </dd>
                        </dl>
                      </div>
                    </div>
                    <div className="mt-4">
                      <div className="relative h-2 overflow-hidden rounded-full bg-gray-200">
                        <div
                          className={`absolute h-full rounded-full ${systemStatus.resources.disk >= 80
                            ? 'bg-red-500'
                            : systemStatus.resources.disk >= 60
                            ? 'bg-yellow-500'
                            : 'bg-green-500'
                            }`}
                          style={{ width: `${systemStatus.resources.disk}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Network Usage */}
                  <div className="overflow-hidden rounded-lg bg-white px-4 py-5 shadow sm:p-6">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <Activity className="h-6 w-6 text-blue-500" aria-hidden="true" />
                      </div>
                      <div className="ml-5 w-0 flex-1">
                        <dl>
                          <dt className="truncate text-sm font-medium text-gray-500">
                            {t('admin.network_usage')}
                          </dt>
                          <dd>
                            <div className="flex items-baseline">
                              <div className="text-2xl font-semibold text-blue-500">
                                {systemStatus.resources.network.in} Mbps
                              </div>
                            </div>
                          </dd>
                        </dl>
                      </div>
                    </div>
                    <div className="mt-1">
                      <p className="text-sm text-gray-500">
                        <span className="font-medium text-blue-500">
                          ↑ {systemStatus.resources.network.out} Mbps
                        </span>{' '}
                        {t('admin.outbound')}
                      </p>
                    </div>
                  </div>
                </div>

                {/* System Metrics */}
                <div className="mt-8">
                  <h4 className="text-sm font-medium text-gray-700">
                    {t('admin.system_metrics')}
                  </h4>

                  <div className="mt-4 grid grid-cols-1 gap-5 sm:grid-cols-2">
                    {/* Documents Processed */}
                    <div className="overflow-hidden rounded-lg bg-white px-4 py-5 shadow sm:p-6">
                      <div className="flex items-center">
                        <div className="flex-shrink-0">
                          <FileText className="h-6 w-6 text-primary" aria-hidden="true" />
                        </div>
                        <div className="ml-5 w-0 flex-1">
                          <dl>
                            <dt className="truncate text-sm font-medium text-gray-500">
                              {t('admin.documents_processed')}
                            </dt>
                            <dd>
                              <div className="flex items-baseline">
                                <div className="text-2xl font-semibold text-gray-900">
                                  {systemStatus.metrics.documentsProcessed.today}
                                </div>
                                <p className="ml-2 text-sm text-gray-500">
                                  {t('admin.today')}
                                </p>
                              </div>
                            </dd>
                          </dl>
                        </div>
                      </div>
                      <div className="mt-1">
                        <p className="text-sm text-gray-500">
                          {systemStatus.metrics.documentsProcessed.week}{' '}
                          {t('admin.this_week')} • {systemStatus.metrics.documentsProcessed.month}{' '}
                          {t('admin.this_month')}
                        </p>
                      </div>
                    </div>

                    {/* Active Users */}
                    <div className="overflow-hidden rounded-lg bg-white px-4 py-5 shadow sm:p-6">
                      <div className="flex items-center">
                        <div className="flex-shrink-0">
                          <Users className="h-6 w-6 text-primary" aria-hidden="true" />
                        </div>
                        <div className="ml-5 w-0 flex-1">
                          <dl>
                            <dt className="truncate text-sm font-medium text-gray-500">
                              {t('admin.active_users')}
                            </dt>
                            <dd>
                              <div className="flex items-baseline">
                                <div className="text-2xl font-semibold text-gray-900">
                                  {systemStatus.metrics.activeUsers.now}
                                </div>
                                <p className="ml-2 text-sm text-gray-500">
                                  {t('admin.right_now')}
                                </p>
                              </div>
                            </dd>
                          </dl>
                        </div>
                      </div>
                      <div className="mt-1">
                        <p className="text-sm text-gray-500">
                          {systemStatus.metrics.activeUsers.today} {t('admin.today')} •{' '}
                          {systemStatus.metrics.activeUsers.week} {t('admin.this_week')}
                        </p>
                      </div>
                    </div>

                    {/* API Requests */}
                    <div className="overflow-hidden rounded-lg bg-white px-4 py-5 shadow sm:p-6">
                      <div className="flex items-center">
                        <div className="flex-shrink-0">
                          <Activity className="h-6 w-6 text-primary" aria-hidden="true" />
                        </div>
                        <div className="ml-5 w-0 flex-1">
                          <dl>
                            <dt className="truncate text-sm font-medium text-gray-500">
                              {t('admin.api_requests')}
                            </dt>
                            <dd>
                              <div className="flex items-baseline">
                                <div className="text-2xl font-semibold text-gray-900">
                                  {systemStatus.metrics.apiRequests.hour}
                                </div>
                                <p className="ml-2 text-sm text-gray-500">
                                  {t('admin.last_hour')}
                                </p>
                              </div>
                            </dd>
                          </dl>
                        </div>
                      </div>
                      <div className="mt-1">
                        <p className="text-sm text-gray-500">
                          {systemStatus.metrics.apiRequests.day} {t('admin.today')}
                        </p>
                      </div>
                    </div>

                    {/* Search Queries */}
                    <div className="overflow-hidden rounded-lg bg-white px-4 py-5 shadow sm:p-6">
                      <div className="flex items-center">
                        <div className="flex-shrink-0">
                          <Search className="h-6 w-6 text-primary" aria-hidden="true" />
                        </div>
                        <div className="ml-5 w-0 flex-1">
                          <dl>
                            <dt className="truncate text-sm font-medium text-gray-500">
                              {t('admin.search_queries')}
                            </dt>
                            <dd>
                              <div className="flex items-baseline">
                                <div className="text-2xl font-semibold text-gray-900">
                                  {systemStatus.metrics.searchQueries.hour}
                                </div>
                                <p className="ml-2 text-sm text-gray-500">
                                  {t('admin.last_hour')}
                                </p>
                              </div>
                            </dd>
                          </dl>
                        </div>
                      </div>
                      <div className="mt-1">
                        <p className="text-sm text-gray-500">
                          {systemStatus.metrics.searchQueries.day} {t('admin.today')}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Charts Placeholder */}
                <div className="mt-8">
                  <h4 className="text-sm font-medium text-gray-700">
                    {t('admin.performance_charts')}
                  </h4>

                  <div className="mt-4 grid grid-cols-1 gap-5 sm:grid-cols-2">
                    {/* CPU & Memory Chart */}
                    <div className="overflow-hidden rounded-lg bg-white px-4 py-5 shadow sm:p-6">
                      <div className="flex items-center justify-between">
                        <h5 className="text-sm font-medium text-gray-700">
                          {t('admin.cpu_memory_usage')}
                        </h5>
                        <div className="flex space-x-2">
                          <span className="inline-flex items-center text-xs text-gray-500">
                            <div className="mr-1 h-2 w-2 rounded-full bg-blue-500"></div>
                            {t('admin.cpu')}
                          </span>
                          <span className="inline-flex items-center text-xs text-gray-500">
                            <div className="mr-1 h-2 w-2 rounded-full bg-green-500"></div>
                            {t('admin.memory')}
                          </span>
                        </div>
                      </div>
                      <div className="mt-4 flex h-64 items-center justify-center">
                        <LineChart className="h-12 w-12 text-gray-300" />
                        <p className="ml-2 text-sm text-gray-500">
                          {t('admin.chart_placeholder')}
                        </p>
                      </div>
                    </div>

                    {/* Network Traffic Chart */}
                    <div className="overflow-hidden rounded-lg bg-white px-4 py-5 shadow sm:p-6">
                      <div className="flex items-center justify-between">
                        <h5 className="text-sm font-medium text-gray-700">
                          {t('admin.network_traffic')}
                        </h5>
                        <div className="flex space-x-2">
                          <span className="inline-flex items-center text-xs text-gray-500">
                            <div className="mr-1 h-2 w-2 rounded-full bg-blue-500"></div>
                            {t('admin.inbound')}
                          </span>
                          <span className="inline-flex items-center text-xs text-gray-500">
                            <div className="mr-1 h-2 w-2 rounded-full bg-green-500"></div>
                            {t('admin.outbound')}
                          </span>
                        </div>
                      </div>
                      <div className="mt-4 flex h-64 items-center justify-center">
                        <BarChart className="h-12 w-12 text-gray-300" />
                        <p className="ml-2 text-sm text-gray-500">
                          {t('admin.chart_placeholder')}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default SystemHealthPage