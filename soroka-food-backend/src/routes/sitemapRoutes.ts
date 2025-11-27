import { Router } from 'express';
import { generateSitemap } from '../controllers/sitemapController';

const router = Router();

// GET /sitemap.xml - Generate sitemap
router.get('/sitemap.xml', generateSitemap);

export default router;
