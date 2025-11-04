import { Router } from 'express';
import {
  subscribe,
  verify,
  unsubscribeByToken,
  unsubscribe,
  cleanupUnverified
} from '../controllers/newsletterController';
import { asyncHandler } from '../middleware/errorHandler';
import { requireSuperAdmin } from '../middleware/auth';

const router = Router();

// Public routes
router.post('/subscribe', asyncHandler(subscribe));
router.get('/verify/:token', asyncHandler(verify));
router.get('/unsubscribe/:token', asyncHandler(unsubscribeByToken));

// Legacy route
router.post('/unsubscribe', asyncHandler(unsubscribe));

// Admin route (SUPER_ADMIN only) - for manual cleanup
router.post('/cleanup-unverified', requireSuperAdmin, asyncHandler(cleanupUnverified));

export default router;
