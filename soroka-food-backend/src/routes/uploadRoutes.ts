import { Router } from 'express';
import { uploadSingle, uploadMultiple } from '../middleware/upload';
import { authenticateToken, requireModeratorOrAbove } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';
import { uploadLimiter } from '../middleware/rateLimiter';
import { validateImage, validateMultipleImages } from '../middleware/imageValidation';
import { uploadRecipeImage, uploadStepImages } from '../controllers/uploadController';

const router = Router();

// Apply authentication to all upload routes
// All roles (MODERATOR+) can upload images
router.use(authenticateToken);
router.use(requireModeratorOrAbove);

// Upload single recipe image
// Creates: optimized original (max 1200px), thumbnail (300px), WebP versions
router.post(
  '/recipe-image',
  uploadLimiter,
  uploadSingle,
  validateImage,
  asyncHandler(uploadRecipeImage)
);

// Upload multiple step images (up to 5)
// Creates optimized versions for each image
router.post(
  '/step-images',
  uploadLimiter,
  uploadMultiple,
  validateMultipleImages,
  asyncHandler(uploadStepImages)
);

export default router;
