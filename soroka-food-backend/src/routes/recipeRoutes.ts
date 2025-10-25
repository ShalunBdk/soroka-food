import { Router } from 'express';
import { getRecipes, getRecipeById } from '../controllers/recipeController';
import { asyncHandler } from '../middleware/errorHandler';

const router = Router();

router.get('/', asyncHandler(getRecipes));
router.get('/:id', asyncHandler(getRecipeById));

export default router;
