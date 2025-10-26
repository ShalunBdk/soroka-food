import { Router, Request, Response } from 'express';
import { uploadSingle, uploadMultiple } from '../middleware/upload';
import { authenticateToken, requireAdmin } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';
import { uploadLimiter } from '../middleware/rateLimiter';
import { validateImage, validateMultipleImages } from '../middleware/imageValidation';

const router = Router();

// Apply authentication to all upload routes
router.use(authenticateToken);
router.use(requireAdmin);

// Upload single recipe image
router.post('/recipe-image', uploadLimiter, uploadSingle, validateImage, asyncHandler(async (req: Request, res: Response) => {
  if (!req.file) {
    res.status(400).json({ error: 'No file uploaded' });
    return;
  }

  const url = `/uploads/${req.file.filename}`;

  res.json({
    message: 'Image uploaded successfully',
    url
  });
}));

// Upload multiple step images (up to 5)
router.post('/step-images', uploadLimiter, uploadMultiple, validateMultipleImages, asyncHandler(async (req: Request, res: Response) => {
  if (!req.files || !Array.isArray(req.files) || req.files.length === 0) {
    res.status(400).json({ error: 'No files uploaded' });
    return;
  }

  const urls = req.files.map(file => `/uploads/${file.filename}`);

  res.json({
    message: 'Images uploaded successfully',
    urls
  });
}));

export default router;
