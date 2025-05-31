import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../../hooks/useAuth'
import { documentsApi } from '../../services/api'
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
  const [isEditing, setIsEditing] = useState(false)
  const [editedDocument, setEditedDocument] = useState(null)

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
    { id: 'permanent', name: 'Permanent', years: 'Permanent' },
    { id: 'cs', name: 'Category CS', years: '30' },
    { id: 'c', name: 'Category C', years: '10' },
    { id: 'ci', name: 'Category CI', years: '5' },
    { id: 'cf', name: 'Category CF', years: '3' },
    { id: '10y', name: 'Category C', years: '10' }, // Add mapping for the raw "10y" value
  ]

  // Confidentiality levels for dropdown
  const confidentialityLevels = [
    { id: 'public', name: 'Public' },
    { id: 'internal', name: 'Internal' },
    { id: 'confidential', name: 'Confidential' },
    { id: 'restricted', name: 'Restricted' },
  ]

  // Fetch document data
  useEffect(() => {
    const fetchDocument = async () => {
      setIsLoading(true)
      try {
        console.log('Fetching document with ID:', id)
        
        // Fetch document details from API
        const response = await documentsApi.getDocument(id)
        
        console.log('Document API response:', response)
        
        if (response.success) {
          const doc = response.data
          console.log('Document details:', doc)
          console.log('Available fields:', Object.keys(doc))
          console.log('File size fields:', {
            file_size: doc.file_size,
            size: doc.size,
            fileSize: doc.fileSize
          })
          console.log('File type fields:', {
            mime_type: doc.mime_type,
            file_type: doc.file_type,
            type: doc.type,
            mimeType: doc.mimeType
          })
          // Transform API response to component state format
          const documentData = {
            id: doc.id,
            title: doc.title || 'Untitled Document',
            documentType: doc.document_type || '',
            documentTypeName: getDocumentTypeName(doc.document_type || ''),
            creator: doc.created_by || 'Unknown',
            creationDate: doc.created_at?.split('T')[0] || '',
            uploadDate: doc.uploaded_at?.split('T')[0] || doc.upload_timestamp?.split('T')[0] || doc.created_at?.split('T')[0] || '',
            uploadedBy: doc.uploaded_by || doc.created_by || 'Unknown',
            uploaderId: doc.uploader_user_id || doc.user_id || '',
            status: doc.status || 'draft',
            statusName: getStatusName(doc.status || 'draft'),
            retentionCategory: doc.retention_category || '',
            retentionYears: getRetentionYears(doc.retention_category || ''),
            retentionEndDate: doc.retention_end_date || '',
            confidentiality: doc.confidentiality_level || 'public',
            description: doc.description || '',
            tags: doc.tags || [],
            files: doc.document_files || [],
            history: doc.history || [],
            // Additional metadata - extract from document_files array
            fileSize: (doc.document_files && doc.document_files.length > 0) ? doc.document_files[0].file_size : 0,
            filePath: (doc.document_files && doc.document_files.length > 0) ? doc.document_files[0].storage_key : '',
            mimeType: (doc.document_files && doc.document_files.length > 0) ? doc.document_files[0].mime_type : '',
            fileName: (doc.document_files && doc.document_files.length > 0) ? doc.document_files[0].file_name : '',
            lastModified: doc.updated_at || doc.created_at,
          }

          setDocument(documentData)
          setEditedDocument({ ...documentData })
        } else {
          console.error('Failed to fetch document:', response.message)
          // Show error message or redirect
          navigate('/documents/search')
        }
      } catch (error) {
        console.error('Error fetching document:', error)
        // Show error message or redirect
        navigate('/documents/search')
      } finally {
        setIsLoading(false)
      }
    }

    if (id) {
    fetchDocument()
    }
  }, [id, navigate])

  // Helper function to get document type display name
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

  // Helper function to get status display name
  const getStatusName = (status) => {
    const statusMap = {
      'draft': 'Draft',
      'under_review': 'Under Review',
      'approved': 'Approved',
      'rejected': 'Rejected',
      'archived': 'Archived',
      'ACTIVE_STORAGE': 'Active Storage',
      'active_storage': 'Active Storage',
      'pending': 'Pending',
      'published': 'Published'
    }
    return statusMap[status] || status || 'Unknown'
  }

  // Helper function to get retention years
  const getRetentionYears = (category) => {
    const categoryMap = {
      'permanent': 'Permanent',
      'cs': '30',
      'c': '10',
      'ci': '5',
      'cf': '3',
      '10y': '10'
    }
    
    // If it's already in the format "Xy" (like "10y"), extract the number
    if (typeof category === 'string' && category.endsWith('y')) {
      const years = category.replace('y', '')
      return isNaN(years) ? category : years
    }
    
    return categoryMap[category] || category || ''
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
      console.log('Saving document changes:', editedDocument)
      
      // Prepare the update payload
      const updateData = {
        title: editedDocument.title,
        description: editedDocument.description,
        document_type: editedDocument.documentType,
        retention_category: editedDocument.retentionCategory,
        confidentiality_level: editedDocument.confidentiality,
        status: editedDocument.status,
        tags: editedDocument.tags,
      }

      // Call the API to update the document
      const response = await documentsApi.updateDocument(editedDocument.id, updateData)
      
      console.log('Document update response:', response)
      
      if (response.success) {
        // Update local state with the response data
        const updatedDoc = response.data
        
        // Transform the response back to the component format
        const documentData = {
          ...editedDocument,
          title: updatedDoc.title || editedDocument.title,
          description: updatedDoc.description || editedDocument.description,
          documentType: updatedDoc.document_type || editedDocument.documentType,
          retentionCategory: updatedDoc.retention_category || editedDocument.retentionCategory,
          confidentiality: updatedDoc.confidentiality_level || editedDocument.confidentiality,
          status: updatedDoc.status || editedDocument.status,
          tags: updatedDoc.tags || editedDocument.tags,
          lastModified: updatedDoc.updated_at || new Date().toISOString(),
        }

        setDocument(documentData)
        setIsEditing(false)
        
        // Show success message (you could add a toast notification here)
        console.log('Document updated successfully')
      } else {
        console.error('Failed to update document:', response.message)
        // Show error message (you could add a toast notification here)
      }
    } catch (error) {
      console.error('Error updating document:', error)
      // Show error message (you could add a toast notification here)
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

  // Get confidentiality badge color
  const getConfidentialityBadgeColor = (level) => {
    switch (level) {
      case 'public':
        return 'bg-green-100 text-green-800'
      case 'internal':
        return 'bg-yellow-100 text-yellow-800'
      case 'confidential':
        return 'bg-orange-100 text-orange-800'
      case 'restricted':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  // Handle simple deletion
  const handleDeleteDocument = () => {
    if (window.confirm('Are you sure you want to delete this document? This action cannot be undone.')) {
      // In a real app, this would call the API to delete the document
      console.log('Deleting document:', document.id)
      navigate('/documents/search')
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
                    {t('common.back')}
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
            {t('common.back')}
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
                  {t('common.cancel')}
                </button>
                <button
                  type="button"
                  onClick={handleSaveDocument}
                  className="ml-3 inline-flex items-center rounded-md bg-primary px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                >
                  <Save className="-ml-0.5 mr-1.5 h-5 w-5" aria-hidden="true" />
                  {t('common.save')}
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={handleDeleteDocument}
                  className="inline-flex items-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                >
                  <Trash2 className="-ml-0.5 mr-1.5 h-5 w-5 text-red-500" aria-hidden="true" />
                  {t('common.delete')}
                </button>
                <button
                  type="button"
                  onClick={handleEditToggle}
                  className="ml-3 inline-flex items-center rounded-md bg-primary px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                >
                  <Pencil className="-ml-0.5 mr-1.5 h-5 w-5" aria-hidden="true" />
                  {t('common.edit')}
                </button>
              </>
            )}
          </div>
        </div>

        {/* Tabs - Remove files and history tabs, keep only details */}
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8" aria-label="Tabs">
            <button
              className="border-primary text-primary whitespace-nowrap border-b-2 px-1 py-4 text-sm font-medium"
              aria-current="page"
            >
              {t('archivist.document_details')}
            </button>
          </nav>
        </div>

        {/* Document Details Content */}
        <div className="mt-8">
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
                      {document.creationDate ? formatDate(document.creationDate) : 'N/A'}
                    </div>
                  )}
                </div>

                {/* Status */}
                <div className="sm:col-span-3">
                  <label
                    htmlFor="status"
                    className="block text-sm font-medium leading-6 text-gray-900"
                  >
                    Status
                  </label>
                  {isEditing ? (
                    <div className="mt-2">
                      <select
                        id="status"
                        name="status"
                        className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-primary sm:text-sm"
                        value={editedDocument.status}
                        onChange={handleInputChange}
                      >
                        <option value="draft">Draft</option>
                        <option value="under_review">Under Review</option>
                        <option value="pending">Pending</option>
                        <option value="approved">Approved</option>
                        <option value="published">Published</option>
                        <option value="ACTIVE_STORAGE">Active Storage</option>
                        <option value="rejected">Rejected</option>
                        <option value="archived">Archived</option>
                      </select>
                    </div>
                  ) : (
                    <div className="mt-2">
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        document.status === 'approved' || document.status === 'ACTIVE_STORAGE' || document.status === 'active_storage' || document.status === 'published' ? 'bg-green-100 text-green-800' :
                        document.status === 'under_review' || document.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        document.status === 'rejected' ? 'bg-red-100 text-red-800' :
                        document.status === 'archived' ? 'bg-gray-100 text-gray-800' :
                        'bg-blue-100 text-blue-800'
                      }`}>
                        {document.statusName}
                      </span>
                    </div>
                  )}
                </div>

                {/* Retention Category */}
                <div className="sm:col-span-3">
                  <label
                    htmlFor="retentionCategory"
                    className="block text-sm font-medium leading-6 text-gray-900"
                  >
                  Retention Category
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
                      <option value="">Select retention category</option>
                        {retentionCategories.map((category) => (
                          <option key={category.id} value={category.id}>
                          {category.name} ({category.years} years)
                          </option>
                        ))}
                      </select>
                    </div>
                  ) : (
                    <div className="mt-2 text-sm text-gray-900">
                    {(() => {
                      if (!document.retentionCategory) return 'Not set'
                      const category = retentionCategories.find(c => c.id === document.retentionCategory)
                      if (category) {
                        return `${category.name} (${category.years} years)`
                      }
                      return document.retentionCategory
                    })()}
                    </div>
                  )}
                </div>

                {/* Confidentiality */}
                <div className="sm:col-span-3">
                  <label
                    htmlFor="confidentiality"
                    className="block text-sm font-medium leading-6 text-gray-900"
                  >
                  Confidentiality Level
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
                      {(() => {
                        const level = confidentialityLevels.find(level => level.id === document.confidentiality)
                        return level ? level.name : document.confidentiality
                      })()}
                      </span>
                    </div>
                  )}
                </div>

              {/* File Information */}
              <div className="sm:col-span-3">
                <label className="block text-sm font-medium leading-6 text-gray-900">
                  File Size
                </label>
                <div className="mt-2 text-sm text-gray-900">
                  {document.fileSize ? formatFileSize(document.fileSize) : 'N/A'}
                </div>
              </div>

              <div className="sm:col-span-3">
                <label className="block text-sm font-medium leading-6 text-gray-900">
                  File Type
                </label>
                <div className="mt-2 text-sm text-gray-900">
                  {document.mimeType || 'N/A'}
                </div>
              </div>

                {/* Description */}
                <div className="col-span-full">
                  <label
                    htmlFor="description"
                    className="block text-sm font-medium leading-6 text-gray-900"
                  >
                  Description
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
                  <div className="mt-2 text-sm text-gray-900">
                    {document.description || 'No description provided'}
                  </div>
                  )}
                </div>

                {/* Tags */}
                <div className="col-span-full">
                  <label
                    htmlFor="tags"
                    className="block text-sm font-medium leading-6 text-gray-900"
                  >
                  Tags
                  </label>
                  {isEditing ? (
                    <div className="mt-2">
                      <div className="flex rounded-md shadow-sm ring-1 ring-inset ring-gray-300 focus-within:ring-2 focus-within:ring-inset focus-within:ring-primary">
                        <input
                          type="text"
                          name="tags"
                          id="tags"
                          className="block flex-1 border-0 bg-transparent py-1.5 pl-2 text-gray-900 placeholder:text-gray-400 focus:ring-0 sm:text-sm"
                        placeholder="Add tags and press Enter"
                          onKeyDown={handleTagChange}
                        />
                      </div>
                      <p className="mt-2 text-sm text-gray-500">
                      Press Enter to add a tag
                      </p>
                    {editedDocument.tags && editedDocument.tags.length > 0 && (
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
                              <span className="sr-only">Remove tag</span>
                                <X className="h-3 w-3" aria-hidden="true" />
                              </button>
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : (
                  <div className="mt-2">
                    {document.tags && document.tags.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                      {document.tags.map((tag) => (
                        <span
                          key={tag}
                          className="inline-flex items-center rounded-md bg-gray-50 px-2 py-1 text-sm font-medium text-gray-600 ring-1 ring-inset ring-gray-500/10"
                        >
                          {tag}
                        </span>
                      ))}
                      </div>
                    ) : (
                      <div className="text-sm text-gray-500">No tags</div>
                    )}
                    </div>
                  )}
                </div>

                {/* Upload Information (read-only) */}
                <div className="sm:col-span-3">
                  <label className="block text-sm font-medium leading-6 text-gray-900">
                  Uploaded By
                  </label>
                  <div className="mt-2 text-sm text-gray-900">{document.uploadedBy}</div>
                </div>

                <div className="sm:col-span-3">
                  <label className="block text-sm font-medium leading-6 text-gray-900">
                  Upload Date
                  </label>
                <div className="mt-2 text-sm text-gray-900">
                  {document.uploadDate ? formatDate(document.uploadDate) : 'N/A'}
                </div>
              </div>

              {/* Last Modified */}
              <div className="sm:col-span-3">
                <label className="block text-sm font-medium leading-6 text-gray-900">
                  Last Modified
                </label>
                <div className="mt-2 text-sm text-gray-900">
                  {document.lastModified ? formatDateTime(document.lastModified) : 'N/A'}
                    </div>
                    </div>

              {/* Document ID */}
              <div className="sm:col-span-3">
                <label className="block text-sm font-medium leading-6 text-gray-900">
                  Document ID
                    </label>
                <div className="mt-2 text-sm text-gray-900 font-mono">
                  {document.id}
                  </div>
                </div>
              </div>
            </div>
            </div>
          </div>
        </div>
    </div>
  )
}

export default StaffDocumentViewPage