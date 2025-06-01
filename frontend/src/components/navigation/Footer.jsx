import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../../hooks/useAuth'
import { LogIn, LayoutDashboard } from 'lucide-react'

function Footer() {
  const { t } = useTranslation()
  const { user } = useAuth()
  const currentYear = new Date().getFullYear()

  const navigation = {
    main: [
      { name: t('public.home'), href: '/' },
      { name: t('public.search_page'), href: '/search' },
      { name: t('public.about'), href: '/about' },
      { name: t('public._faq'), href: '/faq' },
      { name: t('public.contact'), href: '/contact' },
    ],
    legal: [
      { name: t('footer.privacy_policy'), href: '/privacy' },
      { name: t('footer.terms_of_service'), href: '/terms' },
      { name: t('footer.accessibility'), href: '/accessibility' },
    ],
  }

  return (
    <footer className="bg-gradient-to-r from-slate-50 to-gray-100 border-t border-gray-200 shadow-sm">
      <div className="mx-auto max-w-7xl px-4 py-8 md:px-6 lg:px-8">
        {/* Logo and description */}
        <div className="mb-8 flex flex-col items-center text-center sm:flex-row sm:items-start sm:text-left sm:justify-between">
          <div>
            <Link to="/" className="mb-2">
              <span className="text-xl font-bold text-sky-600">OpenArchive</span>
            </Link>
            <p className="mt-2 text-sm text-gray-500 max-w-md">
              {t('footer.description', 'A modern platform for archiving and accessing historical documents.')}
            </p>
          </div>
          
          {/* Login/Dashboard Button */}
          <div className="mt-4 sm:mt-0">
            <Link 
              to={user ? '/dashboard' : '/login'} 
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-sky-600 hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500 transition-colors duration-150"
            >
              {user ? (
                <>
                  <LayoutDashboard className="h-4 w-4 mr-2" />
                  {t('footer.dashboard')}
                </>
              ) : (
                <>
                  <LogIn className="h-4 w-4 mr-2" />
                  {t('footer.login')}
                </>
              )}
            </Link>
          </div>
        </div>
        
        {/* Navigation sections */}
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          <div>
            <h3 className="text-sm font-semibold text-gray-900 tracking-wider uppercase">
              {t('footer.navigation')}
            </h3>
            <ul className="mt-4 space-y-3">
              {navigation.main.map((item) => (
                <li key={item.name}>
                  <Link 
                    to={item.href} 
                    className="text-sm text-gray-600 hover:text-sky-600 transition-colors duration-150"
                  >
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          
          <div>
            <h3 className="text-sm font-semibold text-gray-900 tracking-wider uppercase">
              {t('footer.legal')}
            </h3>
            <ul className="mt-4 space-y-3">
              {navigation.legal.map((item) => (
                <li key={item.name}>
                  <Link 
                    to={item.href} 
                    className="text-sm text-gray-600 hover:text-sky-600 transition-colors duration-150"
                  >
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          
          <div>
            <h3 className="text-sm font-semibold text-gray-900 tracking-wider uppercase">
              {t('footer.connect')}
            </h3>
            <ul className="mt-4 space-y-3">
              <li>
                <a 
                  href="mailto:contact@openarchive.org" 
                  className="text-sm text-gray-600 hover:text-sky-600 transition-colors duration-150"
                >
                  contact@openarchive.org
                </a>
              </li>
              <li>
                <a 
                  href="tel:+1234567890" 
                  className="text-sm text-gray-600 hover:text-sky-600 transition-colors duration-150"
                >
                  +1 (234) 567-890
                </a>
              </li>
            </ul>
          </div>
        </div>
        
        {/* Copyright and legal links - bottom section */}
        <div className="mt-12 pt-8 border-t border-gray-200 flex flex-col md:flex-row justify-between items-center">
          <p className="text-sm text-gray-600 mb-4 md:mb-0">
            &copy; {currentYear} OpenArchive. {t('footer.all_rights_reserved')}
          </p>
          <div className="flex space-x-6">
            {navigation.legal.map((item) => (
              <Link 
                key={item.name} 
                to={item.href} 
                className="text-sm text-gray-600 hover:text-sky-600 hover:underline transition-colors duration-150"
              >
                {item.name}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  )
}

export default Footer