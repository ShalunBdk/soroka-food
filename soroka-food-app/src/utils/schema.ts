/**
 * Schema.org structured data generators
 */

import type { RecipeDetail } from '../types';
import { formatISO8601Duration, stripHtml } from './seo';

/**
 * Generate Recipe schema.org JSON-LD
 * @param recipe - Recipe details
 * @param siteUrl - Site base URL
 * @param siteName - Site name
 * @returns Recipe schema object
 */
export const generateRecipeSchema = (
  recipe: RecipeDetail,
  siteUrl: string,
  siteName: string
) => {
  // Get full image URL
  const getFullUrl = (path: string) => {
    if (path.startsWith('http')) return path;
    return `${siteUrl}${path.startsWith('/') ? '' : '/'}${path}`;
  };

  // Extract ingredients list
  const ingredients: string[] = [];
  if (recipe.ingredients && Array.isArray(recipe.ingredients)) {
    recipe.ingredients.forEach((group: any) => {
      if (group.items && Array.isArray(group.items)) {
        group.items.forEach((item: any) => {
          let ingredientText = '';
          if (item.quantity) ingredientText += `${item.quantity} `;
          if (item.unit) ingredientText += `${item.unit} `;
          if (item.name) ingredientText += item.name;
          if (ingredientText.trim()) {
            ingredients.push(ingredientText.trim());
          }
        });
      }
    });
  }

  // Extract instructions
  const instructions: any[] = [];
  if (recipe.instructions && Array.isArray(recipe.instructions)) {
    recipe.instructions.forEach((step: any, index: number) => {
      const stepObj: any = {
        '@type': 'HowToStep',
        position: index + 1,
        text: stripHtml(step.description || ''),
      };

      if (step.image) {
        stepObj.image = getFullUrl(step.image);
      }

      instructions.push(stepObj);
    });
  }

  // Calculate total time
  const prepTime = recipe.prepTime || 0;
  const cookTime = recipe.cookingTime || 0;
  const totalTime = prepTime + cookTime;

  // Build schema object
  const schema: any = {
    '@context': 'https://schema.org',
    '@type': 'Recipe',
    name: recipe.title,
    description: stripHtml(recipe.description || ''),
    image: recipe.image ? [getFullUrl(recipe.image)] : [],
    author: {
      '@type': 'Organization',
      name: siteName,
    },
    datePublished: recipe.date || new Date().toISOString(),
    recipeYield: `${recipe.servings} порций`,
    recipeIngredient: ingredients,
    recipeInstructions: instructions,
  };

  // Add times if available
  if (prepTime > 0) {
    schema.prepTime = formatISO8601Duration(prepTime);
  }
  if (cookTime > 0) {
    schema.cookTime = formatISO8601Duration(cookTime);
  }
  if (totalTime > 0) {
    schema.totalTime = formatISO8601Duration(totalTime);
  }

  // Add categories if available
  if (recipe.category && recipe.category.length > 0) {
    schema.recipeCategory = recipe.category;
  }

  // Add keywords (tags) if available
  if (recipe.tags && recipe.tags.length > 0) {
    schema.keywords = recipe.tags.join(', ');
  }

  // Add nutrition information if available
  if (recipe.nutrition) {
    const nutrition: any = {
      '@type': 'NutritionInformation',
    };

    if (recipe.nutrition.calories) {
      nutrition.calories = `${recipe.nutrition.calories} калорий`;
    }
    if (recipe.nutrition.protein) {
      nutrition.proteinContent = `${recipe.nutrition.protein} г`;
    }
    if (recipe.nutrition.fat) {
      nutrition.fatContent = `${recipe.nutrition.fat} г`;
    }
    if (recipe.nutrition.carbs) {
      nutrition.carbohydrateContent = `${recipe.nutrition.carbs} г`;
    }

    schema.nutrition = nutrition;
  }

  // Add rating if available
  if (recipe.rating && recipe.rating > 0) {
    schema.aggregateRating = {
      '@type': 'AggregateRating',
      ratingValue: recipe.rating,
      // Use a minimum of 1 review count to be valid
      ratingCount: 1,
      bestRating: 5,
      worstRating: 1,
    };
  }

  return schema;
};

/**
 * Generate BreadcrumbList schema.org JSON-LD
 * @param breadcrumbs - Array of breadcrumb items
 * @param siteUrl - Site base URL
 * @returns BreadcrumbList schema object
 */
export const generateBreadcrumbSchema = (
  breadcrumbs: Array<{ label: string; url?: string }>,
  siteUrl: string
) => {
  const itemListElement = breadcrumbs.map((item, index) => {
    const element: any = {
      '@type': 'ListItem',
      position: index + 1,
      name: item.label,
    };

    if (item.url) {
      element.item = item.url.startsWith('http')
        ? item.url
        : `${siteUrl}${item.url}`;
    }

    return element;
  });

  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement,
  };
};

/**
 * Generate WebSite schema.org JSON-LD
 * @param siteName - Site name
 * @param siteUrl - Site base URL
 * @param description - Site description
 * @returns WebSite schema object
 */
export const generateWebSiteSchema = (
  siteName: string,
  siteUrl: string,
  description: string
) => {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: siteName,
    url: siteUrl,
    description: description,
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${siteUrl}/search?q={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  };
};

/**
 * Generate Organization schema.org JSON-LD
 * @param siteName - Site name
 * @param siteUrl - Site base URL
 * @param logoUrl - Logo URL
 * @param socialLinks - Social media links
 * @returns Organization schema object
 */
export const generateOrganizationSchema = (
  siteName: string,
  siteUrl: string,
  logoUrl?: string,
  socialLinks?: {
    youtube?: string;
    instagram?: string;
    telegram?: string;
    tiktok?: string;
  }
) => {
  const schema: any = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: siteName,
    url: siteUrl,
  };

  if (logoUrl) {
    schema.logo = logoUrl.startsWith('http')
      ? logoUrl
      : `${siteUrl}${logoUrl}`;
  }

  if (socialLinks) {
    const sameAs: string[] = [];
    if (socialLinks.youtube) sameAs.push(socialLinks.youtube);
    if (socialLinks.instagram) sameAs.push(socialLinks.instagram);
    if (socialLinks.telegram) sameAs.push(socialLinks.telegram);
    if (socialLinks.tiktok) sameAs.push(socialLinks.tiktok);

    if (sameAs.length > 0) {
      schema.sameAs = sameAs;
    }
  }

  return schema;
};
