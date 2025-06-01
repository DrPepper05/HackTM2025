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
        t('public.contact_phone_primary'),
        t('public.contact_phone_secondary'),
      ],
    },
    {
      icon: Mail,
      title: t('public.contact_email'),
      details: [
        t('public.contact_email_primary'),
        t('public.contact_email_support'),
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
    <div className="public-page contact-page">
      <div className="content-container">
        <div className="contact-grid">
          <div className="contact-info">
            <h2 className="section-title">
              {t('public.contact_title')}
            </h2>
            <p className="section-subtitle">
              {t('public.contact_subtitle')}
            </p>

            <div className="contact-info-list">
              {contactInfo.map((item, index) => (
                <div key={index} className="contact-info-item">
                  <div className="contact-info-icon">
                    <div className="icon-container">
                      <item.icon className="icon" aria-hidden="true" />
                    </div>
                  </div>
                  <div className="contact-info-content">
                    <p className="contact-info-title">{item.title}</p>
                    {item.details.map((detail, idx) => (
                      <p key={idx} className="contact-info-detail">
                        {detail}
                      </p>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="contact-form-container">
            <h2 className="section-title">
              {t('public.contact_form_title')}
            </h2>
            <p className="section-subtitle">
              {t('public.contact_form_subtitle')}
            </p>

            {formSubmitted ? (
              <div className="alert alert-success">
                <div className="alert-content">
                  <div className="alert-icon">
                    <svg
                      className="icon"
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
                  <div className="alert-message">
                    <h3 className="alert-title">
                      {t('public.contact_form_success_title')}
                    </h3>
                    <div className="alert-description">
                      <p>{t('public.contact_form_success_message')}</p>
                    </div>
                    <div className="alert-actions">
                      <button
                        type="button"
                        onClick={() => setFormSubmitted(false)}
                        className="btn btn-text"
                      >
                        {t('public.contact_form_send_another')}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="contact-form">
                <div className="form-grid">
                  <div className="form-group">
                    <label htmlFor="name" className="form-label">
                      {t('public.contact_form_name')}
                    </label>
                    <div className="input-container">
                      <input
                        type="text"
                        name="name"
                        id="name"
                        autoComplete="name"
                        required
                        className="form-input"
                        value={formData.name}
                        onChange={handleChange}
                      />
                    </div>
                  </div>
                  <div className="form-group">
                    <label htmlFor="email" className="form-label">
                      {t('public.contact_form_email')}
                    </label>
                    <div className="input-container">
                      <input
                        id="email"
                        name="email"
                        type="email"
                        autoComplete="email"
                        required
                        className="form-input"
                        value={formData.email}
                        onChange={handleChange}
                      />
                    </div>
                  </div>
                  <div className="form-group">
                    <label htmlFor="phone" className="form-label">
                      {t('public.contact_form_phone')}
                    </label>
                    <div className="input-container">
                      <input
                        type="text"
                        name="phone"
                        id="phone"
                        autoComplete="tel"
                        className="form-input"
                        value={formData.phone}
                        onChange={handleChange}
                      />
                    </div>
                  </div>
                  <div className="form-group">
                    <label htmlFor="subject" className="form-label">
                      {t('public.contact_form_subject')}
                    </label>
                    <div className="input-container">
                      <input
                        type="text"
                        name="subject"
                        id="subject"
                        required
                        className="form-input"
                        value={formData.subject}
                        onChange={handleChange}
                      />
                    </div>
                  </div>
                  <div className="form-group full-width">
                    <label htmlFor="message" className="form-label">
                      {t('public.contact_form_message')}
                    </label>
                    <div className="input-container">
                      <textarea
                        id="message"
                        name="message"
                        rows={4}
                        required
                        className="form-textarea"
                        value={formData.message}
                        onChange={handleChange}
                      />
                    </div>
                  </div>
                  <div className="form-group full-width">
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="btn btn-primary btn-full"
                    >
                      {isSubmitting ? t('public.contact_form_submitting') : t('public.contact_form_submit')}
                    </button>
                  </div>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>

      {/* Map section */}
      <div className="map-section">
        <div className="content-container">
          <div className="map-content">
            <div className="map-info">
              <h2 className="section-title">
                {t('public.contact_find_us')}
              </h2>
              <p className="section-subtitle">
                {t('public.contact_find_us_description')}
              </p>
            </div>
          </div>
          <div className="map-container">
            {/* In a real app, this would be an actual map */}
            <div className="map-placeholder">
              <p>{t('public.contact_map_placeholder')}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ContactPage