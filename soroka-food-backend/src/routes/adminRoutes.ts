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
import {
  getAllTags,
  renameTag,
  deleteTag
} from '../controllers/tagController';
import { authenticateToken, requireAdmin } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';
import { validate } from '../middleware/validation';
import { createRecipeSchema, updateRecipeSchema } from '../validators/recipe.validator';
import { updateCommentStatusSchema } from '../validators/comment.validator';

const router = Router();

// Apply authentication and admin check to all admin routes
router.use(authenticateToken);
router.use(requireAdmin);

// Dashboard
router.get('/stats', asyncHandler(getDashboardStats));

// Recipes management
router.get('/recipes', asyncHandler(getAllRecipes));
router.get('/recipes/:id', asyncHandler(getRecipeById));
router.post('/recipes', validate(createRecipeSchema), asyncHandler(createRecipe));
router.put('/recipes/:id', validate(updateRecipeSchema), asyncHandler(updateRecipe));
router.delete('/recipes/:id', asyncHandler(deleteRecipe));

// Categories management
router.post('/categories', asyncHandler(createCategory));
router.put('/categories/:id', asyncHandler(updateCategory));
router.delete('/categories/:id', asyncHandler(deleteCategory));

// Comments moderation
router.get('/comments', asyncHandler(getAllComments));
router.patch('/comments/:id/status', validate(updateCommentStatusSchema), asyncHandler(moderateComment));
router.delete('/comments/:id', asyncHandler(deleteComment));

// Newsletter subscribers
router.get('/newsletter', asyncHandler(getAllSubscribers));
router.delete('/newsletter/:id', asyncHandler(deleteSubscriber));

// Site settings
router.get('/settings', asyncHandler(getSettings));
router.put('/settings', asyncHandler(updateSettings));

// Static pages management
router.get('/static-pages', getAllStaticPages);
router.get('/static-pages/:id', getStaticPageById);
router.put('/static-pages/:id', updateStaticPage);

// Tags management
router.get('/tags', asyncHandler(getAllTags));
router.put('/tags/rename', asyncHandler(renameTag));
router.delete('/tags/:name', asyncHandler(deleteTag));

export default router;
