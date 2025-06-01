import { useTranslation } from 'react-i18next'
import { Globe } from 'lucide-react'

function LanguageSwitcher({ isOpen, onToggle }) {
  const { i18n } = useTranslation()

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
    onToggle() // Close the dropdown after selection
  }

  return (
    <div className="relative">
      <button
        type="button"
        className="rounded-full p-1 text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none"
        onClick={onToggle}
      >
        <Globe className="h-6 w-6" />
      </button>

      {isOpen && (
        <div className="absolute right-0 z-10 mt-2 w-40 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5">
          <div className="py-1">
            {languages.map((language) => (
              <button
                key={language.code}
                onClick={() => changeLanguage(language.code)}
                className={`block w-full px-4 py-2 text-left text-sm focus:outline-none ${
                  i18n.language === language.code 
                    ? 'bg-gray-100 text-sky-700'
                    : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                {language.name}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default LanguageSwitcher