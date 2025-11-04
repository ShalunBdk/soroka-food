import { Router } from 'express';
import {
  getEmailLogs,
  getEmailLogStats,
  retryFailedEmail
} from '../controllers/emailLogController';
import { requireAdminOrAbove, requireSuperAdmin } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';

const router = Router();

// All email log routes require at least ADMIN role
router.use(requireAdminOrAbove);

router.get('/', asyncHandler(getEmailLogs));
router.get('/stats', asyncHandler(getEmailLogStats));

// Retry requires SUPER_ADMIN
router.post('/:id/retry', requireSuperAdmin, asyncHandler(retryFailedEmail));

export default router;
