import { Router } from 'express';
import {
  getRecipes,
  getRecipeById,
  searchRecipes,
  getPublicStats,
  incrementRecipeView
} from '../controllers/recipeController';
import { asyncHandler } from '../middleware/errorHandler';
import { cacheMiddleware } from '../middleware/cache';

const router = Router();

// Cache recipe lists for 5 minutes
router.get('/', cacheMiddleware(300), asyncHandler(getRecipes));
// Cache search results for 5 minutes
router.get('/search', cacheMiddleware(300), asyncHandler(searchRecipes));
// Cache stats for 10 minutes
router.get('/stats', cacheMiddleware(600), asyncHandler(getPublicStats));
// Don't cache view increment (POST request)
router.post('/:id/view', asyncHandler(incrementRecipeView));
// Cache recipe details for 10 minutes
router.get('/:id', cacheMiddleware(600), asyncHandler(getRecipeById));

export default router;
