import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Search, FileText, Shield, Clock } from 'lucide-react'

function PublicHomePage() {
  const { t } = useTranslation()
  const [searchQuery, setSearchQuery] = useState('')

  const handleSearch = (e) => {
    e.preventDefault()
    // Navigate to search page with query
    if (searchQuery.trim()) {
      window.location.href = `/search?q=${encodeURIComponent(searchQuery)}`
    }
  }

  const features = [
    {
      name: t('public.features.search_title'),
      description: t('public.features.search_desc'),
      icon: Search,
    },
    {
      name: t('public.features.access_title'),
      description: t('public.features.access_desc'),
      icon: FileText,
    },
    {
      name: t('public.features.compliance_title'),
      description: t('public.features.compliance_desc'),
      icon: Shield,
    },
    {
      name: t('public.features.preservation_title'),
      description: t('public.features.preservation_desc'),
      icon: Clock,
    },
  ]

  return (
    <div className="public-home-page">
      {/* Hero section */}
      <section className="hero-section">
        <div className="content-container text-center">
          <h1 className="hero-title">
            {t('public.hero_title')}
          </h1>
          <p className="hero-subtitle">
            {t('public.hero_subtitle')}
          </p>
          <div className="hero-actions">
            <Link
              to="/search"
              className="btn btn-primary"
            >
              {t('public.search_archives')}
            </Link>
            <Link
              to="/about"
              className="btn btn-text"
            >
              {t('public.learn_more')} <span aria-hidden="true">→</span>
            </Link>
          </div>
        </div>
      </section>

      {/* Search section */}
      <section className="search-section">
        <div className="content-container">
          <div className="section-header text-center">
            <h2 className="section-title">
              {t('public.search_title')}
            </h2>
            <p className="section-subtitle">
              {t('public.search_subtitle')}
            </p>
          </div>
          <div className="search-container">
            <form onSubmit={handleSearch} className="search-form">
              <label htmlFor="search-query" className="sr-only">
                {t('public.search_placeholder')}
              </label>
              <div className="input-group">
                <input
                  id="search-query"
                  name="query"
                  type="text"
                  required
                  className="form-input"
                  placeholder={t('public.search_placeholder')}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <button
                  type="submit"
                  className="btn btn-primary"
                >
                  {t('public.search_button')}
                </button>
              </div>
            </form>
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
              {t('public.features_subtitle')}
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

      {/* CTA section */}
      <section className="cta-section">
        <div className="content-container text-center">
          <h2 className="section-title">
            {t('public.cta_title')}
          </h2>
          <p className="section-subtitle">
            {t('public.cta_subtitle')}
          </p>
          <div className="cta-actions">
            <Link
              to="/login"
              className="btn btn-primary"
            >
              {t('public.cta_button_primary')}
            </Link>
            <Link
              to="/contact"
              className="btn btn-text"
            >
              {t('public.cta_button_secondary')} <span aria-hidden="true">→</span>
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}

export default PublicHomePage