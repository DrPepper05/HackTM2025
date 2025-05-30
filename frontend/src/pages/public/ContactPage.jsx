import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Mail, Phone, MapPin, Clock } from 'lucide-react'

function ContactPage() {
  const { t } = useTranslation()
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: '',
  })
  const [formSubmitted, setFormSubmitted] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData({
      ...formData,
      [name]: value,
    })
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    setIsSubmitting(true)

    // In a real app, this would be an API call
    // For the hackathon, we'll simulate a successful submission
    setTimeout(() => {
      setFormSubmitted(true)
      setIsSubmitting(false)
      // Reset form
      setFormData({
        name: '',
        email: '',
        phone: '',
        subject: '',
        message: '',
      })
    }, 1000)
  }

  const contactInfo = [
    {
      icon: Phone,
      title: t('public.contact_phone'),
      details: [
        '+40 256 123 456',
        '+40 256 789 012',
      ],
    },
    {
      icon: Mail,
      title: t('public.contact_email'),
      details: [
        'contact@openarchive.ro',
        'support@openarchive.ro',
      ],
    },
    {
      icon: MapPin,
      title: t('public.contact_address'),
      details: [
        t('public.contact_address_line_1'),
        t('public.contact_address_line_2'),
      ],
    },
    {
      icon: Clock,
      title: t('public.contact_hours'),
      details: [
        t('public.contact_hours_weekdays'),
        t('public.contact_hours_weekend'),
      ],
    },
  ]

  return (
    <div className="bg-white">
      <div className="mx-auto max-w-7xl py-16 px-6 lg:px-8">
        <div className="mx-auto max-w-lg md:grid md:max-w-none md:grid-cols-2 md:gap-8">
          <div>
            <h2 className="text-3xl font-bold tracking-tight text-gray-900">
              {t('public.contact_title')}
            </h2>
            <p className="mt-4 text-lg text-gray-500">
              {t('public.contact_subtitle')}
            </p>

            <div className="mt-8 space-y-6">
              {contactInfo.map((item, index) => (
                <div key={index} className="flex">
                  <div className="flex-shrink-0">
                    <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary text-white">
                      <item.icon className="h-6 w-6" aria-hidden="true" />
                    </div>
                  </div>
                  <div className="ml-3 text-base">
                    <p className="font-medium text-gray-900">{item.title}</p>
                    {item.details.map((detail, idx) => (
                      <p key={idx} className="mt-1 text-gray-500">
                        {detail}
                      </p>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-12 md:mt-0">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900">
              {t('public.contact_form_title')}
            </h2>
            <p className="mt-4 text-lg text-gray-500">
              {t('public.contact_form_subtitle')}
            </p>

            {formSubmitted ? (
              <div className="mt-8 rounded-md bg-green-50 p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg
                      className="h-5 w-5 text-green-400"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                      aria-hidden="true"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-green-800">
                      {t('public.contact_form_success_title')}
                    </h3>
                    <div className="mt-2 text-sm text-green-700">
                      <p>{t('public.contact_form_success_message')}</p>
                    </div>
                    <div className="mt-4">
                      <div className="-mx-2 -my-1.5 flex">
                        <button
                          type="button"
                          onClick={() => setFormSubmitted(false)}
                          className="rounded-md bg-green-50 px-2 py-1.5 text-sm font-medium text-green-800 hover:bg-green-100 focus:outline-none focus:ring-2 focus:ring-green-600 focus:ring-offset-2 focus:ring-offset-green-50"
                        >
                          {t('public.contact_form_send_another')}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="mt-8 grid grid-cols-1 gap-y-6 sm:grid-cols-2 sm:gap-x-8">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                    {t('public.contact_form_name')}
                  </label>
                  <div className="mt-1">
                    <input
                      type="text"
                      name="name"
                      id="name"
                      autoComplete="name"
                      required
                      className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-primary sm:text-sm"
                      value={formData.name}
                      onChange={handleChange}
                    />
                  </div>
                </div>
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                    {t('public.contact_form_email')}
                  </label>
                  <div className="mt-1">
                    <input
                      id="email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      required
                      className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-primary sm:text-sm"
                      value={formData.email}
                      onChange={handleChange}
                    />
                  </div>
                </div>
                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                    {t('public.contact_form_phone')}
                  </label>
                  <div className="mt-1">
                    <input
                      type="text"
                      name="phone"
                      id="phone"
                      autoComplete="tel"
                      className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-primary sm:text-sm"
                      value={formData.phone}
                      onChange={handleChange}
                    />
                  </div>
                </div>
                <div>
                  <label htmlFor="subject" className="block text-sm font-medium text-gray-700">
                    {t('public.contact_form_subject')}
                  </label>
                  <div className="mt-1">
                    <input
                      type="text"
                      name="subject"
                      id="subject"
                      required
                      className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-primary sm:text-sm"
                      value={formData.subject}
                      onChange={handleChange}
                    />
                  </div>
                </div>
                <div className="sm:col-span-2">
                  <label htmlFor="message" className="block text-sm font-medium text-gray-700">
                    {t('public.contact_form_message')}
                  </label>
                  <div className="mt-1">
                    <textarea
                      id="message"
                      name="message"
                      rows={4}
                      required
                      className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-primary sm:text-sm"
                      value={formData.message}
                      onChange={handleChange}
                    />
                  </div>
                </div>
                <div className="sm:col-span-2">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="inline-flex w-full items-center justify-center rounded-md bg-primary px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary-dark focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:opacity-70"
                  >
                    {isSubmitting ? t('public.contact_form_submitting') : t('public.contact_form_submit')}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>

      {/* Map section */}
      <div className="bg-gray-50">
        <div className="mx-auto max-w-7xl px-6 py-16 lg:px-8">
          <div className="mx-auto max-w-lg md:grid md:max-w-none md:grid-cols-2 md:gap-8">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                {t('public.contact_find_us')}
              </h2>
              <p className="mt-3 text-lg text-gray-500">
                {t('public.contact_find_us_description')}
              </p>
            </div>
          </div>
          <div className="mt-8 rounded-lg overflow-hidden">
            {/* In a real app, this would be an actual map */}
            <div className="h-96 bg-gray-200 flex items-center justify-center">
              <p className="text-gray-500">{t('public.contact_map_placeholder')}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ContactPage