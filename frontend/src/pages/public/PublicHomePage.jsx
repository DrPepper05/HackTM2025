import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { 
  Search, 
  FileText, 
  Shield, 
  Clock, 
  Eye, 
  Clock as Recent,
  Building,
  Globe
} from 'lucide-react'

function PublicHomePage() {
  const { t } = useTranslation()
  const [searchQuery, setSearchQuery] = useState('')

  const handleSearch = (e) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      window.location.href = `/search?q=${encodeURIComponent(searchQuery)}`
    }
  }

  const quickLinks = [
    // {
    //   title: 'Most Viewed Documents',
    //   icon: Eye,
    //   link: '/search?sort=views',
    //   color: 'text-sky-600',
    //   bgColor: 'bg-sky-50'
    // },
    {
      title: 'Recently Added',
      icon: Recent,
      link: '/search?sort=date',
      color: 'text-sky-600',
      bgColor: 'bg-sky-50'
    },
    {
      title: 'Browse by Organization',
      icon: Building,
      link: '/organizations',
      color: 'text-sky-600',
      bgColor: 'bg-sky-50'
    },
    // {
    //   title: 'Geographic Data',
    //   icon: Globe,
    //   link: '/search?type=geographic',
    //   color: 'text-sky-600',
    //   bgColor: 'bg-sky-50'
    // }
  ]

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
    <div className="min-h-screen bg-white">
      {/* Hero Section with Search */}
      <section className="relative bg-gradient-to-br from-sky-600 to-sky-800 py-20">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute right-0 top-0 w-1/2 h-full bg-white/5 transform skew-x-12"></div>
          <div className="absolute left-0 bottom-0 w-full h-32 bg-gradient-to-t from-black/10 to-transparent"></div>
        </div>
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">
              {t('public.hero_title')}
            </h1>
            <p className="text-xl text-sky-100 mb-12 max-w-2xl mx-auto">
              {t('public.hero_subtitle')}
            </p>

            {/* Large Search Box */}
            <div className="max-w-3xl mx-auto bg-white rounded-lg shadow-lg p-1">
              <form onSubmit={handleSearch} className="flex">
                <input
                  type="text"
                  className="flex-1 px-6 py-4 text-lg border-0 focus:ring-0 outline-none"
                  placeholder={t('public.search_placeholder')}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <button
                  type="submit"
                  className="px-8 py-4 bg-sky-600 text-white font-medium rounded-lg hover:bg-sky-700 transition-colors"
                >
                  {t('public.search_button')}
                </button>
              </form>
            </div>

            {/* Statistics */}
            <div className="mt-12 text-white">
              <div className="inline-block px-6 py-2 bg-white/10 rounded-full">
                <span className="font-bold text-2xl">311,097</span>
                <span className="ml-2 text-sky-100">Documents Available</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Quick Links Section */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="max-w-lg mx-auto grid grid-cols-1 md:grid-cols-2 gap-6">
            {quickLinks.map((item) => (
              <Link
                key={item.title}
                to={item.link}
                className="block p-6 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex items-center">
                  <div className={`p-3 rounded-lg ${item.bgColor}`}>
                    <item.icon className={`h-6 w-6 ${item.color}`} />
                  </div>
                  <h3 className="ml-4 font-semibold text-gray-900">{item.title}</h3>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">Our Mission</h2>
            <p className="text-lg text-gray-600 leading-relaxed">
              The OpenArchive platform is designed to unleash the power of public records to:
            </p>
            <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="p-6 bg-sky-50 rounded-lg">
                <h3 className="font-semibold text-sky-900 mb-2">Inform Decisions</h3>
                <p className="text-sky-700">Support public and policymaker decisions with accurate data</p>
              </div>
              <div className="p-6 bg-sky-50 rounded-lg">
                <h3 className="font-semibold text-sky-900 mb-2">Drive Innovation</h3>
                <p className="text-sky-700">Enable innovation and economic growth through open access</p>
              </div>
              <div className="p-6 bg-sky-50 rounded-lg">
                <h3 className="font-semibold text-sky-900 mb-2">Ensure Transparency</h3>
                <p className="text-sky-700">Strengthen the foundation of open and transparent governance</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              {t('public.features_title')}
            </h2>
            <p className="text-lg text-gray-600">
              {t('public.features_subtitle')}
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-7xl mx-auto">
            {features.map((feature) => (
              <div
                key={feature.name}
                className="bg-white p-6 rounded-lg shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="w-12 h-12 bg-sky-50 rounded-lg flex items-center justify-center mb-4">
                  <feature.icon className="h-6 w-6 text-sky-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {feature.name}
                </h3>
                <p className="text-gray-600">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-sky-600">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl font-bold text-white mb-4">
              {t('public.cta_title')}
            </h2>
            <p className="text-xl text-sky-100 mb-8">
              {t('public.cta_subtitle')}
            </p>
            <div className="flex gap-4 justify-center">
              <Link
                to="/login"
                className="px-8 py-3 bg-white text-sky-600 font-medium rounded-lg hover:bg-sky-50 transition-colors"
              >
                {t('public.cta_button_primary')}
              </Link>
              <Link
                to="/contact"
                className="px-8 py-3 text-white font-medium border border-white rounded-lg hover:bg-sky-700 transition-colors"
              >
                {t('public.cta_button_secondary')}
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

export default PublicHomePage