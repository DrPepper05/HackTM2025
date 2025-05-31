import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Menu, Bell, Search, User, LogOut, Settings } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import LanguageSwitcher from './LanguageSwitcher'

function Header({ setSidebarOpen }) {
  const { t, i18n } = useTranslation()
  const { user, signOut, userRole } = useAuth()
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [notificationsOpen, setNotificationsOpen] = useState(false)

  const handleSignOut = async () => {
    await signOut()
  }

  return (
    <header className="bg-white shadow-md">
      <div className="flex h-16 items-center justify-between px-4 md:px-6">
        {/* Mobile menu button */}
        <button
          type="button"
          className="md:hidden"
          onClick={() => setSidebarOpen(true)}
        >
          <span className="sr-only">{t('navigation.open_sidebar')}</span>
          <Menu className="h-6 w-6" aria-hidden="true" />
        </button>

        {/* Logo */}
        <div className="flex md:hidden">
          <Link to="/dashboard" className="flex items-center">
            <span className="text-xl font-bold text-sky-600">OpenArchive</span>
          </Link>
        </div>

        {/* Search */}
        <div className="hidden flex-1 md:flex md:max-w-md lg:max-w-lg">
          <div className="w-full">
            <label htmlFor="search" className="sr-only">{t('common.search')}</label>
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                <Search className="h-5 w-5 text-gray-400" aria-hidden="true" />
              </div>
              <input
                id="search"
                name="search"
                className="block w-full rounded-md border-0 bg-gray-50 py-1.5 pl-10 pr-3 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-sky-600 sm:text-sm sm:leading-6"
                placeholder={t('common.search')}
                type="search"
              />
            </div>
          </div>
        </div>

        {/* Right section */}
        <div className="flex items-center gap-3">
          {/* Language switcher */}
          <LanguageSwitcher />

          {/* Notifications */}
          <div className="relative">
            <button
              type="button"
              className="rounded-full bg-white p-1 text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-sky-600 focus:ring-offset-2"
              onClick={() => setNotificationsOpen(!notificationsOpen)}
            >
              <span className="sr-only">{t('common.notifications')}</span>
              <Bell className="h-6 w-6" aria-hidden="true" />
            </button>

            {/* Notification badge */}
            <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-xs font-medium text-white">
              3
            </span>

            {/* Notifications dropdown */}
            {notificationsOpen && (
              <div className="absolute right-0 mt-2 w-80 origin-top-right rounded-md bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                <div className="px-4 py-2 text-sm font-medium text-gray-700">
                  {t('common.notifications')}
                </div>
                <div className="border-t border-gray-100">
                  {/* Notification items would go here */}
                  <div className="px-4 py-3 hover:bg-gray-50">
                    <p className="text-sm font-medium text-gray-900">{t('notifications.new_document')}</p>
                    <p className="text-xs text-gray-500">{t('notifications.time_ago', { time: '5m' })}</p>
                  </div>
                  <div className="px-4 py-3 hover:bg-gray-50">
                    <p className="text-sm font-medium text-gray-900">{t('notifications.document_approved')}</p>
                    <p className="text-xs text-gray-500">{t('notifications.time_ago', { time: '1h' })}</p>
                  </div>
                  <div className="px-4 py-3 hover:bg-gray-50">
                    <p className="text-sm font-medium text-gray-900">{t('notifications.retention_alert')}</p>
                    <p className="text-xs text-gray-500">{t('notifications.time_ago', { time: '3h' })}</p>
                  </div>
                </div>
                <div className="border-t border-gray-100 px-4 py-2 text-center">
                  <Link to="/notifications" className="text-sm font-medium text-sky-600 hover:text-sky-700">
                    {t('notifications.view_all')}
                  </Link>
                </div>
              </div>
            )}
          </div>

          {/* Profile dropdown */}
          <div className="relative">
            <button
              type="button"
              className="flex rounded-full bg-white text-sm focus:outline-none focus:ring-2 focus:ring-sky-600 focus:ring-offset-2"
              onClick={() => setUserMenuOpen(!userMenuOpen)}
            >
              <span className="sr-only">{t('navigation.open_user_menu')}</span>
              <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center">
                <User className="h-5 w-5 text-gray-500" />
              </div>
            </button>

            {/* User dropdown */}
            {userMenuOpen && (
              <div className="absolute right-0 mt-2 w-48 origin-top-right rounded-md bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                <div className="px-4 py-2 text-sm text-gray-700">
                  <div className="font-medium">{user?.email}</div>
                  <div className="text-xs text-gray-500 capitalize">{t(`roles.${userRole}`)}</div>
                </div>
                <div className="border-t border-gray-100">
                  <Link
                    to="/profile"
                    className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    onClick={() => setUserMenuOpen(false)}
                  >
                    <User className="mr-3 h-4 w-4" />
                    {t('navigation.profile')}
                  </Link>
                  <Link
                    to="/settings"
                    className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    onClick={() => setUserMenuOpen(false)}
                  >
                    <Settings className="mr-3 h-4 w-4" />
                    {t('navigation.settings')}
                  </Link>
                  <button
                    className="flex w-full items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    onClick={() => {
                      setUserMenuOpen(false)
                      handleSignOut()
                    }}
                  >
                    <LogOut className="mr-3 h-4 w-4" />
                    {t('auth.sign_out')}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}

export default Header