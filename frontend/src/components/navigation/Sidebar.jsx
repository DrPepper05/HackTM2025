import { Fragment } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Dialog, Transition } from '@headlessui/react'
import { X, Home, FileText, Upload, Inbox, Clock, Send, Search, Users, Shield, BarChart, FolderArchive } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'

function Sidebar({ sidebarOpen, setSidebarOpen }) {
  const { t } = useTranslation()
  const location = useLocation()
  const { userRole, hasRole } = useAuth()

  // Define navigation items based on user role
  const navigation = [
    // Common for all authenticated users
    { name: t('nav.dashboard'), href: '/dashboard', icon: Home },
    
    // Clerk navigation
    ...(hasRole('clerk') ? [
      { name: t('nav.upload_document'), href: '/documents/upload', icon: Upload },
      { name: t('nav.my_uploads'), href: '/documents/my-uploads', icon: FileText },
    ] : []),
    
    // Archivist navigation
    ...(hasRole('archivist') ? [
      { name: t('nav.ingest_queue'), href: '/archivist/ingest', icon: Inbox },
      { name: t('nav.retention_alerts'), href: '/archivist/retention', icon: Clock },
      { name: t('nav.transfer_queue'), href: '/archivist/transfer', icon: Send },
      { name: t('nav.advanced_search'), href: '/documents/search', icon: Search },
    ] : []),
    
    // Admin navigation
    ...(hasRole('admin') ? [
      { name: t('nav.user_management'), href: '/admin/users', icon: Users },
      { name: t('nav.system_health'), href: '/admin/system', icon: Shield },
    ] : []),
    
    // Inspector/Auditor navigation
    ...(hasRole('inspector') ? [
      { name: t('nav.audit_logs'), href: '/inspector/audit-logs', icon: BarChart },
      { name: t('nav.inventory_reports'), href: '/inspector/reports', icon: FileText },
    ] : []),
  ]

  return (
    <>
      {/* Mobile sidebar */}
      <Transition.Root show={sidebarOpen} as={Fragment}>
        <Dialog as="div" className="relative z-50 md:hidden" onClose={setSidebarOpen}>
          <Transition.Child
            as={Fragment}
            enter="transition-opacity ease-linear duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="transition-opacity ease-linear duration-300"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-gray-600 bg-opacity-75" />
          </Transition.Child>

          <div className="fixed inset-0 z-50 flex">
            <Transition.Child
              as={Fragment}
              enter="transition ease-in-out duration-300 transform"
              enterFrom="-translate-x-full"
              enterTo="translate-x-0"
              leave="transition ease-in-out duration-300 transform"
              leaveFrom="translate-x-0"
              leaveTo="-translate-x-full"
            >
              <Dialog.Panel className="relative flex w-full max-w-xs flex-1 flex-col bg-slate-800 pt-5 pb-4">
                <Transition.Child
                  as={Fragment}
                  enter="ease-in-out duration-300"
                  enterFrom="opacity-0"
                  enterTo="opacity-100"
                  leave="ease-in-out duration-300"
                  leaveFrom="opacity-100"
                  leaveTo="opacity-0"
                  show={sidebarOpen}
                >
                  <div className="absolute top-0 right-0 -mr-12 pt-2">
                    <button
                      type="button"
                      className="ml-1 flex h-10 w-10 items-center justify-center rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
                      onClick={() => setSidebarOpen(false)}
                    >
                      <span className="sr-only">{t('navigation.close_sidebar')}</span>
                      <X className="h-6 w-6 text-white" aria-hidden="true" />
                    </button>
                  </div>
                </Transition.Child>
                
                {/* Logo */}
                <div className="flex flex-shrink-0 items-center px-4">
                  <Link to="/dashboard" className="flex items-center">
                    <FolderArchive className="text-sky-500 mr-3 h-8 w-8" />
                    <span className="text-xl font-bold text-white">OpenArchive</span>
                  </Link>
                </div>
                
                {/* Navigation */}
                <div className="mt-5 h-0 flex-1 overflow-y-auto">
                  <nav className="space-y-1 px-2">
                    {navigation.map((item) => {
                      const isActive = location.pathname === item.href
                      return (
                        <Link
                          key={item.name}
                          to={item.href}
                          className={`group flex items-center px-2 py-2 text-base font-medium rounded-md ${isActive
                            ? 'bg-sky-600 text-white'
                            : 'text-slate-300 hover:bg-slate-700 hover:text-white'}`}
                          onClick={() => setSidebarOpen(false)}
                        >
                          <item.icon
                            className={`mr-4 h-6 w-6 flex-shrink-0 ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-white'}`}
                            aria-hidden="true"
                          />
                          {item.name}
                        </Link>
                      )
                    })}
                  </nav>
                </div>
              </Dialog.Panel>
            </Transition.Child>
            <div className="w-14 flex-shrink-0" aria-hidden="true">
              {/* Dummy element to force sidebar to shrink to fit close icon */}
            </div>
          </div>
        </Dialog>
      </Transition.Root>

      {/* Desktop sidebar */}
      <div className="hidden md:block md:w-64 md:flex-shrink-0 h-full">
        <div className="flex h-full flex-col bg-slate-800">
          <div className="flex h-16 flex-shrink-0 items-center px-4">
            <Link to="/dashboard" className="flex items-center">
              <FolderArchive className="text-sky-500 mr-3 h-8 w-8" />
              <span className="text-xl font-bold text-white">OpenArchive</span>
            </Link>
          </div>
          <div className="flex flex-1 flex-col overflow-y-auto">
            <nav className="flex-1 space-y-1 px-2 py-4">
              {navigation.map((item) => {
                const isActive = location.pathname === item.href
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md ${isActive
                      ? 'bg-sky-600 text-white'
                      : 'text-slate-300 hover:bg-slate-700 hover:text-white'}`}
                  >
                    <item.icon
                      className={`mr-3 h-5 w-5 flex-shrink-0 ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-white'}`}
                      aria-hidden="true"
                    />
                    {item.name}
                  </Link>
                )
              })}
            </nav>
          </div>
        </div>
      </div>
    </>
  )
}

export default Sidebar