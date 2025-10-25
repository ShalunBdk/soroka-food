import { Router } from 'express';
import { getStaticPageBySlug } from '../controllers/staticPageController';
import { asyncHandler } from '../middleware/errorHandler';

const router = Router();

// Public route - get page by slug
router.get('/:slug', asyncHandler(getStaticPageBySlug));

export default router;
