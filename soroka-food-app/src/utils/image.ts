const API_BASE_URL = 'http://localhost:3000';

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
