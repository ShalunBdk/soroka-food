import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import path from 'path';
import { errorHandler } from './middleware/errorHandler';

// Load environment variables
dotenv.config();

const app: Application = express();
const PORT = process.env.PORT || 3000;

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

// Serve static files (uploaded images) with CORS headers
app.use('/uploads', (req, res, next) => {
  // Set CORS headers for static files
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
  next();
}, express.static(path.join(__dirname, '../public/uploads')));

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

// Public routes
app.use('/api/auth', authRoutes);
app.use('/api/recipes', recipeRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/comments', commentRoutes);
app.use('/api/newsletter', newsletterRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/static-pages', staticPageRoutes);

// Protected admin routes
app.use('/api/admin', adminRoutes);
app.use('/api/admin/users', userRoutes);
app.use('/api/admin/logs', adminLogRoutes);
app.use('/api/upload', uploadRoutes);

// Serve frontend static files in production
if (process.env.NODE_ENV === 'production') {
  const frontendPath = path.join(__dirname, '../../soroka-food-app/dist');

  // Serve static files
  app.use(express.static(frontendPath));

  // SPA fallback - serve index.html for all non-API routes
  app.use((req: Request, res: Response) => {
    // If request is for API route and not found, return 404 JSON
    if (req.path.startsWith('/api/') || req.path.startsWith('/uploads/')) {
      res.status(404).json({ error: 'Route not found' });
    } else {
      // For all other routes, serve index.html (SPA fallback)
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

// Start server and keep the instance to prevent process exit
const server = app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📝 Environment: ${process.env.NODE_ENV}`);
});

// Export app for testing (optional)
export default app;
