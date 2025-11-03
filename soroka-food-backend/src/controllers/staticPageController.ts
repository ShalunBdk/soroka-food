import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { asyncHandler } from '../middleware/errorHandler';
import { AppError } from '../middleware/errorHandler';
import { logAdminAction, AdminAction, ResourceType, createUpdateDetails } from '../utils/adminLogger';
import { AuthRequest } from '../middleware/auth';

const prisma = new PrismaClient();

// Public endpoints

/**
 * Get static page by slug
 * GET /api/static-pages/:slug
 */
export const getStaticPageBySlug = asyncHandler(async (req: Request, res: Response) => {
  const { slug } = req.params;

  const page = await prisma.staticPage.findUnique({
    where: { slug }
  });

  if (!page) {
    throw new AppError('Page not found', 404);
  }

  res.json(page);
});

// Admin endpoints

/**
 * Get all static pages (admin)
 * GET /api/admin/static-pages
 */
export const getAllStaticPages = asyncHandler(async (req: Request, res: Response) => {
  const pages = await prisma.staticPage.findMany({
    orderBy: { slug: 'asc' }
  });

  res.json(pages);
});

/**
 * Get static page by ID (admin)
 * GET /api/admin/static-pages/:id
 */
export const getStaticPageById = asyncHandler(async (req: Request, res: Response) => {
  const id = parseInt(req.params.id);

  if (isNaN(id)) {
    throw new AppError('Invalid page ID', 400);
  }

  const page = await prisma.staticPage.findUnique({
    where: { id }
  });

  if (!page) {
    throw new AppError('Page not found', 404);
  }

  res.json(page);
});

/**
 * Update static page (admin)
 * PUT /api/admin/static-pages/:id
 */
export const updateStaticPage = asyncHandler(async (req: AuthRequest, res: Response) => {
  const id = parseInt(req.params.id);
  const { title, content } = req.body;

  if (isNaN(id)) {
    throw new AppError('Invalid page ID', 400);
  }

  // Validate required fields
  if (!title || !content) {
    throw new AppError('Title and content are required', 400);
  }

  // Check if page exists
  const existingPage = await prisma.staticPage.findUnique({
    where: { id }
  });

  if (!existingPage) {
    throw new AppError('Page not found', 404);
  }

  // Update page
  const updatedPage = await prisma.staticPage.update({
    where: { id },
    data: {
      title,
      content
    }
  });

  // Log admin action
  await logAdminAction({
    userId: req.user!.id,
    action: AdminAction.UPDATE_STATIC_PAGE,
    resource: ResourceType.STATIC_PAGES,
    resourceId: id,
    details: createUpdateDetails(
      { title: existingPage.title, slug: existingPage.slug },
      { title: updatedPage.title, slug: updatedPage.slug }
    ),
    req
  });

  res.json(updatedPage);
});
