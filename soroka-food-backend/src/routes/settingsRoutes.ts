import { Router } from 'express';
import { getPublicSettings } from '../controllers/settingsController';
import { asyncHandler } from '../middleware/errorHandler';

const router = Router();

// Public endpoint - no authentication required
router.get('/', asyncHandler(getPublicSettings));

export default router;
