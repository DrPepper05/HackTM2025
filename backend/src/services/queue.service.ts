import { supabaseAdmin, withMonitoring } from '../config/supabase.config'
import { ProcessingQueueTask } from '../types/database.types'

export interface QueueTask {
  type: 'DOCUMENT_ENRICHMENT' | 'OCR_PROCESSING' | 'LIFECYCLE_CHECK' | 'REDACTION' | 'TRANSFER_PREP'
  payload: Record<string, any>
  priority: number
  scheduledFor?: Date
  maxAttempts?: number
}

export interface TaskResult {
  success: boolean
  result?: any
  error?: string
  retryAfter?: Date
}

export class QueueService {
  /**
   * Add a task to the processing queue
   */
  async enqueueTask(task: QueueTask): Promise<string> {
    return withMonitoring('enqueue', 'processing_queue', async () => {
      const { data, error } = await supabaseAdmin.rpc('queue_task', {
        p_task_type: task.type,
        p_payload: task.payload,
        p_priority: task.priority,
        p_scheduled_for: task.scheduledFor?.toISOString() || new Date().toISOString()
      })

      if (error) throw error
      return data
    })
  }

  /**
   * Get pending tasks for processing
   */
  async getPendingTasks(
    types?: string[],
    limit: number = 10
  ): Promise<ProcessingQueueTask[]> {
    let query = supabaseAdmin
      .from('processing_queue')
      .select('*')
      .eq('status', 'pending')
      .lte('scheduled_for', new Date().toISOString())
      .order('priority', { ascending: false })
      .order('scheduled_for', { ascending: true })
      .limit(limit)

    if (types?.length) {
      query = query.in('task_type', types)
    }

    const { data, error } = await query

    if (error) throw error
    return data || []
  }

  /**
   * Mark task as processing
   */
  async markTaskProcessing(taskId: string): Promise<void> {
    // Get current attempts count first
    const { data: currentTask } = await supabaseAdmin
      .from('processing_queue')
      .select('attempts')
      .eq('id', taskId)
      .single()

    const { error } = await supabaseAdmin
      .from('processing_queue')
      .update({
        status: 'processing',
        started_at: new Date().toISOString(),
        attempts: (currentTask?.attempts || 0) + 1
      })
      .eq('id', taskId)

    if (error) throw error
  }

  /**
   * Complete a task
   */
  async completeTask(
    taskId: string,
    result: TaskResult
  ): Promise<void> {
    // Get current error count
    const { data: currentTask } = await supabaseAdmin
      .from('processing_queue')
      .select('error_count')
      .eq('id', taskId)
      .single()

    const updateData: any = {
      completed_at: new Date().toISOString()
    }

    if (result.success) {
      updateData.status = 'completed'
    } else {
      updateData.status = 'failed'
      updateData.last_error = result.error
      updateData.error_count = (currentTask?.error_count || 0) + 1
    }

    const { error } = await supabaseAdmin
      .from('processing_queue')
      .update(updateData)
      .eq('id', taskId)

    if (error) throw error

    // Log completion
    await supabaseAdmin.rpc('create_audit_log', {
      p_action: 'TASK_COMPLETED',
      p_entity_type: 'processing_queue',
      p_entity_id: taskId,
      p_details: {
        success: result.success,
        error: result.error
      }
    })
  }

  /**
   * Retry failed task
   */
  async retryTask(taskId: string, delay?: number): Promise<void> {
    const scheduledFor = delay 
      ? new Date(Date.now() + delay * 1000).toISOString()
      : new Date().toISOString()

    const { error } = await supabaseAdmin
      .from('processing_queue')
      .update({
        status: 'pending',
        scheduled_for: scheduledFor,
        last_error: null
      })
      .eq('id', taskId)

    if (error) throw error
  }

  /**
   * Get task statistics
   */
  async getTaskStatistics(): Promise<{
    pending: number
    processing: number
    completed: number
    failed: number
    by_type: Record<string, number>
  }> {
    const { data: stats, error } = await supabaseAdmin
      .from('processing_queue')
      .select('status, task_type')

    if (error) throw error

    const result = {
      pending: 0,
      processing: 0,
      completed: 0,
      failed: 0,
      by_type: {} as Record<string, number>
    }

    stats?.forEach(task => {
      result[task.status as keyof typeof result]++
      result.by_type[task.task_type] = (result.by_type[task.task_type] || 0) + 1
    })

    return result
  }

  /**
   * Clean up old completed tasks
   */
  async cleanupOldTasks(olderThanDays: number = 30): Promise<number> {
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - olderThanDays)

    const { count } = await supabaseAdmin
      .from('processing_queue')
      .select('*', { count: 'exact', head: true })
      .in('status', ['completed', 'failed'])
      .lt('completed_at', cutoffDate.toISOString())

    const { error } = await supabaseAdmin
      .from('processing_queue')
      .delete()
      .in('status', ['completed', 'failed'])
      .lt('completed_at', cutoffDate.toISOString())

    if (error) throw error

    const deletedCount = count || 0

    await supabaseAdmin.rpc('create_audit_log', {
      p_action: 'QUEUE_CLEANUP',
      p_entity_type: 'processing_queue',
      p_entity_id: null,
      p_details: {
        deleted_count: deletedCount,
        cutoff_date: cutoffDate.toISOString()
      }
    })

    return deletedCount
  }
}

export const queueService = new QueueService() 