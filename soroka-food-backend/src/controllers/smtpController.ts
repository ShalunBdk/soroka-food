import { Response } from 'express';
import prisma from '../config/database';
import { AppError } from '../middleware/errorHandler';
import { AuthRequest } from '../middleware/auth';
import { encryptPassword, testSmtpConnection, sendEmail } from '../utils/emailService';
import { logAdminAction, AdminAction, ResourceType } from '../utils/adminLogger';

// Get SMTP settings (SUPER_ADMIN only)
export const getSmtpSettings = async (req: AuthRequest, res: Response): Promise<void> => {
  let settings = await prisma.smtpSettings.findUnique({
    where: { id: 1 }
  });

  // Create default settings if not exist
  if (!settings) {
    settings = await prisma.smtpSettings.create({
      data: { id: 1 }
    });
  }

  // Don't send password to frontend
  const { password, ...safeSettings } = settings;

  res.json({
    ...safeSettings,
    hasPassword: password !== ''
  });
};

// Update SMTP settings (SUPER_ADMIN only)
export const updateSmtpSettings = async (req: AuthRequest, res: Response): Promise<void> => {
  console.log('========================================');
  console.log('UPDATE SMTP SETTINGS REQUEST RECEIVED');
  console.log('User:', req.user?.username);
  console.log('Body:', JSON.stringify(req.body, null, 2));
  console.log('========================================');

  const { host, port, secure, user, password, fromEmail, fromName, enabled } = req.body;

  // Validation
  if (host && (typeof host !== 'string' || host.trim() === '')) {
    throw new AppError('Invalid host', 400);
  }

  if (port && (typeof port !== 'number' || port < 1 || port > 65535)) {
    throw new AppError('Port must be between 1 and 65535', 400);
  }

  if (fromEmail) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(fromEmail)) {
      throw new AppError('Invalid email format', 400);
    }
  }

  const updateData: any = {};

  if (host !== undefined) updateData.host = host;
  if (port !== undefined) updateData.port = port;
  if (secure !== undefined) updateData.secure = secure;
  if (user !== undefined) updateData.user = user;
  if (password !== undefined && password !== '') {
    updateData.password = encryptPassword(password);
  }
  if (fromEmail !== undefined) updateData.fromEmail = fromEmail;
  if (fromName !== undefined) updateData.fromName = fromName;
  if (enabled !== undefined) updateData.enabled = enabled;

  const oldSettings = await prisma.smtpSettings.findUnique({ where: { id: 1 } });

  const settings = await prisma.smtpSettings.upsert({
    where: { id: 1 },
    update: updateData,
    create: {
      id: 1,
      ...updateData
    }
  });

  // Log admin action
  await logAdminAction({
    userId: req.user!.id,
    action: AdminAction.UPDATE_SMTP_SETTINGS,
    resource: ResourceType.SETTINGS,
    resourceId: 1,
    details: {
      type: 'smtp_settings',
      changes: Object.keys(updateData)
    },
    req
  });

  // Don't send password to frontend
  const { password: _, ...safeSettings } = settings;

  res.json({
    message: 'SMTP настройки успешно обновлены',
    settings: {
      ...safeSettings,
      hasPassword: settings.password !== ''
    }
  });
};

// Test SMTP connection (SUPER_ADMIN only)
export const testSmtp = async (req: AuthRequest, res: Response): Promise<void> => {
  console.log('========================================');
  console.log('SMTP TEST CONNECTION REQUEST RECEIVED');
  console.log('User:', req.user?.username);

  // Show current SMTP settings for debugging
  const currentSettings = await prisma.smtpSettings.findUnique({ where: { id: 1 } });
  if (currentSettings) {
    console.log('Current SMTP settings:');
    console.log('  Host:', currentSettings.host);
    console.log('  Port:', currentSettings.port);
    console.log('  Secure (SSL/TLS):', currentSettings.secure);
    console.log('  User:', currentSettings.user);
    console.log('  Password set:', currentSettings.password ? 'Yes' : 'No');
    console.log('  Enabled:', currentSettings.enabled);
  }
  console.log('========================================');

  const result = await testSmtpConnection();

  console.log('SMTP Test Result:', result);

  if (!result.success) {
    console.error('SMTP test failed with error:', result.error);
    throw new AppError(result.error || 'Ошибка подключения к SMTP серверу', 400);
  }

  // Try to send a test email
  try {
    // Get SMTP settings to get fromEmail (sender's email)
    const smtpSettings = await prisma.smtpSettings.findUnique({ where: { id: 1 } });
    if (!smtpSettings?.fromEmail) {
      throw new AppError('Email отправителя не настроен в SMTP', 400);
    }

    // Send test email to the sender's email (fromEmail from SMTP settings)
    // This ensures the email address exists and avoids "non-local recipient" errors
    const testRecipient = smtpSettings.fromEmail;

    await sendEmail({
      to: testRecipient,
      subject: 'Тестовое письмо от Soroka Food',
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px;">
          <h2>SMTP тест успешен</h2>
          <p>Это тестовое письмо от Soroka Food. Ваша SMTP конфигурация работает правильно!</p>
          <p><strong>Время отправки:</strong> ${new Date().toLocaleString('ru-RU')}</p>
          <p><strong>Получатель:</strong> ${testRecipient}</p>
        </div>
      `,
      text: `SMTP тест успешен\n\nЭто тестовое письмо от Soroka Food. Ваша SMTP конфигурация работает правильно!\n\nВремя отправки: ${new Date().toLocaleString('ru-RU')}\nПолучатель: ${testRecipient}`
    });

    // Log admin action
    await logAdminAction({
      userId: req.user!.id,
      action: AdminAction.TEST_SMTP,
      resource: ResourceType.SETTINGS,
      resourceId: 1,
      details: {
        type: 'smtp_test',
        result: 'success',
        recipient: testRecipient
      },
      req
    });

    res.json({
      success: true,
      message: `Подключение к SMTP успешно! Тестовое письмо отправлено на ${testRecipient}`
    });
  } catch (error: any) {
    throw new AppError(`Ошибка теста SMTP: ${error.message}`, 400);
  }
};
