import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate, useLocation } from 'react-router-dom'
import { 
  List, 
  Clock, 
  HardDrive, 
  Users, 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  Play,
  FileText,
  Database,
  Activity
} from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import { adminApi } from '../../services/api'

function Dashboard() {
  const { t } = useTranslation()
  const { userRole, hasRole } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [dashboardData, setDashboardData] = useState(null)
  const [isLoading, setIsLoading] = useState(true)

  // Define the first available page for each role
  const roleRedirectMap = {
    archivist: '/archivist/ingest',
    clerk: '/documents/upload', 
    inspector: '/inspector/audit-logs',
    citizen: '/' // Redirect citizens to public homepage
  }

  useEffect(() => {
    // Only admin can access the dashboard main page
    if (userRole === 'admin') {
      console.log('Loading dashboard for admin')
      const fetchDashboardData = async () => {
        setIsLoading(true)
        try {
          const response = await adminApi.getDashboard()
          console.log('Dashboard data:', response.data)
          setDashboardData(response.data)
        } catch (error) {
          console.error('Error fetching dashboard data:', error)
        } finally {
          setIsLoading(false)
        }
      }

      fetchDashboardData()
      return
    }

    // All other roles should be redirected to their respective first page
    if (userRole && roleRedirectMap[userRole]) {
      console.log(`Redirecting ${userRole} to ${roleRedirectMap[userRole]}`)
      navigate(roleRedirectMap[userRole])
      return
    }

    // If user has a role but no redirect configured, show access pending message
    if (userRole) {
      console.log(`No redirect configured for role: ${userRole}`)
      setIsLoading(false)
      return
    }

    // If no role yet, wait for role to be determined
    setIsLoading(false)
  }, [userRole, navigate])

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = [t('dashboard.filesize.bytes'), t('dashboard.filesize.kb'), t('dashboard.filesize.mb'), t('dashboard.filesize.gb')]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  // Show loading while we determine the user's role and redirect
  if (isLoading || (userRole && userRole !== 'admin' && roleRedirectMap[userRole])) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="loading-spinner"></div>
          <p className="text-gray-600 text-sm mt-2">{t('common.loading')}</p>
        </div>
      </div>
    )
  }

  // If user has a role but is not admin and no redirect configured, show access pending
  if (userRole && userRole !== 'admin' && !roleRedirectMap[userRole]) {
    return (
      <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-6">
        <div className="mb-4 sm:mb-6">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">{t('dashboard.welcome')}</h1>
          <p className="text-gray-600 mt-2">{t('dashboard.welcome_message')}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4 sm:p-6">
          <div className="text-center">
            <AlertTriangle className="mx-auto h-10 sm:h-12 w-10 sm:w-12 text-yellow-500 mb-3 sm:mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">{t('dashboard.access_pending')}</h3>
            <p className="text-gray-600">
              {t('dashboard.access_pending_message')}
            </p>
          </div>
        </div>
      </div>
    )
  }

  // If no role or not admin, show unauthorized access message
  if (!userRole || userRole !== 'admin') {
    return (
      <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-6">
        <div className="mb-4 sm:mb-6">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">{t('dashboard.access_denied')}</h1>
        </div>
        <div className="bg-white rounded-lg shadow p-4 sm:p-6">
          <div className="text-center">
            <XCircle className="mx-auto h-10 sm:h-12 w-10 sm:w-12 text-red-500 mb-3 sm:mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">{t('dashboard.unauthorized')}</h3>
            <p className="text-gray-600">
              {t('dashboard.unauthorized_message')}
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-6">
      <div className="mb-4 sm:mb-6">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900">{t('dashboard.welcome')}</h1>
        <p className="text-gray-600 mt-2">{t('dashboard.system_overview')}</p>
      </div>

      {/* Queue Section */}
      <div className="mb-6 sm:mb-8">
        <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-3 sm:mb-4 flex items-center">
          <List className="mr-2 h-5 w-5" />
          {t('dashboard.processing_queue')}
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mb-3 sm:mb-4">
          <div className="bg-white rounded-lg shadow p-3 sm:p-4">
            <div className="flex items-center">
              <Clock className="h-6 sm:h-8 w-6 sm:w-8 text-yellow-500" />
              <div className="ml-3 sm:ml-4">
                <p className="text-xs sm:text-sm font-medium text-gray-600">{t('dashboard.pending')}</p>
                <p className="text-lg sm:text-2xl font-bold text-gray-900">{dashboardData?.queue?.pending || 0}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-3 sm:p-4">
            <div className="flex items-center">
              <Play className="h-6 sm:h-8 w-6 sm:w-8 text-blue-500" />
              <div className="ml-3 sm:ml-4">
                <p className="text-xs sm:text-sm font-medium text-gray-600">{t('dashboard.processing')}</p>
                <p className="text-lg sm:text-2xl font-bold text-gray-900">{dashboardData?.queue?.processing || 0}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-3 sm:p-4">
            <div className="flex items-center">
              <CheckCircle className="h-6 sm:h-8 w-6 sm:w-8 text-green-500" />
              <div className="ml-3 sm:ml-4">
                <p className="text-xs sm:text-sm font-medium text-gray-600">{t('dashboard.completed')}</p>
                <p className="text-lg sm:text-2xl font-bold text-gray-900">{dashboardData?.queue?.completed || 0}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-3 sm:p-4">
            <div className="flex items-center">
              <XCircle className="h-6 sm:h-8 w-6 sm:w-8 text-red-500" />
              <div className="ml-3 sm:ml-4">
                <p className="text-xs sm:text-sm font-medium text-gray-600">{t('dashboard.failed')}</p>
                <p className="text-lg sm:text-2xl font-bold text-gray-900">{dashboardData?.queue?.failed || 0}</p>
              </div>
            </div>
          </div>
        </div>
        
        {/* Queue by Type */}
        {dashboardData?.queue?.by_type && (
          <div className="bg-white rounded-lg shadow p-3 sm:p-4">
            <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-3 sm:mb-4">{t('dashboard.queue_by_type')}</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              {Object.entries(dashboardData.queue.by_type).map(([type, count]) => (
                <div key={type} className="flex justify-between items-center p-2 sm:p-3 bg-gray-50 rounded">
                  <span className="text-xs sm:text-sm font-medium text-gray-700">{type.replace(/_/g, ' ')}</span>
                  <span className="text-base sm:text-lg font-bold text-gray-900">{count}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Storage Section */}
      <div className="mb-6 sm:mb-8">
        <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-3 sm:mb-4 flex items-center">
          <HardDrive className="mr-2 h-5 w-5" />
          {t('dashboard.storage_overview')}
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-3 sm:mb-4">
          <div className="bg-white rounded-lg shadow p-3 sm:p-4">
            <div className="flex items-center">
              <FileText className="h-6 sm:h-8 w-6 sm:w-8 text-purple-500" />
              <div className="ml-3 sm:ml-4">
                <p className="text-xs sm:text-sm font-medium text-gray-600">{t('dashboard.total_files')}</p>
                <p className="text-lg sm:text-2xl font-bold text-gray-900">{dashboardData?.storage?.totalFiles || 0}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-3 sm:p-4">
            <div className="flex items-center">
              <Database className="h-6 sm:h-8 w-6 sm:w-8 text-indigo-500" />
              <div className="ml-3 sm:ml-4">
                <p className="text-xs sm:text-sm font-medium text-gray-600">{t('dashboard.total_size')}</p>
                <p className="text-lg sm:text-2xl font-bold text-gray-900">{formatFileSize(dashboardData?.storage?.totalSize || 0)}</p>
              </div>
            </div>
          </div>
        </div>
        
        {/* Storage by Bucket */}
        {dashboardData?.storage?.byBucket && (
          <div className="bg-white rounded-lg shadow p-3 sm:p-4">
            <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-3 sm:mb-4">{t('dashboard.storage_by_bucket')}</h3>
            <div className="space-y-2 sm:space-y-3">
              {Object.entries(dashboardData.storage.byBucket).map(([bucket, data]) => (
                <div key={bucket} className="p-2 sm:p-3 bg-gray-50 rounded">
                  <div className="flex justify-between items-center mb-1 sm:mb-2">
                    <span className="text-xs sm:text-sm font-medium text-gray-700">{bucket}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 sm:gap-4 text-xs sm:text-sm">
                    <div>
                      <span className="text-gray-600">{t('dashboard.files')}: </span>
                      <span className="font-medium">{data.files || 0}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">{t('dashboard.size')}: </span>
                      <span className="font-medium">{formatFileSize(data.size || 0)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Lifecycle Section */}
      <div className="mb-6 sm:mb-8">
        <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-3 sm:mb-4 flex items-center">
          <Activity className="mr-2 h-5 w-5" />
          {t('dashboard.document_lifecycle')}
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
          <div className="bg-white rounded-lg shadow p-3 sm:p-4">
            <div className="flex items-center">
              <AlertTriangle className="h-6 sm:h-8 w-6 sm:w-8 text-orange-500" />
              <div className="ml-3 sm:ml-4">
                <p className="text-xs sm:text-sm font-medium text-gray-600">{t('dashboard.pending_review')}</p>
                <p className="text-lg sm:text-2xl font-bold text-gray-900">{dashboardData?.lifecycle?.pendingReview || 0}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-3 sm:p-4">
            <div className="flex items-center">
              <CheckCircle className="h-6 sm:h-8 w-6 sm:w-8 text-blue-500" />
              <div className="ml-3 sm:ml-4">
                <p className="text-xs sm:text-sm font-medium text-gray-600">{t('dashboard.to_transfer')}</p>
                <p className="text-lg sm:text-2xl font-bold text-gray-900">{dashboardData?.lifecycle?.toTransfer || 0}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-3 sm:p-4">
            <div className="flex items-center">
              <XCircle className="h-6 sm:h-8 w-6 sm:w-8 text-red-500" />
              <div className="ml-3 sm:ml-4">
                <p className="text-xs sm:text-sm font-medium text-gray-600">{t('dashboard.to_destroy')}</p>
                <p className="text-lg sm:text-2xl font-bold text-gray-900">{dashboardData?.lifecycle?.toDestroy || 0}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Access Requests Section */}
      <div className="mb-6 sm:mb-8">
        <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-3 sm:mb-4 flex items-center">
          <Users className="mr-2 h-5 w-5" />
          {t('dashboard.access_requests')}
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mb-3 sm:mb-4">
          <div className="bg-white rounded-lg shadow p-3 sm:p-4">
            <div className="flex items-center">
              <FileText className="h-6 sm:h-8 w-6 sm:w-8 text-gray-500" />
              <div className="ml-3 sm:ml-4">
                <p className="text-xs sm:text-sm font-medium text-gray-600">{t('dashboard.total')}</p>
                <p className="text-lg sm:text-2xl font-bold text-gray-900">{dashboardData?.accessRequests?.total || 0}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-3 sm:p-4">
            <div className="flex items-center">
              <Clock className="h-6 sm:h-8 w-6 sm:w-8 text-yellow-500" />
              <div className="ml-3 sm:ml-4">
                <p className="text-xs sm:text-sm font-medium text-gray-600">{t('dashboard.pending')}</p>
                <p className="text-lg sm:text-2xl font-bold text-gray-900">{dashboardData?.accessRequests?.pending || 0}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-3 sm:p-4">
            <div className="flex items-center">
              <CheckCircle className="h-6 sm:h-8 w-6 sm:w-8 text-green-500" />
              <div className="ml-3 sm:ml-4">
                <p className="text-xs sm:text-sm font-medium text-gray-600">{t('dashboard.approved')}</p>
                <p className="text-lg sm:text-2xl font-bold text-gray-900">{dashboardData?.accessRequests?.approved || 0}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-3 sm:p-4">
            <div className="flex items-center">
              <XCircle className="h-6 sm:h-8 w-6 sm:w-8 text-red-500" />
              <div className="ml-3 sm:ml-4">
                <p className="text-xs sm:text-sm font-medium text-gray-600">{t('dashboard.rejected')}</p>
                <p className="text-lg sm:text-2xl font-bold text-gray-900">{dashboardData?.accessRequests?.rejected || 0}</p>
              </div>
            </div>
          </div>
        </div>
        
        {/* Processing Time */}
        <div className="bg-white rounded-lg shadow p-3 sm:p-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base sm:text-lg font-medium text-gray-900">{t('dashboard.average_processing_time')}</h3>
            <span className="text-xl sm:text-2xl font-bold text-blue-600">
              {dashboardData?.accessRequests?.averageProcessingTimeHours || 0}h
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard