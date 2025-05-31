import { useContext } from 'react'
import { AuthContext } from '../contexts/AuthContext'

// Custom hook to use the auth context
export const useAuth = () => {
  const context = useContext(AuthContext)
  
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  
  return context
}

// Additional auth hooks for convenience
export const useUser = () => {
  const { user } = useAuth()
  return user
}

export const useSession = () => {
  const { session, isAuthenticated } = useAuth()
  return { session, isAuthenticated: isAuthenticated() }
}

export const useRole = () => {
  const { userRole, hasRole } = useAuth()
  return { userRole, hasRole }
}

// Hook for making authenticated API calls
export const useApiCall = () => {
  const { apiCall } = useAuth()
  return apiCall
}

export default useAuth