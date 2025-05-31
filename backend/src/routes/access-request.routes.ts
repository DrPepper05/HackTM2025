// backend/src/routes/access-request.routes.ts
import { Router } from 'express';
import { accessRequestController } from '../controllers';
import { validateAccessRequest, validateUUID } from '../middleware/validation.middleware';
// import { authenticateOptionalToken } from '../middleware/auth.middleware'; // If you want to attach user if logged in

const router = Router();

// Create a new access request (publicly accessible)
// The validateAccessRequest middleware is defined in validation.middleware.ts
router.post('/', validateAccessRequest, accessRequestController.createRequest);

// Get status of a specific access request by ID (publicly accessible by ID)
// Optional: Add authenticateOptionalToken if you want to know who is asking,
// or let the service layer handle permissions if user ID is passed.
router.get('/:id', validateUUID('id'), accessRequestController.getRequestById);

// Get all requests by an email (consider security implications for this endpoint)
router.get('/', accessRequestController.getRequestsByEmail); // e.g. /api/v1/access-requests?email=user@example.com


// Routes for staff/admin to manage/view all requests would be in admin.routes.ts or require staff auth here.
// Example (if not in admin.routes.ts):
// import { authenticateToken, requireStaff } from '../middleware';
// router.get('/list/all', authenticateToken, requireStaff, accessRequestController.getAllRequestsForStaff);

export default router;