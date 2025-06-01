import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import LoadingScreen from '../ui/LoadingScreen'

// Component to protect routes that require authentication
function ProtectedRoute({ children }) {
  const { user, isLoading } = useAuth()

  // Show loading screen while checking authentication
  if (isLoading) {
    return <LoadingScreen />
  }

  // Redirect to login if not authenticated
  if (!user) {
    return <Navigate to="/login" />
  }

  // Render children or outlet
  return children || <Outlet />
}

export default ProtectedRoute