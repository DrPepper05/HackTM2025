import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ChevronDown, Mail, Info, FileText, Lock, HelpCircle } from 'lucide-react'
import FloatingLanguageButton from '../../components/navigation/FloatingLanguageButton'

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
      title: t('public.faq.categories.general'),
      questions: [
        {
          id: 'what-is-openarchive',
          question: t('public.faq.questions.what_is_openarchive'),
          answer: t('public.faq.answers.what_is_openarchive'),
        },
        {
          id: 'who-can-use',
          question: t('public.faq.questions.who_can_use'),
          answer: t('public.faq.answers.who_can_use'),
        },
        {
          id: 'is-free',
          question: t('public.faq.questions.is_free'),
          answer: t('public.faq.answers.is_free'),
        },
      ],
    },
    {
      id: 'documents',
      title: t('public.faq.categories.documents'),
      questions: [
        {
          id: 'what-documents',
          question: t('public.faq.questions.what_documents'),
          answer: t('public.faq.answers.what_documents'),
        },
        {
          id: 'how-to-search',
          question: t('public.faq.questions.how_to_search'),
          answer: t('public.faq.answers.how_to_search'),
        },
        {
          id: 'document-formats',
          question: t('public.faq.questions.document_formats'),
          answer: t('public.faq.answers.document_formats'),
        },
      ],
    },
    {
      id: 'access',
      title: t('public.faq.categories.access'),
      questions: [
        {
          id: 'request-access',
          question: t('public.faq.questions.request_access'),
          answer: t('public.faq.answers.request_access'),
        },
        {
          id: 'access-denied',
          question: t('public.faq.questions.access_denied'),
          answer: t('public.faq.answers.access_denied'),
        },
        {
          id: 'response-time',
          question: t('public.faq.questions.response_time'),
          answer: t('public.faq.answers.response_time'),
        },
      ],
    },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <section className="faq-header">
        <div className="content-container">
          <div className="section-header">
            <div className="icon-container">
              <HelpCircle size={28} strokeWidth={2} />
            </div>
            <h1 className="section-title">{t('public.faq.title')}</h1>
            <p className="section-subtitle">{t('public.faq.subtitle')}</p>
          </div>
        </div>
      </section>

      <section className="faq-content">
        <div className="content-container">
          <div className="faq-categories">
            {faqCategories.map((category) => (
              <div key={category.id} className="faq-category">
                <h2 className="faq-category-title">
                  {category.id === 'general' && <Info size={20} />}
                  {category.id === 'documents' && <FileText size={20} />}
                  {category.id === 'privacy' && <Lock size={20} />}
                  {category.title}
                </h2>
                <div className="faq-questions">
                  {category.questions.map((faq) => (
                    <div key={faq.id} className="faq-question" aria-expanded={openQuestions[faq.id] ? "true" : "false"}>
                      <button
                        type="button"
                        className="faq-question-button"
                        onClick={() => toggleQuestion(faq.id)}
                        aria-expanded={openQuestions[faq.id]}
                      >
                        <span className="faq-question-text">{faq.question}</span>
                        <span className="faq-question-icon">
                          <ChevronDown className="icon" aria-hidden="true" />
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
            <h2 className="faq-contact-title">{t('public.faq.contact_title')}</h2>
            <p className="faq-contact-description">{t('public.faq.contact_description')}</p>
            <a href={t('public.faq.contact_url')} className="btn btn-primary">
              <Mail className="icon" aria-hidden="true" />
              {t('public.faq.contact_button')}
            </a>
          </div>
        </div>
      </section>

      {/* Floating Language Button */}
      <FloatingLanguageButton />
    </div>
  )
}

export default FAQPage