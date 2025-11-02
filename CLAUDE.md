# CLAUDE.md

This file provides guidance to Claude Code when working with this repository.

## Project Overview

**Soroka Food** - Full-stack culinary blog with React 19 + Node.js + PostgreSQL

**Structure**: Monorepo with `soroka-food-app` (frontend) and `soroka-food-backend` (backend)

**Tech Stack**:
- Frontend: React 19, TypeScript, Vite, React Router 7, Plain CSS
- Backend: Express 5, Prisma ORM, PostgreSQL, JWT auth, bcrypt
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

### Database Schema (9 tables)
`users` (roles: SUPER_ADMIN/ADMIN/MODERATOR, active status), `categories`, `recipes` (with JSON: ingredients, instructions, nutrition, tips), `recipe_categories`, `comments` (moderation: APPROVED/PENDING/SPAM), `newsletter_subscribers`, `site_settings`, `static_pages`, `spam_filter_settings` (configurable anti-spam rules)

### Key Routes

**Public**:
- `/` - Home with tab filters (All/Newest/Popular/With Photo)
- `/recipe/:id` - Recipe detail with social sharing, comments, nutrition
- `/category/:slug`, `/cuisine/:type`, `/search?q=`, `/best` - Filtering/search
- `/about`, `/contact`, `/rules`, `/advertising` - Editable static pages

**Admin** (`/admin/*` - JWT protected, role-based access):
- Dashboard, Recipes (CRUD), Categories, Tags (rename/delete), Comments (moderation with bulk actions), Newsletter (ADMIN+), Users (ADMIN+), Static Pages (ADMIN+), Settings (ADMIN+), Spam Filter (SUPER_ADMIN only)

### API Endpoints

**Public**: `/api/auth/login`, `/api/recipes` (supports ?sort=newest|popular|photo), `/api/recipes/:id`, `/api/recipes/:id/view`, `/api/recipes/search`, `/api/recipes/stats`, `/api/recipes/cuisines/:type`, `/api/categories`, `/api/categories/:slug/recipes`, `/api/settings`, `/api/static-pages/:slug`, `/api/comments`, `/api/newsletter/subscribe`

**Protected** (requires `Authorization: Bearer <token>`):
- `/api/admin/*` - stats (MOD+), recipes (MOD+), categories (MOD+), tags (MOD+), comments (MOD+ including bulk actions), newsletter (ADMIN+), users (ADMIN+), settings (ADMIN+), static-pages (ADMIN+), spam-filter (SUPER_ADMIN only)
- `/api/upload/*` - recipe-image (MOD+), step-images (MOD+)

## Database & Types

**PostgreSQL** via Prisma - URL: `postgresql://user:password@localhost:5432/soroka-food` (URL-encode special chars: # → %23, @ → %40)
**Location**: `soroka-food-backend/.env`

**TypeScript types** (`soroka-food-app/src/types/index.ts`) match Prisma schema
**Key types**: Recipe, RecipeDetail, Ingredient, InstructionStep, Nutrition, Comment, Category, User, SiteSettings, StaticPage
**Prisma JSON fields**: ingredients, instructions, nutrition, tips (stored as JSON in PostgreSQL)

## Project Structure

```
soroka-food-app/src/
├── components/      # Header (dynamic logo/name), Footer, RecipeCard, Pagination, Sidebar, SiteStats
├── pages/           # Home, RecipeDetail (with honeypot), CategoryPage, CuisinePage, SearchResults, BestRecipes, static pages
├── pages/admin/     # Dashboard, AdminRecipes, RecipeForm, AdminStaticPages, AdminSettings, AdminSpamFilter, AdminComments (with bulk actions), etc.
├── hooks/           # useCategories, useSidebarData
├── contexts/        # SettingsContext (global state, loads once), ToastContext
├── services/        # api.ts (centralized API client with token management)
├── utils/           # image.ts (getImageUrl helper), sanitize.ts (DOMPurify), viewTracker.ts
├── styles/          # Plain CSS, component-scoped (Header.css, Home.css, etc.)
└── types/           # TypeScript definitions

soroka-food-backend/src/
├── controllers/     # authController, recipeController, adminController, staticPageController, tagController, userController, spamFilterController
├── routes/          # authRoutes, recipeRoutes, adminRoutes, staticPageRoutes, uploadRoutes, userRoutes
├── middleware/      # auth, errorHandler, upload (multer), rateLimiter, validation, imageValidation, permissions
├── validators/      # Zod schemas (auth, recipe, comment, user)
├── utils/           # jwt, password (bcrypt), imageProcessor (Sharp), spamFilter
└── config/          # database.ts (Prisma client)
```

**Styling**: Plain CSS (component-scoped), Google Fonts Montserrat (logo typography)
**File uploads**: Multer → `public/uploads/`, max 5MB, jpeg/jpg/png/webp only
**Frontend image helper**: `getImageUrl(path)` - converts relative paths to full URLs

## Key Implementation Patterns

### Recipe Form (`RecipeForm.tsx`)
- Create (`/admin/recipes/new`) vs Edit mode (`/admin/recipes/:id/edit`)
- Dynamic ingredient/instruction management, file upload with preview
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
- **Filtering**: `?sort=newest|popular|photo`, by category/cuisine
- **Comments**: Submit → Auto spam check → PENDING/SPAM → Admin moderates (APPROVED/PENDING/SPAM) → Display APPROVED only
- **Spam Protection**: Multi-layer defense - honeypot trap, auto-detection (keywords/URLs/caps/repetition/duplicates), bulk moderation actions, configurable filters (SUPER_ADMIN only)
- **Tags**: Global CRUD system - view usage stats, rename across all recipes, delete with confirmation
- **Static Pages**: Database-driven, editable via admin with HTML editor, sanitized with DOMPurify
- **Social Sharing**: VK, Telegram, WhatsApp, copy link (RecipeDetail.tsx:116-174)
- **Sidebar**: Dynamic categories (useSidebarData hook), top 5 by recipe count, cuisine types
- **Stats**: Real-time site statistics (SiteStats component fetches from `/api/recipes/stats`)

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

### Error Handling
- Backend: `AppError` class, global `errorHandler` middleware, `asyncHandler` wrapper
- Frontend: `ApiError` class in api.ts, auto-logout on 401

## Performance & Best Practices

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
```

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
- **Images not displaying**: Use `getImageUrl()` helper, not hardcoded URLs
- **404 on draft recipes**: Use admin endpoint for editing, not public endpoint

## Recent Updates & Features

**Key Features**:
- Full-text search (title/description/tags), tag-based navigation, cuisine filtering (Russian/European/Asian/Eastern)
- Dynamic sidebar (categories from DB), real-time statistics (recipes/users/comments)
- Tab filtering (All/Newest/Popular/With Photo) on home page
- Static pages editable via admin panel (About, Contact, Rules, Advertising)
- Social sharing (VK, Telegram, WhatsApp, copy link)
- Smart view tracking (24h throttle per user via localStorage)
- Tag management system (view stats, rename/delete across all recipes)

**Custom Hooks**: `useCategories()`, `useSidebarData()`, `useSettings()`

**Recent Enhancements**:
- **2025-01-26**: SettingsContext for performance (1 API call per session vs 8+ per navigation), Dynamic site branding (logo + name from settings, Montserrat typography), Production deployment setup (single-server architecture on :3000), Security features (Helmet, CORS, Rate Limiting, Zod validation, Sharp image validation, DOMPurify XSS protection)
- **2025-01-03**: User Management & Role-Based Access Control - Three-tier role hierarchy (SUPER_ADMIN/ADMIN/MODERATOR), granular permission system, user CRUD API, AdminUsers page, UserForm with password management, role-based route protection, privilege escalation prevention
- **2025-01-03**: Anti-Spam System - 6-layer protection (honeypot, auto-detection with 5 filters, bulk moderation, configurable spam filter for SUPER_ADMIN), database-driven settings, custom keyword management, smart UI with optimized slider behavior, handles mass spam attacks efficiently
