import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Globe } from 'lucide-react'

function FloatingLanguageButton() {
  const { i18n } = useTranslation()
  const [isOpen, setIsOpen] = useState(false)

  // Available languages
  const languages = [
    { code: 'en', name: 'English' },
    { code: 'ro', name: 'Română' },
    { code: 'hu', name: 'Magyar' },
    { code: 'sr', name: 'Српски' },
  ]

  // Change language handler
  const changeLanguage = (lng) => {
    i18n.changeLanguage(lng)
    setIsOpen(false)
  }

  // Get current language code (uppercase)
  const currentLang = i18n.language.substring(0, 2).toUpperCase()

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <div className="relative">
        <button
          type="button"
          className="flex items-center justify-center w-14 h-14 rounded-full bg-sky-600 text-white shadow-lg hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500 transition-all duration-200 animate-pulse-slow"
          onClick={() => setIsOpen(!isOpen)}
          aria-label="Change language"
        >
          <Globe className={`h-5 w-5 mr-1 ${isOpen ? 'animate-spin-slow' : ''}`} />
          <span className="text-xs font-bold">{currentLang}</span>
        </button>

        {isOpen && (
          <div className="absolute bottom-16 right-0 z-10 w-40 origin-bottom-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 animate-fadeIn">
            <div className="py-1">
              {languages.map((language, index) => (
                <button
                  key={language.code}
                  onClick={() => changeLanguage(language.code)}
                  className={`block w-full px-4 py-2 text-left text-sm focus:outline-none transition-colors duration-200 animate-slideIn ${
                    i18n.language === language.code 
                      ? 'bg-gray-100 text-sky-700 font-medium'
                      : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  {language.name}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default FloatingLanguageButton 