import { createContext, useEffect, useState } from 'react'

// Create the auth context
export const AuthContext = createContext()

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [session, setSession] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [userRole, setUserRole] = useState(null)

  // Initialize auth state
  useEffect(() => {
    // Get the current session
    const initializeAuth = async () => {
      setIsLoading(true)
      try {
        // Check for existing session
        const { data: { session: currentSession }, error } = await auth.getSession()
        
        if (error) throw error
        
        if (currentSession) {
          // Set the user and session
          setSession(currentSession)
          setUser(currentSession.user)
          
          // Set user role from metadata
          if (currentSession.user?.app_metadata?.role) {
            setUserRole(currentSession.user.app_metadata.role)
          }
        }
      } catch (error) {
        console.error('Error initializing auth:', error)
      } finally {
        setIsLoading(false)
      }
    }

    initializeAuth()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, currentSession) => {
        setSession(currentSession)
        setUser(currentSession?.user || null)
        setUserRole(currentSession?.user?.app_metadata?.role || null)
        setIsLoading(false)
      }
    )

    // Cleanup subscription
    return () => {
      subscription?.unsubscribe()
    }
  }, [])

  // Authentication functions
  const signIn = async ({ email, password }) => {
    try {
      setIsLoading(true);
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/v1/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const result = await response.json();

      if (!response.ok) {
        return { data: null, error: result.message || 'Login failed' };
      }

      // Update state with the returned user and session
      const userData = result.data.user;
      const sessionData = result.data.session;
      
      setUser(userData);
      setSession(sessionData);
      setUserRole(userData.profile?.role || 'citizen');
      
      return { data: { user: userData, session: sessionData }, error: null };
    } catch (error) {
      console.error('Login error:', error);
      return { data: null, error: error.message || 'An unexpected error occurred' };
    } finally {
      setIsLoading(false);
    }
  }
  const signUp = async (email, password, full_name, role = 'citizen', institution = '', phone = '') => {
    try {
      setIsLoading(true);
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/v1/auth/register`, {
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
      });

      const result = await response.json();

      if (!response.ok) {
        return { data: null, error: result.message || 'Registration failed' };
      }

      // Update state with the returned user and session
      const userData = result.data.user;
      const sessionData = result.data.session;
      
      setUser(userData);
      setSession(sessionData);
      setUserRole(userData.profile?.role || 'citizen');
      
      return { data: { user: userData, session: sessionData }, error: null };
    } catch (error) {
      console.error('Registration error:', error);
      return { data: null, error: error.message || 'An unexpected error occurred' };
    } finally {
      setIsLoading(false);
    }
  }

  const signOut = async () => {
    return auth.signOut()
  }

  const resetPassword = async (email) => {
    return auth.resetPassword(email)
  }

  const updatePassword = async (newPassword) => {
    return auth.updatePassword(newPassword)
  }

  // Role-based access control helpers
  const hasRole = (requiredRole) => {
    if (!userRole) return false
    
    if (requiredRole === 'admin') {
      return userRole === 'admin'
    }
    
    if (requiredRole === 'archivist') {
      return userRole === 'admin' || userRole === 'archivist'
    }
    
    if (requiredRole === 'clerk') {
      return userRole === 'admin' || userRole === 'archivist' || userRole === 'clerk'
    }
    
    if (requiredRole === 'inspector') {
      return userRole === 'admin' || userRole === 'inspector'
    }
    
    return true
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        isLoading,
        userRole,
        signIn,
        signUp,
        signOut,
        resetPassword,
        updatePassword,
        hasRole
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}