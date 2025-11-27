import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import dotenv from 'dotenv';
import path from 'path';
import { errorHandler } from './middleware/errorHandler';
import { logger } from './config/logger';

// Load environment variables
dotenv.config();

const app: Application = express();
const PORT = process.env.PORT || 3000;

// Trust proxy - необходимо при использовании nginx или других reverse proxy
// Позволяет Express правильно обрабатывать X-Forwarded-* заголовки
app.set('trust proxy', 1); // 1 = доверять только первому прокси (nginx)

// Security headers with Helmet
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:", "http://localhost:5173"],
      scriptSrc: ["'self'"],
    },
  },
  crossOriginEmbedderPolicy: false, // Allow loading external images
  crossOriginResourcePolicy: { policy: "cross-origin" }, // Allow images to be loaded cross-origin
}));

// Compression middleware
app.use(compression());

// CORS Configuration
const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:5173'];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps, Postman, curl)
    if (!origin) {
      return callback(null, true);
    }

    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Apply general API rate limiting
import { apiLimiter } from './middleware/rateLimiter';
app.use('/api/', apiLimiter);

// Serve static files (uploaded images) with CORS headers and aggressive caching
app.use('/uploads', (req, res, next) => {
  // Set CORS headers for static files
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
  next();
}, express.static(path.join(__dirname, '../public/uploads'), {
  maxAge: '1y', // Cache images for 1 year (they have unique filenames)
  immutable: true, // Images never change (unique filenames per upload)
  etag: true, // Enable ETag for cache validation
  lastModified: true, // Enable Last-Modified header
}));

// Health check route
app.get('/api/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV
  });
});

// Import routes
import authRoutes from './routes/authRoutes';
import recipeRoutes from './routes/recipeRoutes';
import categoryRoutes from './routes/categoryRoutes';
import commentRoutes from './routes/commentRoutes';
import newsletterRoutes from './routes/newsletterRoutes';
import settingsRoutes from './routes/settingsRoutes';
import staticPageRoutes from './routes/staticPageRoutes';
import adminRoutes from './routes/adminRoutes';
import uploadRoutes from './routes/uploadRoutes';
import userRoutes from './routes/userRoutes';
import adminLogRoutes from './routes/adminLogRoutes';
import smtpRoutes from './routes/smtpRoutes';
import emailTemplateRoutes from './routes/emailTemplateRoutes';
import emailLogRoutes from './routes/emailLogRoutes';
import sitemapRoutes from './routes/sitemapRoutes';

// Public routes
app.use('/api/auth', authRoutes);
app.use('/api/recipes', recipeRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/comments', commentRoutes);
app.use('/api/newsletter', newsletterRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/static-pages', staticPageRoutes);

// SEO routes
app.use('/', sitemapRoutes);

// Protected admin routes
app.use('/api/admin', adminRoutes);
app.use('/api/admin/users', userRoutes);
app.use('/api/admin/logs', adminLogRoutes);
app.use('/api/admin/smtp', smtpRoutes);
app.use('/api/admin/email-templates', emailTemplateRoutes);
app.use('/api/admin/email-logs', emailLogRoutes);
app.use('/api/upload', uploadRoutes);

// Serve frontend static files in production
if (process.env.NODE_ENV === 'production') {
  const frontendPath = path.join(__dirname, '../../soroka-food-app/dist');

  // Cache static assets with hashes aggressively (JS, CSS, fonts)
  app.use(/\.(js|css|woff|woff2|ttf|eot|svg|ico)$/,
    express.static(frontendPath, {
      maxAge: '1y', // Cache for 1 year (files have content hashes)
      immutable: true, // These files never change (content-based hashes)
      etag: true,
    })
  );

  // Serve HTML and other files with shorter cache (1 day)
  app.use(express.static(frontendPath, {
    maxAge: '1d', // Cache HTML for 1 day
    etag: true,
    lastModified: true,
  }));

  // SPA fallback - serve index.html for all non-API routes
  app.use((req: Request, res: Response) => {
    // If request is for API route and not found, return 404 JSON
    if (req.path.startsWith('/api/') || req.path.startsWith('/uploads/')) {
      res.status(404).json({ error: 'Route not found' });
    } else {
      // For all other routes, serve index.html (SPA fallback)
      // No caching for SPA entry point
      res.setHeader('Cache-Control', 'no-cache');
      res.sendFile(path.join(frontendPath, 'index.html'));
    }
  });
} else {
  // 404 handler for dev mode (API only)
  app.use((req: Request, res: Response) => {
    res.status(404).json({ error: 'Route not found' });
  });
}

// Global error handler
app.use(errorHandler);

// Initialize email templates on server start
import { initializeDefaultTemplates } from './utils/emailTemplates';

// Start server and keep the instance to prevent process exit
const server = app.listen(PORT, async () => {
  logger.info(`Server running on http://localhost:${PORT}`);
  logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);

  // Initialize default email templates
  try {
    await initializeDefaultTemplates();
    logger.info('Email templates initialized');
  } catch (error) {
    logger.error('Failed to initialize email templates:', error);
  }
});

// Export app for testing (optional)
export default app;
