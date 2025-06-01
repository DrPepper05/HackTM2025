import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../../hooks/useAuth'
import {
  FileText,
  Download,
  ArrowLeft,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Eye,
  Calendar,
  Clock,
  User,
  Tag,
  Lock,
  Info,
} from 'lucide-react'

function DocumentReviewPage() {
  const { id } = useParams()
  const { t } = useTranslation()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [isLoading, setIsLoading] = useState(true)
  const [document, setDocument] = useState(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [reviewData, setReviewData] = useState({
    decision: '',
    comments: '',
    metadataChanges: {},
  })
  const [showConfirmation, setShowConfirmation] = useState(false)

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
          title: 'Contract de achiziție publică pentru servicii de mentenanță',
          documentType: 'contract',
          documentTypeName: 'Contract',
          creator: 'Direcția Achiziții Publice',
          creationDate: '2023-10-20',
          uploadDate: '2023-10-22',
          uploadedBy: 'Maria Popescu',
          status: 'registered',
          retentionCategory: 'c',
          retentionYears: '10',
          confidentiality: 'internal',
          description:
            'Contract de achiziție publică pentru servicii de mentenanță a echipamentelor IT din cadrul instituției pentru perioada 2023-2024.',
          tags: ['contract', 'achiziții', 'IT', 'mentenanță'],
          files: [
            {
              id: 'f1',
              name: 'contract_mentenanta_it.pdf',
              size: 3245678,
              type: 'application/pdf',
              uploadDate: '2023-10-22',
            },
            {
              id: 'f2',
              name: 'anexa1_specificatii_tehnice.docx',
              size: 1245632,
              type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
              uploadDate: '2023-10-22',
            },
            {
              id: 'f3',
              name: 'anexa2_grafic_activitati.xlsx',
              size: 987452,
              type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
              uploadDate: '2023-10-22',
            },
          ],
        }

        setDocument(mockDocument)
        // Initialize metadata changes with current values
        setReviewData({
          ...reviewData,
          metadataChanges: {
            title: mockDocument.title,
            documentType: mockDocument.documentType,
            creator: mockDocument.creator,
            creationDate: mockDocument.creationDate,
            retentionCategory: mockDocument.retentionCategory,
            confidentiality: mockDocument.confidentiality,
            description: mockDocument.description,
            tags: mockDocument.tags.join(', '),
          },
        })
      } catch (error) {
        console.error('Error fetching document:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchDocument()
  }, [id])

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

  // Handle input changes for review data
  const handleInputChange = (e) => {
    const { name, value } = e.target
    setReviewData({
      ...reviewData,
      [name]: value,
    })
  }

  // Handle input changes for metadata
  const handleMetadataChange = (e) => {
    const { name, value } = e.target
    setReviewData({
      ...reviewData,
      metadataChanges: {
        ...reviewData.metadataChanges,
        [name]: value,
      },
    })
  }

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault()
    setShowConfirmation(true)
  }

  // Handle confirmation
  const handleConfirmation = async (confirmed) => {
    if (!confirmed) {
      setShowConfirmation(false)
      return
    }

    setIsSubmitting(true)
    try {
      // In a real app, this would be an API call to submit the review
      // For the hackathon, we'll simulate a successful submission
      await new Promise((resolve) => setTimeout(resolve, 1500))

      // Navigate back to the ingest queue
      navigate('/dashboard/archivist/ingest-queue')
    } catch (error) {
      console.error('Error submitting review:', error)
      setIsSubmitting(false)
      setShowConfirmation(false)
    }
  }

  // Format date for display
  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleDateString()
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
    alert(t('archivist.download_started'))
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

  // Render error state if document not found
  if (!document) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900">{t('archivist.document_not_found')}</h2>
          <p className="mt-2 text-sm text-gray-500">
            {t('archivist.document_not_found_description')}
          </p>
          <button
            type="button"
            onClick={() => navigate('/dashboard/archivist/ingest-queue')}
            className="mt-6 inline-flex items-center rounded-md bg-primary px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary-dark focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          >
            <ArrowLeft className="-ml-0.5 mr-1.5 h-5 w-5" aria-hidden="true" />
            {t('archivist.back_to_ingest_queue')}
          </button>
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
            onClick={() => navigate('/dashboard/archivist/ingest-queue')}
            className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-gray-700"
          >
            <ArrowLeft className="-ml-1 mr-1 h-5 w-5" aria-hidden="true" />
            {t('archivist.back_to_ingest_queue')}
          </button>
        </div>

        {/* Document header */}
        <div className="mb-8 border-b border-gray-200 pb-8">
          <div className="md:flex md:items-center md:justify-between">
            <div className="min-w-0 flex-1">
              <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:text-3xl sm:tracking-tight">
                {t('archivist.review_document')}
              </h2>
              <div className="mt-1 flex flex-col sm:mt-0 sm:flex-row sm:flex-wrap sm:space-x-6">
                <div className="mt-2 flex items-center text-sm text-gray-500">
                  <FileText className="mr-1.5 h-5 w-5 flex-shrink-0 text-gray-400" />
                  {document.documentTypeName}
                </div>
                <div className="mt-2 flex items-center text-sm text-gray-500">
                  <User className="mr-1.5 h-5 w-5 flex-shrink-0 text-gray-400" />
                  {t('archivist.uploaded_by')} {document.uploadedBy}
                </div>
                <div className="mt-2 flex items-center text-sm text-gray-500">
                  <Calendar className="mr-1.5 h-5 w-5 flex-shrink-0 text-gray-400" />
                  {t('archivist.uploaded_on')} {formatDate(document.uploadDate)}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Review form */}
        <form onSubmit={handleSubmit}>
          <div className="space-y-12">
            {/* Document information section */}
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
                  <div className="mt-2">
                    <input
                      type="text"
                      name="title"
                      id="title"
                      className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-primary sm:text-sm"
                      value={reviewData.metadataChanges.title}
                      onChange={handleMetadataChange}
                    />
                  </div>
                </div>

                {/* Document Type */}
                <div className="sm:col-span-3">
                  <label
                    htmlFor="documentType"
                    className="block text-sm font-medium leading-6 text-gray-900"
                  >
                    {t('archivist.document_type')}
                  </label>
                  <div className="mt-2">
                    <select
                      id="documentType"
                      name="documentType"
                      className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-primary sm:text-sm"
                      value={reviewData.metadataChanges.documentType}
                      onChange={handleMetadataChange}
                    >
                      {documentTypes.map((type) => (
                        <option key={type.id} value={type.id}>
                          {type.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Creator */}
                <div className="sm:col-span-3">
                  <label
                    htmlFor="creator"
                    className="block text-sm font-medium leading-6 text-gray-900"
                  >
                    {t('archivist.document_creator')}
                  </label>
                  <div className="mt-2">
                    <input
                      type="text"
                      name="creator"
                      id="creator"
                      className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-primary sm:text-sm"
                      value={reviewData.metadataChanges.creator}
                      onChange={handleMetadataChange}
                    />
                  </div>
                </div>

                {/* Creation Date */}
                <div className="sm:col-span-3">
                  <label
                    htmlFor="creationDate"
                    className="block text-sm font-medium leading-6 text-gray-900"
                  >
                    {t('archivist.document_creation_date')}
                  </label>
                  <div className="mt-2">
                    <input
                      type="date"
                      name="creationDate"
                      id="creationDate"
                      className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-primary sm:text-sm"
                      value={reviewData.metadataChanges.creationDate}
                      onChange={handleMetadataChange}
                    />
                  </div>
                </div>

                {/* Retention Category */}
                <div className="sm:col-span-3">
                  <label
                    htmlFor="retentionCategory"
                    className="block text-sm font-medium leading-6 text-gray-900"
                  >
                    {t('archivist.retention_category')}
                  </label>
                  <div className="mt-2">
                    <select
                      id="retentionCategory"
                      name="retentionCategory"
                      className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-primary sm:text-sm"
                      value={reviewData.metadataChanges.retentionCategory}
                      onChange={handleMetadataChange}
                    >
                      {retentionCategories.map((category) => (
                        <option key={category.id} value={category.id}>
                          {category.name} ({category.years} {t('archivist.years')})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Confidentiality */}
                <div className="sm:col-span-3">
                  <label
                    htmlFor="confidentiality"
                    className="block text-sm font-medium leading-6 text-gray-900"
                  >
                    {t('archivist.confidentiality')}
                  </label>
                  <div className="mt-2">
                    <select
                      id="confidentiality"
                      name="confidentiality"
                      className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-primary sm:text-sm"
                      value={reviewData.metadataChanges.confidentiality}
                      onChange={handleMetadataChange}
                    >
                      <option value="public">{t('archivist.confidentiality_public')}</option>
                      <option value="internal">{t('archivist.confidentiality_internal')}</option>
                      <option value="confidential">{t('archivist.confidentiality_confidential')}</option>
                      <option value="restricted">{t('archivist.confidentiality_restricted')}</option>
                    </select>
                  </div>
                </div>

                {/* Description */}
                <div className="col-span-full">
                  <label
                    htmlFor="description"
                    className="block text-sm font-medium leading-6 text-gray-900"
                  >
                    {t('archivist.document_description')}
                  </label>
                  <div className="mt-2">
                    <textarea
                      id="description"
                      name="description"
                      rows={3}
                      className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-primary sm:text-sm"
                      value={reviewData.metadataChanges.description}
                      onChange={handleMetadataChange}
                    />
                  </div>
                </div>

                {/* Tags */}
                <div className="sm:col-span-4">
                  <label
                    htmlFor="tags"
                    className="block text-sm font-medium leading-6 text-gray-900"
                  >
                    {t('archivist.document_tags')}
                  </label>
                  <div className="mt-2">
                    <input
                      type="text"
                      name="tags"
                      id="tags"
                      className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-primary sm:text-sm"
                      placeholder={t('archivist.document_tags_placeholder')}
                      value={reviewData.metadataChanges.tags}
                      onChange={handleMetadataChange}
                    />
                  </div>
                  <p className="mt-2 text-sm text-gray-500">{t('archivist.document_tags_help')}</p>
                </div>
              </div>
            </div>

            {/* Document files section */}
            <div className="border-b border-gray-900/10 pb-12">
              <h2 className="text-base font-semibold leading-7 text-gray-900">
                {t('archivist.document_files')}
              </h2>
              <p className="mt-1 text-sm leading-6 text-gray-600">
                {t('archivist.document_files_description')}
              </p>

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

            {/* Review decision section */}
            <div className="border-b border-gray-900/10 pb-12">
              <h2 className="text-base font-semibold leading-7 text-gray-900">
                {t('archivist.review_decision')}
              </h2>
              <p className="mt-1 text-sm leading-6 text-gray-600">
                {t('archivist.review_decision_description')}
              </p>

              <div className="mt-6 space-y-6">
                <div className="flex items-center gap-x-3">
                  <input
                    id="approve"
                    name="decision"
                    type="radio"
                    value="approve"
                    checked={reviewData.decision === 'approve'}
                    onChange={handleInputChange}
                    className="h-4 w-4 border-gray-300 text-primary focus:ring-primary"
                  />
                  <label htmlFor="approve" className="block text-sm font-medium leading-6 text-gray-900">
                    {t('archivist.approve')}
                  </label>
                </div>
                <div className="flex items-center gap-x-3">
                  <input
                    id="reject"
                    name="decision"
                    type="radio"
                    value="reject"
                    checked={reviewData.decision === 'reject'}
                    onChange={handleInputChange}
                    className="h-4 w-4 border-gray-300 text-primary focus:ring-primary"
                  />
                  <label htmlFor="reject" className="block text-sm font-medium leading-6 text-gray-900">
                    {t('archivist.reject')}
                  </label>
                </div>

                <div className="mt-6">
                  <label
                    htmlFor="comments"
                    className="block text-sm font-medium leading-6 text-gray-900"
                  >
                    {t('archivist.review_comments')}
                  </label>
                  <div className="mt-2">
                    <textarea
                      id="comments"
                      name="comments"
                      rows={4}
                      className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-primary sm:text-sm"
                      placeholder={t('archivist.review_comments_placeholder')}
                      value={reviewData.comments}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 flex items-center justify-end gap-x-6">
            <button
              type="button"
              onClick={() => navigate('/dashboard/archivist/ingest-queue')}
              className="text-sm font-semibold leading-6 text-gray-900"
            >
              {t('archivist.cancel')}
            </button>
            <button
              type="submit"
              disabled={!reviewData.decision}
              className="rounded-md bg-primary px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary-dark focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:opacity-50"
            >
              {t('archivist.submit_review')}
            </button>
          </div>
        </form>

        {/* Confirmation modal */}
        {showConfirmation && (
          <div className="fixed inset-0 z-10 overflow-y-auto">
            <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
              <div className="relative transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:p-6">
                <div>
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-yellow-100">
                    {reviewData.decision === 'approve' ? (
                      <CheckCircle className="h-6 w-6 text-green-600" aria-hidden="true" />
                    ) : (
                      <XCircle className="h-6 w-6 text-red-600" aria-hidden="true" />
                    )}
                  </div>
                  <div className="mt-3 text-center sm:mt-5">
                    <h3 className="text-base font-semibold leading-6 text-gray-900">
                      {reviewData.decision === 'approve'
                        ? t('archivist.confirm_approve')
                        : t('archivist.confirm_reject')}
                    </h3>
                    <div className="mt-2">
                      <p className="text-sm text-gray-500">
                        {reviewData.decision === 'approve'
                          ? t('archivist.confirm_approve_description')
                          : t('archivist.confirm_reject_description')}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="mt-5 sm:mt-6 sm:grid sm:grid-flow-row-dense sm:grid-cols-2 sm:gap-3">
                  <button
                    type="button"
                    className="inline-flex w-full justify-center rounded-md bg-primary px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary-dark focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary sm:col-start-2"
                    onClick={() => handleConfirmation(true)}
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? t('archivist.submitting') : t('archivist.confirm')}
                  </button>
                  <button
                    type="button"
                    className="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:col-start-1 sm:mt-0"
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

export default DocumentReviewPage