import { invalidateCache } from '../middleware/cache';

/**
 * Invalidate all recipe-related cache
 * Called after creating, updating, or deleting recipes
 */
export const invalidateRecipeCache = async (recipeId?: number): Promise<void> => {
  const patterns = [
    'cache:/api/recipes*',      // All recipe lists
    'cache:/api/categories*',   // Category-related endpoints
    'cache:/api/recipes/stats', // Site statistics
  ];

  // If specific recipe ID provided, invalidate that recipe detail
  if (recipeId) {
    patterns.push(`cache:/api/recipes/${recipeId}`);
  }

  // Invalidate all patterns
  for (const pattern of patterns) {
    await invalidateCache(pattern);
  }
};

/**
 * Invalidate category-related cache
 * Called after creating, updating, or deleting categories
 */
export const invalidateCategoryCache = async (): Promise<void> => {
  const patterns = [
    'cache:/api/categories*',
    'cache:/api/recipes*', // Recipes include categories
  ];

  for (const pattern of patterns) {
    await invalidateCache(pattern);
  }
};

/**
 * Invalidate comment-related cache
 * Called after approving/rejecting comments
 */
export const invalidateCommentCache = async (recipeId: number): Promise<void> => {
  const patterns = [
    `cache:/api/recipes/${recipeId}`, // Recipe detail includes comments
  ];

  for (const pattern of patterns) {
    await invalidateCache(pattern);
  }
};

/**
 * Invalidate all cache
 * Use with caution - only for major changes
 */
export const invalidateAllCache = async (): Promise<void> => {
  await invalidateCache('cache:*');
};
