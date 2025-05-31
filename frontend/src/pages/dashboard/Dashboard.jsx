import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { FileText, Upload, Inbox, Clock, Send, Search, Users, Shield, BarChart } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import { adminApi } from '../../services/api'

function Dashboard() {
  const { t } = useTranslation()
  const { userRole, hasRole } = useAuth()
  const [stats, setStats] = useState(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchDashboardStats = async () => {
      setIsLoading(true)
      try {
        // Fetch real data from the API
        const response = await adminApi.getDashboard()
        
        // Transform the API response to match the expected stats structure
        const dashboardData = response.data
        
        const transformedStats = {
          // Clerk stats
          uploads: {
            total: dashboardData.queue?.document_uploads?.total || 0,
            pending: dashboardData.queue?.document_uploads?.pending || 0,
            approved: dashboardData.queue?.document_uploads?.completed || 0,
          },
          // Archivist stats
          ingestQueue: dashboardData.queue?.ingest_tasks?.pending || 0,
          retentionAlerts: dashboardData.lifecycle?.pending_reviews || 0,
          transferQueue: dashboardData.queue?.transfer_tasks?.pending || 0,
          // Admin stats
          users: dashboardData.accessRequests?.total_users || 0,
          systemHealth: dashboardData.storage?.health_status || 'Unknown',
          // Inspector stats
          auditLogs: dashboardData.storage?.audit_count || 0,
          reports: dashboardData.lifecycle?.reports_due || 0,
        }
        
        setStats(transformedStats)
        setIsLoading(false)
      } catch (error) {
        console.error('Error fetching dashboard stats:', error)
        setIsLoading(false)
      }
    }

    fetchDashboardStats()
  }, [])

  // Dashboard cards based on user role
  const getDashboardCards = () => {
    const cards = []

    // Clerk cards
    if (hasRole('clerk')) {
      cards.push(
        {
          title: t('dashboard.upload_document'),
          description: t('dashboard.upload_document_desc'),
          icon: Upload,
          link: '/documents/upload',
          color: 'bg-blue-500',
        },
        {
          title: t('dashboard.my_uploads'),
          description: t('dashboard.my_uploads_desc'),
          icon: FileText,
          link: '/documents/my-uploads',
          color: 'bg-green-500',
          stats: stats?.uploads,
        }
      )
    }

    // Archivist cards
    if (hasRole('archivist')) {
      cards.push(
        {
          title: t('dashboard.ingest_queue'),
          description: t('dashboard.ingest_queue_desc'),
          icon: Inbox,
          link: '/archivist/ingest',
          color: 'bg-purple-500',
          count: stats?.ingestQueue,
        },
        {
          title: t('dashboard.retention_alerts'),
          description: t('dashboard.retention_alerts_desc'),
          icon: Clock,
          link: '/archivist/retention',
          color: 'bg-yellow-500',
          count: stats?.retentionAlerts,
        },
        {
          title: t('dashboard.transfer_queue'),
          description: t('dashboard.transfer_queue_desc'),
          icon: Send,
          link: '/archivist/transfer',
          color: 'bg-red-500',
          count: stats?.transferQueue,
        },
        {
          title: t('dashboard.advanced_search'),
          description: t('dashboard.advanced_search_desc'),
          icon: Search,
          link: '/documents/search',
          color: 'bg-indigo-500',
        }
      )
    }

    // Admin cards
    if (hasRole('admin')) {
      cards.push(
        {
          title: t('dashboard.user_management'),
          description: t('dashboard.user_management_desc'),
          icon: Users,
          link: '/admin/users',
          color: 'bg-teal-500',
          count: stats?.users,
        },
        // {
        //   title: t('dashboard.system_health'),
        //   description: t('dashboard.system_health_desc'),
        //   icon: Shield,
        //   link: '/admin/system',
        //   color: 'bg-cyan-500',
        //   status: stats?.systemHealth,
        // }
      )
    }

    // Inspector cards
    if (hasRole('inspector')) {
      cards.push(
        {
          title: t('dashboard.audit_logs'),
          description: t('dashboard.audit_logs_desc'),
          icon: BarChart,
          link: '/inspector/audit-logs',
          color: 'bg-orange-500',
          count: stats?.auditLogs,
        },
        {
          title: t('dashboard.inventory_reports'),
          description: t('dashboard.inventory_reports_desc'),
          icon: FileText,
          link: '/inspector/reports',
          color: 'bg-pink-500',
          count: stats?.reports,
        }
      )
    }

    return cards
  }

  const dashboardCards = getDashboardCards()

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="loading-spinner"></div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">{t('dashboard.welcome')}</h1>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {dashboardCards.map((card, index) => (
          <Link
            key={index}
            to={card.link}
            className="block overflow-hidden rounded-lg bg-white shadow transition-all hover:shadow-md"
          >
            <div className={`p-4 text-white ${card.color}`}>
              <card.icon className="h-8 w-8" />
            </div>
            <div className="p-4">
              <h3 className="text-lg font-medium text-gray-900">{card.title}</h3>
              <p className="mt-1 text-sm text-gray-600">{card.description}</p>
              
              {/* Display stats if available */}
              {card.count !== undefined && (
                <div className="mt-4">
                  <span className="text-2xl font-bold text-gray-900">{card.count}</span>
                  <span className="ml-2 text-sm text-gray-600">{t('dashboard.items')}</span>
                </div>
              )}
              
              {/* Display status if available */}
              {card.status && (
                <div className="mt-4">
                  <span className="text-sm font-medium text-gray-900">{t('dashboard.status')}:</span>
                  <span className="ml-2 text-sm font-medium text-green-600">{card.status}</span>
                </div>
              )}
              
              {/* Display upload stats if available */}
              {card.stats && (
                <div className="mt-4 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">{t('dashboard.total')}:</span>
                    <span className="text-sm font-medium text-gray-900">{card.stats.total}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">{t('dashboard.pending')}:</span>
                    <span className="text-sm font-medium text-yellow-600">{card.stats.pending}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">{t('dashboard.approved')}:</span>
                    <span className="text-sm font-medium text-green-600">{card.stats.approved}</span>
                  </div>
                </div>
              )}
            </div>
          </Link>
        ))}
      </div>

      {/* Quick access section */}
      <div className="mt-8">
        <h2 className="mb-4 text-xl font-bold text-gray-900">{t('dashboard.quick_access')}</h2>
        <div className="rounded-lg bg-white p-4 shadow">
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <Link to="/documents/search" className="flex items-center rounded-md p-3 hover:bg-gray-50">
              <Search className="mr-3 h-5 w-5 text-gray-400" />
              <span className="text-sm font-medium text-gray-900">{t('dashboard.search_documents')}</span>
            </Link>
            <Link to="/profile" className="flex items-center rounded-md p-3 hover:bg-gray-50">
              <Users className="mr-3 h-5 w-5 text-gray-400" />
              <span className="text-sm font-medium text-gray-900">{t('dashboard.my_profile')}</span>
            </Link>
            <Link to="/settings" className="flex items-center rounded-md p-3 hover:bg-gray-50">
              <Shield className="mr-3 h-5 w-5 text-gray-400" />
              <span className="text-sm font-medium text-gray-900">{t('dashboard.settings')}</span>
            </Link>
            <Link to="/help" className="flex items-center rounded-md p-3 hover:bg-gray-50">
              <FileText className="mr-3 h-5 w-5 text-gray-400" />
              <span className="text-sm font-medium text-gray-900">{t('dashboard.help')}</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard