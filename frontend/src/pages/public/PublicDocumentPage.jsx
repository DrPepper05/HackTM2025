import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ArrowLeft, Download, Calendar, Building, FileText, Clock, User, Tag } from 'lucide-react'

function PublicDocumentPage() {
  const { id } = useParams()
  const { t } = useTranslation()
  const [document, setDocument] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showRequestForm, setShowRequestForm] = useState(false)
  const [requestForm, setRequestForm] = useState({
    name: '',
    email: '',
    reason: '',
    agreeToTerms: false,
  })
  const [requestSubmitted, setRequestSubmitted] = useState(false)

  useEffect(() => {
    const fetchDocument = async () => {
      setIsLoading(true)
      try {
        // In a real app, this would be an API call
        // For the hackathon, we'll use mock data
        setTimeout(() => {
          // Mock document data based on ID
          const mockDocuments = {
            '1': {
              id: '1',
              title: 'Hotărâre privind aprobarea bugetului local pe anul 2024',
              content: 'Consiliul Local al Municipiului Timișoara, întrunit în ședința ordinară din data de 15.01.2024, având în vedere Referatul de aprobare al proiectului de hotărâre privind aprobarea bugetului local al Municipiului Timișoara pentru anul 2024, expunerea de motive a Primarului Municipiului Timișoara și Raportul de specialitate al Direcției Economice...',
              documentType: 'Hotărâre',
              documentNumber: '1/2024',
              institution: 'Consiliul Local Timișoara',
              creationDate: '2024-01-15',
              releaseDate: '2024-01-20',
              creator: 'Consiliul Local Timișoara',
              status: 'PUBLIC',
              tags: ['buget', 'finanțe', 'administrație locală'],
              files: [
                {
                  id: '1-1',
                  name: 'HCL_1_2024_Buget_Local.pdf',
                  type: 'application/pdf',
                  size: '2.4 MB',
                  url: '#',
                },
                {
                  id: '1-2',
                  name: 'Anexa_1_Buget_Local_2024.xlsx',
                  type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                  size: '1.2 MB',
                  url: '#',
                },
              ],
            },
            '2': {
              id: '2',
              title: 'Dispoziție organizare concurs pentru ocuparea funcției publice de execuție vacante',
              content: 'Primarul Municipiului Timișoara, având în vedere referatul Serviciului Resurse Umane nr. 123/10.02.2024 prin care se propune organizarea concursului pentru ocuparea funcției publice de execuție vacante de consilier, clasa I, grad profesional superior din cadrul Direcției Urbanism...',
              documentType: 'Dispoziție',
              documentNumber: '234/2024',
              institution: 'Primăria Municipiului Timișoara',
              creationDate: '2024-02-20',
              releaseDate: '2024-02-25',
              creator: 'Primarul Municipiului Timișoara',
              status: 'PUBLIC',
              tags: ['resurse umane', 'concurs', 'funcție publică'],
              files: [
                {
                  id: '2-1',
                  name: 'Dispozitie_234_2024_Concurs.pdf',
                  type: 'application/pdf',
                  size: '1.8 MB',
                  url: '#',
                },
              ],
            },
            '3': {
              id: '3',
              title: 'Contract de achiziție publică pentru servicii de mentenanță',
              content: 'Contract de achiziție publică pentru servicii de mentenanță a sistemelor informatice din cadrul instituției, încheiat între Consiliul Județean Timiș și SC IT Solutions SRL...',
              documentType: 'Contract',
              documentNumber: '45/2024',
              institution: 'Consiliul Județean Timiș',
              creationDate: '2024-03-10',
              releaseDate: '2024-03-15',
              creator: 'Consiliul Județean Timiș',
              status: 'PUBLIC',
              tags: ['achiziții publice', 'IT', 'mentenanță'],
              files: [
                {
                  id: '3-1',
                  name: 'Contract_45_2024_Mentenanta_IT.pdf',
                  type: 'application/pdf',
                  size: '3.2 MB',
                  url: '#',
                },
                {
                  id: '3-2',
                  name: 'Anexa_Tehnica_Contract_45_2024.pdf',
                  type: 'application/pdf',
                  size: '1.5 MB',
                  url: '#',
                },
              ],
            },
            '4': {
              id: '4',
              title: 'Autorizație de construire pentru imobil de locuințe colective',
              content: 'Se autorizează executarea lucrărilor de construire pentru imobil de locuințe colective S+P+4E+Er, împrejmuire și branșamente la utilități, pe terenul situat în Timișoara, str. Exemple nr. 123...',
              documentType: 'Autorizație',
              documentNumber: '56/2024',
              institution: 'Primăria Municipiului Timișoara',
              creationDate: '2024-02-05',
              releaseDate: '2024-02-10',
              creator: 'Primăria Municipiului Timișoara',
              status: 'PUBLIC',
              tags: ['urbanism', 'construcții', 'autorizație'],
              files: [
                {
                  id: '4-1',
                  name: 'Autorizatie_56_2024.pdf',
                  type: 'application/pdf',
                  size: '2.1 MB',
                  url: '#',
                },
              ],
            },
            '5': {
              id: '5',
              title: 'Certificat de urbanism pentru construire locuință unifamilială',
              content: 'Se certifică regimul juridic, economic și tehnic pentru imobilul situat în comuna Dumbrăvița, str. Exemple nr. 456, în vederea construirii unei locuințe unifamiliale P+1E, împrejmuire și branșamente la utilități...',
              documentType: 'Certificat',
              documentNumber: '78/2024',
              institution: 'Primăria Comunei Dumbrăvița',
              creationDate: '2024-01-30',
              releaseDate: '2024-02-05',
              creator: 'Primăria Comunei Dumbrăvița',
              status: 'PUBLIC',
              tags: ['urbanism', 'certificat', 'locuință'],
              files: [
                {
                  id: '5-1',
                  name: 'Certificat_Urbanism_78_2024.pdf',
                  type: 'application/pdf',
                  size: '1.7 MB',
                  url: '#',
                },
              ],
            },
          }

          const doc = mockDocuments[id]
          if (doc) {
            setDocument(doc)
          } else {
            setError(t('public.document_not_found'))
          }
          setIsLoading(false)
        }, 500)
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
    // In a real app, this would submit the request to the backend
    // For the hackathon, we'll just show a success message
    setRequestSubmitted(true)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="loading-spinner"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="rounded-md bg-red-50 p-4">
          <div className="flex">
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">{t('public.error')}</h3>
              <div className="mt-2 text-sm text-red-700">
                <p>{error}</p>
              </div>
              <div className="mt-4">
                <div className="-mx-2 -my-1.5 flex">
                  <Link
                      to="/search"
                      className="rounded-md bg-red-50 px-2 py-1.5 text-sm font-medium text-red-800 hover:bg-red-100"
                    >
                      {t('public.back_to_search')}
                    </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!document) {
    return null
  }

  return (
    <div className="bg-white">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl">
          {/* Back button */}
          <div className="mb-8">
            <Link
              to="/search"
              className="inline-flex items-center text-sm font-medium text-primary hover:text-primary-dark"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              {t('public.back_to_search')}
            </Link>
          </div>

          {/* Document header */}
          <div className="border-b border-gray-200 pb-8">
            <h1 className="text-3xl font-bold tracking-tight text-gray-900">{document.title}</h1>
            <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-gray-500">
              <span className="flex items-center gap-x-1">
                <FileText className="h-4 w-4 text-gray-400" />
                <span className="font-medium">{t('public.document_type')}:</span>
                <span>{document.documentType}</span>
                <span className="ml-1 text-gray-400">({document.documentNumber})</span>
              </span>
              <span className="flex items-center gap-x-1">
                <Building className="h-4 w-4 text-gray-400" />
                <span className="font-medium">{t('public.institution')}:</span>
                <span>{document.institution}</span>
              </span>
              <span className="flex items-center gap-x-1">
                <Calendar className="h-4 w-4 text-gray-400" />
                <span className="font-medium">{t('public.creation_date')}:</span>
                <span>{new Date(document.creationDate).toLocaleDateString()}</span>
              </span>
              <span className="flex items-center gap-x-1">
                <Clock className="h-4 w-4 text-gray-400" />
                <span className="font-medium">{t('public.release_date')}:</span>
                <span>{new Date(document.releaseDate).toLocaleDateString()}</span>
              </span>
              <span className="flex items-center gap-x-1">
                <User className="h-4 w-4 text-gray-400" />
                <span className="font-medium">{t('public.creator')}:</span>
                <span>{document.creator}</span>
              </span>
            </div>
            <div className="mt-2 flex flex-wrap gap-2">
              {document.tags.map((tag, index) => (
                <span
                  key={index}
                  className="inline-flex items-center rounded-full bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700"
                >
                  <Tag className="mr-1 h-3 w-3" />
                  {tag}
                </span>
              ))}
            </div>
          </div>

          {/* Document content */}
          <div className="mt-8">
            <h2 className="text-xl font-bold text-gray-900">{t('public.document_content')}</h2>
            <div className="mt-4 rounded-md border border-gray-200 bg-gray-50 p-4 text-sm text-gray-700">
              <p>{document.content}</p>
            </div>
          </div>

          {/* Document files */}
          <div className="mt-8">
            <h2 className="text-xl font-bold text-gray-900">{t('public.document_files')}</h2>
            <ul className="mt-4 divide-y divide-gray-200 rounded-md border border-gray-200">
              {document.files.map((file) => (
                <li key={file.id} className="flex items-center justify-between py-3 pl-3 pr-4 text-sm">
                  <div className="flex w-0 flex-1 items-center">
                    <FileText className="h-5 w-5 flex-shrink-0 text-gray-400" />
                    <span className="ml-2 w-0 flex-1 truncate">{file.name}</span>
                    <span className="ml-2 flex-shrink-0 text-xs text-gray-500">{file.size}</span>
                  </div>
                  <div className="ml-4 flex-shrink-0">
                    <a
                      href={file.url}
                      className="inline-flex items-center font-medium text-primary hover:text-primary-dark"
                    >
                      <Download className="mr-1 h-4 w-4" />
                      {t('public.download')}
                    </a>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          {/* Request access section */}
          <div className="mt-12 rounded-md bg-gray-50 p-6">
            <h2 className="text-xl font-bold text-gray-900">{t('public.need_more_info')}</h2>
            <p className="mt-2 text-sm text-gray-600">{t('public.request_access_description')}</p>

            {!requestSubmitted ? (
              <div className="mt-4">
                {!showRequestForm ? (
                  <button
                    type="button"
                    className="rounded-md bg-primary px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary-dark"
                    onClick={() => setShowRequestForm(true)}
                  >
                    {t('public.request_access')}
                  </button>
                ) : (
                  <form onSubmit={handleRequestSubmit} className="space-y-4">
                    <div>
                      <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                        {t('public.your_name')}
                      </label>
                      <input
                        type="text"
                        name="name"
                        id="name"
                        required
                        className="mt-1 block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-primary sm:text-sm"
                        value={requestForm.name}
                        onChange={handleRequestFormChange}
                      />
                    </div>
                    <div>
                      <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                        {t('public.your_email')}
                      </label>
                      <input
                        type="email"
                        name="email"
                        id="email"
                        required
                        className="mt-1 block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-primary sm:text-sm"
                        value={requestForm.email}
                        onChange={handleRequestFormChange}
                      />
                    </div>
                    <div>
                      <label htmlFor="reason" className="block text-sm font-medium text-gray-700">
                        {t('public.request_reason')}
                      </label>
                      <textarea
                        name="reason"
                        id="reason"
                        rows={4}
                        required
                        className="mt-1 block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-primary sm:text-sm"
                        value={requestForm.reason}
                        onChange={handleRequestFormChange}
                      />
                    </div>
                    <div className="flex items-start">
                      <div className="flex h-5 items-center">
                        <input
                          id="agreeToTerms"
                          name="agreeToTerms"
                          type="checkbox"
                          required
                          className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                          checked={requestForm.agreeToTerms}
                          onChange={handleRequestFormChange}
                        />
                      </div>
                      <div className="ml-3 text-sm">
                        <label htmlFor="agreeToTerms" className="font-medium text-gray-700">
                          {t('public.agree_to_terms')}
                        </label>
                        <p className="text-gray-500">{t('public.agree_to_terms_description')}</p>
                      </div>
                    </div>
                    <div className="flex justify-end space-x-3">
                      <button
                        type="button"
                        className="rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
                        onClick={() => setShowRequestForm(false)}
                      >
                        {t('common.cancel')}
                      </button>
                      <button
                        type="submit"
                        className="rounded-md bg-primary px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary-dark"
                      >
                        {t('public.submit_request')}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            ) : (
              <div className="mt-4 rounded-md bg-green-50 p-4">
                <div className="flex">
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-green-800">{t('public.request_submitted')}</h3>
                    <div className="mt-2 text-sm text-green-700">
                      <p>{t('public.request_submitted_description')}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default PublicDocumentPage