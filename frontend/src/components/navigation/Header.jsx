import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Menu, Bell, User, LogOut, Settings, FolderArchive } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import LanguageSwitcher from './LanguageSwitcher'

function Header({ toggleSidebar }) {
  const { t } = useTranslation()
  const { user, signOut, userRole } = useAuth()
  const navigate = useNavigate()
  const [activeDropdown, setActiveDropdown] = useState(null)
  const headerRef = useRef(null)

  // Close dropdowns when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (headerRef.current && !headerRef.current.contains(event.target)) {
        setActiveDropdown(null)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  const handleDropdownToggle = (dropdownName) => {
    // If clicking the same dropdown, close it
    if (activeDropdown === dropdownName) {
      setActiveDropdown(null)
      return
    }
    
    // If a different dropdown is open, close it first then open the new one after a short delay
    if (activeDropdown) {
      setActiveDropdown(null)
      setTimeout(() => {
        setActiveDropdown(dropdownName)
      }, 100)
    } else {
      // If no dropdown is open, open the selected one immediately
      setActiveDropdown(dropdownName)
    }
  }

  const handleSignOut = async () => {
    await signOut()
  }

  const handleLogoClick = () => {
    navigate('/dashboard')
  }

  const handleProfileClick = () => {
    setActiveDropdown(null)
    navigate('/profile')
  }

  return (
    <header className="bg-white shadow-sm z-10" ref={headerRef}>
      <div className="flex h-16 items-center justify-between px-4 md:px-6 lg:px-8">
        {/* Mobile menu button */}
        <button
          type="button"
          className="md:hidden rounded-md p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-600 focus:outline-none"
          onClick={toggleSidebar}
        >
          <span className="sr-only">{t('nav.open_sidebar')}</span>
          <Menu className="h-6 w-6" aria-hidden="true" />
        </button>

        {/* Logo and App Name */}
        <div className="flex h-16 flex-shrink-0 items-center px-4">
          <Link to="/dashboard" className="flex items-center">
            <FolderArchive className="text-sky-600 mr-3 h-8 w-8" />
            <span className="text-xl font-bold text-gray-800">OpenArchive</span>
          </Link>
        </div>

        {/* Right section */}
        <div className="flex items-center gap-3">
          {/* User Role Badge */}
          <div className="hidden md:block">
            <span className="inline-flex items-center rounded-md bg-sky-100 px-2.5 py-0.5 text-sm font-medium text-sky-800 capitalize">
              {t(`roles.${userRole}`)}
            </span>
          </div>
          
          {/* Language switcher */}
          <LanguageSwitcher 
            isOpen={activeDropdown === 'language'} 
            onToggle={() => handleDropdownToggle('language')}
          />

          {/* Notifications */}
          <div className="relative">
            <button
              type="button"
              className="rounded-full p-1 text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none"
              onClick={() => handleDropdownToggle('notifications')}
            >
              <span className="sr-only">{t('common.notifications')}</span>
              <Bell className="h-6 w-6" aria-hidden="true" />
            </button>

            {/* Notifications dropdown */}
            {activeDropdown === 'notifications' && (
              <div className="absolute right-0 mt-2 w-80 origin-top-right rounded-md bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5 z-20">
                <div className="px-4 py-2 text-sm font-medium text-gray-700">
                  {t('common.notifications')}
                </div>
                <div className="border-t border-gray-100">
                  {/* Empty notifications state */}
                  <div className="px-4 py-3 text-center text-sm text-gray-500">
                    {t('notifications.no_notifications')}
                  </div>
                </div>
                <div className="border-t border-gray-100 px-4 py-2 text-center">
                  <Link 
                    to="/notifications" 
                    className="text-sm font-medium text-sky-600 hover:text-sky-700"
                    onClick={() => setActiveDropdown(null)}
                  >
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
              className="flex rounded-full text-sm hover:bg-gray-100 focus:outline-none"
              onClick={() => handleDropdownToggle('profile')}
            >
              <span className="sr-only">{t('nav.open_user_menu')}</span>
              <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center hover:bg-gray-300">
                <User className="h-5 w-5 text-gray-500" />
              </div>
            </button>

            {/* User dropdown */}
            {activeDropdown === 'profile' && (
              <div className="absolute right-0 mt-2 w-48 origin-top-right rounded-md bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5 z-20">
                <div className="px-4 py-2 text-sm text-gray-700">
                  <div className="font-medium">{user?.email}</div>
                  <div className="text-xs text-gray-500 capitalize">{t(`roles.${userRole}`)}</div>
                </div>
                <div className="border-t border-gray-100">
                  <button
                    onClick={handleProfileClick}
                    className="flex w-full items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 focus:outline-none"
                  >
                    <User className="mr-3 h-4 w-4" />
                    {t('nav.profile')}
                  </button>
                  <button
                    className="flex w-full items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 focus:outline-none"
                    onClick={() => {
                      setActiveDropdown(null)
                      handleSignOut()
                    }}
                  >
                    <LogOut className="mr-3 h-4 w-4" />
                    {t('auth.signOut')}
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