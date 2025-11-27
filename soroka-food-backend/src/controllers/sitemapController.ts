import { Request, Response } from 'express';
import prisma from '../config/database';
import { logger } from '../config/logger';

/**
 * Generate sitemap.xml with all public URLs
 */
export const generateSitemap = async (req: Request, res: Response) => {
  try {
    const baseUrl = process.env.FRONTEND_URL || 'http://localhost:5173';

    // Fetch all published recipes
    const recipes = await prisma.recipe.findMany({
      where: { status: 'PUBLISHED' },
      select: {
        id: true,
        updatedAt: true,
      },
      orderBy: { updatedAt: 'desc' },
    });

    // Fetch all categories
    const categories = await prisma.category.findMany({
      select: {
        slug: true,
        updatedAt: true,
      },
      orderBy: { updatedAt: 'desc' },
    });

    // Fetch all static pages
    const staticPages = await prisma.staticPage.findMany({
      select: {
        slug: true,
        updatedAt: true,
      },
    });

    // Generate XML
    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';

    // Homepage
    xml += '  <url>\n';
    xml += `    <loc>${baseUrl}/</loc>\n`;
    xml += `    <lastmod>${new Date().toISOString()}</lastmod>\n`;
    xml += '    <changefreq>daily</changefreq>\n';
    xml += '    <priority>1.0</priority>\n';
    xml += '  </url>\n';

    // Recipes
    recipes.forEach((recipe: { id: number; updatedAt: Date }) => {
      xml += '  <url>\n';
      xml += `    <loc>${baseUrl}/recipe/${recipe.id}</loc>\n`;
      xml += `    <lastmod>${recipe.updatedAt.toISOString()}</lastmod>\n`;
      xml += '    <changefreq>weekly</changefreq>\n';
      xml += '    <priority>0.8</priority>\n';
      xml += '  </url>\n';
    });

    // Categories
    categories.forEach((category: { slug: string; updatedAt: Date }) => {
      xml += '  <url>\n';
      xml += `    <loc>${baseUrl}/category/${category.slug}</loc>\n`;
      xml += `    <lastmod>${category.updatedAt.toISOString()}</lastmod>\n`;
      xml += '    <changefreq>weekly</changefreq>\n';
      xml += '    <priority>0.7</priority>\n';
      xml += '  </url>\n';
    });

    // Static pages
    const staticRoutes = [
      { path: '/best', priority: '0.6' },
      { path: '/about', priority: '0.5' },
      { path: '/contact', priority: '0.5' },
      { path: '/rules', priority: '0.4' },
      { path: '/advertising', priority: '0.4' },
    ];

    staticRoutes.forEach((route) => {
      xml += '  <url>\n';
      xml += `    <loc>${baseUrl}${route.path}</loc>\n`;
      xml += `    <lastmod>${new Date().toISOString()}</lastmod>\n`;
      xml += '    <changefreq>monthly</changefreq>\n';
      xml += `    <priority>${route.priority}</priority>\n`;
      xml += '  </url>\n';
    });

    // Custom static pages from database
    staticPages.forEach((page: { slug: string; updatedAt: Date }) => {
      xml += '  <url>\n';
      xml += `    <loc>${baseUrl}/${page.slug}</loc>\n`;
      xml += `    <lastmod>${page.updatedAt.toISOString()}</lastmod>\n`;
      xml += '    <changefreq>monthly</changefreq>\n';
      xml += '    <priority>0.5</priority>\n';
      xml += '  </url>\n';
    });

    xml += '</urlset>';

    // Set response headers
    res.setHeader('Content-Type', 'application/xml');
    res.setHeader('Cache-Control', 'public, max-age=3600'); // Cache for 1 hour

    res.send(xml);
  } catch (error) {
    logger.error('Error generating sitemap:', error);
    res.status(500).json({ error: 'Failed to generate sitemap' });
  }
};
