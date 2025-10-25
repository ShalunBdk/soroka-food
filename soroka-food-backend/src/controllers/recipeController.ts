import { Request, Response } from 'express';
import prisma from '../config/database';
import { AppError } from '../middleware/errorHandler';

// Get all published recipes with pagination
export const getRecipes = async (req: Request, res: Response): Promise<void> => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 9;
  const skip = (page - 1) * limit;

  const where = { status: 'PUBLISHED' as const };

  const [recipes, total] = await Promise.all([
    prisma.recipe.findMany({
      where,
      skip,
      take: limit,
      include: {
        categories: {
          include: {
            category: true
          }
        },
        _count: {
          select: { comments: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    }),
    prisma.recipe.count({ where })
  ]);

  const recipesWithCategories = recipes.map(recipe => ({
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
    status: recipe.status,
    category: recipe.categories.map(c => c.category.name),
    tags: recipe.tags,
    commentsCount: recipe._count.comments
  }));

  res.json({
    data: recipesWithCategories,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    }
  });
};

// Get single recipe by ID
export const getRecipeById = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;

  const recipe = await prisma.recipe.findUnique({
    where: { id: parseInt(id) },
    include: {
      categories: {
        include: {
          category: true
        }
      },
      comments: {
        where: { status: 'APPROVED' },
        orderBy: { createdAt: 'desc' }
      }
    }
  });

  if (!recipe || recipe.status !== 'PUBLISHED') {
    throw new AppError('Recipe not found', 404);
  }

  // Increment views
  await prisma.recipe.update({
    where: { id: parseInt(id) },
    data: { views: { increment: 1 } }
  });

  const recipeDetail = {
    id: recipe.id,
    title: recipe.title,
    description: recipe.description,
    image: recipe.image,
    cookingTime: recipe.cookingTime,
    calories: recipe.calories,
    servings: recipe.servings,
    author: recipe.author,
    date: recipe.date.toISOString().split('T')[0],
    views: recipe.views + 1,
    rating: recipe.rating,
    status: recipe.status,
    category: recipe.categories.map(c => c.category.name),
    tags: recipe.tags,
    ingredients: recipe.ingredients,
    instructions: recipe.instructions,
    nutrition: recipe.nutrition,
    tips: recipe.tips,
    comments: recipe.comments.map(comment => ({
      id: comment.id,
      author: comment.author,
      date: formatDate(comment.createdAt),
      rating: comment.rating,
      text: comment.text
    }))
  };

  res.json(recipeDetail);
};

// Helper function to format dates
function formatDate(date: Date): string {
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - date.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Сегодня';
  if (diffDays === 1) return 'Вчера';
  if (diffDays === 2) return '2 дня назад';
  if (diffDays < 7) return `${diffDays} дней назад`;
  if (diffDays < 14) return '1 неделю назад';
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} недели назад`;
  if (diffDays < 60) return '1 месяц назад';

  return date.toISOString().split('T')[0];
}
