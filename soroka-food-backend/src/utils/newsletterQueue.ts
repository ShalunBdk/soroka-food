import prisma from '../config/database';
import { sendEmail } from './emailService';
import { getTemplateByType, EmailTemplateType } from './emailTemplates';
import { logger } from '../config/logger';

interface Recipe {
  id: number;
  title: string;
  description: string;
  image?: string | null;
  cookingTime: number;
  servings: number;
  calories: number;
}

// Send newsletter to all verified subscribers about new recipe
export async function sendNewRecipeNewsletter(recipe: Recipe): Promise<void> {
  try {
    // Get all verified and active subscribers
    const subscribers = await prisma.newsletterSubscriber.findMany({
      where: {
        status: 'ACTIVE',
        verified: true
      }
    });

    if (subscribers.length === 0) {
      logger.info('No verified subscribers to send newsletter to');
      return;
    }

    // Get the new-recipe email template
    const template = await getTemplateByType(EmailTemplateType.NEW_RECIPE);
    if (!template) {
      logger.error('New recipe email template not found');
      return;
    }

    // Check if SMTP is enabled
    const smtpSettings = await prisma.smtpSettings.findUnique({
      where: { id: 1 }
    });

    if (!smtpSettings || !smtpSettings.enabled) {
      logger.info('SMTP is not enabled, skipping newsletter');
      return;
    }

    logger.info(`Starting newsletter send to ${subscribers.length} subscribers for recipe: ${recipe.title}`);

    // Send emails in batches to avoid overwhelming the SMTP server
    const batchSize = 50;
    const delayBetweenBatches = 2000; // 2 seconds

    let successCount = 0;
    let failureCount = 0;

    for (let i = 0; i < subscribers.length; i += batchSize) {
      const batch = subscribers.slice(i, i + batchSize);

      // Process batch in parallel
      const promises = batch.map(async (subscriber: any) => {
        try {
          const siteUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
          const recipeUrl = `${siteUrl}/recipe/${recipe.id}`;
          const unsubscribeUrl = `${siteUrl}/unsubscribe/${subscriber.unsubscribeToken}`;

          // Remove /api from BACKEND_URL if present (uploads are served from root, not /api)
          const backendUrl = (process.env.BACKEND_URL || 'http://localhost:3000').replace(/\/api$/, '');
          const recipeImage = recipe.image
            ? `${backendUrl}${recipe.image}`
            : undefined;

          const result = await sendEmail({
            to: subscriber.email,
            subject: template.subject,
            html: template.bodyHtml,
            text: template.bodyText,
            variables: {
              recipeName: recipe.title,
              recipeDescription: recipe.description,
              recipeImage,
              cookingTime: recipe.cookingTime.toString(),
              servings: recipe.servings.toString(),
              calories: recipe.calories.toString(),
              recipeUrl,
              unsubscribeUrl
            }
          }, subscriber.id);

          if (result.success) {
            successCount++;
          } else {
            failureCount++;
          }
        } catch (error) {
          logger.error(`Failed to send email to ${subscriber.email}:`, error);
          failureCount++;
        }
      });

      await Promise.all(promises);

      // Delay between batches (except for the last batch)
      if (i + batchSize < subscribers.length) {
        await new Promise(resolve => setTimeout(resolve, delayBetweenBatches));
      }
    }

    logger.info(`Newsletter send complete. Success: ${successCount}, Failures: ${failureCount}`);
  } catch (error) {
    logger.error('Error in sendNewRecipeNewsletter:', error);
    throw error;
  }
}

// Send test newsletter to a single email
export async function sendTestNewsletter(recipe: Recipe, email: string): Promise<void> {
  try {
    const template = await getTemplateByType(EmailTemplateType.NEW_RECIPE);
    if (!template) {
      throw new Error('New recipe email template not found');
    }

    const subscriber = await prisma.newsletterSubscriber.findUnique({
      where: { email }
    });

    const siteUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const recipeUrl = `${siteUrl}/recipe/${recipe.id}`;
    const unsubscribeUrl = subscriber?.unsubscribeToken
      ? `${siteUrl}/unsubscribe/${subscriber.unsubscribeToken}`
      : `${siteUrl}/newsletter/unsubscribe`;

    // Remove /api from BACKEND_URL if present (uploads are served from root, not /api)
    const backendUrl = (process.env.BACKEND_URL || 'http://localhost:3000').replace(/\/api$/, '');
    const recipeImage = recipe.image
      ? `${backendUrl}${recipe.image}`
      : undefined;

    await sendEmail({
      to: email,
      subject: `[TEST] ${template.subject}`,
      html: template.bodyHtml,
      text: template.bodyText,
      variables: {
        recipeName: recipe.title,
        recipeDescription: recipe.description,
        recipeImage,
        cookingTime: recipe.cookingTime.toString(),
        servings: recipe.servings.toString(),
        calories: recipe.calories.toString(),
        recipeUrl,
        unsubscribeUrl
      }
    }, subscriber?.id);

    logger.info(`Test newsletter sent to ${email}`);
  } catch (error) {
    logger.error('Error in sendTestNewsletter:', error);
    throw error;
  }
}
