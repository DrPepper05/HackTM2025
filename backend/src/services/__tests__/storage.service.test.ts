import { describe, it, expect, beforeEach, jest } from '@jest/globals'
import { StorageService, S3_BUCKETS, generateS3Key } from '../storage.service'

// Mock the supabase config
jest.mock('../../config/supabase.config', () => ({
  supabaseAdmin: {
    rpc: jest.fn()
  },
  withMonitoring: jest.fn((operation: string, table: string, fn: () => any) => fn())
}))

describe('StorageService', () => {
  let storageService: StorageService
  let mockSupabaseAdmin: any

  beforeEach(() => {
    storageService = new StorageService()
    const { supabaseAdmin } = require('../../config/supabase.config')
    mockSupabaseAdmin = supabaseAdmin
    jest.clearAllMocks()
  })

  describe('uploadFile', () => {
    it('should upload file successfully', async () => {
      const testData = Buffer.from('test file content')
      const bucket = S3_BUCKETS.DOCUMENTS
      const key = 'test/file/key'
      
      mockSupabaseAdmin.rpc.mockResolvedValue({ data: null, error: null })

      const result = await storageService.uploadFile(bucket, key, testData, {
        'content-type': 'application/pdf',
        'document-id': 'test-doc-id'
      })

      expect(result).toEqual({
        key,
        url: `https://${bucket}.s3.amazonaws.com/${key}`,
        etag: expect.any(String),
        bucket
      })

      expect(mockSupabaseAdmin.rpc).toHaveBeenCalledWith('create_audit_log', {
        p_action: 'FILE_UPLOADED',
        p_entity_type: 'storage',
        p_entity_id: key,
        p_details: expect.objectContaining({
          bucket,
          file_size: testData.length,
          content_type: 'application/pdf',
          document_id: 'test-doc-id',
          uploaded_by: undefined
        })
      })
    })

    it('should handle upload with no options', async () => {
      const testData = Buffer.from('simple test')
      const result = await storageService.uploadFile(
        S3_BUCKETS.DOCUMENTS,
        'simple/key',
        testData
      )

      expect(result.key).toBe('simple/key')
      expect(result.bucket).toBe(S3_BUCKETS.DOCUMENTS)
    })
  })

  describe('downloadFile', () => {
    it('should download file successfully', async () => {
      mockSupabaseAdmin.rpc.mockResolvedValue({ data: null, error: null })

      const result = await storageService.downloadFile(S3_BUCKETS.DOCUMENTS, 'test/key')

      expect(result).toEqual({
        data: expect.any(Buffer),
        metadata: expect.objectContaining({
          'content-type': 'application/pdf',
          'content-length': expect.any(String),
          'last-modified': expect.any(String)
        })
      })

      expect(mockSupabaseAdmin.rpc).toHaveBeenCalledWith('create_audit_log', {
        p_action: 'FILE_DOWNLOADED',
        p_entity_type: 'storage',
        p_entity_id: 'test/key',
        p_details: expect.objectContaining({
          bucket: S3_BUCKETS.DOCUMENTS,
          file_size: expect.any(Number)
        })
      })
    })
  })

  describe('deleteFile', () => {
    it('should delete file successfully', async () => {
      mockSupabaseAdmin.rpc.mockResolvedValue({ data: null, error: null })

      await storageService.deleteFile(S3_BUCKETS.DOCUMENTS, 'test/key')

      expect(mockSupabaseAdmin.rpc).toHaveBeenCalledWith('create_audit_log', {
        p_action: 'FILE_DELETED',
        p_entity_type: 'storage',
        p_entity_id: 'test/key',
        p_details: {
          bucket: S3_BUCKETS.DOCUMENTS
        }
      })
    })
  })

  describe('generatePresignedUrl', () => {
    it('should generate presigned URL with default expiration', async () => {
      mockSupabaseAdmin.rpc.mockResolvedValue({ data: null, error: null })

      const url = await storageService.generatePresignedUrl(
        S3_BUCKETS.DOCUMENTS,
        'test/key'
      )

      expect(url).toContain('s3.amazonaws.com')
      expect(url).toContain('X-Amz-Expires=3600')
      expect(url).toContain('X-Amz-Signature=mock')

      expect(mockSupabaseAdmin.rpc).toHaveBeenCalledWith('create_audit_log', {
        p_action: 'PRESIGNED_URL_GENERATED',
        p_entity_type: 'storage',
        p_entity_id: 'test/key',
        p_details: {
          bucket: S3_BUCKETS.DOCUMENTS,
          expires_in: 3600
        }
      })
    })

    it('should generate presigned URL with custom expiration', async () => {
      mockSupabaseAdmin.rpc.mockResolvedValue({ data: null, error: null })

      const customExpiry = 7200 // 2 hours
      const url = await storageService.generatePresignedUrl(
        S3_BUCKETS.DOCUMENTS,
        'test/key',
        customExpiry
      )

      expect(url).toContain(`X-Amz-Expires=${customExpiry}`)
    })
  })

  describe('fileExists', () => {
    it('should return true for file existence check', async () => {
      const exists = await storageService.fileExists(S3_BUCKETS.DOCUMENTS, 'test/key')
      expect(exists).toBe(true)
    })
  })

  describe('copyFile', () => {
    it('should copy file successfully', async () => {
      mockSupabaseAdmin.rpc.mockResolvedValue({ data: null, error: null })

      await storageService.copyFile(
        S3_BUCKETS.DOCUMENTS,
        'source/key',
        S3_BUCKETS.THUMBNAILS,
        'dest/key'
      )

      expect(mockSupabaseAdmin.rpc).toHaveBeenCalledWith('create_audit_log', {
        p_action: 'FILE_COPIED',
        p_entity_type: 'storage',
        p_entity_id: 'dest/key',
        p_details: {
          source_bucket: S3_BUCKETS.DOCUMENTS,
          source_key: 'source/key',
          dest_bucket: S3_BUCKETS.THUMBNAILS,
          dest_key: 'dest/key'
        }
      })
    })
  })

  describe('getStorageStatistics', () => {
    it('should return storage statistics', async () => {
      const stats = await storageService.getStorageStatistics()

      expect(stats).toEqual({
        totalFiles: expect.any(Number),
        totalSize: expect.any(Number),
        byBucket: expect.objectContaining({
          [S3_BUCKETS.DOCUMENTS]: expect.objectContaining({
            files: expect.any(Number),
            size: expect.any(Number)
          }),
          [S3_BUCKETS.THUMBNAILS]: expect.objectContaining({
            files: expect.any(Number),
            size: expect.any(Number)
          }),
          [S3_BUCKETS.TEMP]: expect.objectContaining({
            files: expect.any(Number),
            size: expect.any(Number)
          })
        })
      })
    })
  })

  describe('cleanupTempFiles', () => {
    it('should cleanup temp files with default retention', async () => {
      mockSupabaseAdmin.rpc.mockResolvedValue({ data: null, error: null })

      const cleanedCount = await storageService.cleanupTempFiles()

      expect(cleanedCount).toBeGreaterThanOrEqual(0)
      expect(mockSupabaseAdmin.rpc).toHaveBeenCalledWith('create_audit_log', {
        p_action: 'TEMP_FILES_CLEANED',
        p_entity_type: 'storage',
        p_entity_id: null,
        p_details: {
          cleaned_count: expect.any(Number),
          older_than_hours: 24
        }
      })
    })

    it('should cleanup temp files with custom retention', async () => {
      mockSupabaseAdmin.rpc.mockResolvedValue({ data: null, error: null })

      const customHours = 48
      await storageService.cleanupTempFiles(customHours)

      expect(mockSupabaseAdmin.rpc).toHaveBeenCalledWith('create_audit_log', 
        expect.objectContaining({
          p_details: expect.objectContaining({
            older_than_hours: customHours
          })
        })
      )
    })
  })
})

describe('generateS3Key utility', () => {
  it('should generate key for original file', () => {
    const key = generateS3Key('document.pdf', 'doc-123', 'original')
    
    expect(key).toMatch(/^documents\/doc-123\/original\/\d+_document\.pdf$/)
  })

  it('should generate key for thumbnail', () => {
    const key = generateS3Key('image.jpg', 'doc-123', 'thumbnail')
    
    expect(key).toMatch(/^documents\/doc-123\/thumbnails\/\d+_thumb\.jpg$/)
  })

  it('should generate key for redacted file', () => {
    const key = generateS3Key('contract.pdf', 'doc-123', 'redacted')
    
    expect(key).toMatch(/^documents\/doc-123\/redacted\/\d+_redacted\.pdf$/)
  })

  it('should generate key for temp file', () => {
    const key = generateS3Key('upload.pdf', 'doc-123', 'temp')
    
    expect(key).toMatch(/^temp\/\d+_upload\.pdf$/)
  })

  it('should sanitize filename', () => {
    const key = generateS3Key('file with spaces & symbols!.pdf', 'doc-123', 'original')
    
    expect(key).toContain('file_with_spaces___symbols_.pdf')
    expect(key).not.toContain(' ')
    expect(key).not.toContain('&')
    expect(key).not.toContain('!')
  })
})

describe('S3_BUCKETS constants', () => {
  it('should have correct bucket names', () => {
    expect(S3_BUCKETS.DOCUMENTS).toBe('openarchive-documents')
    expect(S3_BUCKETS.TEMP).toBe('openarchive-temp')
    expect(S3_BUCKETS.THUMBNAILS).toBe('openarchive-thumbnails')
  })

  it('should be immutable at compile time', () => {
    // TypeScript will catch attempts to assign to const objects
    // This test documents the behavior rather than testing runtime immutability
    expect(typeof S3_BUCKETS).toBe('object')
    expect(Object.keys(S3_BUCKETS)).toEqual(['DOCUMENTS', 'TEMP', 'THUMBNAILS'])
  })
}) 