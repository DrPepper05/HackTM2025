import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { FileText, AlertCircle } from 'lucide-react'

function PrivateFileRequestPage() {
  const { t } = useTranslation()
  const [formData, setFormData] = useState({
    requesterName: '',
    requesterEmail: '',
    requesterPhone: '',
    requesterIdNumber: '',
    requesterOrganization: '',
    documentId: '',
    justification: '',
    intendedUse: ''
  })
  const [formSubmitted, setFormSubmitted] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState(null)
  const SERVER_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001/api/v1'

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData({
      ...formData,
      [name]: value,
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)

    try {
      const response = await fetch(`${SERVER_URL}/api/v1/access-requests/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          requester_name: formData.requesterName,
          requester_email: formData.requesterEmail,
          requester_phone: formData.requesterPhone || null,
          requester_id_number: formData.requesterIdNumber,
          requester_organization: formData.requesterOrganization || null,
          document_id: formData.documentId,
          justification: formData.justification,
          intended_use: formData.intendedUse || null
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to submit request');
      }

      if (!data.success) {
        throw new Error(data.message || 'Failed to submit request');
      }

      setFormSubmitted(true)
      // Reset form
      setFormData({
        requesterName: '',
        requesterEmail: '',
        requesterPhone: '',
        requesterIdNumber: '',
        requesterOrganization: '',
        documentId: '',
        justification: '',
        intendedUse: ''
      })
    } catch (err) {
      setError(err.message || 'An error occurred while submitting your request. Please try again.')
      console.error('Error submitting request:', err)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white shadow-lg rounded-lg p-8">
          <div className="text-center mb-8">
            <FileText className="mx-auto h-12 w-12 text-sky-600" />
            <h2 className="mt-4 text-3xl font-bold text-gray-900">
              Request Document Access
            </h2>
            <p className="mt-2 text-lg text-gray-600">
              Please fill out this form to request access to a restricted document
            </p>
          </div>

          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-4">
              <div className="flex">
                <AlertCircle className="h-5 w-5 text-red-400" />
                <p className="ml-3 text-sm text-red-700">{error}</p>
              </div>
            </div>
          )}

          {formSubmitted ? (
            <div className="text-center">
              <div className="rounded-full bg-green-100 p-3 mx-auto w-fit">
                <svg
                  className="h-6 w-6 text-green-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <h3 className="mt-4 text-xl font-medium text-gray-900">
                Request Submitted Successfully
              </h3>
              <p className="mt-2 text-gray-600">
                We have received your request and will review it shortly. You will be notified via email about the status of your request.
              </p>
              <button
                type="button"
                onClick={() => setFormSubmitted(false)}
                className="mt-6 text-sky-600 hover:text-sky-500"
              >
                Submit another request
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <div>
                  <label htmlFor="requesterName" className="block text-sm font-medium text-gray-700">
                    Full Name
                  </label>
                  <input
                    type="text"
                    name="requesterName"
                    id="requesterName"
                    required
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-sky-500 focus:outline-none focus:ring-sky-500"
                    value={formData.requesterName}
                    onChange={handleChange}
                  />
                </div>

                <div>
                  <label htmlFor="requesterEmail" className="block text-sm font-medium text-gray-700">
                    Email Address
                  </label>
                  <input
                    type="email"
                    name="requesterEmail"
                    id="requesterEmail"
                    required
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-sky-500 focus:outline-none focus:ring-sky-500"
                    value={formData.requesterEmail}
                    onChange={handleChange}
                  />
                </div>

                <div>
                  <label htmlFor="requesterPhone" className="block text-sm font-medium text-gray-700">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    name="requesterPhone"
                    id="requesterPhone"
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-sky-500 focus:outline-none focus:ring-sky-500"
                    value={formData.requesterPhone}
                    onChange={handleChange}
                  />
                </div>

                <div>
                  <label htmlFor="requesterIdNumber" className="block text-sm font-medium text-gray-700">
                    National ID Number
                  </label>
                  <input
                    type="text"
                    name="requesterIdNumber"
                    id="requesterIdNumber"
                    required
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-sky-500 focus:outline-none focus:ring-sky-500"
                    value={formData.requesterIdNumber}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div>
                <label htmlFor="requesterOrganization" className="block text-sm font-medium text-gray-700">
                  Organization (Optional)
                </label>
                <input
                  type="text"
                  name="requesterOrganization"
                  id="requesterOrganization"
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-sky-500 focus:outline-none focus:ring-sky-500"
                  value={formData.requesterOrganization}
                  onChange={handleChange}
                />
              </div>

              <div>
                <label htmlFor="documentId" className="block text-sm font-medium text-gray-700">
                  Document ID
                </label>
                <input
                  type="text"
                  name="documentId"
                  id="documentId"
                  required
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-sky-500 focus:outline-none focus:ring-sky-500"
                  value={formData.documentId}
                  onChange={handleChange}
                  placeholder="UUID of the document you want to access"
                />
              </div>

              <div>
                <label htmlFor="justification" className="block text-sm font-medium text-gray-700">
                  Justification
                </label>
                <textarea
                  name="justification"
                  id="justification"
                  required
                  rows={4}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-sky-500 focus:outline-none focus:ring-sky-500"
                  value={formData.justification}
                  onChange={handleChange}
                  placeholder="Please explain why you need access to this document..."
                />
              </div>

              <div>
                <label htmlFor="intendedUse" className="block text-sm font-medium text-gray-700">
                  Intended Use
                </label>
                <textarea
                  name="intendedUse"
                  id="intendedUse"
                  rows={3}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-sky-500 focus:outline-none focus:ring-sky-500"
                  value={formData.intendedUse}
                  onChange={handleChange}
                  placeholder="How do you plan to use this document?"
                />
              </div>

              <div>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-sky-600 hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? 'Submitting...' : 'Submit Request'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}

export default PrivateFileRequestPage 