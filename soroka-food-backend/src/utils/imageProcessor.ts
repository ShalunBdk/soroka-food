import sharp from 'sharp';
import path from 'path';

/**
 * Optimizes an image by resizing and compressing it
 * @param inputPath - Path to the source image
 * @param outputPath - Path where optimized image will be saved
 * @param maxWidth - Maximum width in pixels (default: 1200)
 * @returns Path to the optimized image
 */
export const optimizeImage = async (
  inputPath: string,
  outputPath: string,
  maxWidth: number = 1200
): Promise<string> => {
  await sharp(inputPath)
    .resize(maxWidth, null, {
      fit: 'inside',
      withoutEnlargement: true,
    })
    .jpeg({ quality: 85, progressive: true })
    .toFile(outputPath);

  return outputPath;
};

/**
 * Converts an image to WebP format for better compression
 * @param inputPath - Path to the source image
 * @param quality - WebP quality (default: 85)
 * @returns Path to the converted WebP image
 */
export const convertToWebP = async (
  inputPath: string,
  quality: number = 85
): Promise<string> => {
  const outputPath = inputPath.replace(/\.(jpg|jpeg|png)$/i, '.webp');

  await sharp(inputPath)
    .webp({ quality })
    .toFile(outputPath);

  return outputPath;
};

/**
 * Creates a thumbnail from an image
 * @param inputPath - Path to the source image
 * @param thumbnailWidth - Width of thumbnail in pixels (default: 300)
 * @returns Path to the thumbnail
 */
export const createThumbnail = async (
  inputPath: string,
  thumbnailWidth: number = 300
): Promise<string> => {
  const ext = path.extname(inputPath);
  const thumbnailPath = inputPath.replace(ext, `_thumb${ext}`);

  await sharp(inputPath)
    .resize(thumbnailWidth, null, {
      fit: 'inside',
      withoutEnlargement: true,
    })
    .jpeg({ quality: 80 })
    .toFile(thumbnailPath);

  return thumbnailPath;
};
