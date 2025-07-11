import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { Suspense, lazy } from 'react'
import ProtectedRoute from '../components/auth/ProtectedRoute'
import RoleBasedRoute from '../components/auth/RoleBasedRoute'
import Layout from '../components/layout/Layout'
import LoadingScreen from '../components/ui/LoadingScreen'
import PortalPage from "../pages/portal/PortalPage";

// Lazy load pages for better performance
const LoginPage = lazy(() => import('../pages/auth/LoginPage'))
const RegisterPage = lazy(() => import('../pages/auth/RegisterPage'))
const ForgotPasswordPage = lazy(() => import('../pages/auth/ForgotPasswordPage'))
const ResetPasswordPage = lazy(() => import('../pages/auth/ResetPasswordPage'))
const Dashboard = lazy(() => import('../pages/dashboard/Dashboard'))

// Clerk pages
const AddDocumentPage = lazy(() => import('../pages/clerk/AddDocumentPage'))
const DocumentViewPage = lazy(() => import('../pages/clerk/DocumentViewPage'))
const MyUploadsPage = lazy(() => import('../pages/clerk/MyUploadsPage'))

// Archivist pages
const IngestQueuePage = lazy(() => import('../pages/archivist/IngestQueuePage'))
const RetentionQueuePage = lazy(() => import('../pages/archivist/RetentionQueuePage'))
const AdvancedSearchPage = lazy(() => import('../pages/archivist/AdvancedSearchPage'))
const DocumentReviewPage = lazy(() => import('../pages/archivist/DocumentReviewPage'))
const StaffDocumentViewPage = lazy(() => import('../pages/archivist/StaffDocumentViewPage'))

// Admin pages
const SystemHealthPage = lazy(() => import('../pages/admin/SystemHealthPage'))
const UserManagementPage = lazy(() => import('../pages/admin/UserManagementPage'))

// Inspector pages
const AuditLogPage = lazy(() => import('../pages/inspector/AuditLogPage'))
const InventoryReportsPage = lazy(() => import('../pages/inspector/InventoryReportsPage'))

// Public pages
const PublicHomePage = lazy(() => import('../pages/public/PublicHomePage'))
const PublicSearchPage = lazy(() => import('../pages/public/PublicSearchPage'))
const PublicDocumentPage = lazy(() => import('../pages/public/PublicDocumentPage'))
const AboutPage = lazy(() => import('../pages/public/AboutPage'))
const FAQPage = lazy(() => import('../pages/public/FAQPage'))
const ContactPage = lazy(() => import('../pages/public/ContactPage'))

// Simple redirect component for authenticated users
function RoleBasedRedirect() {
  const { userRole } = useAuth()
  
  const roleRedirects = {
    admin: '/dashboard',
    archivist: '/archivist/ingest',
    clerk: '/documents/upload',
    inspector: '/inspector/audit-logs',
    citizen: '/'
  }
  
  const redirectTo = roleRedirects[userRole] || '/dashboard'
  return <Navigate to={redirectTo} replace />
}

function AppRoutes() {
  const { user, isLoading } = useAuth()

  if (isLoading) {
    return <LoadingScreen />
  }

  return (
    <Suspense fallback={<LoadingScreen />}>
      <Routes>
        {/* Public routes */}
        <Route path="/login" element={!user ? <LoginPage /> : <RoleBasedRedirect />} />
        <Route path="/register" element={!user ? <RegisterPage /> : <RoleBasedRedirect />} />
        <Route path="/forgot-password" element={!user ? <ForgotPasswordPage /> : <RoleBasedRedirect />} />
        <Route path="/reset-password" element={!user ? <ResetPasswordPage /> : <RoleBasedRedirect />} />
        
        {/* Public pages */}
        <Route path="/" element={<PublicHomePage />} />
        <Route path="/search" element={<PublicSearchPage />} />
        <Route path="/document/:id" element={<PublicDocumentPage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/faq" element={<FAQPage />} />
        <Route path="/contact" element={<ContactPage />} />
        <Route path="/portal" element={<PortalPage />} />

        {/* Protected routes */}
        <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
          <Route path="/dashboard" element={
            <RoleBasedRoute allowedRoles={['admin']}>
              <Dashboard />
            </RoleBasedRoute>
          } />
          
          {/* Clerk routes */}
          <Route path="/documents/upload" element={
            <RoleBasedRoute allowedRoles={['clerk', 'archivist', 'admin']}>
              <AddDocumentPage />
            </RoleBasedRoute>
          } />
          <Route path="/documents/my-uploads" element={
            <RoleBasedRoute allowedRoles={['clerk', 'archivist', 'admin']}>
              <MyUploadsPage />
            </RoleBasedRoute>
          } />
          <Route path="/documents/:id" element={
            <RoleBasedRoute allowedRoles={['clerk', 'archivist', 'admin']}>
              <DocumentViewPage />
            </RoleBasedRoute>
          } />
          
          {/* Archivist routes */}
          <Route path="/archivist/ingest" element={
            <RoleBasedRoute allowedRoles={['archivist', 'admin']}>
              <IngestQueuePage />
            </RoleBasedRoute>
          } />
          <Route path="/archivist/review/:id" element={
            <RoleBasedRoute allowedRoles={['archivist', 'admin']}>
              <DocumentReviewPage />
            </RoleBasedRoute>
          } />
          <Route path="/archivist/document/:id" element={
            <RoleBasedRoute allowedRoles={['archivist', 'admin']}>
              <StaffDocumentViewPage />
            </RoleBasedRoute>
          } />
          <Route path="/archivist/retention" element={
            <RoleBasedRoute allowedRoles={['archivist', 'admin']}>
              <RetentionQueuePage />
            </RoleBasedRoute>
          } />
          <Route path="/documents/search" element={
            <RoleBasedRoute allowedRoles={['archivist', 'admin', 'inspector']}>
              <AdvancedSearchPage />
            </RoleBasedRoute>
          } />
          
          {/* Inspector routes */}
          <Route path="/inspector/audit-logs" element={
            <RoleBasedRoute allowedRoles={['admin', 'inspector']}>
              <AuditLogPage />
            </RoleBasedRoute>
          } />
          <Route path="/inspector/reports" element={
            <RoleBasedRoute allowedRoles={['admin', 'inspector']}>
              <InventoryReportsPage />
            </RoleBasedRoute>
          } />
          
          {/* Admin routes */}
          <Route path="/admin/users" element={
            <RoleBasedRoute allowedRoles={['admin']}>
              <UserManagementPage />
            </RoleBasedRoute>
          } />
          <Route path="/admin/system" element={
            <RoleBasedRoute allowedRoles={['admin']}>
              <SystemHealthPage />
            </RoleBasedRoute>
          } />
        </Route>
        
        {/* Fallback route */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Suspense>
  )
}

export default AppRoutes 