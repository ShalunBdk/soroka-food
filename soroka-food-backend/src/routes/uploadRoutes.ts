import { Router, Request, Response } from 'express';
import { uploadSingle, uploadMultiple } from '../middleware/upload';
import { authenticateToken, requireAdmin } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';

const router = Router();

// Apply authentication to all upload routes
router.use(authenticateToken);
router.use(requireAdmin);

// Upload single recipe image
router.post('/recipe-image', uploadSingle, asyncHandler(async (req: Request, res: Response) => {
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
router.post('/step-images', uploadMultiple, asyncHandler(async (req: Request, res: Response) => {
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
