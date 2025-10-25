import { Request, Response } from 'express';
import prisma from '../config/database';
import { AppError } from '../middleware/errorHandler';

// Create a new comment (public endpoint)
export const createComment = async (req: Request, res: Response): Promise<void> => {
  const { recipeId, author, email, rating, text } = req.body;

  if (!recipeId || !author || !rating || !text) {
    throw new AppError('Recipe ID, author, rating, and text are required', 400);
  }

  if (rating < 1 || rating > 5) {
    throw new AppError('Rating must be between 1 and 5', 400);
  }

  // Verify recipe exists
  const recipe = await prisma.recipe.findUnique({
    where: { id: parseInt(recipeId) }
  });

  if (!recipe) {
    throw new AppError('Recipe not found', 404);
  }

  const comment = await prisma.comment.create({
    data: {
      recipeId: parseInt(recipeId),
      author,
      email,
      rating,
      text,
      status: 'PENDING' // Needs moderation
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

// Get approved comments for a recipe
export const getRecipeComments = async (req: Request, res: Response): Promise<void> => {
  const { recipeId } = req.params;

  const comments = await prisma.comment.findMany({
    where: {
      recipeId: parseInt(recipeId),
      status: 'APPROVED'
    },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      author: true,
      rating: true,
      text: true,
      createdAt: true
    }
  });

  const formattedComments = comments.map(comment => ({
    id: comment.id,
    author: comment.author,
    rating: comment.rating,
    text: comment.text,
    date: formatDate(comment.createdAt)
  }));

  res.json(formattedComments);
};
