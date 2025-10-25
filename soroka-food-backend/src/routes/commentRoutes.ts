import { Router } from 'express';
import { createComment, getRecipeComments } from '../controllers/commentController';
import { asyncHandler } from '../middleware/errorHandler';

const router = Router();

router.post('/', asyncHandler(createComment));
router.get('/recipe/:recipeId', asyncHandler(getRecipeComments));

export default router;
