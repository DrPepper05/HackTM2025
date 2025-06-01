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

  // Check if user has the required role
  const hasRequiredRole = Array.isArray(allowedRoles) 
    ? allowedRoles.some(role => hasRole(role))
    : hasRole(allowedRoles)

  // Redirect to appropriate page if user doesn't have the required role
  if (!hasRequiredRole) {
    // Define redirect based on user role
    const roleRedirects = {
      archivist: '/archivist/ingest',
      clerk: '/documents/upload',
      inspector: '/inspector/audit-logs',
      admin: '/dashboard',
      citizen: '/'
    }
    
    const redirectTo = roleRedirects[userRole] || '/'
    return <Navigate to={redirectTo} replace />
  }

  // Render children
  return children
}

export default RoleBasedRoute