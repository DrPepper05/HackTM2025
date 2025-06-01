import { jest, expect } from '@jest/globals'

// Mock environment variables
process.env.NODE_ENV = 'test'
process.env.SUPABASE_URL = 'https://test.supabase.co'
process.env.SUPABASE_KEY = 'test-anon-key'
process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role-key'
process.env.JWT_SECRET = 'test-jwt-secret'

// Mock Supabase
jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => ({
    from: jest.fn(() => ({
      select: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      neq: jest.fn().mockReturnThis(),
      in: jest.fn().mockReturnThis(),
      gte: jest.fn().mockReturnThis(),
      lte: jest.fn().mockReturnThis(),
      like: jest.fn().mockReturnThis(),
      ilike: jest.fn().mockReturnThis(),
      contains: jest.fn().mockReturnThis(),
      overlaps: jest.fn().mockReturnThis(),
      textSearch: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      range: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      single: jest.fn(() => Promise.resolve({ data: null, error: null })),
      maybeSingle: jest.fn(() => Promise.resolve({ data: null, error: null })),
      then: jest.fn(() => Promise.resolve({ data: [], error: null, count: 0 }))
    })),
    rpc: jest.fn(() => Promise.resolve({ data: null, error: null })),
    auth: {
      getUser: jest.fn(() => Promise.resolve({ 
        data: { user: { id: 'test-user-id', email: 'test@example.com' } }, 
        error: null 
      })),
      signUp: jest.fn(() => Promise.resolve({ 
        data: { user: { id: 'test-user-id', email: 'test@example.com' } }, 
        error: null 
      })),
      signInWithPassword: jest.fn(() => Promise.resolve({ 
        data: { user: { id: 'test-user-id', email: 'test@example.com' }, session: { access_token: 'test-token' } }, 
        error: null 
      })),
      signOut: jest.fn(() => Promise.resolve({ error: null }))
    },
    storage: {
      from: jest.fn(() => ({
        upload: jest.fn(() => Promise.resolve({ data: { path: 'test-path' }, error: null })),
        download: jest.fn(() => Promise.resolve({ data: Buffer.from('test'), error: null })),
        remove: jest.fn(() => Promise.resolve({ data: null, error: null })),
        createSignedUrl: jest.fn(() => Promise.resolve({ data: { signedUrl: 'test-url' }, error: null }))
      }))
    }
  }))
}))

// Mock crypto for tests
jest.mock('crypto', () => ({
  createHash: jest.fn(() => ({
    update: jest.fn().mockReturnThis(),
    digest: jest.fn(() => 'test-hash-value')
  })),
  randomBytes: jest.fn(() => Buffer.from('test-random-bytes'))
}))

// Mock UUID
jest.mock('uuid', () => ({
  v4: jest.fn(() => 'test-uuid-value')
}))

// Mock multer
jest.mock('multer', () => {
  const mockMulter: any = jest.fn(() => ({
    single: jest.fn(() => (req: any, res: any, next: any) => {
      req.file = {
        buffer: Buffer.from('test file content'),
        originalname: 'test.pdf',
        mimetype: 'application/pdf',
        size: 1024
      }
      next()
    })
  }))
  
  mockMulter.memoryStorage = jest.fn()
  
  return mockMulter
})

// Global test timeout
jest.setTimeout(30000)

// Silence console logs during tests unless debugging
if (!process.env.DEBUG_TESTS) {
  global.console = {
    ...console,
    log: jest.fn(),
    warn: jest.fn(),
    error: jest.fn()
  }
}

// Global test utilities
declare global {
  namespace jest {
    interface Matchers<R> {
      toBeValidUUID(): R
      toBeValidEmail(): R
      toBeValidDate(): R
    }
  }
}

// Custom matchers
expect.extend({
  toBeValidUUID(received: string) {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    const pass = typeof received === 'string' && uuidRegex.test(received)
    
    return {
      message: () => `expected ${received} to be a valid UUID`,
      pass
    }
  },
  
  toBeValidEmail(received: string) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    const pass = typeof received === 'string' && emailRegex.test(received)
    
    return {
      message: () => `expected ${received} to be a valid email`,
      pass
    }
  },
  
  toBeValidDate(received: string) {
    const date = new Date(received)
    const pass = !isNaN(date.getTime())
    
    return {
      message: () => `expected ${received} to be a valid date`,
      pass
    }
  }
})

// Helper functions for tests
export const createMockRequest = (overrides: any = {}) => ({
  body: {},
  params: {},
  query: {},
  headers: {},
  user: { id: 'test-user-id', email: 'test@example.com', role: 'clerk' },
  userId: 'test-user-id',
  file: undefined,
  ...overrides
})

export const createMockResponse = () => {
  const res: any = {}
  res.status = jest.fn().mockReturnValue(res)
  res.json = jest.fn().mockReturnValue(res)
  res.send = jest.fn().mockReturnValue(res)
  res.set = jest.fn().mockReturnValue(res)
  return res
}

export const createMockNext = () => jest.fn()

// Test data factories
export const createTestDocument = (overrides: any = {}) => ({
  id: 'test-doc-id',
  title: 'Test Document',
  description: 'Test document description',
  document_type: 'CONTRACT',
  status: 'ACTIVE_STORAGE',
  is_public: false,
  uploader_user_id: 'test-user-id',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  ...overrides
})

export const createTestUser = (overrides: any = {}) => ({
  id: 'test-user-id',
  email: 'test@example.com',
  role: 'clerk',
  first_name: 'Test',
  last_name: 'User',
  department: 'Archives',
  is_active: true,
  created_at: new Date().toISOString(),
  ...overrides
})

export const createTestFile = (overrides: any = {}) => ({
  buffer: Buffer.from('test file content'),
  originalname: 'test.pdf',
  mimetype: 'application/pdf',
  size: 1024,
  ...overrides
}) 