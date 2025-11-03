import { Router } from 'express';
import {
  getAdminLogs,
  getAdminLogsStats,
} from '../controllers/adminLogController';
import {
  authenticateToken,
  requireSuperAdmin,
} from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';

const router = Router();

// Apply authentication and SUPER_ADMIN check to all log routes
// Only SUPER_ADMIN can access admin logs
router.use(authenticateToken);
router.use(requireSuperAdmin);

// Admin log routes
router.get('/', asyncHandler(getAdminLogs));
router.get('/stats', asyncHandler(getAdminLogsStats));

export default router;
