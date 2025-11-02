import { z } from 'zod';

// Schema for creating a new user
export const createUserSchema = z.object({
  body: z.object({
    username: z.string()
      .min(3, 'Username must be at least 3 characters')
      .max(50, 'Username must not exceed 50 characters')
      .regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores'),
    email: z.string()
      .email('Invalid email address')
      .max(255, 'Email must not exceed 255 characters'),
    password: z.string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
      .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
      .regex(/[0-9]/, 'Password must contain at least one number'),
    role: z.enum(['SUPER_ADMIN', 'ADMIN', 'MODERATOR'], {
      message: 'Role must be SUPER_ADMIN, ADMIN, or MODERATOR'
    })
  })
});

// Schema for updating an existing user
export const updateUserSchema = z.object({
  body: z.object({
    username: z.string()
      .min(3, 'Username must be at least 3 characters')
      .max(50, 'Username must not exceed 50 characters')
      .regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores')
      .optional(),
    email: z.string()
      .email('Invalid email address')
      .max(255, 'Email must not exceed 255 characters')
      .optional(),
    role: z.enum(['SUPER_ADMIN', 'ADMIN', 'MODERATOR'], {
      message: 'Role must be SUPER_ADMIN, ADMIN, or MODERATOR'
    }).optional(),
    active: z.boolean().optional()
  })
});

// Schema for changing password
export const changePasswordSchema = z.object({
  body: z.object({
    newPassword: z.string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
      .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
      .regex(/[0-9]/, 'Password must contain at least one number')
  })
});

// Schema for toggling user status
export const toggleUserStatusSchema = z.object({
  body: z.object({
    active: z.boolean({
      message: 'Active must be a boolean value'
    })
  })
});
