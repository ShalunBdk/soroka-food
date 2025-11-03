import { Request, Response } from 'express';
import prisma from '../config/database';
import { hashPassword, comparePassword } from '../utils/password';
import { generateToken } from '../utils/jwt';
import { AppError } from '../middleware/errorHandler';
import { logAdminAction, AdminAction, ResourceType } from '../utils/adminLogger';

export const login = async (req: Request, res: Response): Promise<void> => {
  const { username, password } = req.body;

  if (!username || !password) {
    throw new AppError('Username and password are required', 400);
  }

  // Find user
  const user = await prisma.user.findUnique({
    where: { username }
  });

  if (!user) {
    throw new AppError('Invalid credentials', 401);
  }

  // Check if user is active
  if (!user.active) {
    throw new AppError('Account is deactivated', 403);
  }

  // Verify password
  const isPasswordValid = await comparePassword(password, user.password);
  if (!isPasswordValid) {
    throw new AppError('Invalid credentials', 401);
  }

  // Generate token
  const token = generateToken({
    id: user.id,
    username: user.username,
    email: user.email,
    role: user.role
  });

  // Log admin login
  await logAdminAction({
    userId: user.id,
    action: AdminAction.LOGIN,
    resource: ResourceType.AUTH,
    req
  });

  res.json({
    message: 'Login successful',
    token,
    user: {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      active: user.active
    }
  });
};

export const register = async (req: Request, res: Response): Promise<void> => {
  const { username, email, password, role } = req.body;

  if (!username || !email || !password) {
    throw new AppError('Username, email and password are required', 400);
  }

  // Check if user exists
  const existingUser = await prisma.user.findFirst({
    where: {
      OR: [{ username }, { email }]
    }
  });

  if (existingUser) {
    throw new AppError('Username or email already exists', 400);
  }

  // Hash password
  const hashedPassword = await hashPassword(password);

  // Create user
  const user = await prisma.user.create({
    data: {
      username,
      email,
      password: hashedPassword,
      role: role || 'EDITOR'
    }
  });

  // Generate token
  const token = generateToken({
    id: user.id,
    username: user.username,
    email: user.email,
    role: user.role
  });

  res.status(201).json({
    message: 'User created successfully',
    token,
    user: {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role
    }
  });
};

export const getProfile = async (req: any, res: Response): Promise<void> => {
  const userId = req.user.id;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      username: true,
      email: true,
      role: true,
      createdAt: true
    }
  });

  if (!user) {
    throw new AppError('User not found', 404);
  }

  res.json({ user });
};
