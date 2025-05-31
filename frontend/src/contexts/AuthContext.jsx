import { createContext, useEffect, useState, useCallback } from 'react'

// Create the auth context
export const AuthContext = createContext()

const API_BASE_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001'

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [session, setSession] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [userRole, setUserRole] = useState(null)
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  // Token management functions
  const saveSession = (sessionData, userData = null) => {
    const sessionToStore = {
      ...sessionData,
      user: userData || user // Store user data with session
    }
    localStorage.setItem('auth_session', JSON.stringify(sessionToStore))
    setSession(sessionToStore)
  }

  const clearSession = () => {
    localStorage.removeItem('auth_session')
    setSession(null)
    setUser(null)
    setUserRole(null)
    setIsLoggingOut(false)
  }

  const getStoredSession = () => {
    try {
      const stored = localStorage.getItem('auth_session')
      if (!stored) {
        console.log('No stored session found')
        return null
      }
      
      const session = JSON.parse(stored)
      console.log('Retrieved stored session:', { 
        hasAccessToken: !!session.access_token,
        hasRefreshToken: !!session.refresh_token,
        hasUser: !!session.user,
        expiresAt: session.expires_at 
      })
      return session
    } catch (error) {
      console.error('Error parsing stored session:', error)
      // Clear corrupted session data
      localStorage.removeItem('auth_session')
      return null
    }
  }

  // Check if token is expired
  const isTokenExpired = (session) => {
    if (!session?.expires_at) {
      console.log('Token check: No expires_at found, considering expired')
      return true
    }
    
    // Add a 30-second buffer to account for clock skew and network delays
    const bufferMs = 30 * 1000
    const now = Date.now()
    
    // Handle both Unix timestamps (seconds) and JavaScript timestamps (milliseconds)
    let expiresAt
    if (typeof session.expires_at === 'string') {
      expiresAt = new Date(session.expires_at).getTime()
    } else if (session.expires_at < 10000000000) {
      // If the number is less than 10 billion, it's likely in seconds (Unix timestamp)
      expiresAt = session.expires_at * 1000
    } else {
      // Otherwise, it's already in milliseconds
      expiresAt = session.expires_at
    }
    
    const isExpired = now > (expiresAt - bufferMs)
    const timeUntilExpiry = expiresAt - now
    
    console.log('Token expiration check:', {
      expiresAtRaw: session.expires_at,
      timeUntilExpiryMinutes: Math.round(timeUntilExpiry / 60000),
      isExpired
    })
    
    return isExpired
  }

  // API helper with auth headers
  const apiCall = useCallback(async (endpoint, options = {}) => {
    // If we're already logging out, don't make API calls that could trigger another logout
    if (isLoggingOut && endpoint !== '/api/v1/auth/logout') {
      throw new Error('User is being logged out')
    }

    const storedSession = getStoredSession()
    
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      ...options
    }

    // Add auth header if we have a valid session
    if (storedSession?.access_token && !isTokenExpired(storedSession)) {
      config.headers.Authorization = `Bearer ${storedSession.access_token}`
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, config)
    const result = await response.json()

    // Handle 401 errors (token expired/invalid)
    if (response.status === 401) {
      // Prevent cascading logout calls
      if (isLoggingOut) {
        throw new Error('Session expired. Please login again.')
      }

      // Try to refresh token if we have a refresh token
      if (storedSession?.refresh_token) {
        const refreshResult = await refreshToken()
        if (refreshResult.success) {
          // Retry original request with new token
          config.headers.Authorization = `Bearer ${refreshResult.session.access_token}`
          const retryResponse = await fetch(`${API_BASE_URL}${endpoint}`, config)
          return await retryResponse.json()
        }
      }
      // If refresh failed or no refresh token, logout
      await signOut()
      throw new Error('Session expired. Please login again.')
    }

    if (!response.ok) {
      throw new Error(result.message || `HTTP ${response.status}`)
    }

    return result
  }, [isLoggingOut])

  // Load user profile
  const loadUserProfile = useCallback(async () => {
    try {
      console.log('Making API call to load user profile...')
      const result = await apiCall('/api/v1/auth/profile')
      const profile = result.data
      
      console.log('User profile loaded from API:', { 
        id: profile.id, 
        email: profile.email, 
        role: profile.role 
      })
      
      setUser({
        id: profile.id,
        email: profile.email,
        profile
      })
      setUserRole(profile.role)
      
      return profile
    } catch (error) {
      console.error('Error loading user profile:', error)
      // Don't automatically clear session here - let the caller decide
      // This function is called from initialization and other places
      throw error
    }
  }, [apiCall])

  // Initialize auth state
  useEffect(() => {
    const initializeAuth = async () => {
      setIsLoading(true)
      console.log('Starting auth initialization...')
      
      try {
        const storedSession = getStoredSession()
        
        if (!storedSession) {
          console.log('No stored session found, user not logged in')
          setIsLoading(false)
          return
        }

        console.log('Found stored session, checking expiration...')
        
        // Always restore the session first
        setSession(storedSession)

        // Check if token is expired
        if (isTokenExpired(storedSession)) {
          console.log('Token expired, attempting refresh...')
          // Try to refresh token
          try {
            const refreshResult = await refreshToken()
            if (!refreshResult.success) {
              console.log('Token refresh failed during init, logging out')
              clearSession()
              setIsLoading(false)
              return
            }
            console.log('Token refresh successful during init')
            // refreshToken already updates the session, so we continue
          } catch (error) {
            console.log('Token refresh failed during init:', error)
            clearSession()
            setIsLoading(false)
            return
          }
        } else {
          console.log('Token is still valid, proceeding with profile loading')
        }

        // First, try to restore user data from stored session
        if (storedSession.user) {
          console.log('Restoring user data from stored session')
          setUser(storedSession.user)
          setUserRole(storedSession.user.profile?.role || 'citizen')
        }

        // Then try to load fresh user profile, but don't fail the entire auth if it fails
        try {
          console.log('Loading fresh user profile...')
          await loadUserProfile()
          console.log('User profile loaded successfully')
        } catch (error) {
          console.error('Error loading user profile during init:', error)
          
          // Check if it's a 401 error (invalid token)
          if (error.message.includes('Session expired') || error.message.includes('401')) {
            console.log('Profile loading failed due to invalid token, clearing session')
            clearSession()
          } else {
            // For other errors (network issues, server problems), keep the session
            console.warn('Profile loading failed but keeping session. User data restored from cache:', error.message)
            
            // Make sure we have user data from session if profile loading failed
            if (!user && storedSession.user) {
              console.log('Ensuring user data is restored from session after profile loading failure')
              setUser(storedSession.user)
              setUserRole(storedSession.user.profile?.role || 'citizen')
            }
          }
        }
        
      } catch (error) {
        console.error('Error initializing auth:', error)
        // Only clear session for critical authentication errors
        if (error.message.includes('Session expired') || error.message.includes('401')) {
          console.log('Clearing session due to authentication error')
          clearSession()
        } else {
          console.warn('Non-auth error during initialization, keeping session')
        }
      } finally {
        console.log('Auth initialization complete')
        setIsLoading(false)
      }
    }

    initializeAuth()
  }, [loadUserProfile])

  // Authentication functions
  const signIn = async ({ email, password }) => {
    try {
      setIsLoading(true)
      
      const response = await fetch(`${API_BASE_URL}/api/v1/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      })

      const result = await response.json()

      if (!response.ok) {
        return { data: null, error: result.message || 'Login failed' }
      }

      // Save session and update state
      const sessionData = result.data.session
      const userData = result.data.user
      
      saveSession(sessionData, userData)
      setUser(userData)
      setUserRole(userData.profile?.role || 'citizen')
      
      return { data: result.data, error: null }
      
    } catch (error) {
      console.error('Login error:', error)
      return { data: null, error: error.message || 'An unexpected error occurred' }
    } finally {
      setIsLoading(false)
    }
  }

  const signUp = async (email, password, full_name, role = 'citizen', institution = '', phone = '') => {
    try {
      setIsLoading(true)
      
      const response = await fetch(`${API_BASE_URL}/api/v1/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password,
          full_name,
          role,
          institution,
          phone
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        return { data: null, error: result.message || 'Registration failed' }
      }

      // Save session and update state
      const sessionData = result.data.session
      const userData = result.data.user
      
      saveSession(sessionData, userData)
      setUser(userData)
      setUserRole(userData.profile?.role || 'citizen')
      
      return { data: result.data, error: null }
      
    } catch (error) {
      console.error('Registration error:', error)
      return { data: null, error: error.message || 'An unexpected error occurred' }
    } finally {
      setIsLoading(false)
    }
  }

  const signOut = async () => {
    // Prevent multiple logout calls
    if (isLoggingOut) {
      return { error: null }
    }

    setIsLoggingOut(true)
    
    try {
      // Call backend logout endpoint using direct fetch to avoid cascading with apiCall
      const storedSession = getStoredSession()
      if (storedSession?.access_token) {
        await fetch(`${API_BASE_URL}/api/v1/auth/logout`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${storedSession.access_token}`
          }
        })
        // Don't throw errors from logout endpoint - just continue to clear session
      }
    } catch (error) {
      // Even if backend call fails, clear local session
      console.error('Logout error:', error)
    } finally {
      clearSession()
      return { error: null }
    }
  }

  const refreshToken = async () => {
    try {
      const storedSession = getStoredSession()
      
      if (!storedSession?.refresh_token) {
        throw new Error('No refresh token available')
      }

      const response = await fetch(`${API_BASE_URL}/api/v1/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          refreshToken: storedSession.refresh_token 
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.message || 'Token refresh failed')
      }

      // Update session with new tokens while preserving user data
      const newSession = result.data
      saveSession(newSession, storedSession.user)
      
      return { success: true, session: newSession }
      
    } catch (error) {
      console.error('Token refresh error:', error)
      clearSession()
      return { success: false, error: error.message }
    }
  }

  const resetPassword = async (email) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/auth/password/reset`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      })

      const result = await response.json()

      if (!response.ok) {
        return { error: result.message || 'Password reset failed' }
      }

      return { error: null }
      
    } catch (error) {
      console.error('Password reset error:', error)
      return { error: error.message || 'An unexpected error occurred' }
    }
  }

  const updateProfile = async (updates) => {
    try {
      const result = await apiCall('/api/v1/auth/profile', {
        method: 'PUT',
        body: JSON.stringify(updates)
      })

      // Update local user state
      setUser(prevUser => ({
        ...prevUser,
        profile: result.data
      }))

      return { data: result.data, error: null }
      
    } catch (error) {
      console.error('Profile update error:', error)
      return { data: null, error: error.message }
    }
  }

  // Role-based access control helpers
  const hasRole = (requiredRole) => {
    if (!userRole) return false
    
    // Admin has access to everything
    if (userRole === 'admin') return true
    
    // Role hierarchy checks
    const roleHierarchy = {
      admin: ['admin'],
      archivist: ['admin', 'archivist'],
      clerk: ['admin', 'archivist', 'clerk'],
      inspector: ['admin', 'inspector'],
      citizen: ['admin', 'archivist', 'clerk', 'inspector', 'citizen']
    }
    
    return roleHierarchy[requiredRole]?.includes(userRole) || false
  }

  const isAuthenticated = () => {
    // Check current state first
    if (user && session && !isTokenExpired(session)) {
      return true
    }
    
    // If current state is not available, check stored session
    const storedSession = getStoredSession()
    return !!(storedSession?.access_token && storedSession?.user && !isTokenExpired(storedSession))
  }

  // Auto-refresh token when it's about to expire
  useEffect(() => {
    if (!session || !session.expires_at || isLoggingOut) return

    const timeToExpiry = session.expires_at - Date.now()
    const refreshTime = Math.max(timeToExpiry - 300000, 60000) // Refresh 5 mins before expiry, min 1 min

    const refreshTimer = setTimeout(() => {
      // Don't refresh if we're already logging out
      if (!isLoggingOut) {
        refreshToken().catch(error => {
          console.error('Auto token refresh failed:', error)
        })
      }
    }, refreshTime)

    return () => clearTimeout(refreshTimer)
  }, [session, isLoggingOut])

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        isLoading,
        userRole,
        isAuthenticated,
        signIn,
        signUp,
        signOut,
        resetPassword,
        updateProfile,
        refreshToken,
        hasRole,
        apiCall // Expose apiCall for other components to use authenticated requests
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}