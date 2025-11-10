# CLAUDE.md

This file provides guidance to Claude Code when working with this repository.

## Project Overview

**Soroka Food** - Full-stack culinary blog with React 19 + Node.js + PostgreSQL

**Structure**: Monorepo with `soroka-food-app` (frontend) and `soroka-food-backend` (backend)

**Tech Stack**:
- Frontend: React 19, TypeScript, Vite, React Router 7, Plain CSS
- Backend: Express 5, Prisma ORM, PostgreSQL, JWT auth, bcrypt
- Performance: Redis (ioredis) for caching, Database indexes for query optimization
- Security: Helmet, CORS, Rate Limiting, Zod validation, Sharp image validation, DOMPurify (XSS)

## Quick Start Commands

**Development** (from root): `npm run dev` - starts both frontend (:5173) and backend (:3000)
**Production**: `npm run build && npm run start:prod` - single server on :3000
**Database**: `npm run prisma:migrate && npm run prisma:seed`
**Default credentials**:
- **admin** / admin123 (SUPER_ADMIN)
- **admin2** / admin456 (ADMIN)
- **moderator** / moderator123 (MODERATOR)

## Architecture

### Database Schema (14 tables)
`users` (roles: SUPER_ADMIN/ADMIN/MODERATOR, active status), `categories`, `recipes` (with JSON: ingredients with categories/quantities/units, instructions, nutrition, tips; prepTime field for preparation time), `recipe_categories`, `comments` (moderation: APPROVED/PENDING/SPAM), `newsletter_subscribers` (verified, verificationToken, unsubscribeToken), `site_settings`, `static_pages`, `spam_filter_settings` (configurable anti-spam rules), `admin_logs` (audit trail for all admin/moderator actions), `smtp_settings` (encrypted email server config), `email_templates` (customizable templates with Handlebars), `email_logs` (send history with status tracking)

### Key Routes

**Public**:
- `/` - Home with tab filters (All/Newest/Popular/With Photo)
- `/recipe/:id` - Recipe detail with social sharing, comments, nutrition
- `/category/:slug`, `/search?q=`, `/best` - Filtering/search
- `/about`, `/contact`, `/rules`, `/advertising` - Editable static pages

**Admin** (`/admin/*` - JWT protected, role-based access):
- Dashboard, Recipes (CRUD), Categories, Tags (rename/delete), Comments (moderation with bulk actions), Newsletter (ADMIN+), Users (ADMIN+), Static Pages (ADMIN+), Settings (ADMIN+), Spam Filter (SUPER_ADMIN only), Admin Logs (SUPER_ADMIN only)

### API Endpoints

**Public**: `/api/auth/login`, `/api/recipes` (supports ?sort=newest|popular|photo), `/api/recipes/:id`, `/api/recipes/:id/view`, `/api/recipes/search`, `/api/recipes/stats`, `/api/categories`, `/api/categories/:slug/recipes`, `/api/settings`, `/api/static-pages/:slug`, `/api/comments`, `/api/newsletter/subscribe`, `/api/newsletter/verify/:token`, `/api/newsletter/unsubscribe/:token`

**Protected** (requires `Authorization: Bearer <token>`):
- `/api/admin/*` - stats (MOD+), recipes (MOD+), categories (MOD+), tags (MOD+), comments (MOD+ including bulk actions), newsletter (ADMIN+), users (ADMIN+), settings (ADMIN+), static-pages (ADMIN+), email-logs (ADMIN+), smtp (SUPER_ADMIN only), email-templates (SUPER_ADMIN only), spam-filter (SUPER_ADMIN only), logs (SUPER_ADMIN only)
- `/api/admin/logs` - GET / (list logs with filters), GET /stats (statistics)
- `/api/admin/smtp` - GET /, PUT /, POST /test (SMTP configuration)
- `/api/admin/email-templates` - Full CRUD + POST /:id/preview, GET /variables
- `/api/admin/email-logs` - GET /, GET /stats (email send history)
- `/api/upload/*` - recipe-image (MOD+), step-images (MOD+)

## Database & Types

**PostgreSQL** via Prisma - URL: `postgresql://user:password@localhost:5432/soroka-food` (URL-encode special chars: # → %23, @ → %40)
**Location**: `soroka-food-backend/.env`

**TypeScript types** (`soroka-food-app/src/types/index.ts`) match Prisma schema
**Key types**: Recipe, RecipeDetail, Ingredient (with name, amount, quantity, unit, category), InstructionStep, Nutrition, Comment, Category, User, SiteSettings, StaticPage, AdminLog, AdminLogsResponse, AdminLogsStats
**Prisma JSON fields**: ingredients (with optional category grouping, quantity/unit for auto-scaling), instructions, nutrition, tips (stored as JSON in PostgreSQL), details (in admin_logs - stores action-specific data)

## Project Structure

```
soroka-food-app/src/
├── components/      # Header (dynamic logo/name), Footer, RecipeCard, Pagination, Sidebar, SiteStats
├── pages/           # Home, RecipeDetail (with honeypot), CategoryPage, SearchResults, BestRecipes, static pages
├── pages/admin/     # Dashboard, AdminRecipes, RecipeForm, AdminStaticPages, AdminSettings, AdminSpamFilter, AdminComments (with bulk actions), AdminUsers, UserForm, AdminLogs, etc.
├── hooks/           # useCategories, useSidebarData
├── contexts/        # SettingsContext (global state, loads once), ToastContext
├── services/        # api.ts (centralized API client with token management)
├── utils/           # image.ts (getImageUrl helper), sanitize.ts (DOMPurify), viewTracker.ts
├── styles/          # Plain CSS, component-scoped (Header.css, Home.css, etc.)
└── types/           # TypeScript definitions

soroka-food-backend/src/
├── controllers/     # authController, recipeController, adminController, staticPageController, tagController, userController, spamFilterController, adminLogController, uploadController
├── routes/          # authRoutes, recipeRoutes, adminRoutes, staticPageRoutes, uploadRoutes, userRoutes, adminLogRoutes
├── middleware/      # auth, errorHandler, upload (multer), rateLimiter, validation, imageValidation, permissions, cache
├── validators/      # Zod schemas (auth, recipe, comment, user)
├── utils/           # jwt, password (bcrypt), imageProcessor (Sharp - WebP conversion), spamFilter, adminLogger, cacheInvalidation
└── config/          # database.ts (Prisma client), redis.ts (Redis client), logger.ts (Winston)
```

**Styling**: Plain CSS (component-scoped), Google Fonts Montserrat (logo typography)
**File uploads**: Multer → `public/uploads/`, max 5MB, jpeg/jpg/png/webp input
**Image optimization**: Sharp converts all uploads to WebP format - main (1200px max, quality 85) + thumbnail (300px, quality 80)
**Frontend image helper**: `getImageUrl(path)` - converts relative paths to full URLs

## Key Implementation Patterns

### Recipe Form (`RecipeForm.tsx`)
- Create (`/admin/recipes/new`) vs Edit mode (`/admin/recipes/:id/edit`)
- **Ingredient Management**:
  - Group-based interface with optional categories (e.g., "Для соуса", "Для теста")
  - Measurement units dropdown: г, кг, мл, л, шт, ст.л., ч.л., стакан, щепотка, по вкусу
  - Quantity field (numeric) for automatic portion scaling
  - Auto-generates `amount` string from quantity + unit
- **Time Management**:
  - Preparation time (prepTime) - optional field in minutes
  - Cooking time (cookingTime) - required field in minutes
  - Display formatted as hours/minutes (e.g., "1 ч 30 мин" for 90 minutes)
- **Nutrition Fields**:
  - Support for decimal input with both comma and dot separators
  - Stored as string during editing, converted to number on submit
  - Validation: only allows digits and one decimal point
- Dynamic instruction management, file upload with preview
- Category management: select existing or create new (auto-slug generation, Russian-to-Latin transliteration)
- Tag management: auto-load existing tags, create on-the-fly, visual chips
- Supports DRAFT/PUBLISHED status

### API Response Formats
- **List endpoints**: `{data: [...], pagination: {page, limit, total, totalPages}}`
- **Single resource**: Direct object
- **Simple collections**: Direct array
- **Upload**: `{url: string}` or `{urls: string[]}`
- **Auth**: `{token: string, user: {...}}`
- Always check `Array.isArray()` before mapping

### Smart View Tracking
- **Frontend** (`viewTracker.ts`): localStorage tracking, 24-hour throttle per user
- **Backend**: Separate endpoint `POST /api/recipes/:id/view` (not auto-incremented on GET)
- **Integration**: Non-blocking API call, only increments if 24h passed

### Features
- **Search**: Case-insensitive across title/description/tags, supports pagination
- **Filtering**: `?sort=newest|popular|photo`, by category
- **Portion Scaling** (RecipeDetail.tsx):
  - +/- buttons to adjust serving size dynamically
  - Automatic ingredient quantity recalculation based on new portion count
  - Only scales ingredients with numeric quantity and unit (preserves text-based amounts like "по вкусу")
  - Formula: `newQuantity = originalQuantity * (currentServings / originalServings)`
- **Time Display** (utils/time.ts):
  - formatTime() utility converts minutes to human-readable format
  - Examples: 30 → "30 мин", 60 → "1 ч", 90 → "1 ч 30 мин", 125 → "2 ч 5 мин"
  - Shows "Общее время" with breakdown when both prepTime and cookingTime present
- **Comments**:
  - Submit → Auto spam check → PENDING/SPAM → Admin moderates (APPROVED/PENDING/SPAM) → Display APPROVED only
  - **Pagination**: `GET /api/comments/recipe/:id?page=1&limit=20` (max 100 per page), "Load More" button shows remaining count
- **Spam Protection**: Multi-layer defense - honeypot trap, auto-detection (keywords/URLs/caps/repetition/duplicates), bulk moderation actions, configurable filters (SUPER_ADMIN only)
- **Tags**: Global CRUD system - view usage stats, rename across all recipes, delete with confirmation
- **Static Pages**: Database-driven, editable via admin with HTML editor, sanitized with DOMPurify
- **Social Sharing**: VK, Telegram, WhatsApp, copy link (RecipeDetail.tsx:116-174)
- **Sidebar**: Dynamic categories (useSidebarData hook), top 5 by recipe count
- **Stats**: Real-time site statistics (SiteStats component fetches from `/api/recipes/stats` - recipesCount, commentsCount, viewsCount)

### User Management & Role-Based Access Control

**Three-Tier Role Hierarchy**:
- **SUPER_ADMIN (Главный администратор)**: Full system access including advanced settings, can create ADMIN and MODERATOR users
- **ADMIN (Администратор)**: All content management rights, can only create MODERATOR users, cannot access advanced settings
- **MODERATOR (Модератор)**: Content-only access - recipes (CRUD), categories, tags, comment moderation

**Permission Matrix**:
| Feature | SUPER_ADMIN | ADMIN | MODERATOR |
|---------|-------------|-------|-----------|
| Recipes CRUD | ✓ | ✓ | ✓ |
| Categories CRUD | ✓ | ✓ | ✓ |
| Tags CRUD | ✓ | ✓ | ✓ |
| Comments Moderation | ✓ | ✓ | ✓ |
| Newsletter Management | ✓ | ✓ | ✗ |
| Static Pages | ✓ | ✓ | ✗ |
| Site Settings | ✓ | ✓ | ✗ |
| User Management | ✓ | ✓ (MODERATOR only) | ✗ |
| Spam Filter Management | ✓ | ✗ | ✗ |
| Admin Action Logs | ✓ | ✗ | ✗ |

**User Management API** (`/api/admin/users/*` - requires ADMIN or above):
- `GET /api/admin/users` - List all users (optional ?role=SUPER_ADMIN|ADMIN|MODERATOR filter)
- `GET /api/admin/users/:id` - Get user by ID
- `POST /api/admin/users` - Create user (role validation: ADMIN can only create MODERATOR)
- `PUT /api/admin/users/:id` - Update user (prevents self-privilege escalation)
- `DELETE /api/admin/users/:id` - Delete user (prevents self-deletion, protects last SUPER_ADMIN)
- `PATCH /api/admin/users/:id/password` - Change password (min 8 chars, uppercase+lowercase+number)
- `PATCH /api/admin/users/:id/status` - Toggle active/inactive status

**Frontend Components**:
- `AdminUsers.tsx` (`/admin/users`): User list with role badges, status indicators, filter by role, edit/delete/toggle actions
- `UserForm.tsx` (`/admin/users/new`, `/admin/users/:id/edit`): Create/edit form with validation, password change modal, random password generator

**Security Features**:
- **Validation** (`user.validator.ts`): Username 3-50 chars (alphanumeric + underscore), password min 8 chars with uppercase+lowercase+number, email format
- **Permission Helpers** (`middleware/permissions.ts`): `canManageUser()`, `canCreateUserWithRole()`, `cannotElevateOwnRole()`, `isSelf()`
- **Middleware** (`middleware/auth.ts`): `requireSuperAdmin`, `requireAdminOrAbove`, `requireModeratorOrAbove`
- **Protection**: Self-deletion prevention, privilege escalation prevention, last SUPER_ADMIN deletion prevention

**Implementation Files**:
- Backend: `controllers/userController.ts`, `routes/userRoutes.ts`, `validators/user.validator.ts`, `middleware/permissions.ts`
- Frontend: `pages/admin/AdminUsers.tsx`, `pages/admin/UserForm.tsx`, updated `services/api.ts`, updated `types/index.ts`

### Anti-Spam System

**Multi-Layer Protection** (6 levels of defense):

1. **Honeypot Trap** (`RecipeDetail.tsx`):
   - Hidden 'website' field (invisible to humans, visible to bots)
   - Bots filling this field are silently marked as SPAM with fake success response

2. **Automatic Spam Detection** (`utils/spamFilter.ts`):
   - **Keyword Filter**: Checks against built-in spam words (100+ terms) + custom keywords (configurable)
   - **URL Filter**: Detects excessive links (configurable threshold 0-10)
   - **Caps Filter**: Blocks ALL CAPS text (configurable percentage 50-100%)
   - **Repetitive Filter**: Identifies repeated characters/patterns
   - **Duplicate Filter**: Prevents same text reposting within 24h window

3. **Bulk Moderation** (`AdminComments.tsx`):
   - Checkbox selection with "Select All" option
   - Mass actions: Approve, Mark as Spam, Set to Pending, Delete
   - Handles large spam waves efficiently (vs clicking 1000 times)

4. **Configurable Spam Filter** (SUPER_ADMIN only, `/admin/spam-filter`):
   - **Toggle Filters**: Enable/disable each detection method independently
   - **Adjustable Thresholds**: Slider controls for maxUrls (0-10) and capsPercentage (50-100%)
   - **Custom Keywords**: Add/remove spam words dynamically, displayed as chips
   - **Database-Driven**: All settings stored in `SpamFilterSettings` table (single-row, id=1)
   - **Real-time Updates**: Changes apply immediately with toast notifications
   - **Smart UI**: Sliders save only on mouse release (not during drag) for smooth UX

5. **API Endpoints** (SUPER_ADMIN only):
   - `GET /api/admin/spam-filter` - Get current settings
   - `PUT /api/admin/spam-filter` - Update filter toggles/thresholds
   - `POST /api/admin/spam-filter/keywords` - Add custom spam keyword
   - `DELETE /api/admin/spam-filter/keywords/:keyword` - Remove keyword

6. **Comment Submission Flow**:
   ```
   User submits comment → Honeypot check → Spam filter analysis → Status assigned (PENDING/SPAM) → Database → Moderator reviews → APPROVED comments displayed
   ```

**Implementation Files**:
- Backend: `utils/spamFilter.ts`, `controllers/spamFilterController.ts`, `controllers/commentController.ts`, `routes/adminRoutes.ts`
- Frontend: `pages/admin/AdminSpamFilter.tsx`, `pages/admin/AdminComments.tsx` (with bulk actions), `pages/RecipeDetail.tsx` (honeypot)
- Database: `prisma/schema.prisma` (SpamFilterSettings model)

**Key Features**:
- Zero configuration required (works with sensible defaults)
- SUPER_ADMIN can fine-tune all detection parameters
- Non-intrusive (legitimate users never see spam protection)
- Protects against bot spam, manual spam, and mass spam attacks

### Admin Action Logging

**Comprehensive Audit Trail System** (SUPER_ADMIN only, `/admin/logs`):

**Purpose**: Track all administrative and moderator actions for security audit, compliance, and troubleshooting

**What Gets Logged**:
- **User Actions**: Login, logout, password changes
- **Content Management**: Recipe CRUD, category CRUD, tag operations (rename/delete)
- **Moderation**: Comment approval/spam/rejection/deletion, bulk actions
- **User Management**: User CRUD, role changes, status toggles
- **Settings**: Site settings updates, spam filter configuration
- **Static Pages**: Content updates
- **Newsletter**: Subscriber management

**Logged Data** (AdminLog model):
- User who performed action (with relation to User table)
- Action type (enum: LOGIN, CREATE_RECIPE, UPDATE_USER, etc.)
- Resource type (enum: RECIPES, USERS, COMMENTS, etc.)
- Resource ID (optional - specific record affected)
- Details (JSON - action-specific data: old/new values, affected count, etc.)
- IP address (extracted from request headers, supports X-Forwarded-For)
- User agent (browser/client info)
- Timestamp (automatic)

**API Endpoints** (SUPER_ADMIN only):
- `GET /api/admin/logs` - List logs with filtering and pagination
  - Query params: `page`, `limit` (1-100), `userId`, `action`, `resource`, `startDate`, `endDate`
  - Returns: `{logs: AdminLog[], pagination: {...}}`
- `GET /api/admin/logs/stats` - Dashboard statistics
  - Returns: total logs, recent activity count, action breakdown, user breakdown

**Frontend Features** (`AdminLogs.tsx`):
- **Filtering**: By user, action type, resource type, date range
- **Pagination**: Configurable page size (10/25/50/100 per page)
- **Expandable Details**: Click row to view full JSON details
- **User Context**: Shows username and role for each action
- **Visual Indicators**: Color-coded action badges (green=create, blue=update, red=delete, etc.)
- **Responsive Design**: Mobile-friendly table with overflow handling
- **Access Control**: SUPER_ADMIN check with redirect

**Implementation Pattern**:
Every admin controller method calls `logAdminAction()` after successful operation:
```typescript
import { logAdminAction, AdminAction, ResourceType, createUpdateDetails } from '../utils/adminLogger';
import { AuthRequest } from '../middleware/auth';

export const updateRecipe = async (req: AuthRequest, res: Response) => {
  const oldRecipe = await prisma.recipe.findUnique({ where: { id } });
  const updatedRecipe = await prisma.recipe.update({ /* ... */ });

  await logAdminAction({
    userId: req.user!.id,
    action: AdminAction.UPDATE_RECIPE,
    resource: ResourceType.RECIPES,
    resourceId: id,
    details: createUpdateDetails(oldRecipe, updatedRecipe),
    req
  });
};
```

**Helper Functions** (`utils/adminLogger.ts`):
- `logAdminAction()` - Main logging function
- `createUpdateDetails()` - Generates before/after comparison
- `createDeleteDetails()` - Formats deletion info
- `createBulkDetails()` - Handles bulk operations
- `getClientIp()` - Extracts IP from headers (supports proxies)

**Database Indexing**:
Optimized indexes on `userId`, `action`, `resource`, `createdAt` for fast filtering

**Security Features**:
- SUPER_ADMIN-only access (route-level and component-level checks)
- Logs cannot be deleted or modified (append-only)
- Cascade delete when user is deleted (maintains referential integrity)
- IP tracking for security incidents

**Implementation Files**:
- Backend: `utils/adminLogger.ts`, `controllers/adminLogController.ts`, `routes/adminLogRoutes.ts`
- Frontend: `pages/admin/AdminLogs.tsx`, `pages/admin/AdminLogs.css`
- Database: `prisma/schema.prisma` (AdminLog model)
- Integration: All admin controllers (auth, admin, user, tag, staticPage, spamFilter)

### Email/Newsletter System

**Comprehensive Newsletter & Email Marketing Platform** with verification, automated newsletters, and full admin control.

**System Overview**:
Complete email system with SMTP configuration, customizable templates, verified subscriptions, automated newsletters on new recipe publication, and detailed send history tracking.

**Core Features**:

1. **Email Verification (Double Opt-In)**:
   - Subscribers must verify email via link (protection from "email bombers")
   - 24-hour verification window
   - Auto-cleanup of unverified subscriptions after 7 days
   - Prevents fake/malicious subscriptions
   - Welcome email sent after verification

2. **SMTP Configuration** (SUPER_ADMIN only, `/admin/smtp`):
   - Database-stored settings (host, port, secure, user, password encrypted with AES-256)
   - Test connection functionality
   - Enable/disable toggle
   - Support for Gmail (app passwords), Mailgun, SendGrid, custom SMTP
   - Password encryption key in .env (`EMAIL_ENCRYPTION_KEY`)

3. **Email Templates** (SUPER_ADMIN only, customizable with Handlebars):
   - **VERIFICATION**: Sent when user subscribes (link to confirm)
   - **WELCOME**: Sent after successful verification
   - **NEW_RECIPE**: Automatic newsletter when recipe is published
   - **UNSUBSCRIBE**: Confirmation when user unsubscribes
   - Full CRUD via admin panel (create custom templates)
   - Preview with test data
   - Variable injection: `{{recipeName}}`, `{{recipeUrl}}`, `{{unsubscribeUrl}}`, etc.
   - HTML + plain text versions

4. **Automated Newsletter**:
   - Triggers automatically when recipe status changes to PUBLISHED
   - Async send (doesn't block API response)
   - Batch processing (50 subscribers per batch, 2-second delay between batches)
   - Only sent to verified subscribers
   - Includes recipe details, image, nutrition, link to full recipe
   - Every email includes unsubscribe link

5. **Unsubscribe System**:
   - Unique token per subscriber (generated on subscription)
   - One-click unsubscribe via `/unsubscribe/:token`
   - Confirmation email after unsubscribe
   - Re-subscribe option available

6. **Email Logs** (ADMIN+ only, `/admin/email-logs`):
   - Complete history of all sent emails
   - Status tracking: SENT, FAILED, PENDING
   - Error messages for failed sends
   - Filter by status, template type, date range
   - Statistics: total sent, failed, pending, recent activity (24h)
   - Pagination (10/25/50/100 per page)

**API Endpoints**:

**Public**:
- `POST /api/newsletter/subscribe` - Create subscription (sends verification email)
- `GET /api/newsletter/verify/:token` - Verify email address
- `GET /api/newsletter/unsubscribe/:token` - Unsubscribe by token

**Admin (SUPER_ADMIN only)**:
- `GET /api/admin/smtp` - Get SMTP settings (password hidden)
- `PUT /api/admin/smtp` - Update SMTP settings
- `POST /api/admin/smtp/test` - Test SMTP connection (sends test email)
- `GET /api/admin/email-templates` - List all templates
- `GET /api/admin/email-templates/:id` - Get template by ID
- `POST /api/admin/email-templates` - Create template
- `PUT /api/admin/email-templates/:id` - Update template
- `DELETE /api/admin/email-templates/:id` - Delete template (protects built-in defaults)
- `POST /api/admin/email-templates/:id/preview` - Preview template with test data
- `GET /api/admin/email-templates/variables` - Get available variables

**Admin (ADMIN+ only)**:
- `GET /api/admin/email-logs` - Get email send history (filterable, paginated)
- `GET /api/admin/email-logs/stats` - Get email statistics

**Database Models**:
- `SmtpSettings` (single-row, id=1): host, port, secure, user, password (encrypted), fromEmail, fromName, enabled
- `EmailTemplate`: name, subject, bodyHtml, bodyText, variables[], isDefault, type (enum)
- `NewsletterSubscriber`: email, status, verified, verificationToken, verifiedAt, unsubscribeToken
- `EmailLog`: subscriberId, templateId, subject, recipient, status, error, sentAt

**Frontend Pages**:
- `/admin/smtp` - SMTP settings form (SUPER_ADMIN only)
- `/admin/email-logs` - Email send history with stats (ADMIN+)
- `/verify-email/:token` - Public verification success page
- `/unsubscribe/:token` - Public unsubscribe confirmation page

**Implementation Files**:
- Backend Core: `utils/emailService.ts`, `utils/emailTemplates.ts`, `utils/newsletterQueue.ts`
- Backend Controllers: `controllers/smtpController.ts`, `controllers/emailTemplateController.ts`, `controllers/emailLogController.ts`, `controllers/newsletterController.ts`
- Backend Routes: `routes/smtpRoutes.ts`, `routes/emailTemplateRoutes.ts`, `routes/emailLogRoutes.ts`, `routes/newsletterRoutes.ts`
- Frontend: `pages/admin/AdminSmtpSettings.tsx`, `pages/admin/AdminEmailLogs.tsx`, `pages/VerifyEmail.tsx`, `pages/Unsubscribe.tsx`
- Database: `prisma/schema.prisma` (4 new models)
- Integration: `controllers/adminController.ts` (createRecipe, updateRecipe)

**Environment Variables** (`.env`):
```
EMAIL_ENCRYPTION_KEY=<32-character-random-string>
FRONTEND_URL=http://localhost:5173
BACKEND_URL=http://localhost:3000
```

**Setup Workflow**:
1. Run database migration: `npm run prisma:migrate && npm run prisma:seed`
2. Server auto-creates default email templates on start
3. SUPER_ADMIN configures SMTP in `/admin/smtp` (currently disabled)
4. SUPER_ADMIN tests connection
5. Enable email sending
6. System is ready - subscribers get verification emails, new recipes trigger newsletters

**Security Features**:
- AES-256 password encryption for SMTP credentials
- Verification tokens (32-byte random)
- Unsubscribe tokens (UUID)
- Rate limiting on subscribe (3 attempts/hour per IP)
- Email validation
- SUPER_ADMIN-only SMTP/template access
- Logs all email activity

**Key Features**:
- Zero-config defaults (works out of box, configure later)
- Protection from email bombing (double opt-in)
- Automatic newsletter on recipe publish
- Batch sending with rate limiting
- Retry logic (3 attempts with exponential backoff)
- Complete audit trail
- Responsive admin UI
- Template preview before send
- One-click unsubscribe

### Error Handling
- Backend: `AppError` class, global `errorHandler` middleware, `asyncHandler` wrapper
- Frontend: `ApiError` class in api.ts, auto-logout on 401

## Performance & Best Practices

### Database Performance
**Optimized Indexes** (added to improve query performance):
- **Recipe**: status, createdAt, views, rating - optimizes sorting/filtering
- **Comment**: recipeId, status, createdAt - optimizes moderation queries
- **RecipeCategory**: categoryId - optimizes reverse lookups
- **AdminLog**: userId, action, resource, createdAt - optimizes audit queries
- **EmailLog**: subscriberId, status, createdAt - optimizes email history
- **NewsletterSubscriber**: verificationToken, unsubscribeToken - optimizes token lookups

All indexes created via Prisma schema `@@index()` directive and applied via `npx prisma db push`.

### Redis Caching System
**Implementation** (`src/config/redis.ts`, `src/middleware/cache.ts`, `src/utils/cacheInvalidation.ts`):
- **Graceful Fallback**: App works without Redis (lazyConnect, error handling)
- **Smart Caching**: Only GET requests cached, configurable TTL per endpoint
- **Auto-Invalidation**: Cache cleared on data changes (create/update/delete)

**Cached Endpoints**:
- `/api/recipes` - 5 minutes (300s)
- `/api/recipes/:id` - 10 minutes (600s)
- `/api/recipes/search` - 5 minutes
- `/api/recipes/stats` - 10 minutes
- `/api/categories` - 30 minutes (1800s, rarely changes)
- `/api/categories/:slug/recipes` - 5 minutes

**Cache Invalidation Triggers**:
- Recipe CRUD → invalidates `/api/recipes*`, `/api/categories*`, `/api/recipes/stats`
- Category CRUD → invalidates `/api/categories*`, `/api/recipes*`
- Comment moderation → invalidates `/api/recipes/:recipeId`
- Bulk comment actions → invalidates all affected recipes

**Usage**:
```typescript
// In routes
import { cacheMiddleware } from '../middleware/cache';
router.get('/', cacheMiddleware(300), asyncHandler(getRecipes));

// In controllers (auto-invalidation)
import { invalidateRecipeCache } from '../utils/cacheInvalidation';
await invalidateRecipeCache(recipeId);
```

### Image Optimization
**Implementation** (`src/controllers/uploadController.ts`, `src/utils/imageProcessor.ts`):
- **WebP-Only Approach**: Every uploaded image is converted to WebP format (97%+ browser support, 25-35% smaller than JPEG)
- **Automatic Processing**: Generates 2 versions per upload
  - Main image (max 1200px width, quality 85, effort 4)
  - Thumbnail (300px width, quality 80, effort 4)
- **Format Support**: Accepts JPEG/PNG/WebP uploads, all converted to WebP output
- **File Cleanup**: Original uploaded files deleted after conversion (saves ~50% disk space vs storing multiple formats)
- **API Response**: Returns `{url: string, thumbnail: string}` for single image, `{urls: string[], images: [{url, thumbnail}]}` for multiple
- **Sharp Processing**: `convertToWebP()` and `createWebPThumbnail()` functions with optimal compression balance (effort 4)

### HTTP Caching
**Static File Caching** (configured in `src/index.ts`):
- **Uploads** (`/uploads`): 1 year cache, immutable, ETag, Last-Modified
- **Frontend Assets** (production):
  - JS/CSS/fonts: 1 year cache, immutable (content-hashed filenames)
  - HTML files: 1 day cache
  - `index.html`: no-cache (SPA entry point must always be fresh)
- **Benefits**: Reduces server load, improves page load times, lower bandwidth usage

### Comments Pagination
**Implementation** (`src/controllers/commentController.ts`, frontend `RecipeDetail.tsx`):
- **Backend**: Parallel queries (data + count) with `page`/`limit` parameters (max 100 per page)
- **Frontend**: "Load More" button with remaining count display
- **Response Format**: `{data: Comment[], pagination: {page, limit, total, totalPages, hasMore}}`
- **Default**: 20 comments per page, loads additional pages on demand

### SettingsContext - Global State
- Settings loaded once on app mount via `SettingsContext.tsx`
- Prevents redundant API calls (was 8+ per navigation, now 1 per session)
- Usage: `const { settings, loading } = useSettings()`
- Auto-updates document title from settings

### API Client (`api.ts`)
- Centralized client with token management (localStorage), auto-logout on 401, type-safe methods
- Key namespaces: `api.auth`, `api.recipes`, `api.categories`, `api.staticPages`, `api.admin.*`, `api.upload`

### Development Workflow
- **Dev mode**: `npm run dev` - two servers (frontend :5173, backend :3000, CORS enabled)
- **Production**: `npm run build && npm run start:prod` - single server :3000 (backend serves frontend)
- **Database changes**: Edit schema → `npm run prisma:migrate` → `npm run prisma:generate` → update types
- **New feature**: Backend (controller → route → index.ts) + Frontend (component → App.tsx route) + API call in services

## Important Notes

**Image Handling**: Always use `getImageUrl(path)` helper (never hardcode URLs). Backend returns relative paths (`/uploads/file.jpg`), helper converts to full URLs.

**Admin vs Public Endpoints**: Public recipe endpoint (`GET /api/recipes/:id`) returns PUBLISHED only. Admin endpoint (`GET /api/admin/recipes/:id`) returns ALL (including DRAFT) for editing. Always use admin endpoint in RecipeForm.

**Security**: All admin routes require JWT + role-based permissions (SUPER_ADMIN/ADMIN/MODERATOR). Passwords bcrypt-hashed (10 rounds). File uploads: images only (jpeg/jpg/png/webp), max 5MB.

## Security & Production

### Security Features
**Helmet**: Security HTTP headers, CSP for Google Fonts/external images
**CORS**: Environment-based origins (`ALLOWED_ORIGINS` in .env, comma-separated)
**Trust Proxy**: Enabled for nginx/reverse proxy support (`app.set('trust proxy', 1)`) - allows Express to correctly read client IP from X-Forwarded-For header, required for rate limiting and logging behind proxy
**Rate Limiting** (IP-based):
- General API: 1000 req/15min
- Login: 5 attempts/15min (brute-force protection)
- Register: 3/hour (disabled in production)
- Uploads: 50/hour
- Comments: 10/15min (spam protection)

**Zod Validation** (auth, recipe, comment, user validators):
- auth.validator.ts: Username 3-50 chars, password min 8 chars (uppercase+lowercase+number), email format
- recipe.validator.ts: Title 3-255, description 10-1000, cooking time max 1440min, servings max 100, min 1 ingredient/instruction
- comment.validator.ts: Author 2-100, email valid, rating 1-5, text 10-1000
- user.validator.ts: Username 3-50 alphanumeric+underscore, password min 8 with uppercase+lowercase+number, role enum validation
- Returns 400 with field-level errors

**Sharp Image Validation**: Format (jpeg/jpg/png/webp only), max 5000x5000px, integrity check, auto-cleanup invalid files

**DOMPurify HTML Sanitization** (`sanitize.ts`): Allowed tags (p, br, strong, em, u, h2, h3, ul, ol, li, a), strips dangerous HTML/JS, applied to static pages and admin-editable content

### Environment Variables

**Backend** (.env):
```
DATABASE_URL=postgresql://user:password@localhost:5432/soroka-food  # URL-encode special chars
JWT_SECRET=<64+ char random string>  # REQUIRED, generate: node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
JWT_EXPIRES_IN=7d
PORT=3000
NODE_ENV=development|production
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000  # Production: set your domains
MAX_FILE_SIZE=5242880  # 5MB
REDIS_URL=redis://localhost:6379  # Optional - app works without Redis with graceful fallback
EMAIL_ENCRYPTION_KEY=<32-character-random-string>  # For SMTP password encryption
FRONTEND_URL=http://localhost:5173  # For email verification links
BACKEND_URL=http://localhost:3000  # For API URLs in emails
# Prisma mirrors (fix for ECONNRESET during npm install on servers with limited connectivity)
PRISMA_ENGINES_MIRROR=https://github.com/prisma/prisma-engines/releases  # Alternative mirror for Prisma engines
PRISMA_BINARIES_MIRROR=https://npmmirror.com/mirrors/prisma  # Alternative mirror for Prisma binaries
```

**Frontend** (.env) - for standalone deployment without Docker:
```
# IMPORTANT: In production, set to your actual domain with /api suffix
VITE_API_URL=http://localhost:3000/api  # Development
# Production examples:
# VITE_API_URL=https://yourdomain.com/api
# VITE_API_URL=http://your-server-ip:3000/api

VITE_APP_ENV=production
```

### Docker Deployment

**Build-time vs Runtime Environment Variables**:
- **Backend**: Uses runtime environment variables (set in `docker-compose.yml` → `environment` section)
- **Frontend**: Uses **build-time** environment variables (must be set in `docker-compose.yml` → `build.args` section)

**IMPORTANT**: Vite embeds `VITE_*` variables during `npm run build`, NOT at runtime!

**Default Docker Setup** (nginx proxy architecture):
- Frontend (nginx) listens on port 80
- nginx proxies `/api/*` and `/uploads/*` to backend
- `VITE_API_URL=/api` (relative path) - already configured in Dockerfile
- No domain needed, nginx handles routing internally

**Deployment Steps**:
```bash
# 1. Set environment variables in docker-compose.yml or .env file
# For backend (runtime):
#   DATABASE_URL, JWT_SECRET, ALLOWED_ORIGINS, etc.
# For frontend (build-time):
#   VITE_API_URL=/api (default, already set)

# 2. Build and start containers
docker-compose up -d --build

# 3. Run database migrations
docker-compose exec backend npx prisma migrate deploy
docker-compose exec backend npx prisma db seed
```

**Custom Domain Setup**:
If frontend and backend are on different domains, update in `docker-compose.yml`:
```yaml
frontend:
  build:
    args:
      VITE_API_URL: https://api.yourdomain.com/api  # External API
```

**Troubleshooting Docker Images**:
- **Images show localhost URLs**: Frontend was built without correct `VITE_API_URL`. Rebuild: `docker-compose up -d --build frontend`
- **API works but images don't**: Vite build-time env issue. Check `docker-compose.yml` → `build.args` section
- **Rebuild after env changes**: `docker-compose down && docker-compose up -d --build`

### Production Checklist
- [ ] Strong JWT_SECRET (64+ chars)
- [ ] ALLOWED_ORIGINS with production domain(s)
- [ ] NODE_ENV=production
- [ ] .env in .gitignore
- [ ] Test production build locally
- [ ] Database connection for production
- [ ] SSL/HTTPS via reverse proxy

## Common Issues & Troubleshooting

- **PostgreSQL connection**: Ensure service running, correct credentials in .env
- **Migration lock**: Restart PostgreSQL service
- **Port conflicts**: Ports 3000 (backend) or 5173 (frontend) in use
- **CORS issues**: Update CORS config if frontend port changes
- **Images not displaying**: Use `getImageUrl()` helper, not hardcoded URLs. In Docker: ensure `VITE_API_URL` is set correctly in `docker-compose.yml` build args and rebuild frontend container
- **Images show localhost in production**: Frontend built with wrong `VITE_API_URL`. For Docker: check `docker-compose.yml` → `frontend.build.args.VITE_API_URL` and rebuild with `docker-compose up -d --build frontend`
- **404 on draft recipes**: Use admin endpoint for editing, not public endpoint
- **Nginx proxy error (ERR_ERL_UNEXPECTED_X_FORWARDED_FOR)**: When using nginx or other reverse proxy, Express must trust proxy headers. Solution: `app.set('trust proxy', 1)` is already configured in index.ts. Ensure nginx passes X-Forwarded-For header (`proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;`)
- **Prisma ECONNRESET during Docker build**: This occurs when Prisma engines fail to download during `npm install`. Solution: Dockerfile includes `PRISMA_ENGINES_MIRROR` and `PRISMA_BINARIES_MIRROR` environment variables pointing to alternative mirrors (GitHub releases and npmmirror.com). These are already configured in Dockerfile and docker-compose.yml. If issues persist, ensure your server has stable internet connection or try building during off-peak hours.

## Recent Updates & Features

**Key Features**:
- Full-text search (title/description/tags), tag-based navigation
- Dynamic sidebar (categories from DB), real-time statistics (recipes/users/comments)
- Tab filtering (All/Newest/Popular/With Photo) on home page
- Static pages editable via admin panel (About, Contact, Rules, Advertising)
- Social sharing (VK, Telegram, WhatsApp, copy link)
- Smart view tracking (24h throttle per user via localStorage)
- Tag management system (view stats, rename/delete across all recipes)

**Custom Hooks**: `useCategories()`, `useSidebarData()`, `useSettings()`

**Recent Enhancements**:
- **2025-01-10**: Recipe UX Improvements - Ingredient categorization with group-based UI (e.g., "Для соуса", "Для теста"), measurement units system (10 units: г, кг, мл, л, шт, ст.л., ч.л., стакан, щепотка, по вкусу), automatic portion scaling with +/- buttons and real-time recalculation, preparation time field (optional, separate from cooking time), time formatting utility (90 мин → 1 ч 30 мин), decimal input support with comma/dot for nutrition fields, improved ingredient display order (name first, then quantity/unit)
- **2025-01-06**: Image System Optimization - Migrated to WebP-only image format (saves 50% disk space, 97%+ browser support, 25-35% smaller than JPEG), automatic conversion with Sharp (main 1200px + thumbnail 300px, effort 4), original files deleted after processing, simplified imageProcessor.ts with 2 functions (convertToWebP, createWebPThumbnail), backward-compatible API (url/thumbnail response), HTTP caching for static files (uploads 1 year immutable), comments pagination (20 per page with "Load More")
- **2025-01-05**: Performance Optimization - Database indexes (Recipe, Comment, RecipeCategory for faster queries), Redis caching system (5-30 min TTL on public endpoints with auto-invalidation), graceful fallback when Redis unavailable, smart cache invalidation on CRUD operations
- **2025-01-26**: SettingsContext for performance (1 API call per session vs 8+ per navigation), Dynamic site branding (logo + name from settings, Montserrat typography), Production deployment setup (single-server architecture on :3000), Security features (Helmet, CORS, Rate Limiting, Zod validation, Sharp image validation, DOMPurify XSS protection)
- **2025-01-03**: User Management & Role-Based Access Control - Three-tier role hierarchy (SUPER_ADMIN/ADMIN/MODERATOR), granular permission system, user CRUD API, AdminUsers page, UserForm with password management, role-based route protection, privilege escalation prevention
- **2025-01-03**: Anti-Spam System - 6-layer protection (honeypot, auto-detection with 5 filters, bulk moderation, configurable spam filter for SUPER_ADMIN), database-driven settings, custom keyword management, smart UI with optimized slider behavior, handles mass spam attacks efficiently
- **2025-01-03**: Admin Action Logging - Comprehensive audit trail system (SUPER_ADMIN only), tracks all admin/moderator actions with IP/user agent, filtering by user/action/resource/date, expandable JSON details, append-only logs with database indexing, integrated across all admin controllers
- **2025-01-03**: Email/Newsletter System - Complete newsletter platform with double opt-in verification (anti-bombing), SMTP configuration (SUPER_ADMIN), customizable Handlebars email templates, automated newsletters on recipe publish (batch sending 50/batch with retry logic), unsubscribe system, email send history (ADMIN+), AES-256 password encryption, supports Gmail/Mailgun/SendGrid, zero-config defaults with full admin customization
