// backend/src/services/storage.service.ts
import { supabaseAdmin, withMonitoring } from '../config/supabase.config';
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  HeadObjectCommand,
  CopyObjectCommand,
  ListObjectsV2Command,
  DeleteObjectsCommand,
  ListObjectsV2CommandInput,
  ListObjectsV2CommandOutput,
  _Object as S3Object,
  ObjectIdentifier // Import ObjectIdentifier
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { Readable } from 'stream';

// (Rest of the S3 client setup, interfaces, and S3_BUCKETS constant remain the same)
// Load environment variables for S3 config
const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'eu-central-1', // Ensure this is your S3 bucket's region
  credentials: { // Ensure these are correctly set in your environment
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

export interface S3UploadOptions {
  'content-type'?: string;
  'document-id'?: string;
  'uploaded-by'?: string;
  [key: string]: string | undefined;
}

export interface S3UploadResult {
  key: string;
  url: string;
  etag?: string;
  bucket: string;
  versionId?: string;
}

export const S3_BUCKETS = {
  DOCUMENTS: process.env.S3_BUCKET_DOCUMENTS || 'openarchive-documents-default',
  TEMP: process.env.S3_BUCKET_TEMP || 'openarchive-temp-default',
  THUMBNAILS: process.env.S3_BUCKET_THUMBNAILS || 'openarchive-thumbnails-default',
} as const;


export class StorageService {
  // ... (uploadFile, downloadFile, deleteFile, generatePresignedUrl, fileExists, copyFile methods remain the same)
  async uploadFile(
    bucket: string,
    key: string,
    data: Buffer,
    options: S3UploadOptions = {}
  ): Promise<S3UploadResult> {
    return withMonitoring('upload', 'storage_s3', async () => {
      const command = new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        Body: data,
        ContentType: options['content-type'] || 'application/octet-stream',
        Metadata: {
          'document-id': options['document-id'] || '',
          'uploaded-by': options['uploaded-by'] || '',
        },
      });

      try {
        const response = await s3Client.send(command);
        const objectUrl = `https://${bucket}.s3.${process.env.AWS_REGION || 'eu-central-1'}.amazonaws.com/${key}`;

        const result: S3UploadResult = {
          key,
          url: objectUrl,
          etag: response.ETag?.replace(/"/g, ''),
          bucket,
          versionId: response.VersionId,
        };

        await supabaseAdmin.rpc('create_audit_log', {
          p_action: 'FILE_UPLOADED_S3',
          p_entity_type: 'storage',
          p_entity_id: key,
          p_details: { bucket, file_size: data.length, content_type: options['content-type'], document_id: options['document-id'], uploaded_by: options['uploaded-by'], etag: result.etag, versionId: result.versionId } ,
        });

        return result;
      } catch (error) {
        console.error(`S3 Upload Error to ${bucket}/${key}:`, error);
        await supabaseAdmin.rpc('create_audit_log', {
            p_action: 'FILE_UPLOAD_S3_FAILED',
            p_entity_type: 'storage',
            p_entity_id: key,
            p_details: { bucket, error: error instanceof Error ? error.message : String(error) }
        });
        throw error;
      }
    });
  }

  async downloadFile(bucket: string, key: string): Promise<{
    data: Buffer;
    metadata: Record<string, any>;
  }> {
    return withMonitoring('download', 'storage_s3', async () => {
      const command = new GetObjectCommand({
        Bucket: bucket,
        Key: key,
      });

      try {
        const response = await s3Client.send(command);
        if (!response.Body) {
          throw new Error('S3 GetObjectCommand response body is empty.');
        }

        const streamToBuffer = (stream: Readable): Promise<Buffer> =>
          new Promise((resolve, reject) => {
            const chunks: Buffer[] = [];
            stream.on('data', (chunk) => chunks.push(chunk));
            stream.on('error', reject);
            stream.on('end', () => resolve(Buffer.concat(chunks)));
          });

        const data = await streamToBuffer(response.Body as Readable);

        const metadata = {
          'content-type': response.ContentType,
          'content-length': response.ContentLength?.toString(),
          'last-modified': response.LastModified?.toISOString(),
          etag: response.ETag?.replace(/"/g, ''),
          versionId: response.VersionId,
          ...response.Metadata,
        };
        
        await supabaseAdmin.rpc('create_audit_log', {
            p_action: 'FILE_DOWNLOADED_S3',
            p_entity_type: 'storage',
            p_entity_id: key,
            p_details: { bucket, file_size: data.length, versionId: response.VersionId, }
        });
        return { data, metadata };
      } catch (error) {
        console.error(`S3 Download Error from ${bucket}/${key}:`, error);
        await supabaseAdmin.rpc('create_audit_log', {
            p_action: 'FILE_DOWNLOAD_S3_FAILED',
            p_entity_type: 'storage',
            p_entity_id: key,
            p_details: { bucket, error: error instanceof Error ? error.message : String(error) }
        });
        throw error;
      }
    });
  }

  async deleteFile(bucket: string, key: string): Promise<void> {
    return withMonitoring('delete', 'storage_s3', async () => {
      const command = new DeleteObjectCommand({
        Bucket: bucket,
        Key: key,
      });

      try {
        await s3Client.send(command);
        await supabaseAdmin.rpc('create_audit_log', {
            p_action: 'FILE_DELETED_S3',
            p_entity_type: 'storage',
            p_entity_id: key,
            p_details: { bucket }
        });
      } catch (error) {
        console.error(`S3 Delete Error for ${bucket}/${key}:`, error);
        await supabaseAdmin.rpc('create_audit_log', {
            p_action: 'FILE_DELETE_S3_FAILED',
            p_entity_type: 'storage',
            p_entity_id: key,
            p_details: { bucket, error: error instanceof Error ? error.message : String(error) }
        });
        throw error;
      }
    });
  }

  async generatePresignedUrl(
    bucket: string,
    key: string,
    expiresIn: number = 3600
  ): Promise<string> {
    const command = new GetObjectCommand({ Bucket: bucket, Key: key });
    try {
      const url = await getSignedUrl(s3Client, command, { expiresIn });
      await supabaseAdmin.rpc('create_audit_log', {
        p_action: 'PRESIGNED_URL_GENERATED_S3',
        p_entity_type: 'storage',
        p_entity_id: key,
        p_details: { bucket, expires_in: expiresIn, operation: 'GET' }
    });
      return url;
    } catch (error) {
      console.error(`S3 Presigned URL Error for ${bucket}/${key}:`, error);
      await supabaseAdmin.rpc('create_audit_log', {
        p_action: 'PRESIGNED_URL_S3_FAILED',
        p_entity_type: 'storage',
        p_entity_id: key,
        p_details: { bucket, error: error instanceof Error ? error.message : String(error) }
    });
      throw error;
    }
  }

  async fileExists(bucket: string, key: string): Promise<boolean> {
    const command = new HeadObjectCommand({
      Bucket: bucket,
      Key: key,
    });
    try {
      await s3Client.send(command);
      return true;
    } catch (error: any) {
      if (error.name === 'NotFound' || error.$metadata?.httpStatusCode === 404) {
        return false;
      }
      console.error(`S3 File Exists Error for ${bucket}/${key}:`, error);
      throw error;
    }
  }

  async copyFile(
    sourceBucket: string,
    sourceKey: string,
    destBucket: string,
    destKey: string
  ): Promise<void> {
    return withMonitoring('copy', 'storage_s3', async () => {
      const copySource = `${sourceBucket}/${encodeURIComponent(sourceKey)}`;
      const command = new CopyObjectCommand({
        Bucket: destBucket,
        Key: destKey,
        CopySource: copySource,
      });

      try {
        await s3Client.send(command);
        await supabaseAdmin.rpc('create_audit_log', {
            p_action: 'FILE_COPIED_S3',
            p_entity_type: 'storage',
            p_entity_id: destKey,
            p_details: { source_bucket: sourceBucket, source_key: sourceKey, dest_bucket: destBucket, dest_key: destKey }
        });
      } catch (error) {
        console.error(`S3 Copy Error from ${copySource} to ${destBucket}/${destKey}:`, error);
        await supabaseAdmin.rpc('create_audit_log', {
            p_action: 'FILE_COPY_S3_FAILED',
            p_entity_type: 'storage',
            p_entity_id: sourceKey, 
            p_details: { error: error instanceof Error ? error.message : String(error) }
        });
        throw error;
      }
    });
  }

  async getStorageStatistics(): Promise<{
    totalFiles: number;
    totalSize: number;
    byBucket: Record<string, { files: number; size: number }>;
  }> {
    let totalFiles = 0;
    let totalSize = 0;
    const byBucket: Record<string, { files: number; size: number }> = {
        [S3_BUCKETS.DOCUMENTS]: { files: 0, size: 0 },
        [S3_BUCKETS.THUMBNAILS]: { files: 0, size: 0 },
        [S3_BUCKETS.TEMP]: { files: 0, size: 0 },
    };

    try {
        for (const bucketName of Object.values(S3_BUCKETS)) {
            let continuationToken: string | undefined = undefined;
            let currentBucketFiles = 0;
            let currentBucketSize = 0;

            do {
                const commandInput: ListObjectsV2CommandInput = {
                    Bucket: bucketName,
                    ContinuationToken: continuationToken,
                };
                const command = new ListObjectsV2Command(commandInput);
                const response: ListObjectsV2CommandOutput = await s3Client.send(command);
                
                response.Contents?.forEach((obj: S3Object) => {
                    currentBucketFiles++;
                    currentBucketSize += obj.Size || 0;
                });
                continuationToken = response.NextContinuationToken; 

            } while (continuationToken);
            
            byBucket[bucketName] = { files: currentBucketFiles, size: currentBucketSize };
            totalFiles += currentBucketFiles;
            totalSize += currentBucketSize;
        }
        
    } catch (error) {
        console.error("Error getting S3 statistics:", error);
    }

    return { totalFiles, totalSize, byBucket };
  }

  async cleanupTempFiles(olderThanHours: number = 24): Promise<number> {
    let cleanedCount = 0;
    const tempBucket = S3_BUCKETS.TEMP;
    const cutoffDate = new Date(Date.now() - olderThanHours * 60 * 60 * 1000);

    try {
        let continuationToken: string | undefined = undefined;
        // FIX: Type objectsToDelete as ObjectIdentifier[]
        const objectsToDelete: ObjectIdentifier[] = []; 

        do {
            const listCommandInput: ListObjectsV2CommandInput = {
                Bucket: tempBucket,
                ContinuationToken: continuationToken,
            };
            const listCommand = new ListObjectsV2Command(listCommandInput);
            const listResponse: ListObjectsV2CommandOutput = await s3Client.send(listCommand);

            listResponse.Contents?.forEach((obj: S3Object) => {
                // Ensure obj.Key is defined before pushing
                if (obj.Key && obj.LastModified && obj.LastModified < cutoffDate) {
                    objectsToDelete.push({ Key: obj.Key }); // Now Key is guaranteed to be string
                }
            });
            continuationToken = listResponse.NextContinuationToken; 

        } while (continuationToken);

        if (objectsToDelete.length > 0) {
            for (let i = 0; i < objectsToDelete.length; i += 1000) {
                const chunk = objectsToDelete.slice(i, i + 1000);
                if (chunk.length > 0) {
                    const deleteCommand = new DeleteObjectsCommand({
                        Bucket: tempBucket,
                        Delete: { Objects: chunk, Quiet: false }, // This should now be type-compatible
                    });
                    const deleteResponse = await s3Client.send(deleteCommand);
                    cleanedCount += deleteResponse.Deleted?.length || 0;
                    if (deleteResponse.Errors && deleteResponse.Errors.length > 0) {
                        console.error('Errors during bulk delete of temp files:', deleteResponse.Errors);
                    }
                }
            }
        }
        
        await supabaseAdmin.rpc('create_audit_log', {
            p_action: 'TEMP_FILES_CLEANED_S3',
            p_entity_type: 'storage',
            p_entity_id: null,
            p_details: { cleaned_count: cleanedCount, older_than_hours: olderThanHours, bucket: tempBucket, },
        });

    } catch (error) {
        console.error(`Error cleaning up temp files in ${tempBucket}:`, error);
        await supabaseAdmin.rpc('create_audit_log', {
            p_action: 'TEMP_FILES_CLEANUP_S3_FAILED',
            p_entity_type: 'storage',
            p_entity_id: null,
            p_details: { bucket: tempBucket, error: error instanceof Error ? error.message : String(error), },
        });
    }
    return cleanedCount;
  }
}

export const storageService = new StorageService();

export function generateS3Key(
  filename: string,
  documentId: string,
  type: 'original' | 'thumbnail' | 'redacted' | 'temp' | 'transfer'
): string {
  const timestamp = Date.now();
  const safeOriginalName = filename
    .replace(/[^a-zA-Z0-9._-]/g, '_')
    .replace(/\s+/g, '_');
  
  const extension = safeOriginalName.includes('.') ? safeOriginalName.substring(safeOriginalName.lastIndexOf('.') + 1) : 'bin';
  const baseName = safeOriginalName.includes('.') ? safeOriginalName.substring(0, safeOriginalName.lastIndexOf('.')) : safeOriginalName;
  const sanitizedFilename = `${baseName.substring(0, 50)}.${extension}`;

  const year = new Date().getFullYear();
  const month = (new Date().getMonth() + 1).toString().padStart(2, '0');
  const prefix = documentId.length >= 4 ? (documentId.substring(0, 2) + '/' + documentId.substring(2, 4)) : documentId;

  switch (type) {
    case 'original':
      return `documents/${prefix}/${documentId}/original/${timestamp}_${sanitizedFilename}`;
    case 'thumbnail':
      return `documents/${prefix}/${documentId}/thumbnails/${timestamp}_thumb.jpg`;
    case 'redacted':
      return `documents/${prefix}/${documentId}/redacted/${timestamp}_redacted.${extension}`;
    case 'transfer':
        return `transfers/${year}/${month}/${documentId}/${timestamp}_${sanitizedFilename}`;
    case 'temp':
      return `temp/${year}/${month}/${timestamp}_${sanitizedFilename}`;
    default:
      return `documents/${prefix}/${documentId}/other/${timestamp}_${sanitizedFilename}`;
  }
}