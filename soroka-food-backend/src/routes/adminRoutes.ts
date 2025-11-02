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
  bulkCommentsAction,
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
import {
  authenticateToken,
  requireModeratorOrAbove,
  requireAdminOrAbove,
} from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';
import { validate } from '../middleware/validation';
import { createRecipeSchema, updateRecipeSchema } from '../validators/recipe.validator';
import { updateCommentStatusSchema } from '../validators/comment.validator';

const router = Router();

// Apply authentication to all admin routes
router.use(authenticateToken);

// Content Management Routes (accessible by MODERATOR, ADMIN, SUPER_ADMIN)
// Dashboard stats
router.get('/stats', requireModeratorOrAbove, asyncHandler(getDashboardStats));

// Recipes management
router.get('/recipes', requireModeratorOrAbove, asyncHandler(getAllRecipes));
router.get('/recipes/:id', requireModeratorOrAbove, asyncHandler(getRecipeById));
router.post('/recipes', requireModeratorOrAbove, validate(createRecipeSchema), asyncHandler(createRecipe));
router.put('/recipes/:id', requireModeratorOrAbove, validate(updateRecipeSchema), asyncHandler(updateRecipe));
router.delete('/recipes/:id', requireModeratorOrAbove, asyncHandler(deleteRecipe));

// Categories management
router.post('/categories', requireModeratorOrAbove, asyncHandler(createCategory));
router.put('/categories/:id', requireModeratorOrAbove, asyncHandler(updateCategory));
router.delete('/categories/:id', requireModeratorOrAbove, asyncHandler(deleteCategory));

// Comments moderation
router.get('/comments', requireModeratorOrAbove, asyncHandler(getAllComments));
router.patch('/comments/:id/status', requireModeratorOrAbove, validate(updateCommentStatusSchema), asyncHandler(moderateComment));
router.delete('/comments/:id', requireModeratorOrAbove, asyncHandler(deleteComment));
router.post('/comments/bulk', requireModeratorOrAbove, asyncHandler(bulkCommentsAction));

// Static pages management
router.get('/static-pages', requireModeratorOrAbove, getAllStaticPages);
router.get('/static-pages/:id', requireModeratorOrAbove, getStaticPageById);
router.put('/static-pages/:id', requireModeratorOrAbove, updateStaticPage);

// Tags management
router.get('/tags', requireModeratorOrAbove, asyncHandler(getAllTags));
router.put('/tags/rename', requireModeratorOrAbove, asyncHandler(renameTag));
router.delete('/tags/:name', requireModeratorOrAbove, asyncHandler(deleteTag));

// Admin-Only Routes (accessible by ADMIN and SUPER_ADMIN only)
// Newsletter subscribers
router.get('/newsletter', requireAdminOrAbove, asyncHandler(getAllSubscribers));
router.delete('/newsletter/:id', requireAdminOrAbove, asyncHandler(deleteSubscriber));

// Site settings (basic + advanced - will be split in future)
router.get('/settings', requireAdminOrAbove, asyncHandler(getSettings));
router.put('/settings', requireAdminOrAbove, asyncHandler(updateSettings));

export default router;
