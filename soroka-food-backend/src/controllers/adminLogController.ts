import { Response } from 'express';
import prisma from '../config/database';
import { AuthRequest } from '../middleware/auth';

/**
 * Get admin logs with filtering and pagination
 * GET /api/admin/logs?page=1&limit=50&userId=1&action=CREATE_RECIPE&resource=recipes&startDate=2024-01-01&endDate=2024-12-31
 */
export const getAdminLogs = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  const {
    page = '1',
    limit = '50',
    userId,
    action,
    resource,
    startDate,
    endDate,
  } = req.query;

  const pageNum = parseInt(page as string, 10);
  const limitNum = parseInt(limit as string, 10);
  const skip = (pageNum - 1) * limitNum;

  // Build where clause for filtering
  const whereClause: any = {};

  if (userId) {
    whereClause.userId = parseInt(userId as string, 10);
  }

  if (action && typeof action === 'string') {
    whereClause.action = action;
  }

  if (resource && typeof resource === 'string') {
    whereClause.resource = resource;
  }

  if (startDate || endDate) {
    whereClause.createdAt = {};
    if (startDate) {
      whereClause.createdAt.gte = new Date(startDate as string);
    }
    if (endDate) {
      const endDateTime = new Date(endDate as string);
      endDateTime.setHours(23, 59, 59, 999);
      whereClause.createdAt.lte = endDateTime;
    }
  }

  // Get logs with user information
  const [logs, total] = await Promise.all([
    prisma.adminLog.findMany({
      where: whereClause,
      include: {
        user: {
          select: {
            id: true,
            username: true,
            role: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      skip,
      take: limitNum,
    }),
    prisma.adminLog.count({ where: whereClause }),
  ]);

  res.json({
    data: logs,
    pagination: {
      page: pageNum,
      limit: limitNum,
      total,
      totalPages: Math.ceil(total / limitNum),
    },
  });
};

/**
 * Get admin logs statistics
 * GET /api/admin/logs/stats
 */
export const getAdminLogsStats = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  const { days = '30' } = req.query;
  const daysNum = parseInt(days as string, 10);

  const startDate = new Date();
  startDate.setDate(startDate.getDate() - daysNum);

  // Get total logs count
  const totalLogs = await prisma.adminLog.count({
    where: {
      createdAt: {
        gte: startDate,
      },
    },
  });

  // Get logs by action type
  const logsByAction = await prisma.adminLog.groupBy({
    by: ['action'],
    where: {
      createdAt: {
        gte: startDate,
      },
    },
    _count: {
      id: true,
    },
    orderBy: {
      _count: {
        id: 'desc',
      },
    },
    take: 10,
  });

  // Get logs by user
  const logsByUser = await prisma.adminLog.groupBy({
    by: ['userId'],
    where: {
      createdAt: {
        gte: startDate,
      },
    },
    _count: {
      id: true,
    },
    orderBy: {
      _count: {
        id: 'desc',
      },
    },
    take: 10,
  });

  // Get user details for top users
  const userIds = logsByUser.map((log) => log.userId);
  const users = await prisma.user.findMany({
    where: {
      id: {
        in: userIds,
      },
    },
    select: {
      id: true,
      username: true,
      role: true,
    },
  });

  // Combine user data with log counts
  const topUsers = logsByUser.map((log) => {
    const user = users.find((u) => u.id === log.userId);
    return {
      userId: log.userId,
      username: user?.username || 'Unknown',
      role: user?.role || 'Unknown',
      count: log._count.id,
    };
  });

  // Get activity by day
  const activityByDay = await prisma.$queryRaw<
    Array<{ date: string; count: bigint }>
  >`
    SELECT
      DATE(created_at) as date,
      COUNT(*) as count
    FROM admin_logs
    WHERE created_at >= ${startDate}
    GROUP BY DATE(created_at)
    ORDER BY date DESC
  `;

  res.json({
    totalLogs,
    topActions: logsByAction.map((log) => ({
      action: log.action,
      count: log._count.id,
    })),
    topUsers,
    activityByDay: activityByDay.map((item) => ({
      date: item.date,
      count: Number(item.count),
    })),
  });
};
