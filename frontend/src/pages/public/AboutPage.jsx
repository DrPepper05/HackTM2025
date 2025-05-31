import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Archive, Shield, Search, Clock, FileText, Users } from 'lucide-react'

function AboutPage() {
  const { t } = useTranslation()

  const features = [
    {
      name: t('public.about_feature_1_title'),
      description: t('public.about_feature_1_description'),
      icon: Archive,
    },
    {
      name: t('public.about_feature_2_title'),
      description: t('public.about_feature_2_description'),
      icon: Shield,
    },
    {
      name: t('public.about_feature_3_title'),
      description: t('public.about_feature_3_description'),
      icon: Search,
    },
    {
      name: t('public.about_feature_4_title'),
      description: t('public.about_feature_4_description'),
      icon: Clock,
    },
    {
      name: t('public.about_feature_5_title'),
      description: t('public.about_feature_5_description'),
      icon: FileText,
    },
    {
      name: t('public.about_feature_6_title'),
      description: t('public.about_feature_6_description'),
      icon: Users,
    },
  ]

  return (
    <div className="public-home-page">
      {/* Hero section */}
      <section className="hero-section">
        <div className="content-container text-center">
          <h1 className="hero-title">
            {t('public.about_title')}
          </h1>
          <p className="hero-subtitle">
            {t('public.about_subtitle')}
          </p>
        </div>
      </section>

      {/* Mission section */}
      <section className="bg-white py-24 sm:py-32">
        <div className="content-container">
          <div className="section-header text-center">
            <h2 className="section-title">
              {t('public.mission_title')}
            </h2>
            <p className="section-subtitle">
              {t('public.mission_description')}
            </p>
          </div>
        </div>
      </section>

      {/* Features section */}
      <section className="features-section">
        <div className="content-container">
          <div className="section-header text-center">
            <h2 className="section-title">
              {t('public.features_title')}
            </h2>
            <p className="section-subtitle">
              {t('public.features_description')}
            </p>
          </div>
          <div className="features-grid">
            {features.map((feature) => (
              <div key={feature.name} className="feature-card">
                <div className="feature-icon">
                  <feature.icon className="icon" aria-hidden="true" />
                </div>
                <h3 className="feature-title">{feature.name}</h3>
                <p className="feature-description">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Legal compliance section */}
      <section className="bg-gray-50 py-24 sm:py-32">
        <div className="content-container">
          <div className="section-header text-center">
            <h2 className="section-title">
              {t('public.compliance_title')}
            </h2>
            <p className="section-subtitle">
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
                <h4 className="flex-none text-sm font-semibold leading-6 text-primary">
                  {t('public.what_included')}
                </h4>
                <div className="h-px flex-auto bg-gray-100"></div>
              </div>
              <ul
                role="list"
                className="mt-8 grid grid-cols-1 gap-4 text-sm leading-6 text-gray-600 sm:grid-cols-2 sm:gap-6"
              >
                <li className="flex gap-x-3">
                  <svg
                    className="h-6 w-5 flex-none text-primary"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    aria-hidden="true"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z"
                      clipRule="evenodd"
                    />
                  </svg>
                  {t('public.compliance_feature_1')}
                </li>
                <li className="flex gap-x-3">
                  <svg
                    className="h-6 w-5 flex-none text-primary"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    aria-hidden="true"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z"
                      clipRule="evenodd"
                    />
                  </svg>
                  {t('public.compliance_feature_2')}
                </li>
                <li className="flex gap-x-3">
                  <svg
                    className="h-6 w-5 flex-none text-primary"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    aria-hidden="true"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z"
                      clipRule="evenodd"
                    />
                  </svg>
                  {t('public.compliance_feature_3')}
                </li>
                <li className="flex gap-x-3">
                  <svg
                    className="h-6 w-5 flex-none text-primary"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    aria-hidden="true"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z"
                      clipRule="evenodd"
                    />
                  </svg>
                  {t('public.compliance_feature_4')}
                </li>
              </ul>
            </div>
            <div className="-mt-2 p-2 lg:mt-0 lg:w-full lg:max-w-md lg:flex-shrink-0">
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
                    className="btn btn-primary mt-10 block w-full"
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
      </section>

      {/* CTA section */}
      <section className="cta-section">
        <div className="content-container text-center">
          <h2 className="section-title text-white">
            {t('public.cta_title')}
          </h2>
          <p className="section-subtitle text-white/80">
            {t('public.cta_description')}
          </p>
          <div className="cta-actions">
            <Link
              to="/search"
              className="btn btn-light"
            >
              {t('public.search_archives')}
            </Link>
            <Link
              to="/auth/login"
              className="btn btn-text text-white"
            >
              {t('public.login')} <span aria-hidden="true">→</span>
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}

export default AboutPage