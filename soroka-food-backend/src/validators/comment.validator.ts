import { z } from 'zod';

export const createCommentSchema = z.object({
  body: z.object({
    recipeId: z.number()
      .int('Recipe ID must be an integer')
      .positive('Recipe ID must be positive'),
    author: z.string()
      .min(2, 'Author name must be at least 2 characters')
      .max(100, 'Author name must not exceed 100 characters'),
    email: z.string()
      .email('Invalid email address')
      .max(255, 'Email must not exceed 255 characters')
      .optional(),
    text: z.string()
      .min(10, 'Comment text must be at least 10 characters')
      .max(1000, 'Comment text must not exceed 1000 characters'),
    rating: z.number()
      .int('Rating must be an integer')
      .min(1, 'Rating must be at least 1')
      .max(5, 'Rating must not exceed 5')
  })
});

export const updateCommentStatusSchema = z.object({
  params: z.object({
    id: z.string().regex(/^\d+$/, 'Comment ID must be a number')
  }),
  body: z.object({
    status: z.enum(['APPROVED', 'PENDING', 'SPAM'])
  })
});
