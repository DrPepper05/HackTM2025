import { Request, Response } from 'express';
import { asyncHandler } from '../middleware';
import { supabaseAdmin } from '../config/supabase.config';

export class PublicController {
  /**
   * Get public document count
   */
  getPublicDocumentCount = asyncHandler(async (req: Request, res: Response) => {
    try {
      const { count } = await supabaseAdmin
        .from('documents')
        .select('*', { count: 'exact', head: true });

      res.json({
        success: true,
        data: {
          total: count || 0
        }
      });
    } catch (error) {
      console.error('Error getting document count:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get document count'
      });
    }
  });
}

export const publicController = new PublicController(); 