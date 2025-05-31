import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

function Footer() {
  const { t } = useTranslation()
  const currentYear = new Date().getFullYear()

  const navigation = {
    main: [
      { name: t('public.home'), href: '/' },
      { name: t('public.search'), href: '/search' },
      { name: t('public.about'), href: '/about' },
      { name: t('public.faq'), href: '/faq' },
      { name: t('public.contact'), href: '/contact' },
    ],
    legal: [
      { name: t('footer.privacy_policy'), href: '/privacy' },
      { name: t('footer.terms_of_service'), href: '/terms' },
      { name: t('footer.accessibility'), href: '/accessibility' },
    ],
  }

  return (
    <footer className="bg-white border-t border-gray-200">
      <div className="mx-auto max-w-7xl overflow-hidden px-6 py-8 sm:py-12 lg:px-8">
        <nav className="-mb-6 columns-2 sm:flex sm:justify-center sm:space-x-12" aria-label="Footer">
          {navigation.main.map((item) => (
            <div key={item.name} className="pb-6">
              <Link to={item.href} className="text-sm leading-6 text-gray-600 hover:text-sky-600">
                {item.name}
              </Link>
            </div>
          ))}
        </nav>
        
        <div className="mt-8 flex justify-center space-x-10">
          {/* Social media links would go here */}
        </div>
        
        <div className="mt-8 border-t border-gray-900/10 pt-8 sm:mt-12 lg:mt-16">
          <div className="flex flex-col items-center justify-between md:flex-row">
            <p className="text-xs leading-5 text-gray-500">
              &copy; {currentYear} OpenArchive. {t('footer.all_rights_reserved')}
            </p>
            <nav className="mt-4 flex space-x-6 md:mt-0">
              {navigation.legal.map((item) => (
                <Link key={item.name} to={item.href} className="text-xs leading-5 text-gray-500 hover:text-sky-600">
                  {item.name}
                </Link>
              ))}
            </nav>
          </div>
          <div className="mt-4 text-center text-xs text-gray-500">
            <p>{t('footer.compliance_notice')}</p>
            <p className="mt-2">
              {t('footer.developed_by')} <a href="https://hacktm.ro" target="_blank" rel="noopener noreferrer" className="text-sky-600 hover:underline">HackTM 2025</a>
            </p>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default Footer