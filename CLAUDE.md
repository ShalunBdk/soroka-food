# CLAUDE.md

## Project Overview

**Soroka Food** - Full-stack culinary blog with React 19 + Node.js + PostgreSQL

**Tech Stack**:
- Frontend: React 19, TypeScript, Vite, React Router 7, Plain CSS
- Backend: Express 5, Prisma ORM, PostgreSQL, JWT auth, bcrypt
- Performance: Redis caching, Database indexes
- Security: Helmet, CORS, Rate Limiting, Zod validation, Sharp, DOMPurify

## Quick Start

```bash
npm run dev                           # Dev mode (frontend :5173, backend :3000)
npm run build && npm run start:prod  # Production (single server :3000)
npm run prisma:migrate && npm run prisma:seed
```

**Default Credentials**: admin/admin123 (SUPER_ADMIN), admin2/admin456 (ADMIN), moderator/moderator123 (MODERATOR)

## Architecture

### Database (14 tables)
Core: `users`, `categories`, `recipes`, `recipe_categories`, `comments`, `newsletter_subscribers`, `site_settings`, `static_pages`
Admin: `admin_logs`, `spam_filter_settings`, `smtp_settings`, `email_templates`, `email_logs`
JSON fields in recipes: ingredients (with categories/quantities/units), instructions, nutrition, tips, prepTime

### Routes
**Public**: `/`, `/recipe/:id`, `/category/:slug`, `/search`, `/best`, `/about`, `/contact`, `/rules`, `/advertising`, `/sitemap.xml`
**Admin**: Dashboard, Recipes, Categories, Tags, Comments, Newsletter (ADMIN+), Users (ADMIN+), Static Pages (ADMIN+), Settings (ADMIN+), Spam Filter (SUPER_ADMIN), Admin Logs (SUPER_ADMIN)

### API
**Public**: `/api/auth/login`, `/api/recipes` (?sort=newest|popular|photo), `/api/recipes/:id`, `/api/recipes/:id/view`, `/api/recipes/search`, `/api/recipes/stats`, `/api/categories`, `/api/categories/:slug/recipes`, `/api/settings`, `/api/static-pages/:slug`, `/api/comments`, `/api/newsletter/*`, `/sitemap.xml`

**Protected** (Bearer token required):
- MOD+: `/api/admin/{stats,recipes,categories,tags,comments}`, `/api/upload/*`
- ADMIN+: `/api/admin/{users,settings,static-pages,newsletter,email-logs}`
- SUPER_ADMIN: `/api/admin/{smtp,email-templates,spam-filter,logs}`

## Database & Types

**Connection**: PostgreSQL via Prisma (`soroka-food-backend/.env`) - URL-encode special chars (# → %23, @ → %40)
**Types Location**: `soroka-food-app/src/types/index.ts` (matches Prisma schema)
**Key Types**: Recipe, RecipeDetail, Ingredient, InstructionStep, Nutrition, Comment, Category, User, SiteSettings, StaticPage, AdminLog

## Structure

**Frontend** (`soroka-food-app/src/`): components (RecipePrintView, ImageModal, Breadcrumbs, Head, StructuredData), pages, pages/admin, hooks (useCategories, useSidebarData), contexts (SettingsContext, ToastContext), services (api.ts), utils (image, sanitize, viewTracker, seo, schema), styles (component-scoped CSS), types

**Backend** (`soroka-food-backend/src/`): controllers (sitemap), routes (sitemap), middleware (auth, errorHandler, upload, rateLimiter, validation, permissions, cache), validators (Zod), utils (jwt, password, imageProcessor, spamFilter, adminLogger, cacheInvalidation), config (database, redis, logger)

**Images**: Multer → `public/uploads/` (max 5MB, jpeg/jpg/png/webp) → Sharp converts to WebP (main 1200px quality 85 + thumbnail 300px quality 80) → Use `getImageUrl(path)` helper for URLs

## Key Patterns

### Recipe Form
- **Ingredients**: Group-based UI with optional categories, measurement units (г, кг, мл, л, шт, ст.л., ч.л., стакан, щепотка, по вкусу), quantity field for auto-scaling
- **Time**: prepTime (optional) + cookingTime (required), formatted as "1 ч 30 мин"
- **Nutrition**: Decimal input (comma/dot), stored as string during edit, converted to number on submit
- **Categories/Tags**: Select existing or create new (auto-slug, Russian-to-Latin transliteration), visual chips
- DRAFT/PUBLISHED status

### API Response Formats
- Lists: `{data: [...], pagination: {page, limit, total, totalPages}}`
- Single: Direct object | Upload: `{url, thumbnail}` | Auth: `{token, user}`
- Always check `Array.isArray()` before mapping

### Features
- **Search**: Case-insensitive (title/description/tags), paginated
- **Filtering**: ?sort=newest|popular|photo, by category
- **Portion Scaling**: +/- buttons, automatic recalculation for ingredients with quantity/unit
- **View Tracking**: localStorage + 24h throttle, separate POST endpoint
- **Comments**: Submit → Spam check → PENDING/SPAM → Moderation → Display APPROVED only (pagination: 20/page)
- **Spam Protection**: Honeypot + auto-detection (keywords/URLs/caps/repetition/duplicates) + bulk moderation + configurable filters (SUPER_ADMIN)
- **Static Pages**: Database-driven, HTML editor, DOMPurify sanitization
- **Social Sharing**: VK, Telegram, WhatsApp, copy link
- **Recipe Print**: Optimized A4 layout with QR code for mobile access (hidden on mobile), React Portal-based rendering, includes main image, scaled ingredients, step images, nutrition, and tips
- **QR Codes**: In-page QR code in share section (desktop only), print-version QR code for phone access

### User Management & RBAC

**Roles**: SUPER_ADMIN (full access, advanced settings), ADMIN (content + user management, can only create MODERATORs), MODERATOR (recipes/categories/tags/comments only)

**Permissions**: All roles → Recipes/Categories/Tags/Comments | ADMIN+ → Newsletter/Static Pages/Settings/Users | SUPER_ADMIN → Spam Filter/Admin Logs

**API** (`/api/admin/users/*`): GET / (list, filter by role), GET /:id, POST / (create), PUT /:id (update), DELETE /:id (delete), PATCH /:id/password, PATCH /:id/status

**Security**: Self-deletion prevention, privilege escalation prevention, last SUPER_ADMIN protection, username 3-50 chars (alphanumeric+underscore), password min 8 chars (uppercase+lowercase+number)

### Anti-Spam System

**6-Layer Defense**:
1. **Honeypot**: Hidden 'website' field (bots filling it → SPAM)
2. **Auto-Detection**: Keywords (100+ terms + custom), URLs (threshold 0-10), CAPS (50-100%), repetition, duplicates (24h)
3. **Bulk Moderation**: Checkbox selection, mass actions (Approve/Spam/Pending/Delete)
4. **Configurable Filters** (SUPER_ADMIN): Toggle filters, adjust thresholds, add/remove custom keywords, DB-driven settings
5. **API** (SUPER_ADMIN): GET/PUT `/api/admin/spam-filter`, POST/DELETE `/api/admin/spam-filter/keywords/:keyword`
6. **Flow**: Submit → Honeypot → Spam analysis → PENDING/SPAM → Moderation → APPROVED displayed

**Files**: Backend: `utils/spamFilter.ts`, `controllers/spamFilterController.ts` | Frontend: `pages/admin/{AdminSpamFilter,AdminComments}.tsx`, `pages/RecipeDetail.tsx`

### Admin Action Logging

**Purpose** (SUPER_ADMIN only): Audit trail for security, compliance, troubleshooting

**Logged Actions**: Login/logout, Recipe/Category/Tag CRUD, Comment moderation (including bulk), User management, Settings updates, Static pages, Newsletter

**Logged Data**: User, action type (enum), resource type (enum), resource ID, details (JSON: old/new values, affected count), IP address (X-Forwarded-For support), user agent, timestamp

**API** (SUPER_ADMIN): GET `/api/admin/logs` (filter: page, limit 1-100, userId, action, resource, startDate, endDate), GET `/api/admin/logs/stats`

**Frontend** (`AdminLogs.tsx`): Filtering (user/action/resource/date), pagination (10/25/50/100), expandable JSON details, color-coded badges, mobile-friendly

**Usage**: Controllers call `logAdminAction()` after operations. Helpers: `createUpdateDetails()`, `createDeleteDetails()`, `createBulkDetails()`, `getClientIp()`

**Security**: Append-only logs, cascade delete on user deletion, indexed for fast queries

**Files**: Backend: `utils/adminLogger.ts`, `controllers/adminLogController.ts` | Frontend: `pages/admin/AdminLogs.tsx`

### Email/Newsletter System

**Features**:
1. **Double Opt-In**: Verification email → 24h window → Welcome email (auto-cleanup unverified after 7 days)
2. **SMTP Config** (SUPER_ADMIN): DB-stored settings (AES-256 encrypted password), test connection, support Gmail/Mailgun/SendGrid/custom
3. **Email Templates** (SUPER_ADMIN): VERIFICATION, WELCOME, NEW_RECIPE, UNSUBSCRIBE (Handlebars with variables, HTML+text, full CRUD, preview)
4. **Automated Newsletter**: Auto-triggers on recipe PUBLISHED, async batch send (50/batch, 2s delay), verified subscribers only, includes unsubscribe link
5. **Unsubscribe**: One-click via unique token, confirmation email, re-subscribe option
6. **Email Logs** (ADMIN+): Send history (SENT/FAILED/PENDING), error tracking, filtering, statistics, pagination

**API**:
- Public: POST `/api/newsletter/subscribe`, GET `/api/newsletter/{verify,unsubscribe}/:token`
- SUPER_ADMIN: GET/PUT `/api/admin/smtp`, POST `/api/admin/smtp/test`, Full CRUD `/api/admin/email-templates`
- ADMIN+: GET `/api/admin/email-logs`, GET `/api/admin/email-logs/stats`

**DB Models**: SmtpSettings, EmailTemplate, NewsletterSubscriber, EmailLog

**Security**: AES-256 encryption, verification tokens (32-byte), unsubscribe tokens (UUID), rate limiting (3/hour on subscribe)

**Env**: `EMAIL_ENCRYPTION_KEY`, `FRONTEND_URL`, `BACKEND_URL`

**Files**: Backend: `utils/{emailService,emailTemplates,newsletterQueue}.ts`, controllers: `{smtp,emailTemplate,emailLog,newsletter}Controller.ts` | Frontend: `pages/admin/{AdminSmtpSettings,AdminEmailLogs}.tsx`, `pages/{VerifyEmail,Unsubscribe}.tsx`

### Recipe Print System

**Features**:
1. **Print Button**: Located in share section, triggers `window.print()` with optimized layout
2. **A4 Optimized Layout**: Compact typography (10-11pt), optimized margins (12-15mm), page break control
3. **QR Codes**:
   - In-page QR in share section (desktop only, hidden on mobile ≤768px)
   - Print-version QR for mobile access (100px, right-aligned)
4. **Content**: Recipe title, description, info (servings/times), main image (max 100mm), grouped ingredients with scaling, step-by-step instructions with images (max 60×50mm each), nutrition facts, tips
5. **React Portal**: Print view rendered to `document.body` to avoid content interference
6. **Print-Only CSS**: `@media print` hides `#root`, shows only `.recipe-print-view`, optimized spacing

**Implementation**: `RecipePrintView.tsx` uses `createPortal()`, receives `recipe` and `currentServings` props, scales ingredients automatically, renders HTML content with `dangerouslySetInnerHTML`, integrates `react-qr-code` (size 100, level M)

**Dependencies**: `react-qr-code` library for QR generation

**Files**: Frontend: `components/RecipePrintView/{RecipePrintView.tsx,.css}`, `pages/RecipeDetail.tsx`, `styles/RecipeDetail.css`

## SEO & Performance

### SEO Optimization (✅ IMPLEMENTED)

**META Tags & Open Graph**
- **Components**: `components/Head/Head.tsx` - Dynamic meta-tags manager
- **Features**:
  - Unique title and description for each page
  - Open Graph tags (og:title, og:description, og:image, og:url, og:type)
  - Twitter Card tags (twitter:card, twitter:title, twitter:description, twitter:image)
  - Canonical URLs to prevent duplicate content
  - Article-specific tags (publishedTime for recipes)
  - Robots meta (index, follow)
- **Integration**: RecipeDetail, Home, CategoryPage
- **Utils**: `utils/seo.ts` - Helpers for meta description generation, URL formatting, ISO 8601 duration

**Schema.org Structured Data**
- **Components**: `components/StructuredData/StructuredData.tsx` - JSON-LD injector
- **Schemas**: `utils/schema.ts` - Schema generators:
  1. **Recipe** - Full recipe markup (ingredients, instructions, time, nutrition, rating)
  2. **WebSite** - Site schema with SearchAction
  3. **Organization** - Organization info with social links
  4. **BreadcrumbList** - Navigation breadcrumbs
- **Rich Snippets**: ⭐⭐⭐⭐⭐ rating, cooking time, calories in Google search
- **Format**: ISO 8601 durations (PT1H30M), proper nutrition markup

**Technical SEO**
- **robots.txt**: `soroka-food-app/public/robots.txt` - Indexing rules (allow public, disallow admin)
- **sitemap.xml**: Dynamic endpoint `/sitemap.xml` - Auto-generated from DB
  - All PUBLISHED recipes (priority 0.8, weekly)
  - All categories (priority 0.7, weekly)
  - Static pages (priority 0.5-0.6, monthly)
  - Homepage (priority 1.0, daily)
  - Cache: 1 hour
- **Controllers**: `controllers/sitemapController.ts`, `routes/sitemapRoutes.ts`

**Performance Optimization**
- **Preload**: Critical resources (fonts, logo) in index.html
- **Lazy Loading**: All images except hero (loading="lazy", decoding="async")
- **Font Display**: font-display: swap for Google Fonts
- **Lang**: lang="ru" in HTML tag for proper indexing
- **Theme Color**: meta theme-color for mobile browsers

**Files**:
- Frontend: `components/Head/Head.tsx`, `components/StructuredData/StructuredData.tsx`, `utils/seo.ts`, `utils/schema.ts`, `public/robots.txt`, `index.html`
- Backend: `controllers/sitemapController.ts`, `routes/sitemapRoutes.ts`

**Expected Results**:
- Rich snippets in Google (1-2 months)
- CTR +30-50% (1-2 months)
- Organic traffic +40-60% (3-6 months)
- Featured snippets for popular recipes (6-12 months)

**Setup Required**:
1. Update `FRONTEND_URL` in backend `.env`
2. Update sitemap URL in `robots.txt` (yourdomain.com)
3. Submit sitemap to Google Search Console
4. Test Rich Results: https://search.google.com/test/rich-results

### Database
**Indexed Fields**: Recipe (status, createdAt, views, rating), Comment (recipeId, status, createdAt), RecipeCategory (categoryId), AdminLog (userId, action, resource, createdAt), EmailLog (subscriberId, status, createdAt), NewsletterSubscriber (verificationToken, unsubscribeToken)

### Redis Caching
**Implementation**: Graceful fallback (app works without Redis), GET-only caching, auto-invalidation on CRUD
**TTL**: recipes 5-10min, categories 30min, stats 10min
**Invalidation**: Recipe CRUD → recipes/categories/stats, Category CRUD → categories/recipes, Comment moderation → recipe

### Images
**WebP-Only**: All uploads → WebP (main 1200px quality 85 + thumbnail 300px quality 80), 25-35% smaller than JPEG, original files deleted, saves 50% disk space

### HTTP Caching
Uploads: 1 year immutable | JS/CSS/fonts: 1 year immutable | HTML: 1 day | index.html: no-cache

### Other
- **SettingsContext**: Load once per session (prevents 8+ API calls per navigation)
- **API Client** (`api.ts`): Centralized, token management, auto-logout on 401, namespaces: auth, recipes, categories, staticPages, admin.*, upload
- **Comments Pagination**: 20/page, "Load More" button

## Important Notes

- **Images**: Always use `getImageUrl(path)` helper (backend returns relative paths)
- **Admin vs Public**: Public `/api/recipes/:id` returns PUBLISHED only, admin endpoint returns ALL (including DRAFT)
- **Security**: JWT + role-based permissions, bcrypt (10 rounds), file uploads: images only (max 5MB)

## Security & Production

### Security
**Helmet**: HTTP headers, CSP | **CORS**: `ALLOWED_ORIGINS` (.env, comma-separated) | **Trust Proxy**: Enabled for nginx (`app.set('trust proxy', 1)`)

**Rate Limiting** (IP-based): API 1000/15min, Login 5/15min, Register 3/hour, Uploads 50/hour, Comments 10/15min

**Validation** (Zod): auth (username 3-50, password min 8 uppercase+lowercase+number), recipe (title 3-255, description 10-1000, cookingTime max 1440min, servings max 100), comment (author 2-100, rating 1-5, text 10-1000), user (username 3-50 alphanumeric+underscore, password min 8)

**Image Validation** (Sharp): jpeg/jpg/png/webp only, max 5000x5000px, integrity check, auto-cleanup

**HTML Sanitization** (DOMPurify): Allowed tags (p, br, strong, em, u, h2, h3, ul, ol, li, a), strips dangerous HTML/JS

### Environment Variables

**Backend** (.env):
```bash
DATABASE_URL=postgresql://user:password@localhost:5432/soroka-food  # URL-encode special chars
JWT_SECRET=<64+ char random>  # Generate: node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
JWT_EXPIRES_IN=7d
PORT=3000
NODE_ENV=development|production
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000  # Production: your domains
MAX_FILE_SIZE=5242880  # 5MB
REDIS_URL=redis://localhost:6379  # Optional
EMAIL_ENCRYPTION_KEY=<32-char random>  # For SMTP
FRONTEND_URL=http://localhost:5173  # For email links
BACKEND_URL=http://localhost:3000
PRISMA_ENGINES_MIRROR=https://github.com/prisma/prisma-engines/releases  # Fix for ECONNRESET
PRISMA_BINARIES_MIRROR=https://npmmirror.com/mirrors/prisma
```

**Frontend** (.env) - standalone deployment:
```bash
VITE_API_URL=http://localhost:3000/api  # Dev | Production: https://yourdomain.com/api
VITE_APP_ENV=production
```

### Docker

**Architecture**: Frontend (nginx :80) → nginx proxies `/api/*`, `/uploads/*` to backend → `VITE_API_URL=/api` (relative, pre-configured)

**IMPORTANT**: Vite embeds `VITE_*` at build-time (not runtime). Backend uses runtime env vars, Frontend uses build-time env vars.

**Deploy**:
```bash
docker-compose up -d --build  # Build and start
docker-compose exec backend npx prisma migrate deploy && npx prisma db seed  # Migrations
```

**Custom Domain**: Update `docker-compose.yml` → `frontend.build.args.VITE_API_URL: https://api.yourdomain.com/api`

**Troubleshooting**: Images show localhost → Rebuild frontend: `docker-compose up -d --build frontend`

### Production Checklist
- [ ] Strong JWT_SECRET (64+ chars), ALLOWED_ORIGINS with production domains, NODE_ENV=production
- [ ] .env in .gitignore, test build locally, SSL/HTTPS via reverse proxy

## Troubleshooting

- **PostgreSQL**: Ensure service running, correct .env credentials
- **Ports**: 3000 (backend) or 5173 (frontend) may be in use
- **Images**: Use `getImageUrl()` helper. In Docker: check `VITE_API_URL` in `docker-compose.yml` build args, rebuild frontend
- **404 on drafts**: Use admin endpoint (`/api/admin/recipes/:id`), not public endpoint
- **Nginx proxy error**: `app.set('trust proxy', 1)` already configured, ensure nginx passes X-Forwarded-For
- **Prisma ECONNRESET**: Mirrors configured in Dockerfile (`PRISMA_ENGINES_MIRROR`, `PRISMA_BINARIES_MIRROR`)
