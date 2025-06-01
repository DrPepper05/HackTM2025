import { describe, it, expect, beforeEach, jest } from '@jest/globals'
import { QueueService } from '../queue.service'

// Create the mock query object that properly chains
const mockQuery: any = {
  select: jest.fn(),
  eq: jest.fn(),
  lte: jest.fn(),
  order: jest.fn(),
  limit: jest.fn(),
  in: jest.fn(),
  single: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
  lt: jest.fn()
}

// Make all methods return the query object for chaining
Object.keys(mockQuery).forEach(key => {
  mockQuery[key].mockReturnValue(mockQuery)
})

// Mock the supabase config
jest.mock('../../config/supabase.config', () => ({
  supabaseAdmin: {
    rpc: jest.fn(),
    from: jest.fn(() => mockQuery)
  },
  withMonitoring: jest.fn((operation: string, table: string, fn: () => any) => fn())
}))

describe('QueueService', () => {
  let queueService: QueueService
  let mockSupabaseAdmin: any

  beforeEach(() => {
    queueService = new QueueService()
    const { supabaseAdmin } = require('../../config/supabase.config')
    mockSupabaseAdmin = supabaseAdmin
    jest.clearAllMocks()
    
    // Reset all mock query methods to return the query object for chaining
    Object.keys(mockQuery).forEach(key => {
      mockQuery[key].mockReturnValue(mockQuery)
    })
  })

  describe('enqueueTask', () => {
    it('should enqueue a task successfully', async () => {
      const taskData = {
        type: 'DOCUMENT_ENRICHMENT' as const,
        payload: { documentId: 'doc-123' },
        priority: 5
      }

      mockSupabaseAdmin.rpc.mockResolvedValue({ data: 'task-id-123', error: null })

      const taskId = await queueService.enqueueTask(taskData)

      expect(taskId).toBe('task-id-123')
      expect(mockSupabaseAdmin.rpc).toHaveBeenCalledWith('queue_task', {
        p_task_type: taskData.type,
        p_payload: taskData.payload,
        p_priority: taskData.priority,
        p_scheduled_for: expect.any(String)
      })
    })

    it('should enqueue a task with scheduled time', async () => {
      const scheduledFor = new Date('2024-12-31T10:00:00Z')
      const taskData = {
        type: 'OCR_PROCESSING' as const,
        payload: { fileId: 'file-456' },
        priority: 3,
        scheduledFor
      }

      mockSupabaseAdmin.rpc.mockResolvedValue({ data: 'task-id-456', error: null })

      await queueService.enqueueTask(taskData)

      expect(mockSupabaseAdmin.rpc).toHaveBeenCalledWith('queue_task', 
        expect.objectContaining({
          p_scheduled_for: scheduledFor.toISOString()
        })
      )
    })

    it('should throw error when enqueue fails', async () => {
      const taskData = {
        type: 'LIFECYCLE_CHECK' as const,
        payload: {},
        priority: 1
      }

      mockSupabaseAdmin.rpc.mockResolvedValue({ data: null, error: new Error('Database error') })

      await expect(queueService.enqueueTask(taskData)).rejects.toThrow('Database error')
    })
  })

  describe('getPendingTasks', () => {
    it('should get pending tasks without type filter', async () => {
      const mockTasks = [
        { id: '1', task_type: 'DOCUMENT_ENRICHMENT', status: 'pending' },
        { id: '2', task_type: 'OCR_PROCESSING', status: 'pending' }
      ]

      // The final call in the chain should return the data
      mockQuery.limit.mockResolvedValue({ data: mockTasks, error: null })

      const tasks = await queueService.getPendingTasks()

      expect(tasks).toEqual(mockTasks)
      expect(mockSupabaseAdmin.from).toHaveBeenCalledWith('processing_queue')
    })

    it('should handle empty result', async () => {
      mockQuery.limit.mockResolvedValue({ data: null, error: null })

      const tasks = await queueService.getPendingTasks()

      expect(tasks).toEqual([])
    })
  })

  describe('markTaskProcessing', () => {
    it('should mark task as processing', async () => {
      const taskId = 'task-123'

      // Mock the select query for current attempts
      mockQuery.single.mockResolvedValueOnce({ data: { attempts: 1 }, error: null })
      mockQuery.eq.mockResolvedValueOnce({ data: null, error: null })

      await queueService.markTaskProcessing(taskId)

      expect(mockSupabaseAdmin.from).toHaveBeenCalledWith('processing_queue')
    })
  })

  describe('completeTask', () => {
    it('should complete task successfully', async () => {
      const taskId = 'task-789'
      const result = { success: true, result: { processed: true } }

      mockQuery.single.mockResolvedValueOnce({ data: { error_count: 0 }, error: null })
      mockQuery.eq.mockResolvedValueOnce({ data: null, error: null })
      mockSupabaseAdmin.rpc.mockResolvedValue({ data: null, error: null })

      await queueService.completeTask(taskId, result)

      expect(mockSupabaseAdmin.rpc).toHaveBeenCalledWith('create_audit_log', {
        p_action: 'TASK_COMPLETED',
        p_entity_type: 'processing_queue',
        p_entity_id: taskId,
        p_details: {
          success: true,
          error: undefined
        }
      })
    })

    it('should complete task with failure', async () => {
      const taskId = 'task-failed'
      const result = { success: false, error: 'Processing failed' }

      mockQuery.single.mockResolvedValueOnce({ data: { error_count: 2 }, error: null })
      mockQuery.eq.mockResolvedValueOnce({ data: null, error: null })
      mockSupabaseAdmin.rpc.mockResolvedValue({ data: null, error: null })

      await queueService.completeTask(taskId, result)

      expect(mockSupabaseAdmin.rpc).toHaveBeenCalledWith('create_audit_log', {
        p_action: 'TASK_COMPLETED',
        p_entity_type: 'processing_queue',
        p_entity_id: taskId,
        p_details: {
          success: false,
          error: 'Processing failed'
        }
      })
    })
  })

  describe('retryTask', () => {
    it('should retry task immediately', async () => {
      const taskId = 'task-retry'

      mockQuery.eq.mockResolvedValue({ data: null, error: null })

      await queueService.retryTask(taskId)

      expect(mockQuery.update).toHaveBeenCalledWith({
        status: 'pending',
        scheduled_for: expect.any(String),
        last_error: null
      })
    })

    it('should retry task with delay', async () => {
      const taskId = 'task-retry-delayed'
      const delay = 300 // 5 minutes

      mockQuery.update.mockReturnValue({ data: null, error: null })

      await queueService.retryTask(taskId, delay)

      expect(mockQuery.update).toHaveBeenCalledWith({
        status: 'pending',
        scheduled_for: expect.any(String),
        last_error: null
      })
    })
  })

  describe('getTaskStatistics', () => {
    it('should return task statistics', async () => {
      const mockStats = [
        { status: 'pending', task_type: 'DOCUMENT_ENRICHMENT' },
        { status: 'pending', task_type: 'OCR_PROCESSING' },
        { status: 'processing', task_type: 'DOCUMENT_ENRICHMENT' },
        { status: 'completed', task_type: 'LIFECYCLE_CHECK' },
        { status: 'failed', task_type: 'REDACTION' }
      ]

      mockQuery.select.mockResolvedValue({ data: mockStats, error: null })

      const stats = await queueService.getTaskStatistics()

      expect(stats).toEqual({
        pending: 2,
        processing: 1,
        completed: 1,
        failed: 1,
        by_type: {
          'DOCUMENT_ENRICHMENT': 2,
          'OCR_PROCESSING': 1,
          'LIFECYCLE_CHECK': 1,
          'REDACTION': 1
        }
      })
    })

    it('should handle empty statistics', async () => {
      mockQuery.select.mockReturnValue({ data: [], error: null })

      const stats = await queueService.getTaskStatistics()

      expect(stats).toEqual({
        pending: 0,
        processing: 0,
        completed: 0,
        failed: 0,
        by_type: {}
      })
    })
  })

  describe('cleanupOldTasks', () => {
    it('should cleanup old tasks with default retention', async () => {
      mockQuery.lt.mockResolvedValueOnce({ count: 5 })
      mockQuery.lt.mockResolvedValueOnce({ data: null, error: null })
      mockSupabaseAdmin.rpc.mockResolvedValue({ data: null, error: null })

      const deletedCount = await queueService.cleanupOldTasks()

      expect(deletedCount).toBe(5)
      expect(mockSupabaseAdmin.rpc).toHaveBeenCalledWith('create_audit_log', {
        p_action: 'QUEUE_CLEANUP',
        p_entity_type: 'processing_queue',
        p_entity_id: null,
        p_details: {
          deleted_count: 5,
          cutoff_date: expect.any(String)
        }
      })
    })
  })
}) 