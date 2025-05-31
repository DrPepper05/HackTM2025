// backend/src/controllers/access-request.controller.ts
import { Request, Response } from 'express';
import { accessRequestService } from '../services';
import { asyncHandler } from '../middleware';
import { CreateAccessRequestDto } from '../services/access-request.service'; // Assuming the DTO is exported or defined here

export class AccessRequestController {
  /**
   * Create a new access request
   */
  createRequest = asyncHandler(async (req: Request, res: Response) => {
    const requestData: CreateAccessRequestDto = req.body;

    // Basic validation (more comprehensive validation is in the middleware)
    if (!requestData.requesterName || !requestData.requesterEmail || !requestData.justification) {
      return res.status(400).json({
        success: false,
        message: 'Requester name, email, and justification are required.'
      });
    }

    const newAccessRequest = await accessRequestService.createAccessRequest(requestData);

    res.status(201).json({
      success: true,
      message: 'Access request submitted successfully. You will receive a confirmation email.',
      data: newAccessRequest,
    });
  });

  /**
   * Get an access request by ID (can be used by requester to check status or by staff)
   */
  getRequestById = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    // Optional: If you want to verify if the logged-in user is the requester or staff
    // const userId = req.userId; // from authenticateOptionalToken or authenticateToken
    // For now, service handles basic permission or assumes public ID check
    const accessRequest = await accessRequestService.getAccessRequestById(id, req.userId);

    if (!accessRequest) {
      return res.status(404).json({ success: false, message: 'Access request not found.' });
    }
    res.json({ success: true, data: accessRequest });
  });

  /**
   * Get access requests by email (for requester to check their submissions)
   * This might be better on a user-specific route or require some form of token if sensitive.
   * For now, assuming it's a simple lookup.
   */
  getRequestsByEmail = asyncHandler(async (req: Request, res: Response) => {
      const { email } = req.query;
      if (!email || typeof email !== 'string') {
          return res.status(400).json({ success: false, message: 'Email query parameter is required.'});
      }
      const requests = await accessRequestService.getRequestsByEmail(email);
      res.json({ success: true, data: requests });
  });


  // Note: Processing requests (approve/reject) is typically an admin/archivist function
  // and those routes would be in admin.routes.ts or a protected section here.
  // The admin.controller.ts already has bulkProcessAccessRequests.
  // Individual processing could be:
  // processRequest = asyncHandler(async (req: Request, res: Response) => { ... });
}

export const accessRequestController = new AccessRequestController();