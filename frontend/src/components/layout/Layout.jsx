import { useState, useEffect } from 'react'
import { Outlet } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../../hooks/useAuth'
import Header from '../navigation/Header'
import Sidebar from '../navigation/Sidebar'
import Footer from '../navigation/Footer'

function Layout() {
  const { t } = useTranslation()
  const { user } = useAuth()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [isCollapsed, setIsCollapsed] = useState(false)

  // Close sidebar on mobile when route changes
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setSidebarOpen(true)
      } else {
        setSidebarOpen(false)
      }
    }

    // Set initial state based on screen size
    handleResize()

    // Add event listener
    window.addEventListener('resize', handleResize)

    // Clean up
    return () => {
      window.removeEventListener('resize', handleResize)
    }
  }, [])

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen)
  }

  return (
    <div className="min-h-screen h-screen flex flex-col">
      {/* Fixed Header */}
      <div className="fixed top-0 left-0 right-0 z-50">
        <Header toggleSidebar={toggleSidebar} />
      </div>
      
      {/* Content area with padding for fixed header */}
      <div className="flex flex-1 pt-16 bg-slate-50">
        {/* Fixed Sidebar - now with full height */}
        <div className="hidden md:block fixed left-0 top-16 bottom-0 z-40 h-full">
          <div className="h-full">
            <Sidebar 
              sidebarOpen={sidebarOpen} 
              setSidebarOpen={setSidebarOpen}
              isCollapsed={isCollapsed}
              setIsCollapsed={setIsCollapsed}
            />
          </div>
        </div>

        {/* Mobile Sidebar - not fixed */}
        <div className="md:hidden">
          <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
        </div>

        {/* Main content with margin for sidebar */}
        <div className={`flex-1 flex flex-col ${isCollapsed ? 'md:ml-16' : 'md:ml-64'} transition-all duration-300`}>
          <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
            <div className="mx-auto max-w-7xl">
              <Outlet />
            </div>
          </main>
          
          {/* Footer */}
          <Footer />
        </div>
      </div>
    </div>
  )
}

export default Layout