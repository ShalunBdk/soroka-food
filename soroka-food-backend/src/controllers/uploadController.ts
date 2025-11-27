import { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import { convertToWebP, createWebPThumbnail } from '../utils/imageProcessor';
import { logger } from '../config/logger';

/**
 * Upload and optimize a single recipe image
 * Converts to WebP format with main image and thumbnail
 */
export const uploadRecipeImage = async (req: Request, res: Response) => {
  if (!req.file) {
    res.status(400).json({ error: 'No file uploaded' });
    return;
  }

  const originalPath = req.file.path;
  const filename = req.file.filename;

  try {
    // Generate WebP filenames
    const webpFilename = filename.replace(/\.(jpg|jpeg|png)$/i, '.webp');
    const webpPath = path.join(path.dirname(originalPath), webpFilename);

    const thumbnailFilename = filename.replace(/\.(jpg|jpeg|png)$/i, '_thumb.webp');
    const thumbnailPath = path.join(path.dirname(originalPath), thumbnailFilename);

    // 1. Convert to WebP (1200px max, quality 80 for better compression)
    logger.info(`Converting to WebP: ${webpFilename}`);
    await convertToWebP(originalPath, webpPath, 1200, 80);

    // 2. Create WebP thumbnail (600px for recipe cards, quality 75)
    logger.info(`Creating WebP thumbnail: ${thumbnailFilename}`);
    await createWebPThumbnail(originalPath, thumbnailPath, 600, 75);

    // 3. Delete original uploaded file (no longer needed)
    if (fs.existsSync(originalPath)) {
      fs.unlinkSync(originalPath);
    }

    res.json({
      message: 'Image uploaded and converted to WebP successfully',
      url: `/uploads/${webpFilename}`,
      thumbnail: `/uploads/${thumbnailFilename}`,
    });
  } catch (error) {
    logger.error('Image conversion failed:', error);

    // Clean up all files on error
    [originalPath].forEach(file => {
      if (fs.existsSync(file)) {
        fs.unlinkSync(file);
      }
    });

    res.status(500).json({ error: 'Failed to convert image to WebP' });
  }
};

/**
 * Upload and optimize multiple step images
 * Converts all images to WebP format
 */
export const uploadStepImages = async (req: Request, res: Response) => {
  if (!req.files || !Array.isArray(req.files) || req.files.length === 0) {
    res.status(400).json({ error: 'No files uploaded' });
    return;
  }

  const uploadedFiles: {
    url: string;
    thumbnail: string;
  }[] = [];

  const originalPaths: string[] = [];

  try {
    // Process each uploaded file
    for (const file of req.files) {
      const originalPath = file.path;
      const filename = file.filename;
      originalPaths.push(originalPath);

      logger.info(`Processing step image: ${filename}`);

      // Generate WebP filenames
      const webpFilename = filename.replace(/\.(jpg|jpeg|png)$/i, '.webp');
      const webpPath = path.join(path.dirname(originalPath), webpFilename);

      const thumbnailFilename = filename.replace(/\.(jpg|jpeg|png)$/i, '_thumb.webp');
      const thumbnailPath = path.join(path.dirname(originalPath), thumbnailFilename);

      // 1. Convert to WebP
      await convertToWebP(originalPath, webpPath, 1200, 80);

      // 2. Create WebP thumbnail
      await createWebPThumbnail(originalPath, thumbnailPath, 600, 75);

      // 3. Delete original uploaded file
      if (fs.existsSync(originalPath)) {
        fs.unlinkSync(originalPath);
      }

      uploadedFiles.push({
        url: `/uploads/${webpFilename}`,
        thumbnail: `/uploads/${thumbnailFilename}`,
      });
    }

    res.json({
      message: 'Images uploaded and converted to WebP successfully',
      urls: uploadedFiles.map(f => f.url), // For backward compatibility
      images: uploadedFiles,
    });
  } catch (error) {
    logger.error('Batch image conversion failed:', error);

    // Clean up all uploaded files on error
    originalPaths.forEach(file => {
      if (fs.existsSync(file)) {
        fs.unlinkSync(file);
      }
    });

    res.status(500).json({ error: 'Failed to convert images to WebP' });
  }
};
