import { Request, Response } from 'express';
import prisma from '../config/database';
import { AppError } from '../middleware/errorHandler';
import { checkForSpam, checkDuplicateComment } from '../utils/spamFilter';

// Create a new comment (public endpoint)
export const createComment = async (req: Request, res: Response): Promise<void> => {
  const { recipeId, author, email, rating, text, website } = req.body;

  if (!recipeId || !author || !rating || !text) {
    throw new AppError('Recipe ID, author, rating, and text are required', 400);
  }

  if (rating < 1 || rating > 5) {
    throw new AppError('Rating must be between 1 and 5', 400);
  }

  // HONEYPOT: If 'website' field is filled, it's a bot
  if (website) {
    // Silently mark as spam without telling the bot
    const spamComment = await prisma.comment.create({
      data: {
        recipeId: parseInt(recipeId),
        author,
        email,
        rating,
        text,
        status: 'SPAM'
      }
    });

    // Return success to fool the bot
    res.status(201).json({
      message: 'Comment submitted successfully and awaiting moderation',
      comment: {
        id: spamComment.id,
        author: spamComment.author,
        rating: spamComment.rating,
        text: spamComment.text,
        createdAt: spamComment.createdAt
      }
    });
    return;
  }

  // Verify recipe exists
  const recipe = await prisma.recipe.findUnique({
    where: { id: parseInt(recipeId) }
  });

  if (!recipe) {
    throw new AppError('Recipe not found', 404);
  }

  // Check for duplicate comments
  const isDuplicate = await checkDuplicateComment(text, author, prisma);
  if (isDuplicate) {
    throw new AppError('Duplicate comment detected. Please wait before posting again.', 429);
  }

  // Auto spam filter
  const spamCheck = await checkForSpam(text, author, email);
  const status = spamCheck.isSpam ? 'SPAM' : 'PENDING';

  const comment = await prisma.comment.create({
    data: {
      recipeId: parseInt(recipeId),
      author,
      email,
      rating,
      text,
      status
    }
  });

  res.status(201).json({
    message: 'Comment submitted successfully and awaiting moderation',
    comment: {
      id: comment.id,
      author: comment.author,
      rating: comment.rating,
      text: comment.text,
      createdAt: comment.createdAt
    }
  });
};

// Helper function to format dates (same as in recipeController)
function formatDate(date: Date): string {
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - date.getTime());

  // Calculate time differences
  const diffMinutes = Math.floor(diffTime / (1000 * 60));
  const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  // Less than 1 minute
  if (diffMinutes < 1) return 'Только что';

  // Less than 1 hour
  if (diffMinutes < 60) {
    if (diffMinutes === 1) return '1 минуту назад';
    if (diffMinutes < 5) return `${diffMinutes} минуты назад`;
    return `${diffMinutes} минут назад`;
  }

  // Less than 24 hours
  if (diffHours < 24) {
    if (diffHours === 1) return '1 час назад';
    if (diffHours < 5) return `${diffHours} часа назад`;
    return `${diffHours} часов назад`;
  }

  // Days
  if (diffDays === 1) return 'Вчера';
  if (diffDays === 2) return '2 дня назад';
  if (diffDays < 7) return `${diffDays} дней назад`;
  if (diffDays < 14) return '1 неделю назад';
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} недели назад`;
  if (diffDays < 60) return '1 месяц назад';

  return date.toISOString().split('T')[0];
}

// Get approved comments for a recipe with pagination
export const getRecipeComments = async (req: Request, res: Response): Promise<void> => {
  const { recipeId } = req.params;
  const page = parseInt(req.query.page as string) || 1;
  const limit = Math.min(parseInt(req.query.limit as string) || 20, 100); // Max 100 per page
  const skip = (page - 1) * limit;

  // Fetch comments and total count in parallel
  const [comments, total] = await Promise.all([
    prisma.comment.findMany({
      where: {
        recipeId: parseInt(recipeId),
        status: 'APPROVED'
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
      select: {
        id: true,
        author: true,
        rating: true,
        text: true,
        createdAt: true
      }
    }),
    prisma.comment.count({
      where: {
        recipeId: parseInt(recipeId),
        status: 'APPROVED'
      }
    })
  ]);

  const formattedComments = comments.map((comment: any) => ({
    id: comment.id,
    author: comment.author,
    rating: comment.rating,
    text: comment.text,
    date: formatDate(comment.createdAt)
  }));

  res.json({
    data: formattedComments,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      hasMore: page * limit < total
    }
  });
};
