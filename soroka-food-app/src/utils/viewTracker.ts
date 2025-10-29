// View tracking utility to prevent counting multiple views from the same user

const VIEW_STORAGE_KEY = 'recipe_views';
const VIEW_EXPIRY_HOURS = 24; // Don't count views within 24 hours

interface ViewRecord {
  recipeId: number;
  timestamp: number;
}

/**
 * Check if a recipe view should be counted
 * @param recipeId - ID of the recipe
 * @returns true if view should be counted, false otherwise
 */
export function shouldCountView(recipeId: number): boolean {
  try {
    const viewsJson = localStorage.getItem(VIEW_STORAGE_KEY);
    const views: ViewRecord[] = viewsJson ? JSON.parse(viewsJson) : [];

    const now = Date.now();
    const expiryTime = VIEW_EXPIRY_HOURS * 60 * 60 * 1000; // Convert to milliseconds

    // Clean up expired views
    const validViews = views.filter(v => now - v.timestamp < expiryTime);

    // Check if this recipe was viewed recently
    const recentView = validViews.find(v => v.recipeId === recipeId);

    if (recentView) {
      return false; // Already viewed recently
    }

    // Record this view
    validViews.push({ recipeId, timestamp: now });
    localStorage.setItem(VIEW_STORAGE_KEY, JSON.stringify(validViews));

    return true; // Count this view
  } catch (error) {
    // If localStorage is not available or error occurs, count the view
    console.error('View tracking error:', error);
    return true;
  }
}

/**
 * Get time until view can be counted again (in hours)
 * @param recipeId - ID of the recipe
 * @returns hours until next view, or 0 if can view now
 */
export function getTimeUntilNextView(recipeId: number): number {
  try {
    const viewsJson = localStorage.getItem(VIEW_STORAGE_KEY);
    const views: ViewRecord[] = viewsJson ? JSON.parse(viewsJson) : [];

    const view = views.find(v => v.recipeId === recipeId);
    if (!view) return 0;

    const now = Date.now();
    const expiryTime = VIEW_EXPIRY_HOURS * 60 * 60 * 1000;
    const timeSinceView = now - view.timestamp;
    const timeRemaining = expiryTime - timeSinceView;

    return timeRemaining > 0 ? Math.ceil(timeRemaining / (60 * 60 * 1000)) : 0;
  } catch (error) {
    return 0;
  }
}

/**
 * Clear all view records (for testing or admin purposes)
 */
export function clearViewHistory(): void {
  try {
    localStorage.removeItem(VIEW_STORAGE_KEY);
  } catch (error) {
    console.error('Error clearing view history:', error);
  }
}
