import nodemailer, { Transporter } from 'nodemailer';
import prisma from '../config/database';
import crypto from 'crypto';
import Handlebars from 'handlebars';
import net from 'net';

interface EmailOptions {
  to: string;
  subject: string;
  html?: string;
  text?: string;
  templateId?: number;
  variables?: Record<string, any>;
}

interface SendResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

// Encrypt password for storage
export function encryptPassword(password: string): string {
  if (!password) {
    return '';
  }

  // Check if encryption key is set
  if (!process.env.EMAIL_ENCRYPTION_KEY) {
    console.error('EMAIL_ENCRYPTION_KEY is not set in .env file. Password encryption will fail.');
    throw new Error('EMAIL_ENCRYPTION_KEY not configured. Please set it in your .env file.');
  }

  const algorithm = 'aes-256-cbc';
  // Use SHA-256 hash to get exactly 32 bytes from any length key
  const key = crypto.createHash('sha256').update(process.env.EMAIL_ENCRYPTION_KEY).digest();
  const iv = crypto.randomBytes(16);

  const cipher = crypto.createCipheriv(algorithm, key, iv);
  let encrypted = cipher.update(password, 'utf8', 'hex');
  encrypted += cipher.final('hex');

  return iv.toString('hex') + ':' + encrypted;
}

// Decrypt password from storage
export function decryptPassword(encryptedPassword: string): string {
  if (!encryptedPassword || encryptedPassword === '') {
    return '';
  }

  // Check if encryption key is set
  if (!process.env.EMAIL_ENCRYPTION_KEY) {
    console.error('EMAIL_ENCRYPTION_KEY is not set in .env file. Password decryption will fail.');
    throw new Error('EMAIL_ENCRYPTION_KEY not configured. Please set it in your .env file.');
  }

  try {
    const algorithm = 'aes-256-cbc';
    // Use SHA-256 hash to get exactly 32 bytes from any length key
    const key = crypto.createHash('sha256').update(process.env.EMAIL_ENCRYPTION_KEY).digest();

    // Validate encrypted password format
    if (!encryptedPassword.includes(':')) {
      throw new Error('Invalid encrypted password format');
    }

    const parts = encryptedPassword.split(':');
    if (parts.length < 2) {
      throw new Error('Invalid encrypted password format');
    }

    const iv = Buffer.from(parts.shift()!, 'hex');
    const encrypted = parts.join(':');

    const decipher = crypto.createDecipheriv(algorithm, key, iv);
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  } catch (error: any) {
    console.error('Password decryption failed:', error.message);
    throw new Error(`Failed to decrypt password: ${error.message}. This usually means the EMAIL_ENCRYPTION_KEY has changed or the password was encrypted with a different key.`);
  }
}

// Create transporter from database settings
async function createTransporter(): Promise<Transporter | null> {
  try {
    const settings = await prisma.smtpSettings.findUnique({
      where: { id: 1 }
    });

    if (!settings) {
      console.warn('SMTP settings not found in database');
      return null;
    }

    if (!settings.enabled) {
      console.warn('SMTP settings disabled');
      return null;
    }

    if (!settings.host || !settings.user) {
      console.warn('SMTP settings incomplete (missing host or user)');
      return null;
    }

    if (!settings.password || settings.password === '') {
      console.warn('SMTP password not set');
      return null;
    }

    const transporterSettings = {
      host: settings.host,
      port: settings.port,
      secure: settings.secure,
      user: settings.user,
      passwordSet: !!settings.password
    };

    process.stdout.write('\n>>> Creating SMTP transporter with settings:\n');
    process.stdout.write(JSON.stringify(transporterSettings, null, 2) + '\n');
    console.log('Creating SMTP transporter with settings:', transporterSettings);

    const decryptedPassword = decryptPassword(settings.password);
    process.stdout.write('>>> Password decrypted successfully\n');

    // Check if we should reject unauthorized certificates (for antivirus SSL inspection)
    const rejectUnauthorized = process.env.NODE_TLS_REJECT_UNAUTHORIZED !== '0';

    if (!rejectUnauthorized) {
      process.stdout.write('!!! WARNING: TLS certificate validation is DISABLED (NODE_TLS_REJECT_UNAUTHORIZED=0)\n');
      process.stdout.write('!!! This is insecure and should only be used for development/testing\n');
    }

    const transporter = nodemailer.createTransport({
      host: settings.host,
      port: settings.port,
      secure: settings.secure,
      auth: {
        user: settings.user,
        pass: decryptedPassword
      },
      // TLS options with SNI
      tls: {
        minVersion: 'TLSv1.2',
        servername: settings.host, // SNI - use domain name for TLS
        rejectUnauthorized: rejectUnauthorized
      },
      // Connection timeouts
      connectionTimeout: 30000, // 30 seconds
      greetingTimeout: 30000,
      socketTimeout: 30000,
      // Force IPv4
      family: 4,
      // Enable debug to see connection details
      debug: true,
      logger: true
    } as any);

    return transporter;
  } catch (error: any) {
    console.error('Failed to create email transporter:', error.message);
    console.error('Error details:', error);
    return null;
  }
}

// Render template with variables
function renderTemplate(template: string, variables: Record<string, any>): string {
  const compiled = Handlebars.compile(template);
  return compiled(variables);
}

// Send email with retry logic
export async function sendEmail(
  options: EmailOptions,
  subscriberId?: number,
  retryCount: number = 0
): Promise<SendResult> {
  const MAX_RETRIES = 3;

  try {
    const transporter = await createTransporter();
    if (!transporter) {
      throw new Error('Email transport not configured');
    }

    const settings = await prisma.smtpSettings.findUnique({
      where: { id: 1 }
    });

    let html = options.html || '';
    let text = options.text || '';
    let subject = options.subject;

    // If template is specified, load and render it
    if (options.templateId) {
      const template = await prisma.emailTemplate.findUnique({
        where: { id: options.templateId }
      });

      if (template) {
        const vars = options.variables || {};
        html = renderTemplate(template.bodyHtml, vars);
        text = renderTemplate(template.bodyText, vars);
        subject = renderTemplate(template.subject, vars);
      }
    } else if (options.variables) {
      // Render variables in provided subject/HTML/text
      if (subject) {
        subject = renderTemplate(subject, options.variables);
      }
      if (html) {
        html = renderTemplate(html, options.variables);
      }
      if (text) {
        text = renderTemplate(text, options.variables);
      }
    }

    const mailOptions = {
      from: `"${settings?.fromName || 'Soroka Food'}" <${settings?.fromEmail || 'noreply@sorokafood.com'}>`,
      to: options.to,
      subject: subject,
      html: html,
      text: text || undefined
    };

    const info = await transporter.sendMail(mailOptions);

    // Log successful send
    if (subscriberId) {
      await prisma.emailLog.create({
        data: {
          subscriberId,
          templateId: options.templateId,
          subject,
          recipient: options.to,
          status: 'SENT',
          sentAt: new Date()
        }
      });
    }

    return {
      success: true,
      messageId: info.messageId
    };

  } catch (error: any) {
    console.error('Email send error:', error);

    // Retry logic
    if (retryCount < MAX_RETRIES) {
      console.log(`Retrying email send (attempt ${retryCount + 1}/${MAX_RETRIES})...`);
      await new Promise(resolve => setTimeout(resolve, 2000 * (retryCount + 1))); // Exponential backoff
      return sendEmail(options, subscriberId, retryCount + 1);
    }

    // Log failed send
    if (subscriberId) {
      await prisma.emailLog.create({
        data: {
          subscriberId,
          templateId: options.templateId,
          subject: options.subject,
          recipient: options.to,
          status: 'FAILED',
          error: error.message || 'Unknown error'
        }
      });
    }

    return {
      success: false,
      error: error.message || 'Failed to send email'
    };
  }
}

// Test raw TCP connection
async function testTcpConnection(host: string, port: number): Promise<{ success: boolean; error?: string }> {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    const timeout = 10000; // 10 seconds

    socket.setTimeout(timeout);

    socket.on('connect', () => {
      process.stdout.write(`>>> TCP connection to ${host}:${port} successful!\n`);
      socket.destroy();
      resolve({ success: true });
    });

    socket.on('timeout', () => {
      process.stdout.write(`>>> TCP connection timeout to ${host}:${port}\n`);
      socket.destroy();
      resolve({ success: false, error: `TCP timeout connecting to ${host}:${port}` });
    });

    socket.on('error', (err: any) => {
      process.stdout.write(`>>> TCP connection error to ${host}:${port}: ${err.message}\n`);
      socket.destroy();
      resolve({ success: false, error: `TCP error: ${err.message}` });
    });

    process.stdout.write(`>>> Testing raw TCP connection to ${host}:${port}...\n`);
    socket.connect(port, host);
  });
}

// Test SMTP connection
export async function testSmtpConnection(): Promise<{ success: boolean; error?: string }> {
  try {
    process.stdout.write('\n>>> Starting SMTP connection test...\n');
    console.log('>>> Starting SMTP connection test...');

    // Get settings for TCP test
    const settings = await prisma.smtpSettings.findUnique({ where: { id: 1 } });
    if (!settings || !settings.enabled || !settings.host) {
      const errorMsg = 'Настройки SMTP не сконфигурированы или отключены';
      process.stdout.write(`>>> ERROR: ${errorMsg}\n`);
      return { success: false, error: errorMsg };
    }

    // First, test raw TCP connection
    const tcpTest = await testTcpConnection(settings.host, settings.port);
    if (!tcpTest.success) {
      return { success: false, error: `Не удалось установить TCP подключение: ${tcpTest.error}. Проверьте настройки файрвола Windows.` };
    }

    const transporter = await createTransporter();
    if (!transporter) {
      const errorMsg = 'Настройки SMTP не сконфигурированы или отключены';
      process.stdout.write(`>>> ERROR: ${errorMsg}\n`);
      return { success: false, error: errorMsg };
    }

    process.stdout.write('>>> Verifying SMTP connection...\n');
    await transporter.verify();

    process.stdout.write('>>> SMTP connection successful!\n');
    console.log('>>> SMTP connection successful!');
    return { success: true };
  } catch (error: any) {
    process.stdout.write(`>>> SMTP connection test failed: ${error.message}\n`);
    console.error('SMTP connection test failed:', error);

    // Provide detailed error messages
    let errorMessage = error.message || 'Connection failed';

    // Add hints based on common errors
    if (error.code === 'EAUTH') {
      errorMessage = `Ошибка аутентификации: ${error.response || error.message}. Проверьте правильность имени пользователя и пароля.`;
    } else if (error.code === 'ESOCKET' || error.code === 'ECONNECTION') {
      errorMessage = `Ошибка подключения: ${error.message}. Проверьте хост и порт. Возможно, нужен VPN или другой порт.`;
    } else if (error.code === 'ETIMEDOUT') {
      errorMessage = `Превышено время ожидания: ${error.message}. Проверьте доступность SMTP сервера.`;
    } else if (error.responseCode) {
      errorMessage = `Ошибка SMTP ${error.responseCode}: ${error.response || error.message}`;
    }

    return { success: false, error: errorMessage };
  }
}

// Generate verification token
export function generateVerificationToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

// Generate unsubscribe token
export function generateUnsubscribeToken(): string {
  return crypto.randomBytes(32).toString('hex');
}
