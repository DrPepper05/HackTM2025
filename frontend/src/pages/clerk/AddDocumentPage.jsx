import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { Upload, X, FileText, Check, AlertCircle } from 'lucide-react'

function AddDocumentPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [currentStep, setCurrentStep] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [uploadSuccess, setUploadSuccess] = useState(false)
  const [files, setFiles] = useState([])
  const [dragActive, setDragActive] = useState(false)
  const [documentData, setDocumentData] = useState({
    title: '',
    documentType: '',
    creator: '',
    creationDate: '',
    description: '',
    retentionCategory: '',
    confidentiality: 'public',
    tags: '',
  })

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
    { id: 'permanent', name: t('clerk.retention_permanent'), years: 'Permanent' },
    { id: 'cs', name: t('clerk.retention_cs'), years: '30' },
    { id: 'c', name: t('clerk.retention_c'), years: '10' },
    { id: 'ci', name: t('clerk.retention_ci'), years: '5' },
    { id: 'cf', name: t('clerk.retention_cf'), years: '3' },
  ]

  // Handle file drop
  const handleDrag = (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const handleDrop = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(e.dataTransfer.files)
    }
  }

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFiles(e.target.files)
    }
  }

  const handleFiles = (fileList) => {
    const newFiles = Array.from(fileList).map((file) => ({
      file,
      name: file.name,
      size: file.size,
      type: file.type,
      preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : null,
    }))
    setFiles([...files, ...newFiles])
  }

  const removeFile = (index) => {
    const newFiles = [...files]
    if (newFiles[index].preview) {
      URL.revokeObjectURL(newFiles[index].preview)
    }
    newFiles.splice(index, 1)
    setFiles(newFiles)
  }

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target
    setDocumentData({
      ...documentData,
      [name]: value,
    })
  }

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      // In a real app, this would be an API call to upload files and metadata
      // For the hackathon, we'll simulate a successful upload
      setTimeout(() => {
        setUploadSuccess(true)
        setIsSubmitting(false)
      }, 2000)
    } catch (error) {
      console.error('Error uploading document:', error)
      setIsSubmitting(false)
    }
  }

  // Navigate to next step
  const nextStep = () => {
    setCurrentStep(currentStep + 1)
  }

  // Navigate to previous step
  const prevStep = () => {
    setCurrentStep(currentStep - 1)
  }

  // Reset form and start over
  const resetForm = () => {
    setFiles([])
    setDocumentData({
      title: '',
      documentType: '',
      creator: '',
      creationDate: '',
      description: '',
      retentionCategory: '',
      confidentiality: 'public',
      tags: '',
    })
    setCurrentStep(1)
    setUploadSuccess(false)
  }

  // Format file size
  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  // Render step 1: File upload
  const renderStep1 = () => (
    <div>
      <h2 className="text-xl font-semibold text-gray-900">{t('clerk.upload_files')}</h2>
      <p className="mt-1 text-sm text-gray-500">{t('clerk.upload_files_description')}</p>

      {/* File drop area */}
      <div
        className={`mt-6 flex justify-center rounded-lg border border-dashed border-gray-900/25 px-6 py-10 ${
          dragActive ? 'border-primary bg-primary/5' : ''
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <div className="text-center">
          <Upload className="mx-auto h-12 w-12 text-gray-300" />
          <div className="mt-4 flex text-sm leading-6 text-gray-600">
            <label
              htmlFor="file-upload"
              className="relative cursor-pointer rounded-md bg-white font-semibold text-primary focus-within:outline-none focus-within:ring-2 focus-within:ring-primary focus-within:ring-offset-2 hover:text-primary-dark"
            >
              <span>{t('clerk.upload_browse')}</span>
              <input
                id="file-upload"
                name="file-upload"
                type="file"
                className="sr-only"
                multiple
                onChange={handleFileChange}
              />
            </label>
            <p className="pl-1">{t('clerk.upload_drag_drop')}</p>
          </div>
          <p className="text-xs leading-5 text-gray-600">{t('clerk.upload_file_types')}</p>
        </div>
      </div>

      {/* File list */}
      {files.length > 0 && (
        <div className="mt-6">
          <h3 className="text-sm font-medium text-gray-900">{t('clerk.uploaded_files')}</h3>
          <ul className="mt-3 divide-y divide-gray-100 rounded-md border border-gray-200">
            {files.map((file, index) => (
              <li key={index} className="flex items-center justify-between py-3 pl-3 pr-4 text-sm">
                <div className="flex w-0 flex-1 items-center">
                  <FileText className="h-5 w-5 flex-shrink-0 text-gray-400" />
                  <span className="ml-2 w-0 flex-1 truncate">{file.name}</span>
                </div>
                <div className="ml-4 flex flex-shrink-0 space-x-4">
                  <span className="text-gray-500">{formatFileSize(file.size)}</span>
                  <button
                    type="button"
                    className="text-red-500 hover:text-red-700"
                    onClick={() => removeFile(index)}
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Navigation buttons */}
      <div className="mt-8 flex justify-end">
        <button
          type="button"
          onClick={nextStep}
          disabled={files.length === 0}
          className="rounded-md bg-primary px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary-dark focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:opacity-50"
        >
          {t('clerk.next_step')}
        </button>
      </div>
    </div>
  )

  // Render step 2: Document metadata
  const renderStep2 = () => (
    <div>
      <h2 className="text-xl font-semibold text-gray-900">{t('clerk.document_metadata')}</h2>
      <p className="mt-1 text-sm text-gray-500">{t('clerk.document_metadata_description')}</p>

      <form className="mt-6 grid grid-cols-1 gap-x-6 gap-y-6 sm:grid-cols-6">
        {/* Title */}
        <div className="sm:col-span-4">
          <label htmlFor="title" className="block text-sm font-medium leading-6 text-gray-900">
            {t('clerk.document_title')}
          </label>
          <div className="mt-2">
            <input
              type="text"
              name="title"
              id="title"
              required
              className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-primary sm:text-sm"
              value={documentData.title}
              onChange={handleInputChange}
            />
          </div>
        </div>

        {/* Document Type */}
        <div className="sm:col-span-3">
          <label htmlFor="documentType" className="block text-sm font-medium leading-6 text-gray-900">
            {t('clerk.document_type')}
          </label>
          <div className="mt-2">
            <select
              id="documentType"
              name="documentType"
              required
              className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-primary sm:text-sm"
              value={documentData.documentType}
              onChange={handleInputChange}
            >
              <option value="">{t('clerk.select_document_type')}</option>
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
          <label htmlFor="creator" className="block text-sm font-medium leading-6 text-gray-900">
            {t('clerk.document_creator')}
          </label>
          <div className="mt-2">
            <input
              type="text"
              name="creator"
              id="creator"
              required
              className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-primary sm:text-sm"
              value={documentData.creator}
              onChange={handleInputChange}
            />
          </div>
        </div>

        {/* Creation Date */}
        <div className="sm:col-span-3">
          <label htmlFor="creationDate" className="block text-sm font-medium leading-6 text-gray-900">
            {t('clerk.document_creation_date')}
          </label>
          <div className="mt-2">
            <input
              type="date"
              name="creationDate"
              id="creationDate"
              required
              className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-primary sm:text-sm"
              value={documentData.creationDate}
              onChange={handleInputChange}
            />
          </div>
        </div>

        {/* Retention Category */}
        <div className="sm:col-span-3">
          <label htmlFor="retentionCategory" className="block text-sm font-medium leading-6 text-gray-900">
            {t('clerk.retention_category')}
          </label>
          <div className="mt-2">
            <select
              id="retentionCategory"
              name="retentionCategory"
              required
              className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-primary sm:text-sm"
              value={documentData.retentionCategory}
              onChange={handleInputChange}
            >
              <option value="">{t('clerk.select_retention_category')}</option>
              {retentionCategories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name} ({category.years} {t('clerk.years')})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Confidentiality */}
        <div className="sm:col-span-3">
          <label htmlFor="confidentiality" className="block text-sm font-medium leading-6 text-gray-900">
            {t('clerk.confidentiality')}
          </label>
          <div className="mt-2">
            <select
              id="confidentiality"
              name="confidentiality"
              required
              className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-primary sm:text-sm"
              value={documentData.confidentiality}
              onChange={handleInputChange}
            >
              <option value="public">{t('clerk.confidentiality_public')}</option>
              <option value="internal">{t('clerk.confidentiality_internal')}</option>
              <option value="confidential">{t('clerk.confidentiality_confidential')}</option>
              <option value="restricted">{t('clerk.confidentiality_restricted')}</option>
            </select>
          </div>
        </div>

        {/* Description */}
        <div className="col-span-full">
          <label htmlFor="description" className="block text-sm font-medium leading-6 text-gray-900">
            {t('clerk.document_description')}
          </label>
          <div className="mt-2">
            <textarea
              id="description"
              name="description"
              rows={3}
              className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-primary sm:text-sm"
              value={documentData.description}
              onChange={handleInputChange}
            />
          </div>
          <p className="mt-2 text-sm text-gray-500">{t('clerk.document_description_help')}</p>
        </div>

        {/* Tags */}
        <div className="sm:col-span-4">
          <label htmlFor="tags" className="block text-sm font-medium leading-6 text-gray-900">
            {t('clerk.document_tags')}
          </label>
          <div className="mt-2">
            <input
              type="text"
              name="tags"
              id="tags"
              className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-primary sm:text-sm"
              placeholder={t('clerk.document_tags_placeholder')}
              value={documentData.tags}
              onChange={handleInputChange}
            />
          </div>
          <p className="mt-2 text-sm text-gray-500">{t('clerk.document_tags_help')}</p>
        </div>
      </form>

      {/* Navigation buttons */}
      <div className="mt-8 flex justify-between">
        <button
          type="button"
          onClick={prevStep}
          className="rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
        >
          {t('clerk.previous_step')}
        </button>
        <button
          type="button"
          onClick={nextStep}
          disabled={
            !documentData.title ||
            !documentData.documentType ||
            !documentData.creator ||
            !documentData.creationDate ||
            !documentData.retentionCategory
          }
          className="rounded-md bg-primary px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary-dark focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:opacity-50"
        >
          {t('clerk.next_step')}
        </button>
      </div>
    </div>
  )

  // Render step 3: Review and submit
  const renderStep3 = () => (
    <div>
      <h2 className="text-xl font-semibold text-gray-900">{t('clerk.review_and_submit')}</h2>
      <p className="mt-1 text-sm text-gray-500">{t('clerk.review_and_submit_description')}</p>

      <div className="mt-6 rounded-md bg-yellow-50 p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <AlertCircle className="h-5 w-5 text-yellow-400" aria-hidden="true" />
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-yellow-800">{t('clerk.attention')}</h3>
            <div className="mt-2 text-sm text-yellow-700">
              <p>{t('clerk.review_warning')}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 border-t border-gray-100">
        <dl className="divide-y divide-gray-100">
          <div className="px-4 py-6 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-0">
            <dt className="text-sm font-medium leading-6 text-gray-900">{t('clerk.document_title')}</dt>
            <dd className="mt-1 text-sm leading-6 text-gray-700 sm:col-span-2 sm:mt-0">
              {documentData.title}
            </dd>
          </div>
          <div className="px-4 py-6 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-0">
            <dt className="text-sm font-medium leading-6 text-gray-900">{t('clerk.document_type')}</dt>
            <dd className="mt-1 text-sm leading-6 text-gray-700 sm:col-span-2 sm:mt-0">
              {documentTypes.find((type) => type.id === documentData.documentType)?.name || ''}
            </dd>
          </div>
          <div className="px-4 py-6 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-0">
            <dt className="text-sm font-medium leading-6 text-gray-900">{t('clerk.document_creator')}</dt>
            <dd className="mt-1 text-sm leading-6 text-gray-700 sm:col-span-2 sm:mt-0">
              {documentData.creator}
            </dd>
          </div>
          <div className="px-4 py-6 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-0">
            <dt className="text-sm font-medium leading-6 text-gray-900">
              {t('clerk.document_creation_date')}
            </dt>
            <dd className="mt-1 text-sm leading-6 text-gray-700 sm:col-span-2 sm:mt-0">
              {documentData.creationDate}
            </dd>
          </div>
          <div className="px-4 py-6 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-0">
            <dt className="text-sm font-medium leading-6 text-gray-900">{t('clerk.retention_category')}</dt>
            <dd className="mt-1 text-sm leading-6 text-gray-700 sm:col-span-2 sm:mt-0">
              {retentionCategories.find((cat) => cat.id === documentData.retentionCategory)?.name || ''} (
              {retentionCategories.find((cat) => cat.id === documentData.retentionCategory)?.years || ''}{' '}
              {t('clerk.years')})
            </dd>
          </div>
          <div className="px-4 py-6 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-0">
            <dt className="text-sm font-medium leading-6 text-gray-900">{t('clerk.confidentiality')}</dt>
            <dd className="mt-1 text-sm leading-6 text-gray-700 sm:col-span-2 sm:mt-0">
              {t(`clerk.confidentiality_${documentData.confidentiality}`)}
            </dd>
          </div>
          {documentData.description && (
            <div className="px-4 py-6 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-0">
              <dt className="text-sm font-medium leading-6 text-gray-900">
                {t('clerk.document_description')}
              </dt>
              <dd className="mt-1 text-sm leading-6 text-gray-700 sm:col-span-2 sm:mt-0">
                {documentData.description}
              </dd>
            </div>
          )}
          {documentData.tags && (
            <div className="px-4 py-6 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-0">
              <dt className="text-sm font-medium leading-6 text-gray-900">{t('clerk.document_tags')}</dt>
              <dd className="mt-1 text-sm leading-6 text-gray-700 sm:col-span-2 sm:mt-0">
                <div className="flex flex-wrap gap-2">
                  {documentData.tags.split(',').map((tag, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center rounded-full bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-700/10"
                    >
                      {tag.trim()}
                    </span>
                  ))}
                </div>
              </dd>
            </div>
          )}
          <div className="px-4 py-6 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-0">
            <dt className="text-sm font-medium leading-6 text-gray-900">{t('clerk.uploaded_files')}</dt>
            <dd className="mt-1 text-sm leading-6 text-gray-700 sm:col-span-2 sm:mt-0">
              <ul className="divide-y divide-gray-100 rounded-md border border-gray-200">
                {files.map((file, index) => (
                  <li key={index} className="flex items-center justify-between py-3 pl-3 pr-4 text-sm">
                    <div className="flex w-0 flex-1 items-center">
                      <FileText className="h-5 w-5 flex-shrink-0 text-gray-400" />
                      <span className="ml-2 w-0 flex-1 truncate">{file.name}</span>
                    </div>
                    <div className="ml-4 flex-shrink-0">
                      <span className="text-gray-500">{formatFileSize(file.size)}</span>
                    </div>
                  </li>
                ))}
              </ul>
            </dd>
          </div>
        </dl>
      </div>

      {/* Navigation buttons */}
      <div className="mt-8 flex justify-between">
        <button
          type="button"
          onClick={prevStep}
          className="rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
        >
          {t('clerk.previous_step')}
        </button>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="rounded-md bg-primary px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary-dark focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:opacity-50"
        >
          {isSubmitting ? t('clerk.submitting') : t('clerk.submit_document')}
        </button>
      </div>
    </div>
  )

  // Render success message
  const renderSuccess = () => (
    <div className="text-center">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
        <Check className="h-6 w-6 text-green-600" aria-hidden="true" />
      </div>
      <h2 className="mt-6 text-xl font-semibold text-gray-900">{t('clerk.upload_success')}</h2>
      <p className="mt-2 text-sm text-gray-500">{t('clerk.upload_success_description')}</p>
      <div className="mt-8 flex justify-center space-x-4">
        <button
          type="button"
          onClick={resetForm}
          className="rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
        >
          {t('clerk.upload_another')}
        </button>
        <button
          type="button"
          onClick={() => navigate('/dashboard/clerk/my-uploads')}
          className="rounded-md bg-primary px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary-dark focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        >
          {t('clerk.view_my_uploads')}
        </button>
      </div>
    </div>
  )

  return (
    <div className="bg-white">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl">
          {/* Progress steps */}
          {!uploadSuccess && (
            <nav aria-label="Progress" className="mb-8">
              <ol
                role="list"
                className="divide-y divide-gray-300 rounded-md border border-gray-300 md:flex md:divide-y-0"
              >
                {[
                  { id: 1, name: t('clerk.step_upload_files') },
                  { id: 2, name: t('clerk.step_document_metadata') },
                  { id: 3, name: t('clerk.step_review_submit') },
                ].map((step) => (
                  <li key={step.id} className="relative md:flex md:flex-1">
                    {step.id < currentStep ? (
                      <div className="group flex w-full items-center">
                        <span className="flex items-center px-6 py-4 text-sm font-medium">
                          <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-primary">
                            <Check className="h-6 w-6 text-white" aria-hidden="true" />
                          </span>
                          <span className="ml-4 text-sm font-medium text-gray-900">{step.name}</span>
                        </span>
                      </div>
                    ) : step.id === currentStep ? (
                      <div className="flex items-center px-6 py-4 text-sm font-medium" aria-current="step">
                        <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full border-2 border-primary">
                          <span className="text-primary">{step.id}</span>
                        </span>
                        <span className="ml-4 text-sm font-medium text-primary">{step.name}</span>
                      </div>
                    ) : (
                      <div className="group flex items-center">
                        <span className="flex items-center px-6 py-4 text-sm font-medium">
                          <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full border-2 border-gray-300">
                            <span className="text-gray-500">{step.id}</span>
                          </span>
                          <span className="ml-4 text-sm font-medium text-gray-500">{step.name}</span>
                        </span>
                      </div>
                    )}

                    {step.id !== 3 && (
                      <div className="absolute right-0 top-0 hidden h-full w-5 md:block" aria-hidden="true">
                        <svg
                          className="h-full w-full text-gray-300"
                          viewBox="0 0 22 80"
                          fill="none"
                          preserveAspectRatio="none"
                        >
                          <path
                            d="M0 -2L20 40L0 82"
                            vectorEffect="non-scaling-stroke"
                            stroke="currentcolor"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </div>
                    )}
                  </li>
                ))}
              </ol>
            </nav>
          )}

          {/* Step content */}
          {uploadSuccess
            ? renderSuccess()
            : currentStep === 1
            ? renderStep1()
            : currentStep === 2
            ? renderStep2()
            : renderStep3()}
        </div>
      </div>
    </div>
  )
}

export default AddDocumentPage