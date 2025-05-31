import { createContext, useEffect, useState } from 'react'
// Keep the import but we won't use it actively
// import { supabase, auth } from '../services/supabase'

// Create the auth context
export const AuthContext = createContext()

export function AuthProvider({ children }) {
  // Mock user data for development
  const mockUser = {
    id: 'mock-user-id',
    email: 'mock@example.com',
    user_metadata: {
      full_name: 'Mock User'
    },
    app_metadata: {
      role: 'admin' // You can change this to any role you need: 'clerk', 'archivist', 'inspector', etc.
    }
  }

  const [user, setUser] = useState(mockUser)
  const [session, setSession] = useState({ user: mockUser })
  const [isLoading, setIsLoading] = useState(false) // Set to false to avoid loading screen
  const [userRole, setUserRole] = useState(mockUser.app_metadata.role)

  // Initialize auth state - simplified for development
  useEffect(() => {
    // No need to check for session or connect to Supabase
    setIsLoading(false)
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
    // For development, you might want to actually clear the user
    // Uncomment these lines if you want sign out to work
    // setUser(null)
    // setSession(null)
    // setUserRole(null)
    return { error: null }
  }

  const resetPassword = async (email) => {
    return { data: {}, error: null }
  }

  const updatePassword = async (newPassword) => {
    return { data: {}, error: null }
  }

  // Role-based access control helpers
  const hasRole = (requiredRole) => {
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