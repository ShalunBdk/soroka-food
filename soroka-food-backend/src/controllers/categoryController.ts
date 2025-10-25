import { Request, Response } from 'express';
import prisma from '../config/database';

// Get all categories with recipe count
export const getCategories = async (req: Request, res: Response): Promise<void> => {
  const categories = await prisma.category.findMany({
    include: {
      _count: {
        select: { recipes: true }
      }
    },
    orderBy: { name: 'asc' }
  });

  const categoriesWithCount = categories.map(category => ({
    id: category.id,
    name: category.name,
    slug: category.slug,
    description: category.description,
    recipeCount: category._count.recipes
  }));

  res.json(categoriesWithCount);
};

// Get recipes by category
export const getRecipesByCategory = async (req: Request, res: Response): Promise<void> => {
  const { slug } = req.params;
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 9;
  const skip = (page - 1) * limit;

  const category = await prisma.category.findUnique({
    where: { slug },
    include: {
      recipes: {
        where: {
          recipe: { status: 'PUBLISHED' }
        },
        include: {
          recipe: {
            include: {
              categories: {
                include: { category: true }
              },
              _count: {
                select: { comments: true }
              }
            }
          }
        },
        skip,
        take: limit
      }
    }
  });

  if (!category) {
    res.status(404).json({ error: 'Category not found' });
    return;
  }

  const recipes = category.recipes.map(rc => {
    const recipe = rc.recipe;
    return {
      id: recipe.id,
      title: recipe.title,
      description: recipe.description,
      image: recipe.image,
      cookingTime: recipe.cookingTime,
      calories: recipe.calories,
      servings: recipe.servings,
      author: recipe.author,
      date: recipe.date.toISOString().split('T')[0],
      views: recipe.views,
      rating: recipe.rating,
      category: recipe.categories.map(c => c.category.name),
      tags: recipe.tags,
      commentsCount: recipe._count.comments
    };
  });

  const total = await prisma.recipeCategory.count({
    where: {
      categoryId: category.id,
      recipe: { status: 'PUBLISHED' }
    }
  });

  res.json({
    category: {
      id: category.id,
      name: category.name,
      slug: category.slug,
      description: category.description
    },
    recipes,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    }
  });
};
