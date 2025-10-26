import { z } from 'zod';

const ingredientSchema = z.object({
  name: z.string().min(1, 'Ingredient name is required'),
  amount: z.string().min(1, 'Ingredient amount is required')
});

const instructionStepSchema = z.object({
  stepNumber: z.number().int().positive(),
  text: z.string().min(1, 'Instruction text is required'),
  images: z.array(z.string()).optional()
});

const nutritionSchema = z.object({
  calories: z.number().nonnegative().optional(),
  protein: z.number().nonnegative().optional(),
  fat: z.number().nonnegative().optional(),
  carbs: z.number().nonnegative().optional()
}).optional();

export const createRecipeSchema = z.object({
  body: z.object({
    title: z.string()
      .min(3, 'Title must be at least 3 characters')
      .max(255, 'Title must not exceed 255 characters'),
    description: z.string()
      .min(10, 'Description must be at least 10 characters')
      .max(1000, 'Description must not exceed 1000 characters'),
    cookingTime: z.number()
      .int('Cooking time must be an integer')
      .positive('Cooking time must be positive')
      .max(1440, 'Cooking time must not exceed 24 hours (1440 minutes)'),
    servings: z.number()
      .int('Servings must be an integer')
      .positive('Servings must be positive')
      .max(100, 'Servings must not exceed 100'),
    ingredients: z.array(ingredientSchema)
      .min(1, 'At least one ingredient is required'),
    instructions: z.array(instructionStepSchema)
      .min(1, 'At least one instruction step is required'),
    categoryIds: z.array(z.number().int().positive()).optional(),
    tags: z.array(z.string()).optional(),
    cuisine: z.string().optional(),
    image: z.string().optional(),
    nutrition: nutritionSchema,
    tips: z.array(z.string()).optional(),
    status: z.enum(['PUBLISHED', 'DRAFT']).default('DRAFT')
  })
});

export const updateRecipeSchema = z.object({
  params: z.object({
    id: z.string().regex(/^\d+$/, 'Recipe ID must be a number')
  }),
  body: z.object({
    title: z.string()
      .min(3, 'Title must be at least 3 characters')
      .max(255, 'Title must not exceed 255 characters')
      .optional(),
    description: z.string()
      .min(10, 'Description must be at least 10 characters')
      .max(1000, 'Description must not exceed 1000 characters')
      .optional(),
    cookingTime: z.number()
      .int('Cooking time must be an integer')
      .positive('Cooking time must be positive')
      .max(1440, 'Cooking time must not exceed 24 hours')
      .optional(),
    servings: z.number()
      .int('Servings must be an integer')
      .positive('Servings must be positive')
      .max(100, 'Servings must not exceed 100')
      .optional(),
    ingredients: z.array(ingredientSchema).optional(),
    instructions: z.array(instructionStepSchema).optional(),
    categoryIds: z.array(z.number().int().positive()).optional(),
    tags: z.array(z.string()).optional(),
    cuisine: z.string().optional(),
    image: z.string().optional(),
    nutrition: nutritionSchema,
    tips: z.array(z.string()).optional(),
    status: z.enum(['PUBLISHED', 'DRAFT']).optional()
  })
});
