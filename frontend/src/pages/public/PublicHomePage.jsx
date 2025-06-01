import { useState, useEffect } from 'react'
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

const SERVER_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001'
console.log(SERVER_URL)
console.log(`${SERVER_URL}/api/v1/public/documents/count`)

function PublicHomePage() {
  const { t } = useTranslation()
  const [searchQuery, setSearchQuery] = useState('')
  const [documentCount, setDocumentCount] = useState(0)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchDocumentCount = async () => {
      try {
        const response = await fetch(`${SERVER_URL}/api/v1/public/documents/count`)
        const data = await response.json()
        if (data.success) {
          setDocumentCount(data.data.total)
        }
      } catch (error) {
        console.error('Error fetching document count:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchDocumentCount()
  }, [])

  const handleSearch = (e) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      window.location.href = `/search?q=${encodeURIComponent(searchQuery)}`
    }
  }

  const quickLinks = [
    {
      title: t('public.recently_added'),
      icon: Recent,
      link: '/search?sort=date',
      color: 'text-sky-600',
      bgColor: 'bg-sky-100',
      description: t('public.recently_added_desc')
    },
    {
      title: t('public.browse_by_org'),
      icon: Building,
      link: '/organizations',
      color: 'text-green-600',
      bgColor: 'bg-green-100',
      description: t('public.browse_by_org_desc')
    },
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
    {
      name: t('public.features.transparency_title'),
      description: t('public.features.transparency_desc'),
      icon: Eye, 
    },
    {
      name: t('public.features.innovation_title'),
      description: t('public.features.innovation_desc'),
      icon: Globe, 
    }
  ]

  const missionPoints = [
    {
      title: t('public.mission_points.inform_decisions'),
      description: t('public.mission_points.inform_decisions_desc'),
      icon: FileText,
      bgColor: 'bg-sky-50',
      textColor: 'text-sky-700',
      iconColor: 'text-sky-600'
    },
    {
      title: t('public.mission_points.drive_innovation'),
      description: t('public.mission_points.drive_innovation_desc'),
      icon: Globe,
      bgColor: 'bg-green-50',
      textColor: 'text-green-700',
      iconColor: 'text-green-600'
    },
    {
      title: t('public.mission_points.ensure_transparency'),
      description: t('public.mission_points.ensure_transparency_desc'),
      icon: Eye,
      bgColor: 'bg-indigo-50',
      textColor: 'text-indigo-700',
      iconColor: 'text-indigo-600'
    }
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section with Search */}
      <section className="relative bg-gradient-to-br from-sky-600 to-sky-800 py-24 md:py-32">
        {/* Optional: Add a very subtle pattern or texture if desired, e.g., opacity-5 */}
        {/* <div className="absolute inset-0 bg-[url('/path/to/subtle-pattern.svg')] opacity-5"></div> */}
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl md:text-6xl font-bold text-white mb-6">
              {t('public.hero_title')}
            </h1>
            <p className="text-xl md:text-2xl text-sky-100 mb-12 max-w-3xl mx-auto">
              {t('public.hero_subtitle')}
            </p>

            {/* Slicker Search Box */}
            <div className="max-w-3xl mx-auto px-2"> {/* Added slight horizontal padding for very narrow screens if shadow gets clipped */}
              <form 
                onSubmit={handleSearch} 
                className="flex items-center bg-white rounded-xl shadow-xl overflow-hidden focus-within:ring-2 focus-within:ring-sky-400 focus-within:ring-offset-2 focus-within:ring-offset-white transition-all duration-150 ease-in-out"
              > {/* Form is the styled container, increased rounding, adjusted ring color/offset */}
                <div className="relative flex-grow">
                  <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none"> {/* Icon padding */}
                    <Search className="h-5 w-5 text-gray-500" /> {/* Icon color */}
                  </div>
                  <input
                    type="text"
                    className="w-full px-6 py-5 pl-14 text-lg text-gray-800 bg-transparent border-0 focus:outline-none placeholder-gray-500 transition-colors duration-150 ease-in-out" // bg-transparent, darker text, adjusted placeholder
                    placeholder={t('public.search_placeholder')}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <button
                  type="submit"
                  className="px-8 py-5 bg-sky-500 text-white font-semibold hover:bg-sky-600 focus:outline-none active:bg-sky-700 transition-colors duration-150 ease-in-out text-lg"
                >
                  {t('public.search_button')}
                </button>
              </form>
            </div>

            {/* Statistics - Made more prominent */}
            <div className="mt-16 text-white flex justify-center">
              <div className="inline-flex items-center justify-center px-10 py-5 bg-sky-600/80 rounded-lg shadow-lg whitespace-nowrap">
                {isLoading ? (
                  <span className="font-bold text-2xl">{t('public.stats.loading')}</span>
                ) : (
                  <>
                    <span className="font-bold text-3xl tracking-tight mr-6">{documentCount.toLocaleString()}</span>
                    <span className="text-sky-50 text-lg">{t('public.stats.documents_available')}</span>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Quick Links Section - Enhanced */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-gray-800 mb-12 text-center">{t('public.quick_access')}</h2>
          <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8">
            {quickLinks.map((item) => (
              <Link
                key={item.title}
                to={item.link}
                className="group block p-8 bg-white rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 ease-in-out transform hover:-translate-y-1"
              >
                <div className="flex items-start">
                  <div className={`p-4 rounded-xl ${item.bgColor} transition-colors duration-300 group-hover:bg-opacity-80`}>
                    <item.icon className={`h-8 w-8 ${item.color} transition-transform duration-300 group-hover:scale-110`} />
                  </div>
                  <div className="ml-5">
                    <h3 className="text-xl font-semibold text-gray-900 mb-1">{item.title}</h3>
                    <p className="text-gray-600">{item.description}</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Mission Section - Enhanced */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl font-bold text-gray-800 mb-4">{t('public.our_mission')}</h2>
            <p className="text-xl text-gray-600 leading-relaxed mb-12">
              {t('public.mission_description')}
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {missionPoints.map((point) => (
                <div 
                  key={point.title}
                  className={`p-8 rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 ease-in-out transform hover:-translate-y-1 ${point.bgColor}`}
                >
                  <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6 ${point.bgColor === 'bg-sky-50' ? 'bg-sky-100' : point.bgColor === 'bg-green-50' ? 'bg-green-100' : 'bg-indigo-100'}`}>
                    <point.icon className={`h-8 w-8 ${point.iconColor}`} />
                  </div>
                  <h3 className={`text-xl font-semibold mb-3 ${point.textColor.replace('-700', '-900')}`}>{point.title}</h3>
                  <p className={`${point.textColor}`}>{point.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features Section - Enhanced */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-800 mb-4">
              {t('public.features_title')}
            </h2>
            <p className="text-xl text-gray-600">
              {t('public.features_subtitle')}
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
            {features.map((feature) => (
              <div
                key={feature.name}
                className="bg-white p-8 rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 ease-in-out transform hover:-translate-y-1"
              >
                <div className="w-16 h-16 bg-sky-100 rounded-full flex items-center justify-center mb-6">
                  <feature.icon className="h-8 w-8 text-sky-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">
                  {feature.name}
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section - Enhanced */}
      <section className="py-20 bg-sky-700">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
              {t('public.cta_title')}
            </h2>
            <p className="text-xl md:text-2xl text-sky-100 mb-10">
              {t('public.cta_subtitle')}
            </p>
            <div className="flex flex-col sm:flex-row gap-6 justify-center">
              <Link
                to="/request"
                className="px-10 py-4 bg-white text-sky-700 font-semibold rounded-lg hover:bg-sky-50 transition-all duration-300 ease-in-out text-lg shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
              >
                {t('public.cta_button_primary')}
              </Link>
              <Link
                to="/contact"
                className="px-10 py-4 text-white font-semibold border-2 border-white rounded-lg hover:bg-sky-600 hover:border-sky-600 transition-all duration-300 ease-in-out text-lg shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
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