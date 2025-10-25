import { Router } from 'express';
import { subscribe, unsubscribe } from '../controllers/newsletterController';
import { asyncHandler } from '../middleware/errorHandler';

const router = Router();

router.post('/subscribe', asyncHandler(subscribe));
router.post('/unsubscribe', asyncHandler(unsubscribe));

export default router;
