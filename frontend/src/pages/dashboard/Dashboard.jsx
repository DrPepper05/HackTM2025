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
      navigate(roleRedirectMap[userRole], { replace: true })
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
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  // Show loading while we determine the user's role and redirect
  if (isLoading || (userRole && userRole !== 'admin' && roleRedirectMap[userRole])) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p className="text-gray-600 text-sm">{t('common.loading')}</p>
      </div>
    )
  }

  // If user has a role but is not admin and no redirect configured, show access pending
  if (userRole && userRole !== 'admin' && !roleRedirectMap[userRole]) {
    return (
      <div className="container mx-auto px-4 py-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">{t('dashboard.welcome')}</h1>
          <p className="text-gray-600 mt-2">Welcome to the system</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-center">
            <AlertTriangle className="mx-auto h-12 w-12 text-yellow-500 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Access Pending</h3>
            <p className="text-gray-600">
              Your account is set up but you may not have been assigned specific permissions yet. 
              Please contact your administrator if you need access to specific features.
            </p>
          </div>
        </div>
      </div>
    )
  }

  // If no role or not admin, show unauthorized access message
  if (!userRole || userRole !== 'admin') {
    return (
      <div className="container mx-auto px-4 py-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Access Denied</h1>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-center">
            <XCircle className="mx-auto h-12 w-12 text-red-500 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Unauthorized Access</h3>
            <p className="text-gray-600">
              You do not have permission to access the admin dashboard.
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">{t('dashboard.welcome')}</h1>
        <p className="text-gray-600 mt-2">System overview and metrics</p>
      </div>

      {/* Queue Section */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
          <List className="mr-2 h-5 w-5" />
          Processing Queue
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center">
              <Clock className="h-8 w-8 text-yellow-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Pending</p>
                <p className="text-2xl font-bold text-gray-900">{dashboardData?.queue?.pending || 0}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center">
              <Play className="h-8 w-8 text-blue-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Processing</p>
                <p className="text-2xl font-bold text-gray-900">{dashboardData?.queue?.processing || 0}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center">
              <CheckCircle className="h-8 w-8 text-green-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Completed</p>
                <p className="text-2xl font-bold text-gray-900">{dashboardData?.queue?.completed || 0}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center">
              <XCircle className="h-8 w-8 text-red-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Failed</p>
                <p className="text-2xl font-bold text-gray-900">{dashboardData?.queue?.failed || 0}</p>
              </div>
            </div>
          </div>
        </div>
        
        {/* Queue by Type */}
        {dashboardData?.queue?.by_type && (
          <div className="bg-white rounded-lg shadow p-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Queue by Type</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.entries(dashboardData.queue.by_type).map(([type, count]) => (
                <div key={type} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                  <span className="text-sm font-medium text-gray-700">{type.replace(/_/g, ' ')}</span>
                  <span className="text-lg font-bold text-gray-900">{count}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Storage Section */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
          <HardDrive className="mr-2 h-5 w-5" />
          Storage Overview
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center">
              <FileText className="h-8 w-8 text-purple-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Files</p>
                <p className="text-2xl font-bold text-gray-900">{dashboardData?.storage?.totalFiles || 0}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center">
              <Database className="h-8 w-8 text-indigo-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Size</p>
                <p className="text-2xl font-bold text-gray-900">{formatFileSize(dashboardData?.storage?.totalSize || 0)}</p>
              </div>
            </div>
          </div>
        </div>
        
        {/* Storage by Bucket */}
        {dashboardData?.storage?.byBucket && (
          <div className="bg-white rounded-lg shadow p-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Storage by Bucket</h3>
            <div className="space-y-3">
              {Object.entries(dashboardData.storage.byBucket).map(([bucket, data]) => (
                <div key={bucket} className="p-3 bg-gray-50 rounded">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-gray-700">{bucket}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Files: </span>
                      <span className="font-medium">{data.files || 0}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Size: </span>
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
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
          <Activity className="mr-2 h-5 w-5" />
          Document Lifecycle
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center">
              <AlertTriangle className="h-8 w-8 text-orange-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Pending Review</p>
                <p className="text-2xl font-bold text-gray-900">{dashboardData?.lifecycle?.pendingReview || 0}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center">
              <CheckCircle className="h-8 w-8 text-blue-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">To Transfer</p>
                <p className="text-2xl font-bold text-gray-900">{dashboardData?.lifecycle?.toTransfer || 0}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center">
              <XCircle className="h-8 w-8 text-red-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">To Destroy</p>
                <p className="text-2xl font-bold text-gray-900">{dashboardData?.lifecycle?.toDestroy || 0}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Access Requests Section */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
          <Users className="mr-2 h-5 w-5" />
          Access Requests
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center">
              <FileText className="h-8 w-8 text-gray-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total</p>
                <p className="text-2xl font-bold text-gray-900">{dashboardData?.accessRequests?.total || 0}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center">
              <Clock className="h-8 w-8 text-yellow-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Pending</p>
                <p className="text-2xl font-bold text-gray-900">{dashboardData?.accessRequests?.pending || 0}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center">
              <CheckCircle className="h-8 w-8 text-green-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Approved</p>
                <p className="text-2xl font-bold text-gray-900">{dashboardData?.accessRequests?.approved || 0}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center">
              <XCircle className="h-8 w-8 text-red-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Rejected</p>
                <p className="text-2xl font-bold text-gray-900">{dashboardData?.accessRequests?.rejected || 0}</p>
              </div>
            </div>
          </div>
        </div>
        
        {/* Processing Time */}
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-gray-900">Average Processing Time</h3>
            <span className="text-2xl font-bold text-blue-600">
              {dashboardData?.accessRequests?.averageProcessingTimeHours || 0}h
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard