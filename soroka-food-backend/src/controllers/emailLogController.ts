import { Response } from 'express';
import prisma from '../config/database';
import { AppError } from '../middleware/errorHandler';
import { AuthRequest } from '../middleware/auth';

// Get email logs with filtering and pagination (ADMIN+ only)
export const getEmailLogs = async (req: AuthRequest, res: Response): Promise<void> => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = Math.min(parseInt(req.query.limit as string) || 25, 100);
  const skip = (page - 1) * limit;

  const status = req.query.status as string;
  const templateId = req.query.templateId ? parseInt(req.query.templateId as string) : undefined;
  const startDate = req.query.startDate as string;
  const endDate = req.query.endDate as string;

  // Build where clause
  const where: any = {};

  if (status && (status === 'SENT' || status === 'FAILED' || status === 'PENDING')) {
    where.status = status;
  }

  if (templateId) {
    where.templateId = templateId;
  }

  if (startDate || endDate) {
    where.createdAt = {};
    if (startDate) {
      where.createdAt.gte = new Date(startDate);
    }
    if (endDate) {
      const endDateTime = new Date(endDate);
      endDateTime.setHours(23, 59, 59, 999);
      where.createdAt.lte = endDateTime;
    }
  }

  const [logs, total] = await Promise.all([
    prisma.emailLog.findMany({
      where,
      skip,
      take: limit,
      include: {
        subscriber: {
          select: {
            email: true
          }
        },
        template: {
          select: {
            id: true,
            name: true,
            type: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    }),
    prisma.emailLog.count({ where })
  ]);

  res.json({
    logs: logs.map((log: any) => ({
      id: log.id,
      recipient: log.recipient,
      subscriberEmail: log.subscriber.email,
      subject: log.subject,
      status: log.status,
      template: log.template ? {
        id: log.template.id,
        name: log.template.name,
        type: log.template.type
      } : null,
      error: log.error,
      sentAt: log.sentAt,
      createdAt: log.createdAt
    })),
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    }
  });
};

// Get email log statistics (ADMIN+ only)
export const getEmailLogStats = async (req: AuthRequest, res: Response): Promise<void> => {
  const [
    totalSent,
    totalFailed,
    totalPending,
    recentActivity
  ] = await Promise.all([
    prisma.emailLog.count({ where: { status: 'SENT' } }),
    prisma.emailLog.count({ where: { status: 'FAILED' } }),
    prisma.emailLog.count({ where: { status: 'PENDING' } }),
    prisma.emailLog.count({
      where: {
        createdAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
        }
      }
    })
  ]);

  // Get stats by template type
  const templateStats = await prisma.emailLog.groupBy({
    by: ['templateId'],
    _count: { id: true },
    where: {
      templateId: { not: null }
    }
  });

  // Get template names for stats
  const templateIds = templateStats.map((s: any) => s.templateId!);
  const templates = await prisma.emailTemplate.findMany({
    where: { id: { in: templateIds } },
    select: { id: true, name: true, type: true }
  });

  const templateStatsWithNames = templateStats.map((stat: any) => {
    const template = templates.find((t: any) => t.id === stat.templateId);
    return {
      templateId: stat.templateId,
      templateName: template?.name || 'Unknown',
      templateType: template?.type || 'Unknown',
      count: stat._count.id
    };
  });

  res.json({
    totalSent,
    totalFailed,
    totalPending,
    recentActivity,
    templateStats: templateStatsWithNames
  });
};

// Retry failed email (SUPER_ADMIN only)
export const retryFailedEmail = async (req: AuthRequest, res: Response): Promise<void> => {
  const { id } = req.params;

  const log = await prisma.emailLog.findUnique({
    where: { id: parseInt(id) },
    include: {
      subscriber: true,
      template: true
    }
  });

  if (!log) {
    throw new AppError('Email log not found', 404);
  }

  if (log.status !== 'FAILED') {
    throw new AppError('Can only retry failed emails', 400);
  }

  // Update status to pending
  await prisma.emailLog.update({
    where: { id: parseInt(id) },
    data: { status: 'PENDING', error: null }
  });

  // TODO: Implement actual retry logic with email service
  // For now, just update the status

  res.json({ message: 'Email marked for retry' });
};
