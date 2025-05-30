import { Navigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import LoadingScreen from '../ui/LoadingScreen'

// Component to protect routes based on user roles
function RoleBasedRoute({ children, allowedRoles }) {
  const { user, isLoading, userRole, hasRole } = useAuth()

  // Show loading screen while checking authentication
  if (isLoading) {
    return <LoadingScreen />
  }

  // Redirect to login if not authenticated
  if (!user) {
    return <Navigate to="/login" replace />
  }

  // Redirect to dashboard if user doesn't have the required role
  if (!hasRole(allowedRoles)) {
    return <Navigate to="/dashboard" replace />
  }

  // Render children
  return children
}

export default RoleBasedRoute