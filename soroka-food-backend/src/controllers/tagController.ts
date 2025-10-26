import { Request, Response } from 'express';
import prisma from '../config/database';
import { AppError } from '../middleware/errorHandler';

// Get all unique tags with usage count
export const getAllTags = async (req: Request, res: Response): Promise<void> => {
  // Get all recipes with their tags
  const recipes = await prisma.recipe.findMany({
    select: { tags: true }
  });

  // Count tag occurrences
  const tagMap = new Map<string, number>();
  recipes.forEach(recipe => {
    recipe.tags.forEach(tag => {
      tagMap.set(tag, (tagMap.get(tag) || 0) + 1);
    });
  });

  // Convert to array and sort by usage count (descending), then alphabetically
  const tags = Array.from(tagMap.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => {
      if (b.count !== a.count) {
        return b.count - a.count;
      }
      return a.name.localeCompare(b.name, 'ru');
    });

  res.json(tags);
};

// Rename tag across all recipes
export const renameTag = async (req: Request, res: Response): Promise<void> => {
  const { oldName, newName } = req.body;

  if (!oldName || !newName) {
    throw new AppError('Old name and new name are required', 400);
  }

  if (oldName === newName) {
    throw new AppError('Old and new names cannot be the same', 400);
  }

  // Find all recipes with the old tag
  const recipesWithTag = await prisma.recipe.findMany({
    where: {
      tags: {
        has: oldName
      }
    },
    select: { id: true, tags: true }
  });

  if (recipesWithTag.length === 0) {
    throw new AppError('Tag not found', 404);
  }

  // Update each recipe
  await Promise.all(
    recipesWithTag.map(recipe => {
      const updatedTags = recipe.tags.map(tag =>
        tag === oldName ? newName : tag
      );
      return prisma.recipe.update({
        where: { id: recipe.id },
        data: { tags: updatedTags }
      });
    })
  );

  res.json({
    message: `Tag "${oldName}" renamed to "${newName}"`,
    updatedRecipes: recipesWithTag.length
  });
};

// Delete tag from all recipes
export const deleteTag = async (req: Request, res: Response): Promise<void> => {
  const { name } = req.params;

  if (!name) {
    throw new AppError('Tag name is required', 400);
  }

  // Find all recipes with this tag
  const recipesWithTag = await prisma.recipe.findMany({
    where: {
      tags: {
        has: name
      }
    },
    select: { id: true, tags: true }
  });

  if (recipesWithTag.length === 0) {
    throw new AppError('Tag not found', 404);
  }

  // Remove tag from each recipe
  await Promise.all(
    recipesWithTag.map(recipe => {
      const updatedTags = recipe.tags.filter(tag => tag !== name);
      return prisma.recipe.update({
        where: { id: recipe.id },
        data: { tags: updatedTags }
      });
    })
  );

  res.json({
    message: `Tag "${name}" deleted`,
    updatedRecipes: recipesWithTag.length
  });
};
