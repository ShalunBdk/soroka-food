import sharp from 'sharp';
import path from 'path';

/**
 * Converts and optimizes an image to WebP format
 * @param inputPath - Path to the source image (JPEG, PNG, etc.)
 * @param outputPath - Path where WebP image will be saved (should end with .webp)
 * @param maxWidth - Maximum width in pixels (default: 1200)
 * @param quality - WebP quality 0-100 (default: 80)
 * @returns Path to the optimized WebP image
 */
export const convertToWebP = async (
  inputPath: string,
  outputPath: string,
  maxWidth: number = 1200,
  quality: number = 80
): Promise<string> => {
  await sharp(inputPath)
    .rotate() // Auto-rotate based on EXIF orientation
    .resize(maxWidth, null, {
      fit: 'inside',
      withoutEnlargement: true,
    })
    .webp({ quality, effort: 4 }) // effort 4 = good balance between speed and compression
    .toFile(outputPath);

  return outputPath;
};

/**
 * Creates a WebP thumbnail from an image
 * @param inputPath - Path to the source image
 * @param outputPath - Path where WebP thumbnail will be saved
 * @param thumbnailWidth - Width of thumbnail in pixels (default: 600)
 * @param quality - WebP quality 0-100 (default: 75)
 * @returns Path to the WebP thumbnail
 */
export const createWebPThumbnail = async (
  inputPath: string,
  outputPath: string,
  thumbnailWidth: number = 600,
  quality: number = 75
): Promise<string> => {
  await sharp(inputPath)
    .rotate() // Auto-rotate based on EXIF orientation
    .resize(thumbnailWidth, null, {
      fit: 'inside',
      withoutEnlargement: true,
    })
    .webp({ quality, effort: 4 })
    .toFile(outputPath);

  return outputPath;
};
