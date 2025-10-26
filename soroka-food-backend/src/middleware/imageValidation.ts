import sharp from 'sharp';
import { Request, Response, NextFunction } from 'express';
import { AppError } from './errorHandler';
import fs from 'fs/promises';

/**
 * Validates uploaded images using Sharp
 * - Verifies file is a valid image
 * - Checks dimensions (max 5000x5000)
 * - Validates format (jpeg, jpg, png, webp)
 */
export const validateImage = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const file = req.file;

  if (!file) {
    return next();
  }

  try {
    // Check that it's actually an image by reading metadata
    const metadata = await sharp(file.path).metadata();

    // Check dimensions (max 5000x5000)
    if (
      (metadata.width && metadata.width > 5000) ||
      (metadata.height && metadata.height > 5000)
    ) {
      // Delete invalid file
      await fs.unlink(file.path).catch(() => {});
      throw new AppError('Image dimensions too large (max 5000x5000)', 400);
    }

    // Check format
    const allowedFormats = ['jpeg', 'jpg', 'png', 'webp'];
    if (!metadata.format || !allowedFormats.includes(metadata.format)) {
      // Delete invalid file
      await fs.unlink(file.path).catch(() => {});
      throw new AppError('Invalid image format. Allowed: jpeg, jpg, png, webp', 400);
    }

    next();
  } catch (error) {
    // Delete file on any error
    await fs.unlink(file.path).catch(() => {});

    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError('Invalid or corrupted image file', 400);
  }
};

/**
 * Validates multiple uploaded images
 * Same validation as validateImage but for req.files array
 */
export const validateMultipleImages = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const files = req.files;

  if (!files || !Array.isArray(files) || files.length === 0) {
    return next();
  }

  try {
    const allowedFormats = ['jpeg', 'jpg', 'png', 'webp'];

    // Validate all files
    for (const file of files) {
      const metadata = await sharp(file.path).metadata();

      // Check dimensions
      if (
        (metadata.width && metadata.width > 5000) ||
        (metadata.height && metadata.height > 5000)
      ) {
        // Delete all uploaded files on error
        await Promise.all(files.map(f => fs.unlink(f.path).catch(() => {})));
        throw new AppError('One or more images have dimensions too large (max 5000x5000)', 400);
      }

      // Check format
      if (!metadata.format || !allowedFormats.includes(metadata.format)) {
        // Delete all uploaded files on error
        await Promise.all(files.map(f => fs.unlink(f.path).catch(() => {})));
        throw new AppError('One or more images have invalid format. Allowed: jpeg, jpg, png, webp', 400);
      }
    }

    next();
  } catch (error) {
    // Delete all files on any error
    if (Array.isArray(files)) {
      await Promise.all(files.map(f => fs.unlink(f.path).catch(() => {})));
    }

    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError('One or more images are invalid or corrupted', 400);
  }
};
