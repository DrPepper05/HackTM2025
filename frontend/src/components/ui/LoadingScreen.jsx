import { useTranslation } from 'react-i18next'

// Loading screen component
function LoadingScreen() {
  const { t } = useTranslation()

  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center min-h-screen bg-white bg-opacity-90 z-50">
      <div className="loading-spinner mb-4 h-12 w-12"></div>
      <h2 className="text-xl font-semibold text-gray-800">{t('common.loading')}</h2>
    </div>
  )
}

export default LoadingScreen