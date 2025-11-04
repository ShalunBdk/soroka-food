import { Request } from 'express';
import prisma from '../config/database';

// Action types for admin logging
export enum AdminAction {
  // Authentication
  LOGIN = 'LOGIN',
  LOGOUT = 'LOGOUT',

  // Recipe actions
  CREATE_RECIPE = 'CREATE_RECIPE',
  UPDATE_RECIPE = 'UPDATE_RECIPE',
  DELETE_RECIPE = 'DELETE_RECIPE',
  PUBLISH_RECIPE = 'PUBLISH_RECIPE',
  UNPUBLISH_RECIPE = 'UNPUBLISH_RECIPE',

  // Category actions
  CREATE_CATEGORY = 'CREATE_CATEGORY',
  UPDATE_CATEGORY = 'UPDATE_CATEGORY',
  DELETE_CATEGORY = 'DELETE_CATEGORY',

  // Tag actions
  RENAME_TAG = 'RENAME_TAG',
  DELETE_TAG = 'DELETE_TAG',

  // Comment actions
  APPROVE_COMMENT = 'APPROVE_COMMENT',
  REJECT_COMMENT = 'REJECT_COMMENT',
  MARK_SPAM_COMMENT = 'MARK_SPAM_COMMENT',
  DELETE_COMMENT = 'DELETE_COMMENT',
  BULK_APPROVE_COMMENTS = 'BULK_APPROVE_COMMENTS',
  BULK_SPAM_COMMENTS = 'BULK_SPAM_COMMENTS',
  BULK_PENDING_COMMENTS = 'BULK_PENDING_COMMENTS',
  BULK_DELETE_COMMENTS = 'BULK_DELETE_COMMENTS',

  // User management
  CREATE_USER = 'CREATE_USER',
  UPDATE_USER = 'UPDATE_USER',
  DELETE_USER = 'DELETE_USER',
  CHANGE_USER_PASSWORD = 'CHANGE_USER_PASSWORD',
  TOGGLE_USER_STATUS = 'TOGGLE_USER_STATUS',

  // Newsletter
  EXPORT_SUBSCRIBERS = 'EXPORT_SUBSCRIBERS',
  DELETE_SUBSCRIBER = 'DELETE_SUBSCRIBER',

  // Settings
  UPDATE_SITE_SETTINGS = 'UPDATE_SITE_SETTINGS',
  UPDATE_STATIC_PAGE = 'UPDATE_STATIC_PAGE',
  UPDATE_SMTP_SETTINGS = 'UPDATE_SMTP_SETTINGS',
  TEST_SMTP = 'TEST_SMTP',

  // Email templates
  CREATE_EMAIL_TEMPLATE = 'CREATE_EMAIL_TEMPLATE',
  UPDATE_EMAIL_TEMPLATE = 'UPDATE_EMAIL_TEMPLATE',
  DELETE_EMAIL_TEMPLATE = 'DELETE_EMAIL_TEMPLATE',

  // Spam filter (SUPER_ADMIN only)
  UPDATE_SPAM_FILTER = 'UPDATE_SPAM_FILTER',
  ADD_SPAM_KEYWORD = 'ADD_SPAM_KEYWORD',
  REMOVE_SPAM_KEYWORD = 'REMOVE_SPAM_KEYWORD',

  // Uploads
  UPLOAD_RECIPE_IMAGE = 'UPLOAD_RECIPE_IMAGE',
  UPLOAD_STEP_IMAGES = 'UPLOAD_STEP_IMAGES',
}

// Resource types
export enum ResourceType {
  RECIPES = 'recipes',
  CATEGORIES = 'categories',
  TAGS = 'tags',
  COMMENTS = 'comments',
  USERS = 'users',
  NEWSLETTER = 'newsletter',
  SETTINGS = 'settings',
  STATIC_PAGES = 'static_pages',
  SPAM_FILTER = 'spam_filter',
  AUTH = 'auth',
  UPLOADS = 'uploads',
}

interface LogAdminActionParams {
  userId: number;
  action: AdminAction;
  resource: ResourceType;
  resourceId?: number;
  details?: any;
  req?: Request;
}

/**
 * Log admin action to database
 */
export const logAdminAction = async ({
  userId,
  action,
  resource,
  resourceId,
  details,
  req,
}: LogAdminActionParams): Promise<void> => {
  try {
    const ipAddress = req ? getClientIp(req) : null;
    const userAgent = req?.get('user-agent') || null;

    await prisma.adminLog.create({
      data: {
        userId,
        action,
        resource,
        resourceId: resourceId || null,
        details: details || null,
        ipAddress,
        userAgent,
      },
    });
  } catch (error) {
    // Don't throw error if logging fails - we don't want to break the actual operation
    console.error('Failed to log admin action:', error);
  }
};

/**
 * Get client IP address from request
 */
const getClientIp = (req: Request): string => {
  const forwarded = req.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  return req.ip || req.socket.remoteAddress || 'unknown';
};

/**
 * Helper to create details object for UPDATE actions
 */
export const createUpdateDetails = (before: any, after: any) => {
  return {
    before,
    after,
  };
};

/**
 * Helper to create details object for DELETE actions
 */
export const createDeleteDetails = (deletedData: any) => {
  return {
    deletedData,
  };
};

/**
 * Helper to create details object for BULK actions
 */
export const createBulkDetails = (affectedIds: number[], count?: number) => {
  return {
    affectedIds,
    count: count || affectedIds.length,
  };
};
