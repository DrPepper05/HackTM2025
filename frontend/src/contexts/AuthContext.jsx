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

  // Mock authentication functions
  const signIn = async ({ email, password }) => {
    // Always succeed with mock data
    return { data: { user: mockUser, session: { user: mockUser } }, error: null }
  }

  const signUp = async ({ email, password, metadata }) => {
    // Always succeed with mock data
    return { data: { user: mockUser }, error: null }
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