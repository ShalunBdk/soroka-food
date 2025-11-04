import { Router } from 'express';
import { getCategories, getRecipesByCategory } from '../controllers/categoryController';
import { asyncHandler } from '../middleware/errorHandler';
import { cacheMiddleware } from '../middleware/cache';

const router = Router();

// Cache categories list for 30 minutes (rarely changes)
router.get('/', cacheMiddleware(1800), asyncHandler(getCategories));
// Cache category recipes for 5 minutes
router.get('/:slug/recipes', cacheMiddleware(300), asyncHandler(getRecipesByCategory));

export default router;
