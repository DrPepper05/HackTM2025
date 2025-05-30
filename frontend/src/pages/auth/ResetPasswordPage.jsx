import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../../hooks/useAuth'

function ResetPasswordPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const location = useLocation()
  const { updatePassword } = useAuth()
  
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [tokenValid, setTokenValid] = useState(true)

  // Check if the reset token is in the URL
  useEffect(() => {
    const hash = location.hash
    if (!hash || !hash.includes('type=recovery')) {
      setTokenValid(false)
      setError(t('auth.invalid_reset_link'))
    }
  }, [location, t])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)

    // Validate passwords match
    if (password !== confirmPassword) {
      setError(t('auth.passwords_dont_match'))
      return
    }

    // Validate password strength
    if (password.length < 8) {
      setError(t('auth.password_too_short'))
      return
    }

    setIsLoading(true)

    try {
      const { error } = await updatePassword(password)
      
      if (error) {
        setError(error.message)
      } else {
        // Redirect to login with success message
        navigate('/login', { 
          state: { 
            message: t('auth.password_reset_success') 
          } 
        })
      }
    } catch (err) {
      setError(t('auth.reset_error'))
      console.error('Password reset error:', err)
    } finally {
      setIsLoading(false)
    }
  }

  if (!tokenValid) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
        <div className="w-full max-w-md space-y-8">
          <div>
            <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-gray-900">
              {t('auth.invalid_link')}
            </h2>
            <p className="mt-2 text-center text-sm text-gray-600">
              {t('auth.reset_link_invalid_or_expired')}
            </p>
          </div>
          <div className="text-center">
            <button
              onClick={() => navigate('/forgot-password')}
              className="font-medium text-primary hover:text-primary-dark"
            >
              {t('auth.request_new_link')}
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-gray-900">
            {t('auth.set_new_password')}
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            {t('auth.create_new_password')}
          </p>
        </div>

        {error && (
          <div className="rounded-md bg-red-50 p-4">
            <div className="flex">
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">{error}</h3>
              </div>
            </div>
          </div>
        )}

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="-space-y-px rounded-md shadow-sm">
            <div>
              <label htmlFor="password" className="sr-only">
                {t('auth.new_password')}
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                required
                className="relative block w-full rounded-t-md border-0 py-1.5 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:z-10 focus:ring-2 focus:ring-inset focus:ring-primary sm:text-sm sm:leading-6 px-3"
                placeholder={t('auth.new_password')}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="confirm-password" className="sr-only">
                {t('auth.confirm_password')}
              </label>
              <input
                id="confirm-password"
                name="confirm-password"
                type="password"
                autoComplete="new-password"
                required
                className="relative block w-full rounded-b-md border-0 py-1.5 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:z-10 focus:ring-2 focus:ring-inset focus:ring-primary sm:text-sm sm:leading-6 px-3"
                placeholder={t('auth.confirm_password')}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="group relative flex w-full justify-center rounded-md bg-primary px-3 py-2 text-sm font-semibold text-white hover:bg-primary-dark focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:bg-primary-light"
            >
              {isLoading ? t('common.loading') : t('auth.reset_password')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default ResetPasswordPage