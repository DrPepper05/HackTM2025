import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Menu, Bell, User, LogOut, Settings, FolderArchive, Sun, Moon } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import { useTheme } from '../../contexts/ThemeContext'
import LanguageSwitcher from './LanguageSwitcher'

function Header({ toggleSidebar }) {
  const { t } = useTranslation()
  const { user, signOut, userRole } = useAuth()
  const { isDarkMode, toggleDarkMode } = useTheme()
  const navigate = useNavigate()
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [notificationsOpen, setNotificationsOpen] = useState(false)

  const handleSignOut = async () => {
    await signOut()
  }

  const handleLogoClick = () => {
    navigate('/dashboard')
  }

  return (
    <header className={`${isDarkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-800'} shadow-sm z-10`}>
      <div className="flex h-16 items-center justify-between px-4 md:px-6 lg:px-8">
        {/* Mobile menu button */}
        <button
          type="button"
          className="md:hidden rounded-md p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-sky-500"
          onClick={toggleSidebar}
        >
          <span className="sr-only">{t('navigation.open_sidebar')}</span>
          <Menu className="h-6 w-6" aria-hidden="true" />
        </button>

        {/* Logo and App Name */}
        <div className="flex h-16 flex-shrink-0 items-center px-4 cursor-pointer" onClick={handleLogoClick}>
          <FolderArchive className={`${isDarkMode ? 'text-sky-400' : 'text-sky-600'} mr-3 h-8 w-8`} />
          <span className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>OpenArchive</span>
        </div>

        {/* Right section */}
        <div className="flex items-center gap-3">
          {/* User Role Badge */}
          <div className="hidden md:block">
            <span className={`inline-flex items-center rounded-md ${isDarkMode ? 'bg-sky-900 text-sky-200' : 'bg-sky-100 text-sky-800'} px-2.5 py-0.5 text-sm font-medium capitalize`}>
              {t(`roles.${userRole}`)}
            </span>
          </div>
          
          {/* Theme Toggle */}
          <button
            type="button"
            className={`rounded-full p-1 ${isDarkMode ? 'text-gray-300 hover:text-white' : 'text-gray-500 hover:text-gray-600'} focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2`}
            onClick={toggleDarkMode}
          >
            <span className="sr-only">{isDarkMode ? t('common.light_mode') : t('common.dark_mode')}</span>
            {isDarkMode ? <Sun className="h-6 w-6" /> : <Moon className="h-6 w-6" />}
          </button>

          {/* Language switcher */}
          <LanguageSwitcher />

          {/* Notifications */}
          <div className="relative">
            <button
              type="button"
              className={`rounded-full p-1 ${isDarkMode ? 'text-gray-300 hover:text-white' : 'text-gray-400 hover:text-gray-500'} focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2`}
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
              <div className={`absolute right-0 mt-2 w-80 origin-top-right rounded-md ${isDarkMode ? 'bg-gray-700' : 'bg-white'} py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-20`}>
                <div className={`px-4 py-2 text-sm font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                  {t('common.notifications')}
                </div>
                <div className={`border-t ${isDarkMode ? 'border-gray-600' : 'border-gray-100'}`}>
                  {/* Notification items */}
                  <div className={`px-4 py-3 hover:${isDarkMode ? 'bg-gray-600' : 'bg-gray-50'}`}>
                    <p className={`text-sm font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-900'}`}>{t('notifications.new_document')}</p>
                    <p className="text-xs text-gray-500">{t('notifications.time_ago', { time: '5m' })}</p>
                  </div>
                  <div className={`px-4 py-3 hover:${isDarkMode ? 'bg-gray-600' : 'bg-gray-50'}`}>
                    <p className={`text-sm font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-900'}`}>{t('notifications.document_approved')}</p>
                    <p className="text-xs text-gray-500">{t('notifications.time_ago', { time: '1h' })}</p>
                  </div>
                  <div className={`px-4 py-3 hover:${isDarkMode ? 'bg-gray-600' : 'bg-gray-50'}`}>
                    <p className={`text-sm font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-900'}`}>{t('notifications.retention_alert')}</p>
                    <p className="text-xs text-gray-500">{t('notifications.time_ago', { time: '3h' })}</p>
                  </div>
                </div>
                <div className={`border-t ${isDarkMode ? 'border-gray-600' : 'border-gray-100'} px-4 py-2 text-center`}>
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
              className={`flex rounded-full ${isDarkMode ? 'bg-gray-700' : 'bg-white'} text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2`}
              onClick={() => setUserMenuOpen(!userMenuOpen)}
            >
              <span className="sr-only">{t('navigation.open_user_menu')}</span>
              <div className={`h-8 w-8 rounded-full ${isDarkMode ? 'bg-gray-600' : 'bg-gray-200'} flex items-center justify-center`}>
                <User className={`h-5 w-5 ${isDarkMode ? 'text-gray-300' : 'text-gray-500'}`} />
              </div>
            </button>

            {/* User dropdown */}
            {userMenuOpen && (
              <div className={`absolute right-0 mt-2 w-48 origin-top-right rounded-md ${isDarkMode ? 'bg-gray-700' : 'bg-white'} py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-20`}>
                <div className={`px-4 py-2 text-sm ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                  <div className="font-medium">{user?.email}</div>
                  <div className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'} capitalize`}>{t(`roles.${userRole}`)}</div>
                </div>
                <div className={`border-t ${isDarkMode ? 'border-gray-600' : 'border-gray-100'}`}>
                  <Link
                    to="/profile"
                    className={`flex items-center px-4 py-2 text-sm ${isDarkMode ? 'text-gray-200 hover:bg-gray-600' : 'text-gray-700 hover:bg-gray-50'}`}
                    onClick={() => setUserMenuOpen(false)}
                  >
                    <User className="mr-3 h-4 w-4" />
                    {t('navigation.profile')}
                  </Link>
                  <Link
                    to="/settings"
                    className={`flex items-center px-4 py-2 text-sm ${isDarkMode ? 'text-gray-200 hover:bg-gray-600' : 'text-gray-700 hover:bg-gray-50'}`}
                    onClick={() => setUserMenuOpen(false)}
                  >
                    <Settings className="mr-3 h-4 w-4" />
                    {t('navigation.settings')}
                  </Link>
                  <button
                    className={`flex w-full items-center px-4 py-2 text-sm ${isDarkMode ? 'text-gray-200 hover:bg-gray-600' : 'text-gray-700 hover:bg-gray-50'}`}
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