import { Request, Response } from 'express';
import prisma from '../config/database';
import { AppError } from '../middleware/errorHandler';
import { sendEmail, generateVerificationToken, generateUnsubscribeToken } from '../utils/emailService';
import { getTemplateByType, EmailTemplateType } from '../utils/emailTemplates';

// Subscribe to newsletter with email verification (public endpoint)
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

  console.log('========================================');
  console.log('CHECKING EXISTING SUBSCRIPTION');
  console.log('Email:', email);
  console.log('Existing subscriber found:', existing ? 'YES' : 'NO');
  if (existing) {
    console.log('Status:', existing.status);
    console.log('Verified:', existing.verified);
    console.log('Subscribed date:', existing.subscribedDate);
  }
  console.log('========================================');

  if (existing) {
    // Already subscribed and verified
    if (existing.status === 'ACTIVE' && existing.verified) {
      throw new AppError('Этот email уже подписан на рассылку', 400);
    }

    // Pending verification - resend verification email
    if ((existing.status === 'PENDING' || existing.status === 'ACTIVE') && !existing.verified) {
      const verificationToken = generateVerificationToken();
      await prisma.newsletterSubscriber.update({
        where: { email },
        data: {
          status: 'PENDING',
          verificationToken,
          subscribedDate: new Date() // Update subscribedDate for new token expiry
        }
      });

      // Send verification email
      const template = await getTemplateByType(EmailTemplateType.VERIFICATION);
      if (template) {
        const verificationUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/verify-email/${verificationToken}`;
        console.log('Resending verification email. URL:', verificationUrl);

        await sendEmail({
          to: email,
          subject: template.subject,
          html: template.bodyHtml,
          text: template.bodyText,
          variables: { verificationUrl }
        });
      }

      res.json({ message: 'Письмо с подтверждением отправлено повторно. Проверьте вашу почту.' });
      return;
    }

    // Unsubscribed - reactivate with new verification
    if (existing.status === 'UNSUBSCRIBED') {
      const verificationToken = generateVerificationToken();
      const unsubscribeToken = existing.unsubscribeToken || generateUnsubscribeToken();

      await prisma.newsletterSubscriber.update({
        where: { email },
        data: {
          status: 'PENDING',
          verified: false,
          verificationToken,
          unsubscribeToken,
          subscribedDate: new Date() // Update subscribedDate for new token expiry
        }
      });

      // Send verification email
      const template = await getTemplateByType(EmailTemplateType.VERIFICATION);
      if (template) {
        const verificationUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/verify-email/${verificationToken}`;
        console.log('Reactivating subscription. Verification URL:', verificationUrl);

        await sendEmail({
          to: email,
          subject: template.subject,
          html: template.bodyHtml,
          text: template.bodyText,
          variables: { verificationUrl }
        });
      }

      res.json({ message: 'Подписка возобновлена. Проверьте вашу почту для подтверждения.' });
      return;
    }
  }

  // Create new subscription with verification
  const verificationToken = generateVerificationToken();
  const unsubscribeToken = generateUnsubscribeToken();

  console.log('========================================');
  console.log('CREATING NEW SUBSCRIPTION');
  console.log('Email:', email);
  console.log('Verification token:', verificationToken);
  console.log('Token length:', verificationToken.length);
  console.log('========================================');

  const subscriber = await prisma.newsletterSubscriber.create({
    data: {
      email,
      verified: false,
      verificationToken,
      unsubscribeToken
    }
  });

  console.log('Subscriber created with ID:', subscriber.id);

  // Send verification email
  try {
    const template = await getTemplateByType(EmailTemplateType.VERIFICATION);
    if (template) {
      const verificationUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/verify-email/${verificationToken}`;
      console.log('Verification URL:', verificationUrl);

      await sendEmail({
        to: email,
        subject: template.subject,
        html: template.bodyHtml,
        text: template.bodyText,
        variables: { verificationUrl }
      }, subscriber.id);

      console.log('Verification email sent successfully');
    } else {
      console.warn('VERIFICATION template not found!');
    }
  } catch (error) {
    console.error('Failed to send verification email:', error);
    // Don't throw error - subscriber is created, just email failed
  }

  res.status(201).json({
    message: 'Подписка создана. Проверьте вашу почту для подтверждения подписки.'
  });
};

// Verify email subscription
export const verify = async (req: Request, res: Response): Promise<void> => {
  const { token } = req.params;

  console.log('========================================');
  console.log('EMAIL VERIFICATION REQUEST');
  console.log('Token received:', token);
  console.log('Token length:', token?.length);
  console.log('========================================');

  if (!token) {
    throw new AppError('Токен подтверждения отсутствует', 400);
  }

  // Find subscriber by verification token
  const subscriber = await prisma.newsletterSubscriber.findUnique({
    where: { verificationToken: token }
  });

  console.log('Subscriber found:', subscriber ? 'YES' : 'NO');
  if (subscriber) {
    console.log('Subscriber email:', subscriber.email);
    console.log('Already verified:', subscriber.verified);
    console.log('Subscribed date:', subscriber.subscribedDate);
  }

  if (!subscriber) {
    throw new AppError('Неверный или истекший токен подтверждения', 404);
  }

  // Check if token is not older than 24 hours
  const tokenAge = Date.now() - subscriber.subscribedDate.getTime();
  const maxAge = 24 * 60 * 60 * 1000; // 24 hours

  console.log('Token age (hours):', (tokenAge / (60 * 60 * 1000)).toFixed(2));
  console.log('Max age (hours):', (maxAge / (60 * 60 * 1000)).toFixed(2));

  if (tokenAge > maxAge) {
    throw new AppError('Токен подтверждения истёк. Пожалуйста, подпишитесь снова.', 400);
  }

  // If already verified, return success (handles duplicate requests)
  if (subscriber.verified) {
    console.log('Email already verified - returning success for duplicate request');
    res.json({ message: 'Email уже успешно подтверждён! Добро пожаловать в рассылку Soroka Food.' });
    return;
  }

  // Update subscriber - mark as verified and activate
  // IMPORTANT: We keep verificationToken to handle duplicate requests (React StrictMode, double-clicks, etc.)
  await prisma.newsletterSubscriber.update({
    where: { id: subscriber.id },
    data: {
      status: 'ACTIVE',
      verified: true,
      verifiedAt: new Date()
      // Keep verificationToken - don't set to null
    }
  });

  console.log('Subscriber verified and activated successfully');

  // Send welcome email
  try {
    const template = await getTemplateByType(EmailTemplateType.WELCOME);
    if (template) {
      const siteUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
      const unsubscribeUrl = `${siteUrl}/unsubscribe/${subscriber.unsubscribeToken}`;

      await sendEmail({
        to: subscriber.email,
        subject: template.subject,
        html: template.bodyHtml,
        text: template.bodyText,
        variables: { siteUrl, unsubscribeUrl }
      }, subscriber.id);
    }
  } catch (error) {
    console.error('Failed to send welcome email:', error);
  }

  res.json({ message: 'Email успешно подтвержден! Добро пожаловать в рассылку Soroka Food.' });
};

// Unsubscribe from newsletter using token
export const unsubscribeByToken = async (req: Request, res: Response): Promise<void> => {
  const { token } = req.params;

  if (!token) {
    throw new AppError('Unsubscribe token is required', 400);
  }

  const subscriber = await prisma.newsletterSubscriber.findUnique({
    where: { unsubscribeToken: token }
  });

  if (!subscriber) {
    throw new AppError('Invalid unsubscribe token', 404);
  }

  if (subscriber.status === 'UNSUBSCRIBED') {
    throw new AppError('You are already unsubscribed', 400);
  }

  await prisma.newsletterSubscriber.update({
    where: { id: subscriber.id },
    data: { status: 'UNSUBSCRIBED' }
  });

  // Send unsubscribe confirmation email
  try {
    const template = await getTemplateByType(EmailTemplateType.UNSUBSCRIBE);
    if (template) {
      await sendEmail({
        to: subscriber.email,
        subject: template.subject,
        html: template.bodyHtml,
        text: template.bodyText,
        variables: {}
      }, subscriber.id);
    }
  } catch (error) {
    console.error('Failed to send unsubscribe confirmation:', error);
  }

  res.json({ message: 'Вы успешно отписались от рассылки' });
};

// Unsubscribe from newsletter (legacy - by email)
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

  res.json({ message: 'Вы успешно отписались от рассылки' });
};

// Clean up unverified subscriptions older than 7 days (should be called by cron or manually)
export const cleanupUnverified = async (req: Request, res: Response): Promise<void> => {
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const result = await prisma.newsletterSubscriber.deleteMany({
    where: {
      verified: false,
      subscribedDate: {
        lt: sevenDaysAgo
      }
    }
  });

  res.json({
    message: `Cleaned up ${result.count} unverified subscriptions older than 7 days`
  });
};
