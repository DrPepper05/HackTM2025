import { createClient } from '@supabase/supabase-js'

// Initialize the Supabase client
const supabaseUrl = import.meta.env.SUPABASE_URL
const supabaseAnonKey = import.meta.env.SUPABASE_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error(
    'Missing Supabase credentials. Please set SUPABASE_URL and SUPABASE_KEY in your .env file.'
  )
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
})

// Authentication helpers
export const auth = {
  // Sign up a new user
  signUp: async ({ email, password }) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    })
    return { data, error }
  },

  // Sign in an existing user
  signIn: async ({ email, password }) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    return { data, error }
  },

  // Sign out the current user
  signOut: async () => {
    const { error } = await supabase.auth.signOut()
    return { error }
  },

  // Get the current user session
  getSession: async () => {
    const { data, error } = await supabase.auth.getSession()
    return { data, error }
  },

  // Get the current user
  getUser: async () => {
    const { data, error } = await supabase.auth.getUser()
    return { data, error }
  },

  // Reset password
  resetPassword: async (email) => {
    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    })
    return { data, error }
  },

  // Update password
  updatePassword: async (password) => {
    const { data, error } = await supabase.auth.updateUser({
      password,
    })
    return { data, error }
  },
}

// Document related helpers
export const documents = {
  // Upload a document
  upload: async (file, metadata, userId) => {
    // First upload the file to storage
    const fileExt = file.name.split('.').pop()
    const fileName = `${Math.random().toString(36).substring(2, 15)}.${fileExt}`
    const filePath = `${userId}/${new Date().getFullYear()}/${new Date().getMonth() + 1}/${fileName}`

    const { data: fileData, error: fileError } = await supabase.storage
      .from('documents')
      .upload(filePath, file)

    if (fileError) {
      return { error: fileError }
    }

    // Then create a record in the documents table
    const { data, error } = await supabase.from('documents').insert([
      {
        title: metadata.title,
        document_type: metadata.documentType,
        creator: metadata.creator,
        creation_date: metadata.creationDate,
        description: metadata.description,
        keywords: metadata.keywords,
        retention_category: metadata.retentionCategory,
        is_public: metadata.isPublic,
        status: 'registered',
        file_path: filePath,
        uploader_id: userId,
      },
    ])

    return { data, error }
  },

  // Get documents uploaded by a specific user
  getByUser: async (userId) => {
    const { data, error } = await supabase
      .from('documents')
      .select('*')
      .eq('uploader_id', userId)
      .order('created_at', { ascending: false })

    return { data, error }
  },

  // Get a single document by ID
  getById: async (id) => {
    const { data, error } = await supabase
      .from('documents')
      .select('*, document_metadata(*)')
      .eq('id', id)
      .single()

    return { data, error }
  },

  // Get documents by status
  getByStatus: async (status) => {
    const { data, error } = await supabase
      .from('documents')
      .select('*')
      .eq('status', status)
      .order('created_at', { ascending: false })

    return { data, error }
  },

  // Search documents
  search: async (query, filters = {}) => {
    let queryBuilder = supabase.from('documents').select('*')

    // Apply text search if query is provided
    if (query) {
      queryBuilder = queryBuilder.textSearch('title', query, {
        type: 'websearch',
        config: 'english',
      })
    }

    // Apply filters
    if (filters.documentType) {
      queryBuilder = queryBuilder.eq('document_type', filters.documentType)
    }

    if (filters.creator) {
      queryBuilder = queryBuilder.eq('creator', filters.creator)
    }

    if (filters.retentionCategory) {
      queryBuilder = queryBuilder.eq('retention_category', filters.retentionCategory)
    }

    if (filters.status) {
      queryBuilder = queryBuilder.eq('status', filters.status)
    }

    if (filters.startDate && filters.endDate) {
      queryBuilder = queryBuilder.gte('creation_date', filters.startDate).lte('creation_date', filters.endDate)
    }

    // Only include public documents for public search
    if (filters.publicOnly) {
      queryBuilder = queryBuilder.eq('is_public', true).eq('status', 'released')
    }

    const { data, error } = await queryBuilder.order('created_at', { ascending: false })

    return { data, error }
  },

  // Update document status
  updateStatus: async (id, status, reason = null) => {
    const { data, error } = await supabase
      .from('documents')
      .update({ status, rejection_reason: reason })
      .eq('id', id)

    return { data, error }
  },

  // Update document metadata
  updateMetadata: async (id, metadata) => {
    const { data, error } = await supabase
      .from('documents')
      .update({
        title: metadata.title,
        document_type: metadata.documentType,
        creator: metadata.creator,
        creation_date: metadata.creationDate,
        description: metadata.description,
        keywords: metadata.keywords,
        retention_category: metadata.retentionCategory,
        is_public: metadata.isPublic,
      })
      .eq('id', id)

    return { data, error }
  },

  // Get document file URL
  getFileUrl: async (filePath) => {
    const { data, error } = await supabase.storage.from('documents').createSignedUrl(filePath, 3600)

    return { data, error }
  },
}

// Audit logs helpers
export const auditLogs = {
  // Get audit logs
  getLogs: async (filters = {}) => {
    let queryBuilder = supabase.from('audit_logs').select('*')

    if (filters.userId) {
      queryBuilder = queryBuilder.eq('user_id', filters.userId)
    }

    if (filters.action) {
      queryBuilder = queryBuilder.eq('action', filters.action)
    }

    if (filters.entityId) {
      queryBuilder = queryBuilder.eq('entity_id', filters.entityId)
    }

    if (filters.startDate && filters.endDate) {
      queryBuilder = queryBuilder.gte('timestamp', filters.startDate).lte('timestamp', filters.endDate)
    }

    const { data, error } = await queryBuilder.order('timestamp', { ascending: false })

    return { data, error }
  },

  // Create an audit log entry
  createLog: async (userId, userName, action, entityId, entityType, details) => {
    const { data, error } = await supabase.from('audit_logs').insert([
      {
        user_id: userId,
        user_name: userName,
        action,
        entity_id: entityId,
        entity_type: entityType,
        details,
      },
    ])

    return { data, error }
  },
}

// User management helpers
export const users = {
  // Get all users
  getAll: async () => {
    const { data, error } = await supabase.from('users').select('*')

    return { data, error }
  },

  // Get user by ID
  getById: async (id) => {
    const { data, error } = await supabase.from('users').select('*').eq('id', id).single()

    return { data, error }
  },

  // Update user
  update: async (id, userData) => {
    const { data, error } = await supabase.from('users').update(userData).eq('id', id)

    return { data, error }
  },

  // Delete user
  delete: async (id) => {
    const { data, error } = await supabase.from('users').delete().eq('id', id)

    return { data, error }
  },
}

// Access request helpers
export const accessRequests = {
  // Create an access request
  create: async (requestData) => {
    const { data, error } = await supabase.from('access_requests').insert([requestData])

    return { data, error }
  },

  // Get access requests
  getAll: async () => {
    const { data, error } = await supabase.from('access_requests').select('*')

    return { data, error }
  },

  // Update access request status
  updateStatus: async (id, status, responseDetails = null) => {
    const { data, error } = await supabase
      .from('access_requests')
      .update({ status, response_details: responseDetails })
      .eq('id', id)

    return { data, error }
  },
}