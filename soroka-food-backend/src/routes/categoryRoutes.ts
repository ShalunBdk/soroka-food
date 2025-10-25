import { Router } from 'express';
import { getCategories, getRecipesByCategory } from '../controllers/categoryController';
import { asyncHandler } from '../middleware/errorHandler';

const router = Router();

router.get('/', asyncHandler(getCategories));
router.get('/:slug/recipes', asyncHandler(getRecipesByCategory));

export default router;
