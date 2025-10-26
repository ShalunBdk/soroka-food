import { Router } from 'express';
import { getStaticPageBySlug } from '../controllers/staticPageController';

const router = Router();

// Public route - get page by slug
router.get('/:slug', getStaticPageBySlug);

export default router;
