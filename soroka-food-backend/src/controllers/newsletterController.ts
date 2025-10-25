import { Request, Response } from 'express';
import prisma from '../config/database';
import { AppError } from '../middleware/errorHandler';

// Subscribe to newsletter (public endpoint)
export const subscribe = async (req: Request, res: Response): Promise<void> => {
  const { email } = req.body;

  if (!email) {
    throw new AppError('Email is required', 400);
  }

  // Basic email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    throw new AppError('Invalid email format', 400);
  }

  // Check if already subscribed
  const existing = await prisma.newsletterSubscriber.findUnique({
    where: { email }
  });

  if (existing) {
    if (existing.status === 'ACTIVE') {
      throw new AppError('This email is already subscribed', 400);
    } else {
      // Reactivate subscription
      await prisma.newsletterSubscriber.update({
        where: { email },
        data: { status: 'ACTIVE' }
      });
      res.json({ message: 'Subscription reactivated successfully' });
      return;
    }
  }

  // Create new subscription
  await prisma.newsletterSubscriber.create({
    data: { email }
  });

  res.status(201).json({ message: 'Successfully subscribed to newsletter' });
};

// Unsubscribe from newsletter
export const unsubscribe = async (req: Request, res: Response): Promise<void> => {
  const { email } = req.body;

  if (!email) {
    throw new AppError('Email is required', 400);
  }

  const subscriber = await prisma.newsletterSubscriber.findUnique({
    where: { email }
  });

  if (!subscriber) {
    throw new AppError('Email not found in subscribers', 404);
  }

  await prisma.newsletterSubscriber.update({
    where: { email },
    data: { status: 'UNSUBSCRIBED' }
  });

  res.json({ message: 'Successfully unsubscribed from newsletter' });
};
