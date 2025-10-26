import { Request, Response } from 'express';
import prisma from '../config/database';
import { AppError } from '../middleware/errorHandler';

// Get dashboard statistics
export const getDashboardStats = async (req: Request, res: Response): Promise<void> => {
  const [
    totalRecipes,
    publishedRecipes,
    draftRecipes,
    totalComments,
    pendingComments,
    totalSubscribers,
    recentRecipes
  ] = await Promise.all([
    prisma.recipe.count(),
    prisma.recipe.count({ where: { status: 'PUBLISHED' } }),
    prisma.recipe.count({ where: { status: 'DRAFT' } }),
    prisma.comment.count(),
    prisma.comment.count({ where: { status: 'PENDING' } }),
    prisma.newsletterSubscriber.count({ where: { status: 'ACTIVE' } }),
    prisma.recipe.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: {
        _count: { select: { comments: true } }
      }
    })
  ]);

  // Calculate views for last 7 and 30 days
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const recentRecipes7Days = await prisma.recipe.findMany({
    where: {
      createdAt: { gte: sevenDaysAgo }
    },
    select: { views: true }
  });

  const recentRecipes30Days = await prisma.recipe.findMany({
    where: {
      createdAt: { gte: thirtyDaysAgo }
    },
    select: { views: true }
  });

  const viewsLast7Days = recentRecipes7Days.reduce((sum, r) => sum + r.views, 0);
  const viewsLast30Days = recentRecipes30Days.reduce((sum, r) => sum + r.views, 0);

  res.json({
    stats: {
      totalRecipes,
      publishedRecipes,
      draftRecipes,
      totalComments,
      pendingComments,
      totalSubscribers,
      viewsLast7Days,
      viewsLast30Days
    },
    recentRecipes: recentRecipes.map(r => ({
      id: r.id,
      title: r.title,
      image: r.image,
      status: r.status,
      views: r.views,
      commentsCount: r._count.comments,
      date: r.date.toISOString().split('T')[0],
      createdAt: r.createdAt
    }))
  });
};

// CRUD for Recipes (Admin)
export const getRecipeById = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;

  const recipe = await prisma.recipe.findUnique({
    where: { id: parseInt(id) },
    include: {
      categories: {
        include: { category: true }
      },
      _count: { select: { comments: true } }
    }
  });

  if (!recipe) {
    throw new AppError('Recipe not found', 404);
  }

  const formattedRecipe = {
    id: recipe.id,
    title: recipe.title,
    description: recipe.description,
    image: recipe.image,
    cookingTime: recipe.cookingTime,
    calories: recipe.calories,
    servings: recipe.servings,
    author: recipe.author,
    ingredients: recipe.ingredients,
    instructions: recipe.instructions,
    nutrition: recipe.nutrition,
    tips: recipe.tips,
    tags: recipe.tags,
    status: recipe.status,
    views: recipe.views,
    rating: recipe.rating,
    date: recipe.date.toISOString().split('T')[0],
    categories: recipe.categories.map(c => ({ id: c.category.id, name: c.category.name })),
    commentsCount: recipe._count.comments,
    createdAt: recipe.createdAt,
    updatedAt: recipe.updatedAt
  };

  res.json(formattedRecipe);
};

export const getAllRecipes = async (req: Request, res: Response): Promise<void> => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const status = req.query.status as string;
  const skip = (page - 1) * limit;

  const where: any = {};
  if (status && (status === 'PUBLISHED' || status === 'DRAFT')) {
    where.status = status;
  }

  const [recipes, total] = await Promise.all([
    prisma.recipe.findMany({
      where,
      skip,
      take: limit,
      include: {
        categories: {
          include: { category: true }
        },
        _count: { select: { comments: true } }
      },
      orderBy: { createdAt: 'desc' }
    }),
    prisma.recipe.count({ where })
  ]);

  const formattedRecipes = recipes.map(r => ({
    id: r.id,
    title: r.title,
    description: r.description,
    image: r.image,
    status: r.status,
    views: r.views,
    rating: r.rating,
    date: r.date.toISOString().split('T')[0],
    categories: r.categories.map(c => ({ id: c.category.id, name: c.category.name })),
    commentsCount: r._count.comments,
    createdAt: r.createdAt,
    updatedAt: r.updatedAt
  }));

  res.json({
    data: formattedRecipes,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    }
  });
};

export const createRecipe = async (req: Request, res: Response): Promise<void> => {
  const {
    title,
    description,
    image,
    cookingTime,
    calories,
    servings,
    author,
    ingredients,
    instructions,
    nutrition,
    tips,
    tags,
    categories,
    status
  } = req.body;

  if (!title || !description || !cookingTime || !servings) {
    throw new AppError('Title, description, cooking time, and servings are required', 400);
  }

  const recipe = await prisma.recipe.create({
    data: {
      title,
      description,
      image,
      cookingTime: parseInt(cookingTime),
      calories: parseInt(calories) || 0,
      servings: parseInt(servings),
      author: author || 'Soroka',
      ingredients: ingredients || [],
      instructions: instructions || [],
      nutrition: nutrition || {},
      tips: tips || [],
      tags: tags || [],
      status: status || 'DRAFT'
    }
  });

  // Add categories if provided
  if (categories && Array.isArray(categories) && categories.length > 0) {
    await prisma.recipeCategory.createMany({
      data: categories.map((categoryId: number) => ({
        recipeId: recipe.id,
        categoryId
      }))
    });
  }

  res.status(201).json({ message: 'Recipe created successfully', recipe });
};

export const updateRecipe = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const {
    title,
    description,
    image,
    cookingTime,
    calories,
    servings,
    author,
    ingredients,
    instructions,
    nutrition,
    tips,
    tags,
    categories,
    status
  } = req.body;

  const recipe = await prisma.recipe.findUnique({ where: { id: parseInt(id) } });
  if (!recipe) {
    throw new AppError('Recipe not found', 404);
  }

  const updated = await prisma.recipe.update({
    where: { id: parseInt(id) },
    data: {
      title,
      description,
      image,
      cookingTime: cookingTime ? parseInt(cookingTime) : undefined,
      calories: calories ? parseInt(calories) : undefined,
      servings: servings ? parseInt(servings) : undefined,
      author,
      ingredients,
      instructions,
      nutrition,
      tips,
      tags,
      status
    }
  });

  // Update categories if provided
  if (categories && Array.isArray(categories)) {
    await prisma.recipeCategory.deleteMany({
      where: { recipeId: parseInt(id) }
    });

    if (categories.length > 0) {
      await prisma.recipeCategory.createMany({
        data: categories.map((categoryId: number) => ({
          recipeId: parseInt(id),
          categoryId
        }))
      });
    }
  }

  res.json({ message: 'Recipe updated successfully', recipe: updated });
};

export const deleteRecipe = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;

  const recipe = await prisma.recipe.findUnique({ where: { id: parseInt(id) } });
  if (!recipe) {
    throw new AppError('Recipe not found', 404);
  }

  await prisma.recipe.delete({ where: { id: parseInt(id) } });

  res.json({ message: 'Recipe deleted successfully' });
};

// CRUD for Categories (Admin)
export const createCategory = async (req: Request, res: Response): Promise<void> => {
  const { name, slug, description } = req.body;

  if (!name || !slug) {
    throw new AppError('Name and slug are required', 400);
  }

  const category = await prisma.category.create({
    data: { name, slug, description }
  });

  res.status(201).json({ message: 'Category created successfully', category });
};

export const updateCategory = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const { name, slug, description } = req.body;

  const category = await prisma.category.update({
    where: { id: parseInt(id) },
    data: { name, slug, description }
  });

  res.json({ message: 'Category updated successfully', category });
};

export const deleteCategory = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;

  await prisma.category.delete({ where: { id: parseInt(id) } });

  res.json({ message: 'Category deleted successfully' });
};

// Comment moderation
export const getAllComments = async (req: Request, res: Response): Promise<void> => {
  const status = req.query.status as string;
  const where: any = {};
  if (status && ['APPROVED', 'PENDING', 'SPAM'].includes(status)) {
    where.status = status;
  }

  const comments = await prisma.comment.findMany({
    where,
    include: {
      recipe: {
        select: { id: true, title: true }
      }
    },
    orderBy: { createdAt: 'desc' }
  });

  const formattedComments = comments.map(c => ({
    id: c.id,
    author: c.author,
    email: c.email,
    rating: c.rating,
    text: c.text,
    status: c.status,
    date: formatDate(c.createdAt),
    recipe: {
      id: c.recipe.id,
      title: c.recipe.title
    },
    recipeId: c.recipe.id,
    createdAt: c.createdAt
  }));

  res.json(formattedComments);
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

export const moderateComment = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const { status } = req.body;

  if (!['APPROVED', 'PENDING', 'SPAM'].includes(status)) {
    throw new AppError('Invalid status', 400);
  }

  const comment = await prisma.comment.update({
    where: { id: parseInt(id) },
    data: { status }
  });

  res.json({ message: 'Comment status updated', comment });
};

export const deleteComment = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;

  await prisma.comment.delete({ where: { id: parseInt(id) } });

  res.json({ message: 'Comment deleted successfully' });
};

// Newsletter subscribers management
export const getAllSubscribers = async (req: Request, res: Response): Promise<void> => {
  const subscribers = await prisma.newsletterSubscriber.findMany({
    orderBy: { subscribedDate: 'desc' }
  });

  const formattedSubscribers = subscribers.map(s => ({
    id: s.id,
    email: s.email,
    status: s.status,
    createdAt: s.subscribedDate
  }));

  res.json(formattedSubscribers);
};

export const deleteSubscriber = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;

  await prisma.newsletterSubscriber.delete({ where: { id: parseInt(id) } });

  res.json({ message: 'Subscriber deleted successfully' });
};

// Site settings
export const getSettings = async (req: Request, res: Response): Promise<void> => {
  let settings = await prisma.siteSettings.findUnique({ where: { id: 1 } });

  if (!settings) {
    settings = await prisma.siteSettings.create({
      data: { id: 1 }
    });
  }

  // Transform flat structure to nested structure for frontend
  const formattedSettings = {
    siteName: settings.siteName || '',
    siteDescription: settings.siteDescription || '',
    logo: settings.logo || '',
    socialLinks: {
      youtube: settings.youtube || '',
      instagram: settings.instagram || '',
      telegram: settings.telegram || '',
      tiktok: settings.tiktok || ''
    },
    seo: {
      metaTitle: settings.metaTitle || '',
      metaDescription: settings.metaDescription || '',
      metaKeywords: settings.metaKeywords || ''
    }
  };

  res.json(formattedSettings);
};

export const updateSettings = async (req: Request, res: Response): Promise<void> => {
  const {
    siteName,
    siteDescription,
    logo,
    socialLinks,
    seo
  } = req.body;

  // Get current settings to preserve fields that aren't being updated
  const currentSettings = await prisma.siteSettings.findUnique({ where: { id: 1 } });

  // Flatten nested structure for database
  const flatData: any = {
    siteName,
    siteDescription,
    youtube: socialLinks?.youtube || '',
    instagram: socialLinks?.instagram || '',
    telegram: socialLinks?.telegram || '',
    tiktok: socialLinks?.tiktok || '',
    metaTitle: seo?.metaTitle || '',
    metaDescription: seo?.metaDescription || '',
    metaKeywords: seo?.metaKeywords || ''
  };

  // Only update logo if a new value is provided (not empty string)
  if (logo !== undefined && logo !== null && logo !== '') {
    flatData.logo = logo;
  } else if (currentSettings?.logo) {
    flatData.logo = currentSettings.logo;
  } else {
    flatData.logo = '';
  }

  const settings = await prisma.siteSettings.upsert({
    where: { id: 1 },
    update: flatData,
    create: {
      id: 1,
      ...flatData
    }
  });

  // Return formatted structure to frontend
  const formattedSettings = {
    siteName: settings.siteName || '',
    siteDescription: settings.siteDescription || '',
    logo: settings.logo || '',
    socialLinks: {
      youtube: settings.youtube || '',
      instagram: settings.instagram || '',
      telegram: settings.telegram || '',
      tiktok: settings.tiktok || ''
    },
    seo: {
      metaTitle: settings.metaTitle || '',
      metaDescription: settings.metaDescription || '',
      metaKeywords: settings.metaKeywords || ''
    }
  };

  res.json({ message: 'Settings updated successfully', settings: formattedSettings });
};
