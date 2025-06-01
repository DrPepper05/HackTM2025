/**
 * Document repository implementation using Supabase
 */
import { supabase } from '../services/supabase';
import {
  Document,
  CreateDocumentData,
  UpdateDocumentData,
  DocumentRepository,
  DocumentStatus
} from '../models/document';

/**
 * Supabase implementation of the DocumentRepository interface
 */
export class SupabaseDocumentRepository implements DocumentRepository {
  private readonly tableName = 'documents';

  /**
   * Create a new document record in the database
   */
  async create(data: CreateDocumentData): Promise<Document> {
    const { data: document, error } = await supabase
      .from(this.tableName)
      .insert([
        {
          title: data.title,
          file_name: data.file_name,
          file_type: data.file_type,
          file_size: data.file_size,
          storage_path: data.storage_path,
          status: DocumentStatus.PROCESSING,
          created_by: data.created_by
        }
      ])
      .select()
      .single();

    if (error) {
      console.error('Error creating document:', error);
      throw new Error(`Failed to create document: ${error.message}`);
    }

    return document as Document;
  }

  /**
   * Find a document by its ID
   */
  async findById(id: string): Promise<Document | null> {
    const { data, error } = await supabase
      .from(this.tableName)
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') { // Record not found
        return null;
      }
      console.error('Error finding document:', error);
      throw new Error(`Failed to find document: ${error.message}`);
    }

    return data as Document;
  }

  /**
   * Update a document's information
   */
  async update(id: string, data: UpdateDocumentData): Promise<Document | null> {
    const updateData = {
      ...data,
      updated_at: new Date()
    };

    const { data: updatedDocument, error } = await supabase
      .from(this.tableName)
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating document:', error);
      throw new Error(`Failed to update document: ${error.message}`);
    }

    return updatedDocument as Document;
  }

  /**
   * Delete a document by its ID
   */
  async delete(id: string): Promise<boolean> {
    const { error } = await supabase
      .from(this.tableName)
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting document:', error);
      throw new Error(`Failed to delete document: ${error.message}`);
    }

    return true;
  }

  /**
   * Find all documents created by a specific user
   */
  async findByUserId(userId: string): Promise<Document[]> {
    const { data, error } = await supabase
      .from(this.tableName)
      .select('*')
      .eq('created_by', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error finding documents by user ID:', error);
      throw new Error(`Failed to find documents: ${error.message}`);
    }

    return data as Document[];
  }
}