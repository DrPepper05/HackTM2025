import { Fragment, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Dialog, Transition } from '@headlessui/react'
import { X, Home, FileText, Upload, Inbox, Clock, Send, Search, Users, Shield, BarChart, FolderArchive, ChevronLeft, ChevronRight } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import { useTheme } from '../../contexts/ThemeContext'

function Sidebar({ sidebarOpen, setSidebarOpen, isCollapsed, setIsCollapsed }) {
  const { t } = useTranslation()
  const location = useLocation()
  const { userRole, hasRole } = useAuth()
  const { isDarkMode } = useTheme()

  // Debug logging
  console.log('Sidebar render - userRole:', userRole)
  console.log('Sidebar render - hasRole check for archivist:', hasRole('archivist'))
  console.log('Sidebar render - hasRole check for clerk:', hasRole('clerk'))
  console.log('Sidebar render - hasRole check for admin:', hasRole('admin'))

  // Define navigation items based on user role
  const navigation = [
    // Admin navigation
    ...(hasRole('admin') ? [
      { name: t('nav.dashboard'), href: '/dashboard', icon: Home },
      { name: t('nav.user_management'), href: '/admin/users', icon: Users },
      // { name: t('navigation.system_health'), href: '/admin/system', icon: Shield },
    ] : []),
    
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
    

    
    // Inspector/Auditor navigation
    ...(hasRole('inspector') ? [
      { name: t('nav.audit_logs'), href: '/inspector/audit-logs', icon: BarChart },
      { name: t('nav.inventory_reports'), href: '/inspector/reports', icon: FileText },
    ] : []),
  ]

  const isActive = (path) => location.pathname === path

  const navClasses = (path) => `
    flex items-center px-2 py-2 text-sm font-medium rounded-md whitespace-nowrap
    ${isActive(path)
      ? `${isDarkMode 
          ? 'bg-gray-900 text-white' 
          : 'bg-sky-100 text-sky-700'}`
      : `${isDarkMode
          ? 'text-gray-300 hover:bg-gray-700 hover:text-white'
          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}`
    }
  `

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
              <Dialog.Panel className={`relative flex w-full max-w-xs flex-1 flex-col ${isDarkMode ? 'bg-slate-800' : 'bg-gray-100'} pt-5 pb-4`}>
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
                
                {/* Navigation */}
                <div className="mt-5 flex-1 overflow-y-auto">
                  <nav className="space-y-1 px-2">
                    {navigation.map((item) => {
                      return (
                        <Link
                          key={item.name}
                          to={item.href}
                          className={navClasses(item.href)}
                          onClick={() => setSidebarOpen(false)}
                        >
                          <item.icon
                            className={`mr-4 h-6 w-6 flex-shrink-0 ${isActive(item.href) 
                              ? (isDarkMode ? 'text-white' : 'text-sky-700')
                              : isDarkMode 
                                ? 'text-slate-400 group-hover:text-white' 
                                : 'text-gray-500 group-hover:text-gray-900'}`}
                            aria-hidden="true"
                          />
                          <span className="truncate">{item.name}</span>
                        </Link>
                      )
                    })}
                  </nav>
                </div>

                {/* Logo at bottom */}
                <div className="flex-shrink-0 px-4 py-4">
                  <Link to="/dashboard" className="flex items-center">
                    <FolderArchive className={`${isDarkMode ? 'text-sky-500' : 'text-sky-600'} h-8 w-8`} />
                  </Link>
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
      <div className={`hidden md:block ${isCollapsed ? 'md:w-16' : 'md:w-64'} md:flex-shrink-0 h-full transition-all duration-300`}>
        <div className={`flex h-full flex-col ${isDarkMode ? 'bg-slate-800' : 'bg-gray-100'} relative`}>
          {/* Toggle button */}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className={`absolute -right-3 top-16 bg-white rounded-full p-1 border border-gray-200 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2 ${isDarkMode ? 'border-gray-600' : 'border-gray-200'}`}
          >
            {isCollapsed ? (
              <ChevronRight className="h-4 w-4 text-gray-600" />
            ) : (
              <ChevronLeft className="h-4 w-4 text-gray-600" />
            )}
          </button>
          
          <div className="flex flex-1 flex-col overflow-y-auto">
            {/* Navigation */}
            <nav className="flex-1 space-y-1 px-2 py-4">
              {navigation.map((item) => {
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`${navClasses(item.href)} ${isCollapsed ? 'justify-center' : ''}`}
                    title={isCollapsed ? item.name : undefined}
                  >
                    <item.icon
                      className={`${isCollapsed ? '' : 'mr-3'} h-5 w-5 flex-shrink-0 ${isActive(item.href)
                        ? (isDarkMode ? 'text-white' : 'text-sky-700')
                        : isDarkMode
                          ? 'text-slate-400 group-hover:text-white'
                          : 'text-gray-500 group-hover:text-gray-900'}`}
                      aria-hidden="true"
                    />
                    {!isCollapsed && <span className="truncate">{item.name}</span>}
                  </Link>
                )
              })}
            </nav>

            {/* Logo at bottom */}
            <div className={`flex-shrink-0 px-4 py-4 ${isCollapsed ? 'flex justify-center' : ''}`}>
              <Link to="/dashboard" className="flex items-center" title="Dashboard">
                <FolderArchive className={`${isDarkMode ? 'text-sky-500' : 'text-sky-600'} h-8 w-8`} />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default Sidebar