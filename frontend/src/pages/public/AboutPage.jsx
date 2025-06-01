import React from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Archive, Shield, Search, Clock, FileText, Users, ArrowRight } from 'lucide-react'
import FloatingLanguageButton from '../../components/navigation/FloatingLanguageButton'

function AboutPage() {
  const { t } = useTranslation()

  const features = [
    {
      name: t('public.about_feature_1_title'),
      description: t('public.about_feature_1_description'),
      icon: Archive,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
    },
    {
      name: t('public.about_feature_2_title'),
      description: t('public.about_feature_2_description'),
      icon: Shield,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
    },
    {
      name: t('public.about_feature_3_title'),
      description: t('public.about_feature_3_description'),
      icon: Search,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
    },
    {
      name: t('public.about_feature_4_title'),
      description: t('public.about_feature_4_description'),
      icon: Clock,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100',
    },
    {
      name: t('public.about_feature_5_title'),
      description: t('public.about_feature_5_description'),
      icon: FileText,
      color: 'text-red-600',
      bgColor: 'bg-red-100',
    },
    {
      name: t('public.about_feature_6_title'),
      description: t('public.about_feature_6_description'),
      icon: Users,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-100',
    },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Hero section with gradient background */}
      <div className="relative overflow-hidden bg-white">
        <div className="mx-auto max-w-7xl">
          <div className="relative z-10 pb-8 sm:pb-16 md:pb-20 lg:w-full lg:max-w-2xl lg:pb-28 xl:pb-32">
            <main className="mx-auto mt-10 max-w-7xl px-4 sm:mt-12 sm:px-6 md:mt-16 lg:mt-20 lg:px-8 xl:mt-28">
              <div className="sm:text-center lg:text-left">
                <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl md:text-6xl">
                  <span className="block">{t('public.about_title')}</span>
                  <span className="block text-sky-600">{t('public.about_subtitle')}</span>
                </h1>
                <p className="mt-3 text-base text-gray-500 sm:mx-auto sm:mt-5 sm:max-w-xl sm:text-lg md:mt-5 md:text-xl lg:mx-0">
                  {t('public.mission_description')}
                </p>
                <div className="mt-5 sm:mt-8 sm:flex sm:justify-center lg:justify-start">
                  <div className="rounded-md shadow">
                    <Link
                      to="/search"
                      className="flex w-full items-center justify-center rounded-md border border-transparent bg-sky-600 px-8 py-3 text-base font-medium text-white hover:bg-sky-700 md:py-4 md:px-10 md:text-lg"
                    >
                      {t('public.search_archives')}
                    </Link>
                  </div>
                  <div className="mt-3 sm:mt-0 sm:ml-3">
                    <Link
                      to="/contact"
                      className="flex w-full items-center justify-center rounded-md border border-transparent bg-sky-100 px-8 py-3 text-base font-medium text-sky-700 hover:bg-sky-200 md:py-4 md:px-10 md:text-lg"
                    >
                      {t('public.contact')}
                    </Link>
                  </div>
                </div>
              </div>
            </main>
          </div>
        </div>
      </div>

      {/* Features grid with hover effects */}
      <div className="py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              {t('public.features_title')}
            </h2>
            <p className="mt-6 text-lg leading-8 text-gray-600">
              {t('public.features_description')}
            </p>
          </div>
          <div className="mx-auto mt-16 max-w-7xl px-6 lg:px-8">
            <div className="mx-auto grid max-w-2xl grid-cols-1 gap-8 sm:gap-y-10 lg:mx-0 lg:max-w-none lg:grid-cols-3">
              {features.map((feature) => (
                <div
                  key={feature.name}
                  className="group relative overflow-hidden rounded-2xl bg-white p-8 shadow-lg ring-1 ring-gray-200 hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
                >
                  <div className={`${feature.bgColor} absolute right-0 top-0 h-24 w-24 translate-x-8 translate-y-(-8) transform rounded-full opacity-20`} />
                  <div className={`${feature.bgColor} inline-flex rounded-lg p-3`}>
                    <feature.icon className={`h-6 w-6 ${feature.color}`} />
                  </div>
                  <h3 className="mt-4 text-xl font-semibold leading-7 text-gray-900">
                    {feature.name}
                  </h3>
                  <p className="mt-2 text-base leading-7 text-gray-600">
                    {feature.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Legal compliance section with modern card design */}
      <div className="bg-white py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl sm:text-center">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              {t('public.compliance_title')}
            </h2>
            <p className="mt-6 text-lg leading-8 text-gray-600">
              {t('public.compliance_description')}
            </p>
          </div>
          <div className="mx-auto mt-16 max-w-2xl rounded-3xl ring-1 ring-gray-200 sm:mt-20 lg:mx-0 lg:flex lg:max-w-none">
            <div className="p-8 sm:p-10 lg:flex-auto">
              <h3 className="text-2xl font-bold tracking-tight text-gray-900">
                {t('public.law_title')}
              </h3>
              <p className="mt-6 text-base leading-7 text-gray-600">
                {t('public.law_description')}
              </p>
              <div className="mt-10 flex items-center gap-x-4">
                <h4 className="flex-none text-sm font-semibold leading-6 text-sky-600">
                  {t('public.what_included')}
                </h4>
                <div className="h-px flex-auto bg-gray-100" />
              </div>
              <ul className="mt-8 grid grid-cols-1 gap-4 text-sm leading-6 text-gray-600 sm:grid-cols-2 sm:gap-6">
                {[
                  t('public.compliance_feature_1'),
                  t('public.compliance_feature_2'),
                  t('public.compliance_feature_3'),
                  t('public.compliance_feature_4'),
                ].map((feature) => (
                  <li key={feature} className="flex gap-x-3">
                    <svg className="h-6 w-5 flex-none text-sky-600" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
                    </svg>
                    {feature}
                  </li>
                ))}
              </ul>
            </div>
            <div className="p-2 lg:mt-0 lg:w-full lg:max-w-md lg:flex-shrink-0">
              <div className="rounded-2xl bg-gray-50 py-10 text-center ring-1 ring-inset ring-gray-900/5 lg:flex lg:flex-col lg:justify-center lg:py-16">
                <div className="mx-auto max-w-xs px-8">
                  <p className="text-base font-semibold text-gray-600">
                    {t('public.learn_more_about_law')}
                  </p>
                  <p className="mt-6 flex items-baseline justify-center gap-x-2">
                    <span className="text-5xl font-bold tracking-tight text-gray-900">16/1996</span>
                  </p>
                  <Link
                    to="https://legislatie.just.ro/public/DetaliiDocument/7937"
                    className="mt-10 block w-full rounded-md bg-sky-600 px-3 py-2 text-center text-sm font-semibold text-white shadow-sm hover:bg-sky-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-600"
                    target="_blank"
                  >
                    {t('public.read_full_law')}
                  </Link>
                  <p className="mt-6 text-xs leading-5 text-gray-600">
                    {t('public.law_note')}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CTA section with gradient background */}
      <div className="relative isolate overflow-hidden bg-gradient-to-b from-sky-100 via-sky-50 to-white">
        <div className="mx-auto max-w-7xl px-6 py-24 sm:py-32 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              {t('public.cta_title')}
            </h2>
            <p className="mx-auto mt-6 max-w-xl text-lg leading-8 text-gray-600">
              {t('public.cta_description')}
            </p>
            <div className="mt-10 flex items-center justify-center gap-x-6">
              <Link
                to="/search"
                className="rounded-md bg-sky-600 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-sky-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-600"
              >
                {t('public.search_archives')}
              </Link>
              <Link
                to="/auth/login"
                className="group text-sm font-semibold leading-6 text-gray-900"
              >
                {t('public.login')} <ArrowRight className="inline-block h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Floating Language Button */}
      <FloatingLanguageButton />
    </div>
  )
}

export default AboutPage