const API_BASE_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001'

// Base API class
class ApiService {
  constructor() {
    this.baseURL = API_BASE_URL
  }

  // Helper method to get auth token from localStorage
  getAuthToken() {
    try {
      const session = JSON.parse(localStorage.getItem('auth_session'))
      return session?.access_token || null
    } catch {
      return null
    }
  }

  // Helper method to make requests
  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`
    const token = this.getAuthToken()

    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    }

    // Add auth header if token exists
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }

    try {
      const response = await fetch(url, config)
      const data = await response.json()

      if (!response.ok) {
        throw new ApiError(data.message || `HTTP ${response.status}`, response.status, data)
      }

      return data
    } catch (error) {
      if (error instanceof ApiError) {
        throw error
      }
      throw new ApiError(error.message || 'Network error', 0, null)
    }
  }

  // GET request
  async get(endpoint, params = {}) {
    const queryString = new URLSearchParams(params).toString()
    const url = queryString ? `${endpoint}?${queryString}` : endpoint
    return this.request(url, { method: 'GET' })
  }

  // POST request
  async post(endpoint, data = {}) {
    return this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  // PUT request
  async put(endpoint, data = {}) {
    return this.request(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  }

  // PATCH request
  async patch(endpoint, data = {}) {
    return this.request(endpoint, {
      method: 'PATCH',
      body: JSON.stringify(data),
    })
  }

  // DELETE request
  async delete(endpoint) {
    return this.request(endpoint, { method: 'DELETE' })
  }

  // File upload method
  async upload(endpoint, formData) {
    const token = this.getAuthToken()
    const config = {
      method: 'POST',
      body: formData,
      headers: {},
    }

    // Add auth header if token exists (don't set Content-Type for FormData)
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }

    try {
      const response = await fetch(`${this.baseURL}${endpoint}`, config)
      const data = await response.json()

      if (!response.ok) {
        throw new ApiError(data.message || `HTTP ${response.status}`, response.status, data)
      }

      return data
    } catch (error) {
      if (error instanceof ApiError) {
        throw error
      }
      throw new ApiError(error.message || 'Upload failed', 0, null)
    }
  }
}

// Custom error class for API errors
export class ApiError extends Error {
  constructor(message, status, data) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.data = data
  }
}

// Create singleton instance
const apiService = new ApiService()

// Export specific service methods for different domains
export const authApi = {
  register: (data) => apiService.post('/api/v1/auth/register', data),
  login: (data) => apiService.post('/api/v1/auth/login', data),
  logout: () => apiService.post('/api/v1/auth/logout'),
  refreshToken: (refreshToken) => apiService.post('/api/v1/auth/refresh', { refreshToken }),
  getProfile: () => apiService.get('/api/v1/auth/profile'),
  updateProfile: (data) => apiService.put('/api/v1/auth/profile', data),
  resetPassword: (email) => apiService.post('/api/v1/auth/password/reset', { email }),
}

export const documentsApi = {
  getDocuments: (params) => apiService.get('/api/v1/documents', params),
  getUserUploads: () => apiService.get('/api/v1/documents'),
  getAllDocuments: (params) => apiService.get('/api/v1/documents/all', params),
  getDocument: (id) => apiService.get(`/api/v1/documents/${id}`),
  createDocument: (data) => apiService.post('/api/v1/documents', data),
  updateDocument: (id, data) => apiService.put(`/api/v1/documents/${id}`, data),
  deleteDocument: (id) => apiService.delete(`/api/v1/documents/${id}`),
  uploadDocument: (formData) => apiService.upload('/api/v1/documents', formData),
  downloadDocument: (id) => apiService.get(`/api/v1/documents/${id}/download`),
  getDocumentVersions: (id) => apiService.get(`/api/v1/documents/${id}/versions`),
  restoreVersion: (id, versionId) => apiService.post(`/api/v1/documents/${id}/versions/${versionId}/restore`),
  
  // Access request methods for archivist/admin (using management endpoints)
  getAccessRequests: (params) => apiService.get('/api/v1/access-requests-manage', params),
  updateAccessRequest: (requestId, data) => apiService.put(`/api/v1/access-requests-manage/${requestId}`, data),
  getAccessRequestById: (requestId) => apiService.get(`/api/v1/access-requests/${requestId}`),
  createAccessRequest: (data) => apiService.post('/api/v1/access-requests', data),
}

export const collectionsApi = {
  getCollections: (params) => apiService.get('/api/v1/collections', params),
  getCollection: (id) => apiService.get(`/api/v1/collections/${id}`),
  createCollection: (data) => apiService.post('/api/v1/collections', data),
  updateCollection: (id, data) => apiService.put(`/api/v1/collections/${id}`, data),
  deleteCollection: (id) => apiService.delete(`/api/v1/collections/${id}`),
  addDocumentToCollection: (collectionId, documentId) => 
    apiService.post(`/api/v1/collections/${collectionId}/documents`, { documentId }),
  removeDocumentFromCollection: (collectionId, documentId) => 
    apiService.delete(`/api/v1/collections/${collectionId}/documents/${documentId}`),
}

export const searchApi = {
  search: (params) => apiService.post('/api/v1/search/documents', { 
    query: params.query || '',
    filters: {},
    sort: { field: 'created_at', order: 'desc' },
    pagination: { limit: params.limit || 20, offset: params.offset || 0 }
  }),
  publicSearch: (params) => apiService.get('/api/v1/search/public', params),
  advancedSearch: (data) => apiService.post('/api/v1/search/advanced', data),
  getSuggestions: (query) => apiService.get('/api/v1/search/suggestions', { query }),
}

// Semantic Search API service
export const semanticSearchApi = {
  // Call the semantic search API from the APIs folder
  search: async (query) => {
    const SEMANTIC_API_URL = import.meta.env.VITE_SEMANTIC_API_URL || 'http://127.0.0.1:8000'
    
    try {
      const response = await fetch(`${SEMANTIC_API_URL}/sort-db`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query })
      })
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }
      
      const data = await response.json()
      
      if (data.error) {
        throw new Error(data.error)
      }
      
      return data
    } catch (error) {
      console.error('Semantic search error:', error)
      throw new ApiError(error.message || 'Semantic search failed', 0, null)
    }
  }
}

export const usersApi = {
  getUsers: (params) => apiService.get('/api/v1/admin/users', params),
  getUser: (id) => apiService.get(`/api/v1/admin/users/${id}`),
  createUser: (data) => apiService.post('/api/v1/admin/users', data),
  updateUser: (id, data) => apiService.put(`/api/v1/admin/users/${id}`, data),
  deleteUser: (id) => apiService.delete(`/api/v1/admin/users/${id}`),
  getUserStatistics: () => apiService.get('/api/v1/admin/users/statistics'),
  getInstitutions: () => apiService.get('/api/v1/admin/users/institutions'),
}

export const auditApi = {
  getAuditLogs: (params) => apiService.get('/api/v1/inspector/audit-logs', params),
  exportAuditLogs: (params) => apiService.get('/api/v1/inspector/audit-logs/export', params),
  getAuditStatistics: (params) => apiService.get('/api/v1/inspector/audit-logs/statistics', params),
  verifyIntegrity: () => apiService.get('/api/v1/inspector/audit-logs/integrity-check'),
  getComplianceReport: (params) => apiService.get('/api/v1/inspector/audit-logs/compliance-report', params),
  getUserAuditTrail: (userId, params) => apiService.get(`/api/v1/inspector/audit-logs/user/${userId}`, params),
  getEntityAuditTrail: (entityType, entityId) => apiService.get(`/api/v1/inspector/audit-logs/entity/${entityType}/${entityId}`),
  searchAuditLogs: (params) => apiService.get('/api/v1/inspector/audit-logs/search', params),
  getCriticalEvents: (params) => apiService.get('/api/v1/inspector/audit-logs/critical-events', params),
}

export const systemApi = {
  getHealth: () => apiService.get('/api/v1/health'),
  getMetrics: () => apiService.get('/api/v1/metrics'),
  getSettings: () => apiService.get('/api/v1/settings'),
  updateSettings: (data) => apiService.put('/api/v1/settings', data),
}

export const adminApi = {
  getDashboard: () => apiService.get('/api/v1/admin/dashboard'),
  getQueueStatus: (params) => apiService.get('/api/v1/admin/queue', params),
  retryTask: (taskId, data) => apiService.post(`/api/v1/admin/queue/tasks/${taskId}/retry`, data),
  cleanupTasks: (data) => apiService.post('/api/v1/admin/queue/cleanup', data),
  checkLifecycles: () => apiService.get('/api/v1/admin/lifecycle'),
  getStorageStats: () => apiService.get('/api/v1/admin/storage'),
  getAccessRequestStats: () => apiService.get('/api/v1/access-requests-manage/stats'),
}

// Export the main API service instance
export default apiService