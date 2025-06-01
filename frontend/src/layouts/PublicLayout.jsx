import { Outlet } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import PublicHeader from '../components/navigation/PublicHeader'
import Footer from '../components/navigation/Footer'

function PublicLayout() {
  const { t } = useTranslation()

  return (
    <div className="flex flex-col bg-gray-50">
      <PublicHeader />
      
      {/* Main content */}
      <main className="flex-1">
        <Outlet />
      </main>
      
      <Footer />
    </div>
  )
}

export default PublicLayout