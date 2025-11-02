import { Response } from 'express';
import prisma from '../config/database';
import { hashPassword } from '../utils/password';
import { AppError } from '../middleware/errorHandler';
import { AuthRequest } from '../middleware/auth';
import {
  canManageUser,
  canCreateUserWithRole,
  cannotElevateOwnRole,
  isSelf,
  UserRole,
} from '../middleware/permissions';

/**
 * Get all users with optional role filter
 * GET /api/admin/users?role=MODERATOR
 */
export const getAllUsers = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  const { role } = req.query;

  const whereClause: any = {};
  if (role && typeof role === 'string') {
    whereClause.role = role;
  }

  const users = await prisma.user.findMany({
    where: whereClause,
    select: {
      id: true,
      username: true,
      email: true,
      role: true,
      active: true,
      createdAt: true,
      updatedAt: true,
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  res.json(users);
};

/**
 * Get a specific user by ID
 * GET /api/admin/users/:id
 */
export const getUserById = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  const { id } = req.params;
  const userId = parseInt(id, 10);

  if (isNaN(userId)) {
    throw new AppError('Invalid user ID', 400);
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      username: true,
      email: true,
      role: true,
      active: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  if (!user) {
    throw new AppError('User not found', 404);
  }

  res.json(user);
};

/**
 * Create a new user
 * POST /api/admin/users
 */
export const createUser = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  const { username, email, password, role } = req.body;
  const currentUserRole = req.user!.role as UserRole;

  // Check if current user can create a user with this role
  if (!canCreateUserWithRole(currentUserRole, role)) {
    throw new AppError(
      `You do not have permission to create a user with role ${role}`,
      403
    );
  }

  // Check if username already exists
  const existingUsername = await prisma.user.findUnique({
    where: { username },
  });

  if (existingUsername) {
    throw new AppError('Username already exists', 400);
  }

  // Check if email already exists
  const existingEmail = await prisma.user.findUnique({
    where: { email },
  });

  if (existingEmail) {
    throw new AppError('Email already exists', 400);
  }

  // Hash password
  const hashedPassword = await hashPassword(password);

  // Create user
  const newUser = await prisma.user.create({
    data: {
      username,
      email,
      password: hashedPassword,
      role,
      active: true,
    },
    select: {
      id: true,
      username: true,
      email: true,
      role: true,
      active: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  res.status(201).json({
    message: 'User created successfully',
    user: newUser,
  });
};

/**
 * Update an existing user
 * PUT /api/admin/users/:id
 */
export const updateUser = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  const { id } = req.params;
  const userId = parseInt(id, 10);
  const { username, email, role, active } = req.body;
  const currentUserId = req.user!.id;
  const currentUserRole = req.user!.role as UserRole;

  if (isNaN(userId)) {
    throw new AppError('Invalid user ID', 400);
  }

  // Find target user
  const targetUser = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!targetUser) {
    throw new AppError('User not found', 404);
  }

  // Check if current user can manage this user
  if (!canManageUser(currentUserRole, targetUser.role as UserRole)) {
    throw new AppError('You do not have permission to update this user', 403);
  }

  // If updating role, check permissions
  if (role && role !== targetUser.role) {
    // Check if user can create users with the new role
    if (!canCreateUserWithRole(currentUserRole, role)) {
      throw new AppError(
        `You do not have permission to assign role ${role}`,
        403
      );
    }

    // Prevent self-elevation
    if (!cannotElevateOwnRole(currentUserId, userId, currentUserRole, role)) {
      throw new AppError('You cannot elevate your own role', 403);
    }
  }

  // Check if new username already exists (if changing username)
  if (username && username !== targetUser.username) {
    const existingUsername = await prisma.user.findUnique({
      where: { username },
    });

    if (existingUsername) {
      throw new AppError('Username already exists', 400);
    }
  }

  // Check if new email already exists (if changing email)
  if (email && email !== targetUser.email) {
    const existingEmail = await prisma.user.findUnique({
      where: { email },
    });

    if (existingEmail) {
      throw new AppError('Email already exists', 400);
    }
  }

  // Update user
  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: {
      ...(username && { username }),
      ...(email && { email }),
      ...(role && { role }),
      ...(typeof active === 'boolean' && { active }),
    },
    select: {
      id: true,
      username: true,
      email: true,
      role: true,
      active: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  res.json({
    message: 'User updated successfully',
    user: updatedUser,
  });
};

/**
 * Delete a user
 * DELETE /api/admin/users/:id
 */
export const deleteUser = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  const { id } = req.params;
  const userId = parseInt(id, 10);
  const currentUserId = req.user!.id;
  const currentUserRole = req.user!.role as UserRole;

  if (isNaN(userId)) {
    throw new AppError('Invalid user ID', 400);
  }

  // Prevent self-deletion
  if (isSelf(currentUserId, userId)) {
    throw new AppError('You cannot delete your own account', 403);
  }

  // Find target user
  const targetUser = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!targetUser) {
    throw new AppError('User not found', 404);
  }

  // Check if current user can manage this user
  if (!canManageUser(currentUserRole, targetUser.role as UserRole)) {
    throw new AppError('You do not have permission to delete this user', 403);
  }

  // Prevent deletion of the last SUPER_ADMIN
  if (targetUser.role === 'SUPER_ADMIN') {
    const superAdminCount = await prisma.user.count({
      where: { role: 'SUPER_ADMIN' },
    });

    if (superAdminCount <= 1) {
      throw new AppError(
        'Cannot delete the last Super Admin user',
        403
      );
    }
  }

  // Delete user
  await prisma.user.delete({
    where: { id: userId },
  });

  res.json({
    message: 'User deleted successfully',
  });
};

/**
 * Change user password
 * PATCH /api/admin/users/:id/password
 */
export const changePassword = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  const { id } = req.params;
  const userId = parseInt(id, 10);
  const { newPassword } = req.body;
  const currentUserRole = req.user!.role as UserRole;

  if (isNaN(userId)) {
    throw new AppError('Invalid user ID', 400);
  }

  // Find target user
  const targetUser = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!targetUser) {
    throw new AppError('User not found', 404);
  }

  // Check if current user can manage this user
  if (!canManageUser(currentUserRole, targetUser.role as UserRole)) {
    throw new AppError(
      'You do not have permission to change this user\'s password',
      403
    );
  }

  // Hash new password
  const hashedPassword = await hashPassword(newPassword);

  // Update password
  await prisma.user.update({
    where: { id: userId },
    data: {
      password: hashedPassword,
    },
  });

  res.json({
    message: 'Password changed successfully',
  });
};

/**
 * Toggle user active status
 * PATCH /api/admin/users/:id/status
 */
export const toggleUserStatus = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  const { id } = req.params;
  const userId = parseInt(id, 10);
  const { active } = req.body;
  const currentUserId = req.user!.id;
  const currentUserRole = req.user!.role as UserRole;

  if (isNaN(userId)) {
    throw new AppError('Invalid user ID', 400);
  }

  // Prevent self-deactivation
  if (isSelf(currentUserId, userId) && !active) {
    throw new AppError('You cannot deactivate your own account', 403);
  }

  // Find target user
  const targetUser = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!targetUser) {
    throw new AppError('User not found', 404);
  }

  // Check if current user can manage this user
  if (!canManageUser(currentUserRole, targetUser.role as UserRole)) {
    throw new AppError(
      'You do not have permission to change this user\'s status',
      403
    );
  }

  // Update status
  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: { active },
    select: {
      id: true,
      username: true,
      email: true,
      role: true,
      active: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  res.json({
    message: 'User status updated successfully',
    user: updatedUser,
  });
};
