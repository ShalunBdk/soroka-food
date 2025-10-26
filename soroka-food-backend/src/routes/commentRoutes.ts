import { Router } from 'express';
import { createComment, getRecipeComments } from '../controllers/commentController';
import { asyncHandler } from '../middleware/errorHandler';
import { validate } from '../middleware/validation';
import { createCommentSchema } from '../validators/comment.validator';
import { commentLimiter } from '../middleware/rateLimiter';

const router = Router();

router.post('/', commentLimiter, validate(createCommentSchema), asyncHandler(createComment));
router.get('/recipe/:recipeId', asyncHandler(getRecipeComments));

export default router;
