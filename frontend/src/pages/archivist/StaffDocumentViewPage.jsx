import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../../hooks/useAuth'
import {
  ArrowLeft,
  FileText,
  User,
  Calendar,
  Tag,
  Clock,
  Lock,
  Download,
  Eye,
  Pencil,
  Check,
  X,
  Save,
  Trash2,
  AlertTriangle,
  History,
  FileDigit,
  Info,
} from 'lucide-react'

function StaffDocumentViewPage() {
  const { t } = useTranslation()
  const { user } = useAuth()
  const { id } = useParams()
  const navigate = useNavigate()
  const [isLoading, setIsLoading] = useState(true)
  const [document, setDocument] = useState(null)
  const [activeTab, setActiveTab] = useState('details')
  const [isEditing, setIsEditing] = useState(false)
  const [editedDocument, setEditedDocument] = useState(null)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [showRedactionModal, setShowRedactionModal] = useState(false)
  const [isRedacting, setIsRedacting] = useState(false)
  const [redactionReason, setRedactionReason] = useState('')

  // Document types for dropdown
  const documentTypes = [
    { id: 'hotarare', name: 'Hotărâre' },
    { id: 'dispozitie', name: 'Dispoziție' },
    { id: 'contract', name: 'Contract' },
    { id: 'autorizatie', name: 'Autorizație' },
    { id: 'certificat', name: 'Certificat' },
    { id: 'adresa', name: 'Adresă' },
    { id: 'raport', name: 'Raport' },
    { id: 'proces_verbal', name: 'Proces-verbal' },
  ]

  // Retention categories for dropdown
  const retentionCategories = [
    { id: 'permanent', name: t('archivist.retention_permanent'), years: 'Permanent' },
    { id: 'cs', name: t('archivist.retention_cs'), years: '30' },
    { id: 'c', name: t('archivist.retention_c'), years: '10' },
    { id: 'ci', name: t('archivist.retention_ci'), years: '5' },
    { id: 'cf', name: t('archivist.retention_cf'), years: '3' },
  ]

  // Confidentiality levels for dropdown
  const confidentialityLevels = [
    { id: 'public', name: t('archivist.confidentiality_public') },
    { id: 'internal', name: t('archivist.confidentiality_internal') },
    { id: 'confidential', name: t('archivist.confidentiality_confidential') },
    { id: 'restricted', name: t('archivist.confidentiality_restricted') },
  ]

  // Fetch document data
  useEffect(() => {
    const fetchDocument = async () => {
      setIsLoading(true)
      try {
        // In a real app, this would be an API call to fetch document details
        // For the hackathon, we'll use mock data
        await new Promise((resolve) => setTimeout(resolve, 1000))

        // Mock document data
        const mockDocument = {
          id,
          title: 'Hotărâre privind aprobarea bugetului local pe anul 2023',
          documentType: 'hotarare',
          documentTypeName: 'Hotărâre',
          creator: 'Consiliul Local',
          creationDate: '2023-01-15',
          uploadDate: '2023-01-20',
          uploadedBy: 'Ion Popescu',
          uploaderId: 'user123',
          status: 'approved',
          statusName: t('archivist.status_approved'),
          retentionCategory: 'c',
          retentionYears: '10',
          retentionEndDate: '2033-01-15',
          confidentiality: 'public',
          description:
            'Hotărârea Consiliului Local privind aprobarea bugetului local al municipiului pentru anul fiscal 2023, inclusiv alocările pentru investiții, servicii publice și funcționarea aparatului administrativ.',
          tags: ['buget', 'hotărâre', '2023', 'consiliu local'],
          files: [
            {
              id: 'file1',
              name: 'hotarare_buget_2023.pdf',
              type: 'application/pdf',
              size: 1458000,
              uploadDate: '2023-01-20',
              url: '#',
              isRedacted: false,
              hasRedactedVersion: true,
              redactedUrl: '#',
            },
            {
              id: 'file2',
              name: 'anexa1_buget_2023.xlsx',
              type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
              size: 2540000,
              uploadDate: '2023-01-20',
              url: '#',
              isRedacted: false,
              hasRedactedVersion: false,
              redactedUrl: null,
            },
            {
              id: 'file3',
              name: 'anexa2_investitii_2023.pdf',
              type: 'application/pdf',
              size: 1050000,
              uploadDate: '2023-01-20',
              url: '#',
              isRedacted: false,
              hasRedactedVersion: true,
              redactedUrl: '#',
            },
          ],
          history: [
            {
              id: 'hist1',
              date: '2023-01-20T10:15:00',
              action: 'upload',
              actionName: t('archivist.action_upload'),
              user: 'Ion Popescu',
              userId: 'user123',
              details: t('archivist.action_upload_details'),
            },
            {
              id: 'hist2',
              date: '2023-01-22T14:30:00',
              action: 'metadata_update',
              actionName: t('archivist.action_metadata_update'),
              user: 'Maria Ionescu',
              userId: 'user456',
              details: t('archivist.action_metadata_update_details'),
            },
            {
              id: 'hist3',
              date: '2023-01-25T09:45:00',
              action: 'approve',
              actionName: t('archivist.action_approve'),
              user: 'Maria Ionescu',
              userId: 'user456',
              details: t('archivist.action_approve_details'),
            },
            {
              id: 'hist4',
              date: '2023-02-10T11:20:00',
              action: 'redact',
              actionName: t('archivist.action_redact'),
              user: 'Maria Ionescu',
              userId: 'user456',
              details: t('archivist.action_redact_details'),
            },
          ],
        }

        setDocument(mockDocument)
        setEditedDocument({ ...mockDocument })
      } catch (error) {
        console.error('Error fetching document:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchDocument()
  }, [id, t])

  // Handle tab change
  const handleTabChange = (tab) => {
    setActiveTab(tab)
  }

  // Handle edit mode toggle
  const handleEditToggle = () => {
    if (isEditing) {
      // Cancel editing
      setEditedDocument({ ...document })
    }
    setIsEditing(!isEditing)
  }

  // Handle input changes in edit mode
  const handleInputChange = (e) => {
    const { name, value } = e.target
    setEditedDocument({
      ...editedDocument,
      [name]: value,
    })
  }

  // Handle tag input
  const handleTagChange = (e) => {
    const value = e.target.value
    if (e.key === 'Enter' && value.trim()) {
      e.preventDefault()
      if (!editedDocument.tags.includes(value.trim())) {
        setEditedDocument({
          ...editedDocument,
          tags: [...editedDocument.tags, value.trim()],
        })
      }
      e.target.value = ''
    }
  }

  // Remove tag
  const handleRemoveTag = (tag) => {
    setEditedDocument({
      ...editedDocument,
      tags: editedDocument.tags.filter((t) => t !== tag),
    })
  }

  // Save edited document
  const handleSaveDocument = async () => {
    try {
      // In a real app, this would be an API call to update the document
      // For the hackathon, we'll simulate an update
      await new Promise((resolve) => setTimeout(resolve, 1000))

      // Update document state
      setDocument({ ...editedDocument })
      setIsEditing(false)

      // Add history entry for metadata update
      const newHistoryEntry = {
        id: `hist${document.history.length + 1}`,
        date: new Date().toISOString(),
        action: 'metadata_update',
        actionName: t('archivist.action_metadata_update'),
        user: user.name,
        userId: user.id,
        details: t('archivist.action_metadata_update_details'),
      }

      setDocument((prevDoc) => ({
        ...prevDoc,
        ...editedDocument,
        history: [newHistoryEntry, ...prevDoc.history],
      }))
    } catch (error) {
      console.error('Error updating document:', error)
    }
  }

  // Handle document deletion
  const handleDeleteDocument = async () => {
    setIsDeleting(true)
    try {
      // In a real app, this would be an API call to delete the document
      // For the hackathon, we'll simulate a deletion
      await new Promise((resolve) => setTimeout(resolve, 1500))

      // Redirect to documents list
      navigate('/dashboard/archivist/advanced-search')
    } catch (error) {
      console.error('Error deleting document:', error)
      setIsDeleting(false)
      setShowDeleteModal(false)
    }
  }

  // Handle file redaction
  const handleRedactFile = async (fileId) => {
    setIsRedacting(true)
    try {
      // In a real app, this would be an API call to redact the file
      // For the hackathon, we'll simulate a redaction
      await new Promise((resolve) => setTimeout(resolve, 1500))

      // Update file in document state
      const updatedFiles = document.files.map((file) => {
        if (file.id === fileId) {
          return {
            ...file,
            hasRedactedVersion: true,
            redactedUrl: '#',
          }
        }
        return file
      })

      // Add history entry for redaction
      const newHistoryEntry = {
        id: `hist${document.history.length + 1}`,
        date: new Date().toISOString(),
        action: 'redact',
        actionName: t('archivist.action_redact'),
        user: user.name,
        userId: user.id,
        details: `${t('archivist.action_redact_details')}: ${redactionReason}`,
      }

      setDocument((prevDoc) => ({
        ...prevDoc,
        files: updatedFiles,
        history: [newHistoryEntry, ...prevDoc.history],
      }))

      setShowRedactionModal(false)
      setRedactionReason('')
    } catch (error) {
      console.error('Error redacting file:', error)
    } finally {
      setIsRedacting(false)
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
    if (bytes < 1024) {
      return bytes + ' B'
    } else if (bytes < 1024 * 1024) {
      return (bytes / 1024).toFixed(2) + ' KB'
    } else if (bytes < 1024 * 1024 * 1024) {
      return (bytes / (1024 * 1024)).toFixed(2) + ' MB'
    } else {
      return (bytes / (1024 * 1024 * 1024)).toFixed(2) + ' GB'
    }
  }

  // Get file icon based on type
  const getFileIcon = (fileType) => {
    if (fileType.includes('pdf')) {
      return <FileText className="h-5 w-5 text-red-500" />
    } else if (fileType.includes('spreadsheet') || fileType.includes('excel')) {
      return <FileDigit className="h-5 w-5 text-green-500" />
    } else if (fileType.includes('word') || fileType.includes('document')) {
      return <FileText className="h-5 w-5 text-blue-500" />
    } else {
      return <FileText className="h-5 w-5 text-gray-500" />
    }
  }

  // Get confidentiality badge color
  const getConfidentialityBadgeColor = (confidentiality) => {
    switch (confidentiality) {
      case 'public':
        return 'bg-green-100 text-green-800'
      case 'internal':
        return 'bg-blue-100 text-blue-800'
      case 'confidential':
        return 'bg-yellow-100 text-yellow-800'
      case 'restricted':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="h-32 w-32 animate-spin rounded-full border-b-2 border-t-2 border-primary"></div>
      </div>
    )
  }

  if (!document) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="rounded-md bg-red-50 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <AlertTriangle className="h-5 w-5 text-red-400" aria-hidden="true" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">{t('archivist.document_not_found')}</h3>
              <div className="mt-2 text-sm text-red-700">
                <p>{t('archivist.document_not_found_description')}</p>
              </div>
              <div className="mt-4">
                <div className="-mx-2 -my-1.5 flex">
                  <button
                    type="button"
                    onClick={() => navigate('/dashboard/archivist/advanced-search')}
                    className="rounded-md bg-red-50 px-2 py-1.5 text-sm font-medium text-red-800 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-red-600 focus:ring-offset-2 focus:ring-offset-red-50"
                  >
                    {t('archivist.back_to_search')}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        {/* Back button */}
        <div className="mb-8">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="inline-flex items-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
          >
            <ArrowLeft className="-ml-0.5 mr-1.5 h-5 w-5" aria-hidden="true" />
            {t('archivist.back')}
          </button>
        </div>

        {/* Document header */}
        <div className="mb-8 md:flex md:items-center md:justify-between">
          <div className="min-w-0 flex-1">
            <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:text-3xl sm:tracking-tight">
              {document.title}
            </h2>
            <div className="mt-1 flex flex-col sm:mt-0 sm:flex-row sm:flex-wrap sm:space-x-6">
              <div className="mt-2 flex items-center text-sm text-gray-500">
                <FileText className="mr-1.5 h-5 w-5 flex-shrink-0 text-gray-400" />
                {document.documentTypeName}
              </div>
              <div className="mt-2 flex items-center text-sm text-gray-500">
                <User className="mr-1.5 h-5 w-5 flex-shrink-0 text-gray-400" />
                {document.creator}
              </div>
              <div className="mt-2 flex items-center text-sm text-gray-500">
                <Calendar className="mr-1.5 h-5 w-5 flex-shrink-0 text-gray-400" />
                {formatDate(document.creationDate)}
              </div>
              <div className="mt-2 flex items-center text-sm text-gray-500">
                <Clock className="mr-1.5 h-5 w-5 flex-shrink-0 text-gray-400" />
                {t('archivist.retention')}: {document.retentionYears} {t('archivist.years')}
              </div>
              <div className="mt-2">
                <span
                  className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ${getConfidentialityBadgeColor(
                    document.confidentiality
                  )}`}
                >
                  <Lock className="-ml-0.5 mr-1.5 h-4 w-4" />
                  {confidentialityLevels.find((level) => level.id === document.confidentiality)?.name}
                </span>
              </div>
            </div>
          </div>
          <div className="mt-4 flex flex-shrink-0 md:ml-4 md:mt-0">
            {isEditing ? (
              <>
                <button
                  type="button"
                  onClick={handleEditToggle}
                  className="inline-flex items-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                >
                  <X className="-ml-0.5 mr-1.5 h-5 w-5" aria-hidden="true" />
                  {t('archivist.cancel')}
                </button>
                <button
                  type="button"
                  onClick={handleSaveDocument}
                  className="ml-3 inline-flex items-center rounded-md bg-primary px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                >
                  <Save className="-ml-0.5 mr-1.5 h-5 w-5" aria-hidden="true" />
                  {t('archivist.save')}
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => setShowDeleteModal(true)}
                  className="inline-flex items-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                >
                  <Trash2 className="-ml-0.5 mr-1.5 h-5 w-5 text-red-500" aria-hidden="true" />
                  {t('archivist.delete')}
                </button>
                <button
                  type="button"
                  onClick={handleEditToggle}
                  className="ml-3 inline-flex items-center rounded-md bg-primary px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                >
                  <Pencil className="-ml-0.5 mr-1.5 h-5 w-5" aria-hidden="true" />
                  {t('archivist.edit')}
                </button>
              </>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8" aria-label="Tabs">
            <button
              onClick={() => handleTabChange('details')}
              className={`${activeTab === 'details'
                ? 'border-primary text-primary'
                : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                } whitespace-nowrap border-b-2 px-1 py-4 text-sm font-medium`}
              aria-current={activeTab === 'details' ? 'page' : undefined}
            >
              {t('archivist.document_details')}
            </button>
            <button
              onClick={() => handleTabChange('files')}
              className={`${activeTab === 'files'
                ? 'border-primary text-primary'
                : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                } whitespace-nowrap border-b-2 px-1 py-4 text-sm font-medium`}
              aria-current={activeTab === 'files' ? 'page' : undefined}
            >
              {t('archivist.document_files')}
            </button>
            <button
              onClick={() => handleTabChange('history')}
              className={`${activeTab === 'history'
                ? 'border-primary text-primary'
                : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                } whitespace-nowrap border-b-2 px-1 py-4 text-sm font-medium`}
              aria-current={activeTab === 'history' ? 'page' : undefined}
            >
              {t('archivist.document_history')}
            </button>
          </nav>
        </div>

        {/* Tab content */}
        <div className="mt-8">
          {/* Details tab */}
          {activeTab === 'details' && (
            <div className="space-y-12">
              <div className="border-b border-gray-900/10 pb-12">
                <h2 className="text-base font-semibold leading-7 text-gray-900">
                  {t('archivist.document_information')}
                </h2>
                <p className="mt-1 text-sm leading-6 text-gray-600">
                  {t('archivist.document_information_description')}
                </p>

                <div className="mt-10 grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-6">
                  {/* Title */}
                  <div className="sm:col-span-4">
                    <label
                      htmlFor="title"
                      className="block text-sm font-medium leading-6 text-gray-900"
                    >
                      {t('archivist.document_title')}
                    </label>
                    {isEditing ? (
                      <div className="mt-2">
                        <input
                          type="text"
                          name="title"
                          id="title"
                          className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-primary sm:text-sm"
                          value={editedDocument.title}
                          onChange={handleInputChange}
                        />
                      </div>
                    ) : (
                      <div className="mt-2 text-sm text-gray-900">{document.title}</div>
                    )}
                  </div>

                  {/* Document Type */}
                  <div className="sm:col-span-2">
                    <label
                      htmlFor="documentType"
                      className="block text-sm font-medium leading-6 text-gray-900"
                    >
                      {t('archivist.document_type')}
                    </label>
                    {isEditing ? (
                      <div className="mt-2">
                        <select
                          id="documentType"
                          name="documentType"
                          className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-primary sm:text-sm"
                          value={editedDocument.documentType}
                          onChange={(e) => {
                            const selectedType = documentTypes.find(
                              (type) => type.id === e.target.value
                            )
                            setEditedDocument({
                              ...editedDocument,
                              documentType: e.target.value,
                              documentTypeName: selectedType ? selectedType.name : '',
                            })
                          }}
                        >
                          {documentTypes.map((type) => (
                            <option key={type.id} value={type.id}>
                              {type.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    ) : (
                      <div className="mt-2 text-sm text-gray-900">{document.documentTypeName}</div>
                    )}
                  </div>

                  {/* Creator */}
                  <div className="sm:col-span-3">
                    <label
                      htmlFor="creator"
                      className="block text-sm font-medium leading-6 text-gray-900"
                    >
                      {t('archivist.document_creator')}
                    </label>
                    {isEditing ? (
                      <div className="mt-2">
                        <input
                          type="text"
                          name="creator"
                          id="creator"
                          className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-primary sm:text-sm"
                          value={editedDocument.creator}
                          onChange={handleInputChange}
                        />
                      </div>
                    ) : (
                      <div className="mt-2 text-sm text-gray-900">{document.creator}</div>
                    )}
                  </div>

                  {/* Creation Date */}
                  <div className="sm:col-span-3">
                    <label
                      htmlFor="creationDate"
                      className="block text-sm font-medium leading-6 text-gray-900"
                    >
                      {t('archivist.document_creation_date')}
                    </label>
                    {isEditing ? (
                      <div className="mt-2">
                        <input
                          type="date"
                          name="creationDate"
                          id="creationDate"
                          className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-primary sm:text-sm"
                          value={editedDocument.creationDate}
                          onChange={handleInputChange}
                        />
                      </div>
                    ) : (
                      <div className="mt-2 text-sm text-gray-900">
                        {formatDate(document.creationDate)}
                      </div>
                    )}
                  </div>

                  {/* Retention Category */}
                  <div className="sm:col-span-3">
                    <label
                      htmlFor="retentionCategory"
                      className="block text-sm font-medium leading-6 text-gray-900"
                    >
                      {t('archivist.retention_category')}
                    </label>
                    {isEditing ? (
                      <div className="mt-2">
                        <select
                          id="retentionCategory"
                          name="retentionCategory"
                          className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-primary sm:text-sm"
                          value={editedDocument.retentionCategory}
                          onChange={(e) => {
                            const selectedCategory = retentionCategories.find(
                              (category) => category.id === e.target.value
                            )
                            setEditedDocument({
                              ...editedDocument,
                              retentionCategory: e.target.value,
                              retentionYears: selectedCategory ? selectedCategory.years : '',
                            })
                          }}
                        >
                          {retentionCategories.map((category) => (
                            <option key={category.id} value={category.id}>
                              {category.name} ({category.years} {t('archivist.years')})
                            </option>
                          ))}
                        </select>
                      </div>
                    ) : (
                      <div className="mt-2 text-sm text-gray-900">
                        {retentionCategories.find((c) => c.id === document.retentionCategory)?.name} (
                        {document.retentionYears} {t('archivist.years')})
                      </div>
                    )}
                  </div>

                  {/* Confidentiality */}
                  <div className="sm:col-span-3">
                    <label
                      htmlFor="confidentiality"
                      className="block text-sm font-medium leading-6 text-gray-900"
                    >
                      {t('archivist.confidentiality')}
                    </label>
                    {isEditing ? (
                      <div className="mt-2">
                        <select
                          id="confidentiality"
                          name="confidentiality"
                          className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-primary sm:text-sm"
                          value={editedDocument.confidentiality}
                          onChange={handleInputChange}
                        >
                          {confidentialityLevels.map((level) => (
                            <option key={level.id} value={level.id}>
                              {level.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    ) : (
                      <div className="mt-2">
                        <span
                          className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ${getConfidentialityBadgeColor(
                            document.confidentiality
                          )}`}
                        >
                          <Lock className="-ml-0.5 mr-1.5 h-4 w-4" />
                          {confidentialityLevels.find((level) => level.id === document.confidentiality)
                            ?.name}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Description */}
                  <div className="col-span-full">
                    <label
                      htmlFor="description"
                      className="block text-sm font-medium leading-6 text-gray-900"
                    >
                      {t('archivist.document_description')}
                    </label>
                    {isEditing ? (
                      <div className="mt-2">
                        <textarea
                          id="description"
                          name="description"
                          rows={3}
                          className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-primary sm:text-sm"
                          value={editedDocument.description}
                          onChange={handleInputChange}
                        />
                      </div>
                    ) : (
                      <div className="mt-2 text-sm text-gray-900">{document.description}</div>
                    )}
                  </div>

                  {/* Tags */}
                  <div className="col-span-full">
                    <label
                      htmlFor="tags"
                      className="block text-sm font-medium leading-6 text-gray-900"
                    >
                      {t('archivist.document_tags')}
                    </label>
                    {isEditing ? (
                      <div className="mt-2">
                        <div className="flex rounded-md shadow-sm ring-1 ring-inset ring-gray-300 focus-within:ring-2 focus-within:ring-inset focus-within:ring-primary">
                          <input
                            type="text"
                            name="tags"
                            id="tags"
                            className="block flex-1 border-0 bg-transparent py-1.5 pl-2 text-gray-900 placeholder:text-gray-400 focus:ring-0 sm:text-sm"
                            placeholder={t('archivist.document_tags_placeholder')}
                            onKeyDown={handleTagChange}
                          />
                        </div>
                        <p className="mt-2 text-sm text-gray-500">
                          {t('archivist.document_tags_help')}
                        </p>
                        {editedDocument.tags.length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-2">
                            {editedDocument.tags.map((tag) => (
                              <span
                                key={tag}
                                className="inline-flex items-center rounded-md bg-primary-50 px-2 py-1 text-sm font-medium text-primary-700 ring-1 ring-inset ring-primary-600/20"
                              >
                                {tag}
                                <button
                                  type="button"
                                  onClick={() => handleRemoveTag(tag)}
                                  className="ml-1 inline-flex h-4 w-4 items-center justify-center rounded-full text-primary-400 hover:bg-primary-200 hover:text-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
                                >
                                  <span className="sr-only">{t('archivist.remove_tag')}</span>
                                  <X className="h-3 w-3" aria-hidden="true" />
                                </button>
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="mt-2 flex flex-wrap gap-2">
                        {document.tags.map((tag) => (
                          <span
                            key={tag}
                            className="inline-flex items-center rounded-md bg-gray-50 px-2 py-1 text-sm font-medium text-gray-600 ring-1 ring-inset ring-gray-500/10"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Upload Information (read-only) */}
                  <div className="sm:col-span-3">
                    <label className="block text-sm font-medium leading-6 text-gray-900">
                      {t('archivist.uploaded_by')}
                    </label>
                    <div className="mt-2 text-sm text-gray-900">{document.uploadedBy}</div>
                  </div>

                  <div className="sm:col-span-3">
                    <label className="block text-sm font-medium leading-6 text-gray-900">
                      {t('archivist.upload_date')}
                    </label>
                    <div className="mt-2 text-sm text-gray-900">{formatDate(document.uploadDate)}</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Files tab */}
          {activeTab === 'files' && (
            <div>
              <h2 className="text-base font-semibold leading-7 text-gray-900">
                {t('archivist.document_files')}
              </h2>
              <p className="mt-1 text-sm leading-6 text-gray-600">
                {t('archivist.document_files_description')}
              </p>

              <ul role="list" className="mt-6 divide-y divide-gray-100 border-t border-gray-200">
                {document.files.map((file) => (
                  <li key={file.id} className="flex items-center justify-between gap-x-6 py-5">
                    <div className="flex min-w-0 gap-x-4">
                      <div className="flex h-12 w-12 flex-none items-center justify-center rounded-md bg-gray-50">
                        {getFileIcon(file.type)}
                      </div>
                      <div className="min-w-0 flex-auto">
                        <p className="text-sm font-semibold leading-6 text-gray-900">{file.name}</p>
                        <p className="mt-1 truncate text-xs leading-5 text-gray-500">
                          {formatFileSize(file.size)} • {formatDate(file.uploadDate)}
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-none items-center gap-x-4">
                      <a
                        href={file.url}
                        className="hidden rounded-md bg-white px-2.5 py-1.5 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:block"
                      >
                        <Download className="h-5 w-5" aria-hidden="true" />
                        <span className="sr-only">{t('archivist.download_original')}</span>
                      </a>
                      <a
                        href={file.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="rounded-md bg-white px-2.5 py-1.5 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
                      >
                        <Eye className="h-5 w-5" aria-hidden="true" />
                        <span className="sr-only">{t('archivist.view_original')}</span>
                      </a>
                      {file.hasRedactedVersion ? (
                        <>
                          <a
                            href={file.redactedUrl}
                            className="hidden rounded-md bg-white px-2.5 py-1.5 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:block"
                          >
                            <Download className="h-5 w-5 text-red-500" aria-hidden="true" />
                            <span className="sr-only">{t('archivist.download_redacted')}</span>
                          </a>
                          <a
                            href={file.redactedUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="rounded-md bg-white px-2.5 py-1.5 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
                          >
                            <Eye className="h-5 w-5 text-red-500" aria-hidden="true" />
                            <span className="sr-only">{t('archivist.view_redacted')}</span>
                          </a>
                        </>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            setShowRedactionModal(true)
                          }}
                          className="rounded-md bg-white px-2.5 py-1.5 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
                        >
                          <span className="flex items-center">
                            <Pencil className="h-5 w-5 text-red-500" aria-hidden="true" />
                            <span className="ml-2 hidden sm:block">{t('archivist.create_redacted')}</span>
                          </span>
                        </button>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* History tab */}
          {activeTab === 'history' && (
            <div>
              <h2 className="text-base font-semibold leading-7 text-gray-900">
                {t('archivist.document_history')}
              </h2>
              <p className="mt-1 text-sm leading-6 text-gray-600">
                {t('archivist.document_history_description')}
              </p>

              <div className="mt-6 flow-root">
                <ul role="list" className="-mb-8">
                  {document.history.map((historyItem, itemIdx) => (
                    <li key={historyItem.id}>
                      <div className="relative pb-8">
                        {itemIdx !== document.history.length - 1 ? (
                          <span
                            className="absolute left-4 top-4 -ml-px h-full w-0.5 bg-gray-200"
                            aria-hidden="true"
                          />
                        ) : null}
                        <div className="relative flex space-x-3">
                          <div>
                            <span
                              className={`flex h-8 w-8 items-center justify-center rounded-full ring-8 ring-white ${
                                historyItem.action === 'upload'
                                  ? 'bg-green-500'
                                  : historyItem.action === 'metadata_update'
                                  ? 'bg-blue-500'
                                  : historyItem.action === 'approve'
                                  ? 'bg-primary'
                                  : historyItem.action === 'redact'
                                  ? 'bg-red-500'
                                  : 'bg-gray-500'
                              }`}
                            >
                              {historyItem.action === 'upload' ? (
                                <FileText className="h-5 w-5 text-white" aria-hidden="true" />
                              ) : historyItem.action === 'metadata_update' ? (
                                <Pencil className="h-5 w-5 text-white" aria-hidden="true" />
                              ) : historyItem.action === 'approve' ? (
                                <Check className="h-5 w-5 text-white" aria-hidden="true" />
                              ) : historyItem.action === 'redact' ? (
                                <Lock className="h-5 w-5 text-white" aria-hidden="true" />
                              ) : (
                                <Info className="h-5 w-5 text-white" aria-hidden="true" />
                              )}
                            </span>
                          </div>
                          <div className="flex min-w-0 flex-1 justify-between space-x-4 pt-1.5">
                            <div>
                              <p className="text-sm text-gray-500">
                                {historyItem.actionName}{' '}
                                <span className="font-medium text-gray-900">{historyItem.details}</span>
                              </p>
                            </div>
                            <div className="whitespace-nowrap text-right text-sm text-gray-500">
                              <time dateTime={historyItem.date}>
                                {formatDateTime(historyItem.date)}
                              </time>
                              <p>{historyItem.user}</p>
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

      {/* Delete confirmation modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-10 overflow-y-auto">
          <div className="flex min-h-screen items-end justify-center px-4 pb-20 pt-4 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>

            <span className="hidden sm:inline-block sm:h-screen sm:align-middle" aria-hidden="true">
              &#8203;
            </span>

            <div className="inline-block transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-left align-bottom shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:p-6 sm:align-middle">
              <div className="sm:flex sm:items-start">
                <div className="mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                  <AlertTriangle className="h-6 w-6 text-red-600" aria-hidden="true" />
                </div>
                <div className="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left">
                  <h3 className="text-lg font-medium leading-6 text-gray-900">
                    {t('archivist.delete_document')}
                  </h3>
                  <div className="mt-2">
                    <p className="text-sm text-gray-500">
                      {t('archivist.delete_document_confirmation')}
                    </p>
                  </div>
                </div>
              </div>
              <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  className="inline-flex w-full justify-center rounded-md border border-transparent bg-red-600 px-4 py-2 text-base font-medium text-white shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 sm:ml-3 sm:w-auto sm:text-sm"
                  onClick={handleDeleteDocument}
                  disabled={isDeleting}
                >
                  {isDeleting ? t('archivist.deleting') : t('archivist.delete')}
                </button>
                <button
                  type="button"
                  className="mt-3 inline-flex w-full justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-base font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 sm:mt-0 sm:w-auto sm:text-sm"
                  onClick={() => setShowDeleteModal(false)}
                  disabled={isDeleting}
                >
                  {t('archivist.cancel')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Redaction modal */}
      {showRedactionModal && (
        <div className="fixed inset-0 z-10 overflow-y-auto">
          <div className="flex min-h-screen items-end justify-center px-4 pb-20 pt-4 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>

            <span className="hidden sm:inline-block sm:h-screen sm:align-middle" aria-hidden="true">
              &#8203;
            </span>

            <div className="inline-block transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-left align-bottom shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:p-6 sm:align-middle">
              <div className="sm:flex sm:items-start">
                <div className="mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-yellow-100 sm:mx-0 sm:h-10 sm:w-10">
                  <Lock className="h-6 w-6 text-yellow-600" aria-hidden="true" />
                </div>
                <div className="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left">
                  <h3 className="text-lg font-medium leading-6 text-gray-900">
                    {t('archivist.create_redacted_version')}
                  </h3>
                  <div className="mt-2">
                    <p className="text-sm text-gray-500">
                      {t('archivist.create_redacted_version_description')}
                    </p>
                    <div className="mt-4">
                      <label
                        htmlFor="redactionReason"
                        className="block text-sm font-medium text-gray-700"
                      >
                        {t('archivist.redaction_reason')}
                      </label>
                      <textarea
                        id="redactionReason"
                        name="redactionReason"
                        rows={3}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                        placeholder={t('archivist.redaction_reason_placeholder')}
                        value={redactionReason}
                        onChange={(e) => setRedactionReason(e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              </div>
              <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  className="inline-flex w-full justify-center rounded-md border border-transparent bg-primary px-4 py-2 text-base font-medium text-white shadow-sm hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 sm:ml-3 sm:w-auto sm:text-sm"
                  onClick={() => handleRedactFile('file1')}
                  disabled={isRedacting || !redactionReason.trim()}
                >
                  {isRedacting ? t('archivist.processing') : t('archivist.create_redacted')}
                </button>
                <button
                  type="button"
                  className="mt-3 inline-flex w-full justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-base font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 sm:mt-0 sm:w-auto sm:text-sm"
                  onClick={() => {
                    setShowRedactionModal(false)
                    setRedactionReason('')
                  }}
                  disabled={isRedacting}
                >
                  {t('archivist.cancel')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default StaffDocumentViewPage