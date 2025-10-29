import { Request, Response } from 'express';
import prisma from '../config/database';
import { AppError } from '../middleware/errorHandler';

// Get all published recipes with pagination
export const getRecipes = async (req: Request, res: Response): Promise<void> => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 9;
  const skip = (page - 1) * limit;
  const sort = req.query.sort as string;

  const where: any = { status: 'PUBLISHED' as const };

  // Apply filters based on sort parameter
  if (sort === 'photo') {
    where.image = { not: null };
  }

  // Determine order by
  let orderBy: any = { createdAt: 'desc' }; // Default: newest

  if (sort === 'popular') {
    orderBy = { views: 'desc' };
  } else if (sort === 'newest') {
    orderBy = { createdAt: 'desc' };
  }

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
      orderBy
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
    views: recipe.views,
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

// Get recipes by cuisine type (stored in tags)
export const getRecipesByCuisine = async (req: Request, res: Response): Promise<void> => {
  const { type } = req.params;
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 9;
  const skip = (page - 1) * limit;

  // Map cuisine type to tag
  const cuisineMap: Record<string, string> = {
    'russian': 'Русская кухня',
    'european': 'Европейская кухня',
    'asian': 'Азиатская кухня',
    'eastern': 'Восточная кухня'
  };

  const cuisineTag = cuisineMap[type];

  if (!cuisineTag) {
    throw new AppError('Cuisine type not found', 404);
  }

  const where = {
    status: 'PUBLISHED' as const,
    tags: {
      has: cuisineTag
    }
  };

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
    category: recipe.categories.map(c => c.category.name),
    tags: recipe.tags,
    commentsCount: recipe._count.comments
  }));

  res.json({
    cuisine: {
      type,
      name: cuisineTag
    },
    recipes: recipesWithCategories,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    }
  });
};

// Search recipes by query
export const searchRecipes = async (req: Request, res: Response): Promise<void> => {
  const query = req.query.q as string;
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 9;
  const skip = (page - 1) * limit;

  if (!query || query.trim().length === 0) {
    res.json({
      data: [],
      pagination: {
        page,
        limit,
        total: 0,
        totalPages: 0
      }
    });
    return;
  }

  const searchTerm = query.trim();

  const where = {
    status: 'PUBLISHED' as const,
    OR: [
      {
        title: {
          contains: searchTerm,
          mode: 'insensitive' as const
        }
      },
      {
        description: {
          contains: searchTerm,
          mode: 'insensitive' as const
        }
      },
      {
        tags: {
          has: searchTerm
        }
      }
    ]
  };

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
    category: recipe.categories.map(c => c.category.name),
    tags: recipe.tags,
    commentsCount: recipe._count.comments
  }));

  res.json({
    query: searchTerm,
    data: recipesWithCategories,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    }
  });
};

// Get public site statistics
export const getPublicStats = async (req: Request, res: Response): Promise<void> => {
  const [totalRecipes, totalComments, totalUsers] = await Promise.all([
    prisma.recipe.count({ where: { status: 'PUBLISHED' } }),
    prisma.comment.count({ where: { status: 'APPROVED' } }),
    prisma.user.count()
  ]);

  res.json({
    recipesCount: totalRecipes,
    commentsCount: totalComments,
    usersCount: totalUsers
  });
};

// Increment recipe view count (separate endpoint for better tracking)
export const incrementRecipeView = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;

  // Check if recipe exists and is published
  const recipe = await prisma.recipe.findUnique({
    where: { id: parseInt(id) },
    select: { id: true, status: true }
  });

  if (!recipe || recipe.status !== 'PUBLISHED') {
    throw new AppError('Recipe not found', 404);
  }

  // Increment view count
  const updated = await prisma.recipe.update({
    where: { id: parseInt(id) },
    data: { views: { increment: 1 } },
    select: { views: true }
  });

  res.json({ success: true, views: updated.views });
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
