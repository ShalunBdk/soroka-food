import { Request, Response } from 'express';
import prisma from '../config/database';
import { AppError } from '../middleware/errorHandler';
import { logAdminAction, AdminAction, ResourceType, createUpdateDetails, createDeleteDetails, createBulkDetails } from '../utils/adminLogger';
import { AuthRequest } from '../middleware/auth';
import { sendNewRecipeNewsletter } from '../utils/newsletterQueue';

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

  // Calculate total views across all recipes
  const allRecipes = await prisma.recipe.findMany({
    select: { views: true }
  });

  const totalViews = allRecipes.reduce((sum, r) => sum + r.views, 0);

  // Calculate average views per recipe
  const avgViewsPerRecipe = totalRecipes > 0 ? Math.round(totalViews / totalRecipes) : 0;

  res.json({
    stats: {
      totalRecipes,
      publishedRecipes,
      draftRecipes,
      totalComments,
      pendingComments,
      totalSubscribers,
      totalViews,
      avgViewsPerRecipe
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

export const createRecipe = async (req: AuthRequest, res: Response): Promise<void> => {
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

  // Log admin action
  await logAdminAction({
    userId: req.user!.id,
    action: AdminAction.CREATE_RECIPE,
    resource: ResourceType.RECIPES,
    resourceId: recipe.id,
    req
  });

  // Send newsletter if recipe is published
  if (status === 'PUBLISHED') {
    // Send newsletter asynchronously (don't wait for it to complete)
    sendNewRecipeNewsletter({
      id: recipe.id,
      title: recipe.title,
      description: recipe.description,
      image: recipe.image,
      cookingTime: recipe.cookingTime,
      servings: recipe.servings,
      calories: recipe.calories
    }).catch(error => {
      console.error('Failed to send newsletter for new recipe:', error);
    });
  }

  res.status(201).json({ message: 'Recipe created successfully', recipe });
};

export const updateRecipe = async (req: AuthRequest, res: Response): Promise<void> => {
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

  const oldRecipe = await prisma.recipe.findUnique({ where: { id: parseInt(id) } });
  if (!oldRecipe) {
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

  // Log admin action
  await logAdminAction({
    userId: req.user!.id,
    action: AdminAction.UPDATE_RECIPE,
    resource: ResourceType.RECIPES,
    resourceId: parseInt(id),
    details: createUpdateDetails(
      { title: oldRecipe.title, status: oldRecipe.status },
      { title: updated.title, status: updated.status }
    ),
    req
  });

  // Send newsletter if recipe status changed from DRAFT to PUBLISHED
  if (oldRecipe.status === 'DRAFT' && status === 'PUBLISHED') {
    // Send newsletter asynchronously (don't wait for it to complete)
    sendNewRecipeNewsletter({
      id: updated.id,
      title: updated.title,
      description: updated.description,
      image: updated.image,
      cookingTime: updated.cookingTime,
      servings: updated.servings,
      calories: updated.calories
    }).catch(error => {
      console.error('Failed to send newsletter for published recipe:', error);
    });
  }

  res.json({ message: 'Recipe updated successfully', recipe: updated });
};

export const deleteRecipe = async (req: AuthRequest, res: Response): Promise<void> => {
  const { id } = req.params;

  const recipe = await prisma.recipe.findUnique({ where: { id: parseInt(id) } });
  if (!recipe) {
    throw new AppError('Recipe not found', 404);
  }

  await prisma.recipe.delete({ where: { id: parseInt(id) } });

  // Log admin action
  await logAdminAction({
    userId: req.user!.id,
    action: AdminAction.DELETE_RECIPE,
    resource: ResourceType.RECIPES,
    resourceId: parseInt(id),
    details: createDeleteDetails({ title: recipe.title, id: recipe.id }),
    req
  });

  res.json({ message: 'Recipe deleted successfully' });
};

// CRUD for Categories (Admin)
export const createCategory = async (req: AuthRequest, res: Response): Promise<void> => {
  const { name, slug, description } = req.body;

  if (!name || !slug) {
    throw new AppError('Name and slug are required', 400);
  }

  const category = await prisma.category.create({
    data: { name, slug, description }
  });

  await logAdminAction({
    userId: req.user!.id,
    action: AdminAction.CREATE_CATEGORY,
    resource: ResourceType.CATEGORIES,
    resourceId: category.id,
    req
  });

  res.status(201).json({ message: 'Category created successfully', category });
};

export const updateCategory = async (req: AuthRequest, res: Response): Promise<void> => {
  const { id } = req.params;
  const { name, slug, description } = req.body;

  const oldCategory = await prisma.category.findUnique({ where: { id: parseInt(id) } });

  const category = await prisma.category.update({
    where: { id: parseInt(id) },
    data: { name, slug, description }
  });

  await logAdminAction({
    userId: req.user!.id,
    action: AdminAction.UPDATE_CATEGORY,
    resource: ResourceType.CATEGORIES,
    resourceId: parseInt(id),
    details: createUpdateDetails(oldCategory, category),
    req
  });

  res.json({ message: 'Category updated successfully', category });
};

export const deleteCategory = async (req: AuthRequest, res: Response): Promise<void> => {
  const { id } = req.params;

  const category = await prisma.category.findUnique({ where: { id: parseInt(id) } });

  await prisma.category.delete({ where: { id: parseInt(id) } });

  await logAdminAction({
    userId: req.user!.id,
    action: AdminAction.DELETE_CATEGORY,
    resource: ResourceType.CATEGORIES,
    resourceId: parseInt(id),
    details: createDeleteDetails(category),
    req
  });

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

export const moderateComment = async (req: AuthRequest, res: Response): Promise<void> => {
  const { id } = req.params;
  const { status } = req.body;

  if (!['APPROVED', 'PENDING', 'SPAM'].includes(status)) {
    throw new AppError('Invalid status', 400);
  }

  const oldComment = await prisma.comment.findUnique({ where: { id: parseInt(id) } });

  const comment = await prisma.comment.update({
    where: { id: parseInt(id) },
    data: { status }
  });

  const actionMap: Record<string, AdminAction> = {
    'APPROVED': AdminAction.APPROVE_COMMENT,
    'SPAM': AdminAction.MARK_SPAM_COMMENT,
    'PENDING': AdminAction.REJECT_COMMENT
  };

  await logAdminAction({
    userId: req.user!.id,
    action: actionMap[status],
    resource: ResourceType.COMMENTS,
    resourceId: parseInt(id),
    details: { oldStatus: oldComment?.status, newStatus: status },
    req
  });

  res.json({ message: 'Comment status updated', comment });
};

export const deleteComment = async (req: AuthRequest, res: Response): Promise<void> => {
  const { id } = req.params;

  const comment = await prisma.comment.findUnique({ where: { id: parseInt(id) } });

  await prisma.comment.delete({ where: { id: parseInt(id) } });

  await logAdminAction({
    userId: req.user!.id,
    action: AdminAction.DELETE_COMMENT,
    resource: ResourceType.COMMENTS,
    resourceId: parseInt(id),
    details: createDeleteDetails(comment),
    req
  });

  res.json({ message: 'Comment deleted successfully' });
};

// Bulk actions for comments
export const bulkCommentsAction = async (req: AuthRequest, res: Response): Promise<void> => {
  const { ids, action } = req.body;

  if (!Array.isArray(ids) || ids.length === 0) {
    throw new AppError('IDs array is required and must not be empty', 400);
  }

  if (!['delete', 'approve', 'spam', 'pending'].includes(action)) {
    throw new AppError('Invalid action. Must be: delete, approve, spam, or pending', 400);
  }

  const commentIds = ids.map(id => parseInt(id));

  let result;
  if (action === 'delete') {
    result = await prisma.comment.deleteMany({
      where: { id: { in: commentIds } }
    });
  } else {
    const statusMap: Record<string, string> = {
      approve: 'APPROVED',
      spam: 'SPAM',
      pending: 'PENDING'
    };

    result = await prisma.comment.updateMany({
      where: { id: { in: commentIds } },
      data: { status: statusMap[action] as any }
    });
  }

  const bulkActionMap: Record<string, AdminAction> = {
    'delete': AdminAction.BULK_DELETE_COMMENTS,
    'approve': AdminAction.BULK_APPROVE_COMMENTS,
    'spam': AdminAction.BULK_SPAM_COMMENTS,
    'pending': AdminAction.BULK_PENDING_COMMENTS
  };

  await logAdminAction({
    userId: req.user!.id,
    action: bulkActionMap[action],
    resource: ResourceType.COMMENTS,
    details: createBulkDetails(commentIds, result.count),
    req
  });

  res.json({
    message: `Bulk action completed successfully`,
    action,
    count: result.count
  });
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
    verified: s.verified,
    verifiedAt: s.verifiedAt,
    subscribedDate: s.subscribedDate,
    createdAt: s.subscribedDate
  }));

  res.json(formattedSubscribers);
};

export const deleteSubscriber = async (req: AuthRequest, res: Response): Promise<void> => {
  const { id } = req.params;

  const subscriber = await prisma.newsletterSubscriber.findUnique({ where: { id: parseInt(id) } });

  await prisma.newsletterSubscriber.delete({ where: { id: parseInt(id) } });

  await logAdminAction({
    userId: req.user!.id,
    action: AdminAction.DELETE_SUBSCRIBER,
    resource: ResourceType.NEWSLETTER,
    resourceId: parseInt(id),
    details: createDeleteDetails(subscriber),
    req
  });

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

export const updateSettings = async (req: AuthRequest, res: Response): Promise<void> => {
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

  // Log admin action
  await logAdminAction({
    userId: req.user!.id,
    action: AdminAction.UPDATE_SITE_SETTINGS,
    resource: ResourceType.SETTINGS,
    resourceId: 1,
    details: createUpdateDetails(currentSettings, settings),
    req
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
