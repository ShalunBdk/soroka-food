import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { errorHandler } from './middleware/errorHandler';

// Load environment variables
dotenv.config();

const app: Application = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files (uploaded images)
app.use('/uploads', express.static(path.join(__dirname, '../public/uploads')));

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

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📝 Environment: ${process.env.NODE_ENV}`);
});

export default app;
