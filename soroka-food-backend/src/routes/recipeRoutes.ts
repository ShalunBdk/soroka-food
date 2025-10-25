import { Router } from 'express';
import { getRecipes, getRecipeById, getRecipesByCuisine, searchRecipes, getPublicStats } from '../controllers/recipeController';
import { asyncHandler } from '../middleware/errorHandler';

const router = Router();

router.get('/', asyncHandler(getRecipes));
router.get('/search', asyncHandler(searchRecipes));
router.get('/stats', asyncHandler(getPublicStats));
router.get('/cuisines/:type', asyncHandler(getRecipesByCuisine));
router.get('/:id', asyncHandler(getRecipeById));

export default router;
