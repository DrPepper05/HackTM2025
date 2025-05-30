import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ChevronDown, ChevronUp, Mail } from 'lucide-react'

function FAQPage() {
  const { t } = useTranslation()
  const [openQuestions, setOpenQuestions] = useState({})

  const toggleQuestion = (id) => {
    setOpenQuestions((prev) => ({
      ...prev,
      [id]: !prev[id],
    }))
  }

  const faqCategories = [
    {
      id: 'general',
      title: t('faq.categories.general'),
      questions: [
        {
          id: 'what-is-openarchive',
          question: t('faq.questions.what_is_openarchive'),
          answer: t('faq.answers.what_is_openarchive'),
        },
        {
          id: 'who-can-use',
          question: t('faq.questions.who_can_use'),
          answer: t('faq.answers.who_can_use'),
        },
        {
          id: 'is-free',
          question: t('faq.questions.is_free'),
          answer: t('faq.answers.is_free'),
        },
      ],
    },
    {
      id: 'documents',
      title: t('faq.categories.documents'),
      questions: [
        {
          id: 'what-documents',
          question: t('faq.questions.what_documents'),
          answer: t('faq.answers.what_documents'),
        },
        {
          id: 'how-to-search',
          question: t('faq.questions.how_to_search'),
          answer: t('faq.answers.how_to_search'),
        },
        {
          id: 'document-formats',
          question: t('faq.questions.document_formats'),
          answer: t('faq.answers.document_formats'),
        },
      ],
    },
    {
      id: 'access',
      title: t('faq.categories.access'),
      questions: [
        {
          id: 'request-access',
          question: t('faq.questions.request_access'),
          answer: t('faq.answers.request_access'),
        },
        {
          id: 'access-denied',
          question: t('faq.questions.access_denied'),
          answer: t('faq.answers.access_denied'),
        },
        {
          id: 'response-time',
          question: t('faq.questions.response_time'),
          answer: t('faq.answers.response_time'),
        },
      ],
    },
  ]

  return (
    <div className="public-home-page">
      <section className="faq-header">
        <div className="content-container">
          <div className="section-header">
            <h1 className="section-title">{t('faq.title')}</h1>
            <p className="section-subtitle">{t('faq.subtitle')}</p>
          </div>
        </div>
      </section>

      <section className="faq-content">
        <div className="content-container">
          <div className="faq-categories">
            {faqCategories.map((category) => (
              <div key={category.id} className="faq-category">
                <h2 className="faq-category-title">{category.title}</h2>
                <div className="faq-questions">
                  {category.questions.map((faq) => (
                    <div key={faq.id} className="faq-question">
                      <button
                        type="button"
                        className="faq-question-button"
                        onClick={() => toggleQuestion(faq.id)}
                        aria-expanded={openQuestions[faq.id]}
                      >
                        <span className="faq-question-text">{faq.question}</span>
                        <span className="faq-question-icon">
                          {openQuestions[faq.id] ? (
                            <ChevronUp className="icon" aria-hidden="true" />
                          ) : (
                            <ChevronDown className="icon" aria-hidden="true" />
                          )}
                        </span>
                      </button>
                      {openQuestions[faq.id] && (
                        <div className="faq-answer">
                          <p>{faq.answer}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="faq-contact">
        <div className="content-container">
          <div className="faq-contact-content">
            <h2 className="faq-contact-title">{t('faq.contact_title')}</h2>
            <p className="faq-contact-description">{t('faq.contact_description')}</p>
            <a href="/public/contact" className="btn btn-primary">
              <Mail className="icon" aria-hidden="true" />
              {t('faq.contact_button')}
            </a>
          </div>
        </div>
      </section>
    </div>
  )
}

export default FAQPage