// API Configuration
// In production, use relative path since frontend and backend are served from same server
// In development, use localhost:3000
// For images, we need base URL without /api suffix
const getApiBaseUrl = () => {
  // If VITE_API_URL is set (e.g., http://localhost:3000/api), extract base without /api
  const apiUrl = import.meta.env.VITE_API_URL;
  if (apiUrl) {
    return apiUrl.replace('/api', '');
  }

  // Fallback: in production use empty string (relative paths), in development use localhost
  return import.meta.env.MODE === 'production' ? '' : 'http://localhost:3000';
};

const API_BASE_URL = getApiBaseUrl();

/**
 * Get full image URL
 * @param imagePath - Relative path from API (e.g., "/uploads/image.jpg") or full URL
 * @returns Full image URL
 */
export const getImageUrl = (imagePath: string | null | undefined): string => {
  if (!imagePath) {
    return '/placeholder-recipe.jpg'; // fallback image
  }

  // If already a full URL (http:// or https://), return as is
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    return imagePath;
  }

  // If relative path, add base URL
  return `${API_BASE_URL}${imagePath}`;
};

/**
 * Get thumbnail URL from main image path
 * Converts /uploads/recipe-123.webp to /uploads/recipe-123_thumb.webp
 * @param imagePath - Main image path
 * @returns Thumbnail image URL (600px, optimized for recipe cards)
 */
export const getThumbnailUrl = (imagePath: string | null | undefined): string => {
  if (!imagePath) {
    return '/placeholder-recipe.jpg';
  }

  // Convert main image path to thumbnail path
  const thumbnailPath = imagePath.replace('.webp', '_thumb.webp');

  return getImageUrl(thumbnailPath);
};
