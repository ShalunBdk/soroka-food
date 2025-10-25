import { Router } from 'express';
import {
  getDashboardStats,
  getAllRecipes,
  getRecipeById,
  createRecipe,
  updateRecipe,
  deleteRecipe,
  createCategory,
  updateCategory,
  deleteCategory,
  getAllComments,
  moderateComment,
  deleteComment,
  getAllSubscribers,
  deleteSubscriber,
  getSettings,
  updateSettings
} from '../controllers/adminController';
import {
  getAllStaticPages,
  getStaticPageById,
  updateStaticPage
} from '../controllers/staticPageController';
import { authenticateToken, requireAdmin } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';

const router = Router();

// Apply authentication and admin check to all admin routes
router.use(authenticateToken);
router.use(requireAdmin);

// Dashboard
router.get('/stats', asyncHandler(getDashboardStats));

// Recipes management
router.get('/recipes', asyncHandler(getAllRecipes));
router.get('/recipes/:id', asyncHandler(getRecipeById));
router.post('/recipes', asyncHandler(createRecipe));
router.put('/recipes/:id', asyncHandler(updateRecipe));
router.delete('/recipes/:id', asyncHandler(deleteRecipe));

// Categories management
router.post('/categories', asyncHandler(createCategory));
router.put('/categories/:id', asyncHandler(updateCategory));
router.delete('/categories/:id', asyncHandler(deleteCategory));

// Comments moderation
router.get('/comments', asyncHandler(getAllComments));
router.patch('/comments/:id/status', asyncHandler(moderateComment));
router.delete('/comments/:id', asyncHandler(deleteComment));

// Newsletter subscribers
router.get('/newsletter', asyncHandler(getAllSubscribers));
router.delete('/newsletter/:id', asyncHandler(deleteSubscriber));

// Site settings
router.get('/settings', asyncHandler(getSettings));
router.put('/settings', asyncHandler(updateSettings));

// Static pages management
router.get('/static-pages', asyncHandler(getAllStaticPages));
router.get('/static-pages/:id', asyncHandler(getStaticPageById));
router.put('/static-pages/:id', asyncHandler(updateStaticPage));

export default router;
