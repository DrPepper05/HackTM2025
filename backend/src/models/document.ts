/**
 * Document model and types
 */

/**
 * Document status enum
 */
export enum DocumentStatus {
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED'
}

/**
 * Document interface representing a document in the database
 */
export interface Document {
  id: string;
  title: string;
  file_name: string;
  file_type: string;
  file_size: number;
  storage_path: string;
  extracted_text?: string;
  status: DocumentStatus;
  created_at: Date;
  updated_at: Date;
  created_by?: string;
}

/**
 * Document creation data interface
 */
export interface CreateDocumentData {
  title: string;
  file_name: string;
  file_type: string;
  file_size: number;
  storage_path: string;
  created_by?: string;
}

/**
 * Document update data interface
 */
export interface UpdateDocumentData {
  title?: string;
  extracted_text?: string;
  status?: DocumentStatus;
}

/**
 * Document repository interface for database operations
 */
export interface DocumentRepository {
  create(data: CreateDocumentData): Promise<Document>;
  findById(id: string): Promise<Document | null>;
  update(id: string, data: UpdateDocumentData): Promise<Document | null>;
  delete(id: string): Promise<boolean>;
  findByUserId(userId: string): Promise<Document[]>;
}
