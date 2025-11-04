import { Response } from 'express';
import prisma from '../config/database';
import { AppError } from '../middleware/errorHandler';
import { AuthRequest } from '../middleware/auth';
import { logAdminAction, AdminAction, ResourceType, createUpdateDetails, createDeleteDetails } from '../utils/adminLogger';
import { getAllTemplateVariables } from '../utils/emailTemplates';
import Handlebars from 'handlebars';

// Get all email templates (SUPER_ADMIN only)
export const getAllTemplates = async (req: AuthRequest, res: Response): Promise<void> => {
  const templates = await prisma.emailTemplate.findMany({
    orderBy: { type: 'asc' }
  });

  res.json(templates);
};

// Get email template by ID (SUPER_ADMIN only)
export const getTemplate = async (req: AuthRequest, res: Response): Promise<void> => {
  const { id } = req.params;

  const template = await prisma.emailTemplate.findUnique({
    where: { id: parseInt(id) }
  });

  if (!template) {
    throw new AppError('Template not found', 404);
  }

  res.json(template);
};

// Create email template (SUPER_ADMIN only)
export const createTemplate = async (req: AuthRequest, res: Response): Promise<void> => {
  const { name, subject, bodyHtml, bodyText, variables, isDefault, type } = req.body;

  // Validation
  if (!name || !subject || !bodyHtml || !type) {
    throw new AppError('Missing required fields', 400);
  }

  if (name.length > 100) {
    throw new AppError('Name must be 100 characters or less', 400);
  }

  if (subject.length > 200) {
    throw new AppError('Subject must be 200 characters or less', 400);
  }

  // Check if name already exists
  const existing = await prisma.emailTemplate.findUnique({
    where: { name }
  });

  if (existing) {
    throw new AppError('Template with this name already exists', 400);
  }

  // If setting as default, unset other defaults for this type
  if (isDefault) {
    await prisma.emailTemplate.updateMany({
      where: { type, isDefault: true },
      data: { isDefault: false }
    });
  }

  const template = await prisma.emailTemplate.create({
    data: {
      name,
      subject,
      bodyHtml,
      bodyText: bodyText || '',
      variables: variables || [],
      isDefault: isDefault || false,
      type
    }
  });

  // Log admin action
  await logAdminAction({
    userId: req.user!.id,
    action: AdminAction.CREATE_EMAIL_TEMPLATE,
    resource: ResourceType.SETTINGS,
    resourceId: template.id,
    details: {
      type: 'email_template',
      name: template.name
    },
    req
  });

  res.status(201).json(template);
};

// Update email template (SUPER_ADMIN only)
export const updateTemplate = async (req: AuthRequest, res: Response): Promise<void> => {
  const { id } = req.params;
  const { name, subject, bodyHtml, bodyText, variables, isDefault, type } = req.body;

  const oldTemplate = await prisma.emailTemplate.findUnique({
    where: { id: parseInt(id) }
  });

  if (!oldTemplate) {
    throw new AppError('Template not found', 404);
  }

  // Validation
  if (name && name.length > 100) {
    throw new AppError('Name must be 100 characters or less', 400);
  }

  if (subject && subject.length > 200) {
    throw new AppError('Subject must be 200 characters or less', 400);
  }

  // Check if name already exists (excluding current template)
  if (name && name !== oldTemplate.name) {
    const existing = await prisma.emailTemplate.findUnique({
      where: { name }
    });

    if (existing) {
      throw new AppError('Template with this name already exists', 400);
    }
  }

  // If setting as default, unset other defaults for this type
  if (isDefault && (type || oldTemplate.type)) {
    const templateType = type || oldTemplate.type;
    await prisma.emailTemplate.updateMany({
      where: {
        type: templateType,
        isDefault: true,
        id: { not: parseInt(id) }
      },
      data: { isDefault: false }
    });
  }

  const updateData: any = {};
  if (name !== undefined) updateData.name = name;
  if (subject !== undefined) updateData.subject = subject;
  if (bodyHtml !== undefined) updateData.bodyHtml = bodyHtml;
  if (bodyText !== undefined) updateData.bodyText = bodyText;
  if (variables !== undefined) updateData.variables = variables;
  if (isDefault !== undefined) updateData.isDefault = isDefault;
  if (type !== undefined) updateData.type = type;

  const template = await prisma.emailTemplate.update({
    where: { id: parseInt(id) },
    data: updateData
  });

  // Log admin action
  await logAdminAction({
    userId: req.user!.id,
    action: AdminAction.UPDATE_EMAIL_TEMPLATE,
    resource: ResourceType.SETTINGS,
    resourceId: template.id,
    details: {
      type: 'email_template',
      ...createUpdateDetails(oldTemplate, template)
    },
    req
  });

  res.json(template);
};

// Delete email template (SUPER_ADMIN only)
export const deleteTemplate = async (req: AuthRequest, res: Response): Promise<void> => {
  const { id } = req.params;

  const template = await prisma.emailTemplate.findUnique({
    where: { id: parseInt(id) }
  });

  if (!template) {
    throw new AppError('Template not found', 404);
  }

  // Prevent deleting built-in default templates
  const builtInNames = ['verification', 'welcome', 'new-recipe', 'unsubscribe'];
  if (builtInNames.includes(template.name) && template.isDefault) {
    throw new AppError('Cannot delete built-in default templates', 400);
  }

  await prisma.emailTemplate.delete({
    where: { id: parseInt(id) }
  });

  // Log admin action
  await logAdminAction({
    userId: req.user!.id,
    action: AdminAction.DELETE_EMAIL_TEMPLATE,
    resource: ResourceType.SETTINGS,
    resourceId: parseInt(id),
    details: createDeleteDetails(template),
    req
  });

  res.json({ message: 'Template deleted successfully' });
};

// Preview template with test data (SUPER_ADMIN only)
export const previewTemplate = async (req: AuthRequest, res: Response): Promise<void> => {
  const { id } = req.params;
  const { testData } = req.body;

  const template = await prisma.emailTemplate.findUnique({
    where: { id: parseInt(id) }
  });

  if (!template) {
    throw new AppError('Template not found', 404);
  }

  // Default test data based on type
  const defaultTestData: Record<string, any> = {
    VERIFICATION: {
      verificationUrl: 'http://localhost:5173/verify-email/sample-token-123'
    },
    WELCOME: {
      siteUrl: 'http://localhost:5173',
      unsubscribeUrl: 'http://localhost:5173/unsubscribe/sample-token-123'
    },
    NEW_RECIPE: {
      recipeName: 'Борщ традиционный',
      recipeDescription: 'Классический украинский борщ с мясом и сметаной',
      recipeImage: 'http://localhost:3000/uploads/sample-recipe.jpg',
      cookingTime: '90',
      servings: '6',
      calories: '250',
      recipeUrl: 'http://localhost:5173/recipe/1',
      unsubscribeUrl: 'http://localhost:5173/unsubscribe/sample-token-123'
    },
    UNSUBSCRIBE: {}
  };

  const data = testData || defaultTestData[template.type] || {};

  try {
    const htmlTemplate = Handlebars.compile(template.bodyHtml);
    const textTemplate = Handlebars.compile(template.bodyText);
    const subjectTemplate = Handlebars.compile(template.subject);

    const renderedHtml = htmlTemplate(data);
    const renderedText = textTemplate(data);
    const renderedSubject = subjectTemplate(data);

    res.json({
      subject: renderedSubject,
      html: renderedHtml,
      text: renderedText
    });
  } catch (error: any) {
    throw new AppError(`Template rendering error: ${error.message}`, 400);
  }
};

// Get available template variables
export const getTemplateVariables = async (req: AuthRequest, res: Response): Promise<void> => {
  const variables = getAllTemplateVariables();
  res.json(variables);
};
