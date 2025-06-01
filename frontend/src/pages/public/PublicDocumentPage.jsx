import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ArrowLeft, FileText, Download, Calendar, Building, User, Lock, Eye, FileQuestion } from 'lucide-react'

function PublicDocumentPage() {
  const { t } = useTranslation()
  const { id } = useParams()
  const [document, setDocument] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showRequestForm, setShowRequestForm] = useState(false)
  const [requestForm, setRequestForm] = useState({
    name: '',
    email: '',
    reason: '',
    agree: false,
  })

  useEffect(() => {
    const fetchDocument = async () => {
      setIsLoading(true)
      try {
        // In a real app, this would be an API call
        // For the hackathon, we'll use mock data
        setTimeout(() => {
          if (id === '1') {
            setDocument({
              id: '1',
              title: 'Hotărâre privind aprobarea bugetului local pe anul 2024',
              description:
                'Hotărâre a Consiliului Local privind aprobarea bugetului local al municipiului pentru anul fiscal 2024.',
              documentType: 'Hotărâre',
              institution: 'Consiliul Local Timișoara',
              releaseDate: '2024-01-15',
              author: 'Consiliul Local Timișoara',
              status: 'public',
              files: [
                {
                  id: 'file-1',
                  name: 'HCL_Buget_2024.pdf',
                  size: '2.4 MB',
                  type: 'application/pdf',
                  url: '#',
                },
                {
                  id: 'file-2',
                  name: 'Anexa_1_Buget_2024.xlsx',
                  size: '1.8 MB',
                  type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                  url: '#',
                },
              ],
            })
          } else if (id === '2') {
            setDocument({
              id: '2',
              title: 'Dispoziție organizare concurs pentru ocuparea funcției publice de execuție vacante',
              description:
                'Dispoziție privind organizarea concursului pentru ocuparea funcției publice de execuție vacante de consilier, clasa I, grad profesional superior.',
              documentType: 'Dispoziție',
              institution: 'Primăria Municipiului Timișoara',
              releaseDate: '2024-02-20',
              author: 'Primarul Municipiului Timișoara',
              status: 'public',
              files: [
                {
                  id: 'file-1',
                  name: 'Dispozitie_concurs_2024.pdf',
                  size: '1.2 MB',
                  type: 'application/pdf',
                  url: '#',
                },
              ],
            })
          } else if (id === '3') {
            setDocument({
              id: '3',
              title: 'Contract de achiziție publică pentru servicii de mentenanță',
              description:
                'Contract de achiziție publică pentru servicii de mentenanță a sistemelor informatice din cadrul instituției.',
              documentType: 'Contract',
              institution: 'Consiliul Județean Timiș',
              releaseDate: '2024-03-10',
              author: 'Consiliul Județean Timiș',
              status: 'restricted',
              restrictionReason: 'Conține informații comerciale confidențiale',
              files: [],
            })
          } else {
            setError(t('public.document_not_found'))
          }
          setIsLoading(false)
        }, 1000)
      } catch (error) {
        console.error('Error fetching document:', error)
        setError(t('public.error_loading_document'))
        setIsLoading(false)
      }
    }

    fetchDocument()
  }, [id, t])

  const handleRequestFormChange = (e) => {
    const { name, value, type, checked } = e.target
    setRequestForm({
      ...requestForm,
      [name]: type === 'checkbox' ? checked : value,
    })
  }

  const handleRequestSubmit = (e) => {
    e.preventDefault()
    // In a real app, this would submit the request to an API
    alert(t('public.access_request_submitted'))
    setShowRequestForm(false)
  }

  if (isLoading) {
    return (
      <div className="document-page">
        <div className="content-container">
          <div className="loading-container">
            <div className="loading-spinner"></div>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="document-page">
        <div className="content-container">
          <div className="error-container">
            <div className="error-content">
              <FileQuestion className="error-icon" />
              <h1 className="error-title">{error}</h1>
              <p className="error-message">{t('public.document_not_found_description')}</p>
              <Link to="/public" className="btn btn-primary">
                <ArrowLeft className="icon" />
                {t('public.back_to_home')}
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="document-page">
      <div className="content-container">
        <div className="document-header">
          <Link to="/public" className="back-button">
            <ArrowLeft className="icon" />
            {t('public.back_to_search')}
          </Link>

          <div className="document-title-container">
            <h1 className="document-title">{document.title}</h1>
          </div>

          <div className="document-meta">
            <div className="document-meta-item">
              <Calendar className="icon" />
              <span className="document-meta-label">{t('public.release_date')}:</span>
              <span className="document-meta-value">
                {new Date(document.releaseDate).toLocaleDateString()}
              </span>
            </div>

            <div className="document-meta-item">
              <Building className="icon" />
              <span className="document-meta-label">{t('public.institution')}:</span>
              <span className="document-meta-value">{document.institution}</span>
            </div>

            <div className="document-meta-item">
              <FileText className="icon" />
              <span className="document-meta-label">{t('public.document_type')}:</span>
              <span className="document-meta-value">{document.documentType}</span>
            </div>

            <div className="document-meta-item">
              <User className="icon" />
              <span className="document-meta-label">{t('public.author')}:</span>
              <span className="document-meta-value">{document.author}</span>
            </div>

            <div className="document-meta-item">
              <Eye className="icon" />
              <span className="document-meta-label">{t('public.status')}:</span>
              <span className="document-meta-value">
                {document.status === 'public' ? (
                  <span className="status-public">{t('public.status_public')}</span>
                ) : (
                  <span className="status-restricted">{t('public.status_restricted')}</span>
                )}
              </span>
            </div>
          </div>
        </div>

        <div className="document-content">
          <div className="document-description">
            <h2 className="document-section-title">{t('public.description')}</h2>
            <p>{document.description}</p>
          </div>

          {document.status === 'public' && document.files && document.files.length > 0 ? (
            <div className="document-files">
              <h2 className="document-section-title">{t('public.files')}</h2>
              <ul className="document-files-list">
                {document.files.map((file) => (
                  <li key={file.id} className="document-file-item">
                    <div className="document-file-info">
                      <FileText className="icon" />
                      <span className="document-file-name">{file.name}</span>
                      <span className="document-file-size">{file.size}</span>
                    </div>
                    <a href={file.url} className="btn btn-secondary">
                      <Download className="icon" />
                      {t('public.download')}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ) : document.status === 'restricted' ? (
            <div className="document-restricted">
              <div className="document-restricted-content">
                <Lock className="document-restricted-icon" />
                <h2 className="document-restricted-title">{t('public.restricted_access')}</h2>
                <p className="document-restricted-message">
                  {document.restrictionReason || t('public.restricted_access_description')}
                </p>
                {!showRequestForm ? (
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={() => setShowRequestForm(true)}
                  >
                    {t('public.request_access')}
                  </button>
                ) : null}
              </div>

              {showRequestForm && (
                <div className="document-request-form">
                  <h3 className="document-request-form-title">{t('public.request_access_form_title')}</h3>
                  <form onSubmit={handleRequestSubmit}>
                    <div className="form-group">
                      <label htmlFor="name" className="form-label">
                        {t('public.full_name')} *
                      </label>
                      <input
                        type="text"
                        id="name"
                        name="name"
                        className="form-input"
                        value={requestForm.name}
                        onChange={handleRequestFormChange}
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label htmlFor="email" className="form-label">
                        {t('public.email')} *
                      </label>
                      <input
                        type="email"
                        id="email"
                        name="email"
                        className="form-input"
                        value={requestForm.email}
                        onChange={handleRequestFormChange}
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label htmlFor="reason" className="form-label">
                        {t('public.reason_for_access')} *
                      </label>
                      <textarea
                        id="reason"
                        name="reason"
                        rows="4"
                        className="form-textarea"
                        value={requestForm.reason}
                        onChange={handleRequestFormChange}
                        required
                      ></textarea>
                    </div>

                    <div className="form-group">
                      <div className="form-checkbox">
                        <input
                          type="checkbox"
                          id="agree"
                          name="agree"
                          checked={requestForm.agree}
                          onChange={handleRequestFormChange}
                          required
                        />
                        <label htmlFor="agree">
                          {t('public.agree_to_terms')}
                        </label>
                      </div>
                    </div>

                    <div className="form-actions">
                      <button
                        type="button"
                        className="btn btn-text"
                        onClick={() => setShowRequestForm(false)}
                      >
                        {t('public.cancel')}
                      </button>
                      <button type="submit" className="btn btn-primary">
                        {t('public.submit_request')}
                      </button>
                    </div>
                  </form>
                </div>
              )}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  )
}

export default PublicDocumentPage