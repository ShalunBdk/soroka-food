/**
 * SEO utility functions
 */

/**
 * Format time in minutes to ISO 8601 duration format (PT##M or PT##H##M)
 * @param minutes - Time in minutes
 * @returns ISO 8601 duration string (e.g., "PT30M" or "PT1H30M")
 */
export const formatISO8601Duration = (minutes: number | null | undefined): string | undefined => {
  if (!minutes || minutes <= 0) return undefined;

  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;

  if (hours > 0 && mins > 0) {
    return `PT${hours}H${mins}M`;
  } else if (hours > 0) {
    return `PT${hours}H`;
  } else {
    return `PT${mins}M`;
  }
};

/**
 * Strip HTML tags from string
 * @param html - HTML string
 * @returns Plain text
 */
export const stripHtml = (html: string): string => {
  const tmp = document.createElement('div');
  tmp.innerHTML = html;
  return tmp.textContent || tmp.innerText || '';
};

/**
 * Truncate text to specified length
 * @param text - Text to truncate
 * @param maxLength - Maximum length
 * @returns Truncated text with ellipsis
 */
export const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength).trim() + '...';
};

/**
 * Generate meta description from recipe
 * @param description - Recipe description (HTML)
 * @param cookingTime - Cooking time in minutes
 * @param servings - Number of servings
 * @param maxLength - Maximum description length (default 160)
 * @returns SEO-optimized meta description
 */
export const generateRecipeMetaDescription = (
  description: string,
  cookingTime: number,
  servings: number,
  maxLength: number = 160
): string => {
  const plainText = stripHtml(description);
  const prefix = `Рецепт на ${servings} ${getPluralForm(servings, 'порцию', 'порции', 'порций')}. Время приготовления: ${cookingTime} мин. `;
  const remainingLength = maxLength - prefix.length;

  if (remainingLength > 50) {
    const truncatedDesc = truncateText(plainText, remainingLength);
    return prefix + truncatedDesc;
  }

  return truncateText(plainText, maxLength);
};

/**
 * Get plural form for Russian words
 * @param count - Number
 * @param one - Form for 1 (e.g., "порцию")
 * @param few - Form for 2-4 (e.g., "порции")
 * @param many - Form for 5+ (e.g., "порций")
 * @returns Correct plural form
 */
export const getPluralForm = (count: number, one: string, few: string, many: string): string => {
  const mod10 = count % 10;
  const mod100 = count % 100;

  if (mod10 === 1 && mod100 !== 11) {
    return one;
  } else if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) {
    return few;
  } else {
    return many;
  }
};

/**
 * Generate full URL for image
 * @param imagePath - Relative image path
 * @param baseUrl - Base URL (optional, uses window.location.origin by default)
 * @returns Full image URL
 */
export const getFullImageUrl = (imagePath: string, baseUrl?: string): string => {
  const base = baseUrl || window.location.origin;

  // If already full URL, return as is
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    return imagePath;
  }

  // Ensure path starts with /
  const path = imagePath.startsWith('/') ? imagePath : `/${imagePath}`;

  return `${base}${path}`;
};

/**
 * Generate canonical URL
 * @param path - Page path
 * @param baseUrl - Base URL (optional, uses window.location.origin by default)
 * @returns Full canonical URL
 */
export const getCanonicalUrl = (path: string, baseUrl?: string): string => {
  const base = baseUrl || window.location.origin;

  // Ensure path starts with /
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;

  return `${base}${normalizedPath}`;
};
