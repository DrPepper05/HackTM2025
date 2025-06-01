import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

const ProtectedRoute = ({ 
  children, 
  requiredRole = null, 
  fallbackUrl = '/login',
  loadingComponent = null 
}) => {
  const { user, isLoading, hasRole, isAuthenticated } = useAuth()
  const location = useLocation()

  // Show loading state while checking authentication
  if (isLoading) {
    return loadingComponent || (
      <div className="loading-container min-h-screen">
        <div className="loading-spinner"></div>
        <p className="text-gray-600 text-sm mt-2">Loading...</p>
      </div>
    )
  }

  // Check if user is authenticated
  if (!isAuthenticated()) {
    // Redirect to login with return URL
    return <Navigate 
      to={fallbackUrl} 
      state={{ from: location.pathname }} 
      replace 
    />
  }

  // Check role-based access if required
  if (requiredRole && !hasRole(requiredRole)) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h2>
          <p className="text-gray-600 mb-6">
            You don't have the required permissions to access this page.
          </p>
          <p className="text-sm text-gray-500">
            Required role: <span className="font-medium">{requiredRole}</span>
          </p>
          <p className="text-sm text-gray-500">
            Your role: <span className="font-medium">{user?.profile?.role || 'Unknown'}</span>
          </p>
          <button 
            onClick={() => window.history.back()} 
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Go Back
          </button>
        </div>
      </div>
    )
  }

  // User is authenticated and authorized
  return children
}

export default ProtectedRoute 