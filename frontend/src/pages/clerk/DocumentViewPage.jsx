import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../../hooks/useAuth'
import {
  FileText,
  Download,
  Clock,
  CheckCircle,
  AlertTriangle,
  XCircle,
  ArrowLeft,
  History,
  Eye,
} from 'lucide-react'

function DocumentViewPage() {
  const { id } = useParams()
  const { t } = useTranslation()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [isLoading, setIsLoading] = useState(true)
  const [document, setDocument] = useState(null)
  const [activeTab, setActiveTab] = useState('details')

  // Mock data for document
  useEffect(() => {
    // In a real app, this would be an API call to fetch document details
    const fetchDocument = async () => {
      setIsLoading(true)
      try {
        // Simulate API call delay
        await new Promise((resolve) => setTimeout(resolve, 1000))

        // Mock data
        const mockDocument = {
          id,
          title: 'Hotărâre privind aprobarea bugetului local',
          documentType: 'hotarare',
          documentTypeName: 'Hotărâre',
          creator: 'Consiliul Local',
          creationDate: '2023-11-15',
          uploadDate: '2023-11-16',
          uploadedBy: 'Maria Popescu',
          status: 'approved',
          statusDate: '2023-11-18',
          statusBy: 'Ion Ionescu',
          retentionCategory: 'cs',
          retentionYears: '30',
          confidentiality: 'public',
          description:
            'Hotărâre privind aprobarea bugetului local al municipiului pentru anul fiscal 2024, inclusiv alocările pentru investiții în infrastructură și servicii publice.',
          tags: ['buget', 'finanțe', '2024', 'investiții'],
          files: [
            {
              id: 'f1',
              name: 'hotarare_buget_2024.pdf',
              size: 2457862,
              type: 'application/pdf',
              uploadDate: '2023-11-16',
            },
            {
              id: 'f2',
              name: 'anexa1_buget_2024.xlsx',
              size: 1245632,
              type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
              uploadDate: '2023-11-16',
            },
          ],
          history: [
            {
              id: 'h1',
              date: '2023-11-16T10:23:45',
              action: 'upload',
              user: 'Maria Popescu',
              details: 'Document uploaded',
            },
            {
              id: 'h2',
              date: '2023-11-17T09:15:30',
              action: 'review',
              user: 'Ion Ionescu',
              details: 'Document reviewed',
            },
            {
              id: 'h3',
              date: '2023-11-18T14:05:12',
              action: 'approve',
              user: 'Ion Ionescu',
              details: 'Document approved',
            },
          ],
        }

        setDocument(mockDocument)
      } catch (error) {
        console.error('Error fetching document:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchDocument()
  }, [id])

  // Get status badge color and icon
  const getStatusBadge = (status) => {
    switch (status) {
      case 'registered':
        return {
          color: 'bg-blue-50 text-blue-700 ring-blue-600/20',
          icon: <Clock className="mr-1 h-5 w-5" />,
        }
      case 'pending_review':
        return {
          color: 'bg-yellow-50 text-yellow-700 ring-yellow-600/20',
          icon: <Clock className="mr-1 h-5 w-5" />,
        }
      case 'approved':
        return {
          color: 'bg-green-50 text-green-700 ring-green-600/20',
          icon: <CheckCircle className="mr-1 h-5 w-5" />,
        }
      case 'rejected':
        return {
          color: 'bg-red-50 text-red-700 ring-red-600/20',
          icon: <XCircle className="mr-1 h-5 w-5" />,
        }
      default:
        return {
          color: 'bg-gray-50 text-gray-700 ring-gray-600/20',
          icon: <AlertTriangle className="mr-1 h-5 w-5" />,
        }
    }
  }

  // Format date for display
  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleDateString()
  }

  // Format datetime for display
  const formatDateTime = (dateTimeString) => {
    const date = new Date(dateTimeString)
    return date.toLocaleString()
  }

  // Format file size for display
  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  // Get file icon based on type
  const getFileIcon = (fileType) => {
    if (fileType.includes('pdf')) {
      return <FileText className="h-6 w-6 text-red-500" />
    } else if (fileType.includes('spreadsheet') || fileType.includes('excel')) {
      return <FileText className="h-6 w-6 text-green-500" />
    } else if (fileType.includes('word') || fileType.includes('document')) {
      return <FileText className="h-6 w-6 text-blue-500" />
    } else if (fileType.includes('image')) {
      return <FileText className="h-6 w-6 text-purple-500" />
    } else {
      return <FileText className="h-6 w-6 text-gray-500" />
    }
  }

  // Handle file download
  const handleDownload = (fileId) => {
    // In a real app, this would trigger a file download
    console.log(`Downloading file with ID: ${fileId}`)
    alert(t('clerk.download_started'))
  }

  // Render loading state
  if (isLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary"></div>
      </div>
    )
  }

  // Render error state if document not found
  if (!document) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900">{t('clerk.document_not_found')}</h2>
          <p className="mt-2 text-sm text-gray-500">{t('clerk.document_not_found_description')}</p>
          <button
            type="button"
            onClick={() => navigate('/dashboard/clerk/my-uploads')}
            className="mt-6 inline-flex items-center rounded-md bg-primary px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary-dark focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          >
            <ArrowLeft className="-ml-0.5 mr-1.5 h-5 w-5" aria-hidden="true" />
            {t('clerk.back_to_my_uploads')}
          </button>
        </div>
      </div>
    )
  }

  const statusBadge = getStatusBadge(document.status)

  return (
    <div className="bg-white">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        {/* Back button */}
        <div className="mb-8">
          <button
            type="button"
            onClick={() => navigate('/dashboard/clerk/my-uploads')}
            className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-gray-700"
          >
            <ArrowLeft className="-ml-1 mr-1 h-5 w-5" aria-hidden="true" />
            {t('clerk.back_to_my_uploads')}
          </button>
        </div>

        {/* Document header */}
        <div className="mb-8 border-b border-gray-200 pb-8">
          <div className="md:flex md:items-center md:justify-between">
            <div className="min-w-0 flex-1">
              <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:text-3xl sm:tracking-tight">
                {document.title}
              </h2>
              <div className="mt-2 flex flex-col sm:flex-row sm:flex-wrap sm:space-x-6">
                <div className="mt-2 flex items-center text-sm text-gray-500">
                  <FileText className="mr-1.5 h-5 w-5 flex-shrink-0 text-gray-400" />
                  {document.documentTypeName}
                </div>
                <div className="mt-2 flex items-center text-sm text-gray-500">
                  <Clock className="mr-1.5 h-5 w-5 flex-shrink-0 text-gray-400" />
                  {t('clerk.uploaded_on')} {formatDate(document.uploadDate)}
                </div>
                <div className="mt-2 flex items-center text-sm text-gray-500">
                  <span
                    className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${statusBadge.color}`}
                  >
                    {statusBadge.icon}
                    {t(`clerk.status_${document.status}`)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-8 border-b border-gray-200">
          <nav className="-mb-px flex space-x-8" aria-label="Tabs">
            <button
              onClick={() => setActiveTab('details')}
              className={`${
                activeTab === 'details'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
              } whitespace-nowrap border-b-2 px-1 py-4 text-sm font-medium`}
              aria-current={activeTab === 'details' ? 'page' : undefined}
            >
              {t('clerk.document_details')}
            </button>
            <button
              onClick={() => setActiveTab('files')}
              className={`${
                activeTab === 'files'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
              } whitespace-nowrap border-b-2 px-1 py-4 text-sm font-medium`}
              aria-current={activeTab === 'files' ? 'page' : undefined}
            >
              {t('clerk.document_files')}
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`${
                activeTab === 'history'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
              } whitespace-nowrap border-b-2 px-1 py-4 text-sm font-medium`}
              aria-current={activeTab === 'history' ? 'page' : undefined}
            >
              {t('clerk.document_history')}
            </button>
          </nav>
        </div>

        {/* Tab content */}
        <div>
          {/* Details tab */}
          {activeTab === 'details' && (
            <div className="border-b border-gray-200 pb-8">
              <dl className="divide-y divide-gray-100">
                <div className="px-4 py-6 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-0">
                  <dt className="text-sm font-medium leading-6 text-gray-900">
                    {t('clerk.document_title')}
                  </dt>
                  <dd className="mt-1 text-sm leading-6 text-gray-700 sm:col-span-2 sm:mt-0">
                    {document.title}
                  </dd>
                </div>
                <div className="px-4 py-6 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-0">
                  <dt className="text-sm font-medium leading-6 text-gray-900">
                    {t('clerk.document_type')}
                  </dt>
                  <dd className="mt-1 text-sm leading-6 text-gray-700 sm:col-span-2 sm:mt-0">
                    {document.documentTypeName}
                  </dd>
                </div>
                <div className="px-4 py-6 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-0">
                  <dt className="text-sm font-medium leading-6 text-gray-900">
                    {t('clerk.document_creator')}
                  </dt>
                  <dd className="mt-1 text-sm leading-6 text-gray-700 sm:col-span-2 sm:mt-0">
                    {document.creator}
                  </dd>
                </div>
                <div className="px-4 py-6 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-0">
                  <dt className="text-sm font-medium leading-6 text-gray-900">
                    {t('clerk.document_creation_date')}
                  </dt>
                  <dd className="mt-1 text-sm leading-6 text-gray-700 sm:col-span-2 sm:mt-0">
                    {formatDate(document.creationDate)}
                  </dd>
                </div>
                <div className="px-4 py-6 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-0">
                  <dt className="text-sm font-medium leading-6 text-gray-900">
                    {t('clerk.upload_date')}
                  </dt>
                  <dd className="mt-1 text-sm leading-6 text-gray-700 sm:col-span-2 sm:mt-0">
                    {formatDate(document.uploadDate)}
                  </dd>
                </div>
                <div className="px-4 py-6 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-0">
                  <dt className="text-sm font-medium leading-6 text-gray-900">
                    {t('clerk.uploaded_by')}
                  </dt>
                  <dd className="mt-1 text-sm leading-6 text-gray-700 sm:col-span-2 sm:mt-0">
                    {document.uploadedBy}
                  </dd>
                </div>
                <div className="px-4 py-6 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-0">
                  <dt className="text-sm font-medium leading-6 text-gray-900">{t('clerk.status')}</dt>
                  <dd className="mt-1 text-sm leading-6 text-gray-700 sm:col-span-2 sm:mt-0">
                    <span
                      className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${statusBadge.color}`}
                    >
                      {statusBadge.icon}
                      {t(`clerk.status_${document.status}`)}
                    </span>
                    {document.statusDate && (
                      <span className="ml-2 text-gray-500">
                        ({formatDate(document.statusDate)} {t('clerk.by')} {document.statusBy})
                      </span>
                    )}
                  </dd>
                </div>
                <div className="px-4 py-6 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-0">
                  <dt className="text-sm font-medium leading-6 text-gray-900">
                    {t('clerk.retention_category')}
                  </dt>
                  <dd className="mt-1 text-sm leading-6 text-gray-700 sm:col-span-2 sm:mt-0">
                    {document.retentionCategory === 'permanent'
                      ? t('clerk.retention_permanent')
                      : document.retentionCategory === 'cs'
                      ? t('clerk.retention_cs')
                      : document.retentionCategory === 'c'
                      ? t('clerk.retention_c')
                      : document.retentionCategory === 'ci'
                      ? t('clerk.retention_ci')
                      : t('clerk.retention_cf')}{' '}
                    ({document.retentionYears === 'Permanent'
                      ? t('clerk.permanent')
                      : `${document.retentionYears} ${t('clerk.years')}`})
                  </dd>
                </div>
                <div className="px-4 py-6 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-0">
                  <dt className="text-sm font-medium leading-6 text-gray-900">
                    {t('clerk.confidentiality')}
                  </dt>
                  <dd className="mt-1 text-sm leading-6 text-gray-700 sm:col-span-2 sm:mt-0">
                    {t(`clerk.confidentiality_${document.confidentiality}`)}
                  </dd>
                </div>
                {document.description && (
                  <div className="px-4 py-6 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-0">
                    <dt className="text-sm font-medium leading-6 text-gray-900">
                      {t('clerk.document_description')}
                    </dt>
                    <dd className="mt-1 text-sm leading-6 text-gray-700 sm:col-span-2 sm:mt-0">
                      {document.description}
                    </dd>
                  </div>
                )}
                {document.tags && document.tags.length > 0 && (
                  <div className="px-4 py-6 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-0">
                    <dt className="text-sm font-medium leading-6 text-gray-900">
                      {t('clerk.document_tags')}
                    </dt>
                    <dd className="mt-1 text-sm leading-6 text-gray-700 sm:col-span-2 sm:mt-0">
                      <div className="flex flex-wrap gap-2">
                        {document.tags.map((tag, index) => (
                          <span
                            key={index}
                            className="inline-flex items-center rounded-full bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-700/10"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </dd>
                  </div>
                )}
              </dl>
            </div>
          )}

          {/* Files tab */}
          {activeTab === 'files' && (
            <div>
              <h3 className="text-base font-semibold leading-6 text-gray-900">
                {t('clerk.document_files')}
              </h3>
              <p className="mt-1 text-sm text-gray-500">{t('clerk.document_files_description')}</p>

              <ul
                role="list"
                className="mt-6 divide-y divide-gray-100 rounded-md border border-gray-200"
              >
                {document.files.map((file) => (
                  <li
                    key={file.id}
                    className="flex items-center justify-between py-4 pl-4 pr-5 text-sm leading-6"
                  >
                    <div className="flex w-0 flex-1 items-center">
                      {getFileIcon(file.type)}
                      <div className="ml-4 flex min-w-0 flex-1 gap-2">
                        <span className="truncate font-medium">{file.name}</span>
                        <span className="flex-shrink-0 text-gray-400">
                          {formatFileSize(file.size)}
                        </span>
                      </div>
                    </div>
                    <div className="ml-4 flex flex-shrink-0 space-x-4">
                      <button
                        type="button"
                        onClick={() => handleDownload(file.id)}
                        className="font-medium text-primary hover:text-primary-dark"
                      >
                        <Download className="h-5 w-5" />
                      </button>
                      <button
                        type="button"
                        className="font-medium text-primary hover:text-primary-dark"
                      >
                        <Eye className="h-5 w-5" />
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* History tab */}
          {activeTab === 'history' && (
            <div>
              <h3 className="text-base font-semibold leading-6 text-gray-900">
                {t('clerk.document_history')}
              </h3>
              <p className="mt-1 text-sm text-gray-500">{t('clerk.document_history_description')}</p>

              <div className="mt-6 flow-root">
                <ul role="list" className="-mb-8">
                  {document.history.map((event, eventIdx) => (
                    <li key={event.id}>
                      <div className="relative pb-8">
                        {eventIdx !== document.history.length - 1 ? (
                          <span
                            className="absolute left-4 top-4 -ml-px h-full w-0.5 bg-gray-200"
                            aria-hidden="true"
                          />
                        ) : null}
                        <div className="relative flex space-x-3">
                          <div>
                            <span
                              className={`flex h-8 w-8 items-center justify-center rounded-full ${
                                event.action === 'upload'
                                  ? 'bg-blue-500'
                                  : event.action === 'review'
                                  ? 'bg-yellow-500'
                                  : event.action === 'approve'
                                  ? 'bg-green-500'
                                  : event.action === 'reject'
                                  ? 'bg-red-500'
                                  : 'bg-gray-500'
                              } ring-8 ring-white`}
                            >
                              <History className="h-5 w-5 text-white" aria-hidden="true" />
                            </span>
                          </div>
                          <div className="flex min-w-0 flex-1 justify-between space-x-4 pt-1.5">
                            <div>
                              <p className="text-sm text-gray-500">
                                {event.action === 'upload'
                                  ? t('clerk.history_upload')
                                  : event.action === 'review'
                                  ? t('clerk.history_review')
                                  : event.action === 'approve'
                                  ? t('clerk.history_approve')
                                  : event.action === 'reject'
                                  ? t('clerk.history_reject')
                                  : t('clerk.history_update')}{' '}
                                <span className="font-medium text-gray-900">{event.user}</span>
                              </p>
                              {event.details && (
                                <p className="mt-0.5 text-sm text-gray-500">{event.details}</p>
                              )}
                            </div>
                            <div className="whitespace-nowrap text-right text-sm text-gray-500">
                              {formatDateTime(event.date)}
                            </div>
                          </div>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default DocumentViewPage