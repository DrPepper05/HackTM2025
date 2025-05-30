import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { ChevronDown, ChevronUp } from 'lucide-react'

function FAQPage() {
  const { t } = useTranslation()
  const [openFaqs, setOpenFaqs] = useState({})

  const toggleFaq = (id) => {
    setOpenFaqs((prev) => ({
      ...prev,
      [id]: !prev[id],
    }))
  }

  const faqs = [
    {
      id: 'faq-1',
      question: t('public.faq_question_1'),
      answer: t('public.faq_answer_1'),
      category: 'general',
    },
    {
      id: 'faq-2',
      question: t('public.faq_question_2'),
      answer: t('public.faq_answer_2'),
      category: 'general',
    },
    {
      id: 'faq-3',
      question: t('public.faq_question_3'),
      answer: t('public.faq_answer_3'),
      category: 'general',
    },
    {
      id: 'faq-4',
      question: t('public.faq_question_4'),
      answer: t('public.faq_answer_4'),
      category: 'access',
    },
    {
      id: 'faq-5',
      question: t('public.faq_question_5'),
      answer: t('public.faq_answer_5'),
      category: 'access',
    },
    {
      id: 'faq-6',
      question: t('public.faq_question_6'),
      answer: t('public.faq_answer_6'),
      category: 'access',
    },
    {
      id: 'faq-7',
      question: t('public.faq_question_7'),
      answer: t('public.faq_answer_7'),
      category: 'technical',
    },
    {
      id: 'faq-8',
      question: t('public.faq_question_8'),
      answer: t('public.faq_answer_8'),
      category: 'technical',
    },
    {
      id: 'faq-9',
      question: t('public.faq_question_9'),
      answer: t('public.faq_answer_9'),
      category: 'legal',
    },
    {
      id: 'faq-10',
      question: t('public.faq_question_10'),
      answer: t('public.faq_answer_10'),
      category: 'legal',
    },
  ]

  const categories = [
    { id: 'general', name: t('public.faq_category_general') },
    { id: 'access', name: t('public.faq_category_access') },
    { id: 'technical', name: t('public.faq_category_technical') },
    { id: 'legal', name: t('public.faq_category_legal') },
  ]

  return (
    <div className="bg-white">
      <div className="mx-auto max-w-7xl px-6 py-24 sm:py-32 lg:px-8 lg:py-40">
        <div className="mx-auto max-w-4xl divide-y divide-gray-900/10">
          <h1 className="text-4xl font-bold tracking-tight text-gray-900">
            {t('public.faq_title')}
          </h1>
          <p className="mt-6 text-lg leading-8 text-gray-600">
            {t('public.faq_description')}
          </p>

          {/* Categories */}
          <div className="mt-10 flex flex-wrap gap-4">
            {categories.map((category) => (
              <a
                key={category.id}
                href={`#${category.id}`}
                className="rounded-full bg-gray-100 px-4 py-2 text-sm font-medium text-gray-900 hover:bg-gray-200"
              >
                {category.name}
              </a>
            ))}
          </div>

          <div className="mt-10 space-y-6 divide-y divide-gray-900/10">
            {/* General FAQs */}
            <div id="general" className="pt-10">
              <h2 className="text-2xl font-bold leading-10 tracking-tight text-gray-900">
                {t('public.faq_category_general')}
              </h2>
              <dl className="mt-10 space-y-6 divide-y divide-gray-900/10">
                {faqs
                  .filter((faq) => faq.category === 'general')
                  .map((faq) => (
                    <div key={faq.id} className="pt-6">
                      <dt>
                        <button
                          onClick={() => toggleFaq(faq.id)}
                          className="flex w-full items-start justify-between text-left text-gray-900"
                        >
                          <span className="text-base font-semibold leading-7">{faq.question}</span>
                          <span className="ml-6 flex h-7 items-center">
                            {openFaqs[faq.id] ? (
                              <ChevronUp className="h-6 w-6" aria-hidden="true" />
                            ) : (
                              <ChevronDown className="h-6 w-6" aria-hidden="true" />
                            )}
                          </span>
                        </button>
                      </dt>
                      {openFaqs[faq.id] && (
                        <dd className="mt-2 pr-12">
                          <p className="text-base leading-7 text-gray-600">{faq.answer}</p>
                        </dd>
                      )}
                    </div>
                  ))}
              </dl>
            </div>

            {/* Access FAQs */}
            <div id="access" className="pt-10">
              <h2 className="text-2xl font-bold leading-10 tracking-tight text-gray-900">
                {t('public.faq_category_access')}
              </h2>
              <dl className="mt-10 space-y-6 divide-y divide-gray-900/10">
                {faqs
                  .filter((faq) => faq.category === 'access')
                  .map((faq) => (
                    <div key={faq.id} className="pt-6">
                      <dt>
                        <button
                          onClick={() => toggleFaq(faq.id)}
                          className="flex w-full items-start justify-between text-left text-gray-900"
                        >
                          <span className="text-base font-semibold leading-7">{faq.question}</span>
                          <span className="ml-6 flex h-7 items-center">
                            {openFaqs[faq.id] ? (
                              <ChevronUp className="h-6 w-6" aria-hidden="true" />
                            ) : (
                              <ChevronDown className="h-6 w-6" aria-hidden="true" />
                            )}
                          </span>
                        </button>
                      </dt>
                      {openFaqs[faq.id] && (
                        <dd className="mt-2 pr-12">
                          <p className="text-base leading-7 text-gray-600">{faq.answer}</p>
                        </dd>
                      )}
                    </div>
                  ))}
              </dl>
            </div>

            {/* Technical FAQs */}
            <div id="technical" className="pt-10">
              <h2 className="text-2xl font-bold leading-10 tracking-tight text-gray-900">
                {t('public.faq_category_technical')}
              </h2>
              <dl className="mt-10 space-y-6 divide-y divide-gray-900/10">
                {faqs
                  .filter((faq) => faq.category === 'technical')
                  .map((faq) => (
                    <div key={faq.id} className="pt-6">
                      <dt>
                        <button
                          onClick={() => toggleFaq(faq.id)}
                          className="flex w-full items-start justify-between text-left text-gray-900"
                        >
                          <span className="text-base font-semibold leading-7">{faq.question}</span>
                          <span className="ml-6 flex h-7 items-center">
                            {openFaqs[faq.id] ? (
                              <ChevronUp className="h-6 w-6" aria-hidden="true" />
                            ) : (
                              <ChevronDown className="h-6 w-6" aria-hidden="true" />
                            )}
                          </span>
                        </button>
                      </dt>
                      {openFaqs[faq.id] && (
                        <dd className="mt-2 pr-12">
                          <p className="text-base leading-7 text-gray-600">{faq.answer}</p>
                        </dd>
                      )}
                    </div>
                  ))}
              </dl>
            </div>

            {/* Legal FAQs */}
            <div id="legal" className="pt-10">
              <h2 className="text-2xl font-bold leading-10 tracking-tight text-gray-900">
                {t('public.faq_category_legal')}
              </h2>
              <dl className="mt-10 space-y-6 divide-y divide-gray-900/10">
                {faqs
                  .filter((faq) => faq.category === 'legal')
                  .map((faq) => (
                    <div key={faq.id} className="pt-6">
                      <dt>
                        <button
                          onClick={() => toggleFaq(faq.id)}
                          className="flex w-full items-start justify-between text-left text-gray-900"
                        >
                          <span className="text-base font-semibold leading-7">{faq.question}</span>
                          <span className="ml-6 flex h-7 items-center">
                            {openFaqs[faq.id] ? (
                              <ChevronUp className="h-6 w-6" aria-hidden="true" />
                            ) : (
                              <ChevronDown className="h-6 w-6" aria-hidden="true" />
                            )}
                          </span>
                        </button>
                      </dt>
                      {openFaqs[faq.id] && (
                        <dd className="mt-2 pr-12">
                          <p className="text-base leading-7 text-gray-600">{faq.answer}</p>
                        </dd>
                      )}
                    </div>
                  ))}
              </dl>
            </div>
          </div>

          {/* Contact section */}
          <div className="mt-16 rounded-2xl bg-gray-50 p-8">
            <h2 className="text-base font-semibold leading-7 text-gray-900">
              {t('public.still_have_questions')}
            </h2>
            <p className="mt-6 text-base leading-7 text-gray-600">
              {t('public.contact_description')}
            </p>
            <div className="mt-10 flex">
              <Link
                to="/contact"
                className="rounded-md bg-primary px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-primary-dark focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
              >
                {t('public.contact_us')}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default FAQPage