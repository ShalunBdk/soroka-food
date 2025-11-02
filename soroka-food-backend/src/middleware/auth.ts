import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface AuthRequest extends Request {
  user?: {
    id: number;
    username: string;
    email: string;
    role: string;
  };
}

export const authenticateToken = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    res.status(401).json({ error: 'Access token required' });
    return;
  }

  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET is not defined in environment variables');
  }

  try {
    const decoded = jwt.verify(token, secret) as {
      id: number;
      username: string;
      email: string;
      role: string;
    };

    req.user = decoded;
    next();
  } catch (error) {
    // 401 for invalid/expired tokens (authentication issue)
    res.status(401).json({ error: 'Invalid or expired token' });
  }
};

// Require SUPER_ADMIN role only
export const requireSuperAdmin = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void => {
  if (!req.user) {
    res.status(401).json({ error: 'Authentication required' });
    return;
  }

  if (req.user.role !== 'SUPER_ADMIN') {
    res.status(403).json({ error: 'Super admin access required' });
    return;
  }

  next();
};

// Require ADMIN or SUPER_ADMIN roles
export const requireAdminOrAbove = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void => {
  if (!req.user) {
    res.status(401).json({ error: 'Authentication required' });
    return;
  }

  if (req.user.role !== 'ADMIN' && req.user.role !== 'SUPER_ADMIN') {
    res.status(403).json({ error: 'Admin access required' });
    return;
  }

  next();
};

// Require MODERATOR, ADMIN, or SUPER_ADMIN roles
export const requireModeratorOrAbove = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void => {
  if (!req.user) {
    res.status(401).json({ error: 'Authentication required' });
    return;
  }

  if (
    req.user.role !== 'MODERATOR' &&
    req.user.role !== 'ADMIN' &&
    req.user.role !== 'SUPER_ADMIN'
  ) {
    res.status(403).json({ error: 'Moderator access required' });
    return;
  }

  next();
};

// Legacy alias for backward compatibility - same as requireModeratorOrAbove
export const requireAdmin = requireModeratorOrAbove;
