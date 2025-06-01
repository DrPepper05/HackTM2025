import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { Upload, X, FileText, Check, AlertCircle } from 'lucide-react'

function AddDocumentPage() {
  const API_BASE_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001'
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
    { id: 'hotarare', name: t('clerk.document_types.hotarare') },
    { id: 'dispozitie', name: t('clerk.document_types.dispozitie') },
    { id: 'contract', name: t('clerk.document_types.contract') },
    { id: 'autorizatie', name: t('clerk.document_types.autorizatie') },
    { id: 'certificat', name: t('clerk.document_types.certificat') },
    { id: 'adresa', name: t('clerk.document_types.adresa') },
    { id: 'raport', name: t('clerk.document_types.raport') },
    { id: 'proces_verbal', name: t('clerk.document_types.proces_verbal') },
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
    const newFiles = Array.from(fileList)
      .filter((file) => {
        // Only allow PDF files
        if (file.type !== 'application/pdf') {
          alert(`Error: ${file.name} is not a PDF file. Only PDF files are allowed.`);
          return false;
        }
        return true;
      })
      .map((file) => ({
        file,
        name: file.name,
        size: file.size,
        type: file.type,
        preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : null,
      }));
    
    if (newFiles.length > 0) {
      setFiles([...files, ...newFiles]);
      // Automatically advance to step 2 (review) if files were added
      setCurrentStep(2);
    }
  };

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
      // Create a FormData object to send files
      const formData = new FormData()
      
      if(files.length > 0) {
        formData.append('file', files[0].file);
      }
      else {
        throw new Error('No files selected');
      }
      
      // Append metadata - using file name as title if no title is provided (TODO --change)
      formData.append('title', files[0].name);
      formData.append('description', 'Uploaded document');
      formData.append('document_type', 'document');
      formData.append('retention_category', '10y'); // Changed from 'c' to a valid value
      formData.append('tags', JSON.stringify([]));
      formData.append('creation_date', new Date().toISOString());
      formData.append('is_public', 'false');

      const sessionData = localStorage.getItem('auth_session');
      const parsedSession = sessionData ? JSON.parse(sessionData) : null;
      const accessToken = parsedSession?.access_token;

      // const headers = accessToken ? {
      //   Authorization: `Bearer ${accessToken}`
      // } : {};

      // Make the API call to upload the document
      const response = await fetch(`${API_BASE_URL}/api/v1/documents/`, {
        method: 'POST',
        body: formData,
        // No need to set Content-Type header as it's automatically set with FormData
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      })
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to upload document');
      }
      
      setUploadSuccess(true)
      setIsSubmitting(false)
    } catch (error) {
      console.error('Error uploading document:', error)
    }
    finally {
      setIsSubmitting(false)
    }
  }

  // Navigate to next step
  const nextStep = () => {
    setCurrentStep(currentStep + 1)
  }

  // Navigate to previous step
  const prevStep = () => {
    // Clear uploaded files when going back to step 1
    setFiles([])
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
    const sizes = [t('dashboard.filesize.bytes'), t('dashboard.filesize.kb'), t('dashboard.filesize.mb'), t('dashboard.filesize.gb')]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  // Render step 1: File upload
  const renderStep1 = () => (
    <div>
      <h2 className="text-lg sm:text-xl font-semibold text-gray-900">{t('clerk.upload_files')}</h2>
      <p className="mt-1 text-sm text-gray-500">{t('clerk.upload_files_description')}</p>

      {/* File drop area */}
      <div
        className={`mt-4 sm:mt-6 flex justify-center rounded-lg border border-dashed border-gray-900/25 px-3 sm:px-6 py-6 sm:py-10 ${
          dragActive ? 'border-primary bg-primary/5' : ''
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <div className="text-center">
          <Upload className="mx-auto h-10 sm:h-12 w-10 sm:w-12 text-gray-300" />
          <div className="mt-3 sm:mt-4 flex flex-col text-sm leading-6 text-gray-600">
            <label
              htmlFor="file-upload"
              className="relative cursor-pointer rounded-md bg-white font-semibold text-primary border border-primary px-3 py-2 mb-3 focus-within:outline-none focus-within:ring-2 focus-within:ring-primary focus-within:ring-offset-2 hover:text-primary-dark"
            >
              <span>{t('clerk.upload_browse')}</span>
              <input
                id="file-upload"
                name="file-upload"
                type="file"
                className="sr-only"
                accept=".pdf,application/pdf"
                multiple
                onChange={handleFileChange}
              />
            </label>
            <p>{t('clerk.upload_drag_drop')}</p>
          </div>
          <p className="text-xs leading-5 text-gray-600">{t('clerk.upload_file_types')}</p>
        </div>
      </div>

      {/* File list */}
      {files.length > 0 && (
        <div className="mt-4 sm:mt-6">
          <h3 className="text-sm font-medium text-gray-900">{t('clerk.uploaded_files')}</h3>
          <ul className="mt-2 sm:mt-3 divide-y divide-gray-100 rounded-md border border-gray-200">
            {files.map((file, index) => (
              <li key={index} className="flex items-center justify-between py-2 sm:py-3 pl-2 sm:pl-3 pr-2 sm:pr-4 text-sm">
                <div className="flex w-0 flex-1 items-center">
                  <FileText className="h-4 sm:h-5 w-4 sm:w-5 flex-shrink-0 text-gray-400" />
                  <span className="ml-2 w-0 flex-1 truncate text-xs sm:text-sm">{file.name}</span>
                </div>
                <div className="ml-2 sm:ml-4 flex flex-shrink-0 space-x-2 sm:space-x-4">
                  <span className="text-xs sm:text-sm text-gray-500">{formatFileSize(file.size)}</span>
                  <button
                    type="button"
                    className="text-red-500 hover:text-red-700"
                    onClick={() => removeFile(index)}
                  >
                    <X className="h-4 sm:h-5 w-4 sm:w-5" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Navigation buttons */}
      <div className="mt-6 sm:mt-8 flex justify-end">
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

  // Render step 2: Review and submit (previously step 3)
  const renderStep2 = () => (
    <div>
      <h2 className="text-lg sm:text-xl font-semibold text-gray-900">{t('clerk.review_and_submit')}</h2>
      <p className="mt-1 text-sm text-gray-500">{t('clerk.review_and_submit_description')}</p>

      <div className="mt-4 sm:mt-6 border-t border-gray-100">
        <dl className="divide-y divide-gray-100">
          <div className="py-4 sm:py-6 sm:grid sm:grid-cols-3 sm:gap-4">
            <dt className="text-sm font-medium leading-6 text-gray-900">{t('clerk.uploaded_files')}</dt>
            <dd className="mt-1 text-sm leading-6 text-gray-700 sm:col-span-2 sm:mt-0">
              <ul className="divide-y divide-gray-100 rounded-md border border-gray-200">
                {files.map((file, index) => (
                  <li key={index} className="flex items-center justify-between py-2 sm:py-3 pl-2 sm:pl-3 pr-2 sm:pr-4 text-sm">
                    <div className="flex w-0 flex-1 items-center">
                      <FileText className="h-4 sm:h-5 w-4 sm:w-5 flex-shrink-0 text-gray-400" />
                      <span className="ml-2 w-0 flex-1 truncate text-xs sm:text-sm">{file.name}</span>
                    </div>
                    <div className="ml-2 sm:ml-4 flex-shrink-0">
                      <span className="text-xs sm:text-sm text-gray-500">{formatFileSize(file.size)}</span>
                    </div>
                  </li>
                ))}
              </ul>
            </dd>
          </div>
        </dl>
      </div>

      {/* Navigation buttons */}
      <div className="mt-6 sm:mt-8 flex flex-col sm:flex-row sm:justify-between space-y-3 sm:space-y-0">
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
          className="rounded-md bg-primary px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary-dark focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:opacity-50"
        >
          {t('clerk.submit_document')}
        </button>
      </div>
    </div>
  )

  // Render success message
  const renderSuccess = () => (
    <div className="text-center">
      <div className="mx-auto flex h-10 sm:h-12 w-10 sm:w-12 items-center justify-center rounded-full bg-green-100">
        <Check className="h-5 sm:h-6 w-5 sm:w-6 text-green-600" aria-hidden="true" />
      </div>
      <h2 className="mt-4 sm:mt-6 text-lg sm:text-xl font-semibold text-gray-900">{t('clerk.upload_success')}</h2>
      <p className="mt-2 text-sm text-gray-500">{t('clerk.upload_success_description')}</p>
      <div className="mt-6 sm:mt-8 flex flex-col sm:flex-row justify-center space-y-3 sm:space-y-0 sm:space-x-4">
        <button
          type="button"
          onClick={resetForm}
          className="rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
        >
          {t('clerk.upload_another')}
        </button>
        <button
          type="button"
          onClick={() => navigate('/documents/my-uploads')}
          className="rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
        >
          {t('clerk.view_my_uploads')}
        </button>
      </div>
    </div>
  )

  return (
    <div className="bg-white">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl">
          {/* Progress steps */}
          {!uploadSuccess && (
            <nav aria-label="Progress" className="mb-6 sm:mb-8">
              <ol
                role="list"
                className="divide-y divide-gray-300 rounded-md border border-gray-300 md:flex md:divide-y-0"
              >
                {[
                  { id: 1, name: t('clerk.step_upload_files') },
                  { id: 2, name: t('clerk.step_review_submit') },
                ].map((step) => (
                  <li key={step.id} className="relative md:flex md:flex-1">
                    {step.id < currentStep ? (
                      <div className="group flex w-full items-center">
                        <span className="flex items-center px-4 sm:px-6 py-2 sm:py-4 text-sm font-medium">
                          <span className="flex h-8 sm:h-10 w-8 sm:w-10 flex-shrink-0 items-center justify-center rounded-full bg-primary">
                            <span className="text-white">{step.id}</span>
                          </span>
                          <span className="ml-2 sm:ml-4 text-xs sm:text-sm font-medium text-gray-900">{step.name}</span>
                        </span>
                      </div>
                    ) : step.id === currentStep ? (
                      <div className="flex items-center px-4 sm:px-6 py-2 sm:py-4 text-sm font-medium" aria-current="step">
                        <span className="flex h-8 sm:h-10 w-8 sm:w-10 flex-shrink-0 items-center justify-center rounded-full border-2 border-primary">
                          <span className="text-primary">{step.id}</span>
                        </span>
                        <span className="ml-2 sm:ml-4 text-xs sm:text-sm font-medium text-primary">{step.name}</span>
                      </div>
                    ) : (
                      <div className="group flex items-center">
                        <span className="flex items-center px-4 sm:px-6 py-2 sm:py-4 text-sm font-medium">
                          <span className="flex h-8 sm:h-10 w-8 sm:w-10 flex-shrink-0 items-center justify-center rounded-full border-2 border-gray-300">
                            <span className="text-gray-500">{step.id}</span>
                          </span>
                          <span className="ml-2 sm:ml-4 text-xs sm:text-sm font-medium text-gray-500">{step.name}</span>
                        </span>
                      </div>
                    )}

                    {step.id !== 2 && (
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
            : renderStep2()}
        </div>
      </div>
    </div>
  )
}

export default AddDocumentPage