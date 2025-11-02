import { Router } from 'express';
import {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  changePassword,
  toggleUserStatus,
} from '../controllers/userController';
import {
  authenticateToken,
  requireAdminOrAbove,
} from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';
import { validate } from '../middleware/validation';
import {
  createUserSchema,
  updateUserSchema,
  changePasswordSchema,
  toggleUserStatusSchema,
} from '../validators/user.validator';

const router = Router();

// Apply authentication and admin check to all user management routes
// Only ADMIN and SUPER_ADMIN can access these routes
router.use(authenticateToken);
router.use(requireAdminOrAbove);

// User management routes
router.get('/', asyncHandler(getAllUsers));
router.get('/:id', asyncHandler(getUserById));
router.post('/', validate(createUserSchema), asyncHandler(createUser));
router.put('/:id', validate(updateUserSchema), asyncHandler(updateUser));
router.delete('/:id', asyncHandler(deleteUser));
router.patch('/:id/password', validate(changePasswordSchema), asyncHandler(changePassword));
router.patch('/:id/status', validate(toggleUserStatusSchema), asyncHandler(toggleUserStatus));

export default router;
