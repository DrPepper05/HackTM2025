import { useTranslation } from 'react-i18next'

// Loading screen component
function LoadingScreen() {
  const { t } = useTranslation()

  return (
    <div className="flex flex-col items-center justify-center h-full p-4">
      <div className="loading-spinner mb-4"></div>
      <h2 className="text-xl font-semibold">{t('common.loading')}</h2>
    </div>
  )
}

export default LoadingScreen