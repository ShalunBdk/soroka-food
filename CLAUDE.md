# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Soroka Food is a full-stack culinary blog web application with a React frontend and Node.js backend. The application consists of:
- **Frontend**: React 19 + TypeScript + Vite - public recipe blog and admin panel
- **Backend**: Node.js + Express + Prisma + PostgreSQL - REST API with JWT authentication

The project is structured as a monorepo with two main directories: `soroka-food-app` (frontend) and `soroka-food-backend` (backend).

## Development Commands

### Unified Commands (from project root)

```bash
# Development mode (two servers)
npm run dev              # Start BOTH frontend and backend (recommended)
npm run dev:frontend     # Start only frontend (http://localhost:5173)
npm run dev:backend      # Start only backend (http://localhost:3000)

# Production mode (single server)
npm run build            # Build both frontend and backend
npm run start:prod       # Start production server (backend serves frontend on http://localhost:3000)

# Dependencies
npm run install:all      # Install all dependencies (root, frontend, backend)

# Database commands
npm run prisma:migrate   # Run Prisma migrations
npm run prisma:seed      # Seed database with initial data
npm run prisma:studio    # Open Prisma Studio GUI
```

### Frontend-only commands (from `soroka-food-app/`)

```bash
npm run dev              # Start dev server (http://localhost:5173)
npm run build            # Build for production
npm run lint             # Run ESLint
npm run preview          # Preview production build
```

### Backend-only commands (from `soroka-food-backend/`)

```bash
npm run dev              # Start with hot-reload
npm run build            # Compile TypeScript to JavaScript
npm start                # Run production build
npm run prisma:generate  # Generate Prisma Client
npm run prisma:migrate   # Run migrations
npm run prisma:studio    # Open Prisma Studio
npm run prisma:seed      # Seed database
```

## Architecture

### Full-Stack Structure

**Frontend (soroka-food-app/)**
- React 19 with TypeScript and Vite
- React Router 7 for client-side routing
- Plain CSS (component-scoped)
- Public site + Admin panel

**Backend (soroka-food-backend/)**
- Express 5 REST API
- Prisma ORM with PostgreSQL
- JWT authentication with bcrypt password hashing
- Multer for file uploads (images stored in `public/uploads/`)
- TypeScript throughout
- **Security**: Helmet, CORS, Rate Limiting, Zod validation, Sharp image validation
- **HTML Sanitization**: DOMPurify on frontend for XSS protection

### Frontend Architecture

**Public Site Routes**:
- `/` - Home page with recipe browsing and tab filters (All/New/Popular/With Photo)
- `/recipe/:id` - Detailed recipe view with ingredients, instructions, nutrition, comments
- `/recipes` - Recipe listing (same as home)
- `/category/:slug` - Recipes filtered by category
- `/cuisine/:type` - Recipes filtered by cuisine type (russian/european/asian/eastern)
- `/search?q=query` - Search results for recipes by title, description, or tags
- `/best` - Best/most popular recipes (sorted by views)
- `/about` - About the site
- `/contact` - Contact information
- `/rules` - Site rules and policies
- `/advertising` - Advertising opportunities

**Features**:
- Dynamic site branding (logo and name loaded from admin settings)
- Recipe browsing with pagination and filtering
- Tab-based filtering (Newest, Popular, With Photo)
- Search functionality with tag support
- Detailed recipe views with ingredients, instructions, nutrition info
- Comment system with ratings (moderated)
- Newsletter subscription
- Dynamic category sidebar (loaded from database)
- Real-time site statistics (recipes, users, comments)
- Dynamic document title (browser tab updates from settings)

**Admin Panel** (`/admin/*`)
- JWT-protected routes
- Admin login at `/admin/login`
- Dashboard with statistics
- Recipe management (CRUD operations)
- Category management
- Comment moderation (approve/pending/spam)
- Newsletter subscriber management
- Static pages management (About, Contact, Rules, Advertising)
- Site settings

### Backend Architecture

**Database Schema (8 tables)**:
1. `users` - Admin/editor accounts with hashed passwords
2. `categories` - Recipe categories with slugs
3. `recipes` - Recipes with JSON fields (ingredients, instructions, nutrition, tips)
4. `recipe_categories` - Many-to-many relationship
5. `comments` - Comments with moderation status (APPROVED/PENDING/SPAM)
6. `newsletter_subscribers` - Email subscriptions (ACTIVE/UNSUBSCRIBED)
7. `site_settings` - Single-row configuration table
8. `static_pages` - Static pages content (About, Contact, Rules, Advertising)

**API Endpoints**:

*Public (no auth required)*:
- `POST /api/auth/login` - User login, returns JWT token
- `POST /api/auth/register` - Create new user
- `GET /api/recipes` - List published recipes (supports ?page=1&limit=9&sort=newest|popular|photo)
- `GET /api/recipes/:id` - Recipe details (increments views)
- `GET /api/recipes/search` - Search recipes (?q=query&page=1&limit=9) - searches title, description, tags
- `GET /api/recipes/stats` - Public site statistics (recipesCount, commentsCount, usersCount)
- `GET /api/recipes/cuisines/:type` - Recipes by cuisine type (russian/european/asian/eastern)
- `GET /api/categories` - All categories with recipe counts
- `GET /api/categories/:slug/recipes` - Recipes by category slug
- `GET /api/settings` - Public site settings (social links, SEO)
- `GET /api/static-pages/:slug` - Get static page by slug (about, contact, rules, advertising)
- `POST /api/comments` - Submit comment (auto-status: PENDING)
- `GET /api/comments/recipe/:recipeId` - Approved comments only
- `POST /api/newsletter/subscribe` - Subscribe to newsletter

*Protected (requires `Authorization: Bearer <token>`)*:
- `GET /api/auth/profile` - Get current user profile
- `GET /api/admin/stats` - Dashboard statistics
- `GET /api/admin/recipes` - All recipes (including drafts, with pagination)
- `GET /api/admin/recipes/:id` - Get single recipe (including drafts)
- `POST /api/admin/recipes` - Create recipe
- `PUT /api/admin/recipes/:id` - Update recipe
- `DELETE /api/admin/recipes/:id` - Delete recipe
- `POST /api/admin/categories` - Create category
- `PUT /api/admin/categories/:id` - Update category
- `DELETE /api/admin/categories/:id` - Delete category
- `GET /api/admin/comments` - All comments (filter by status)
- `PATCH /api/admin/comments/:id/status` - Moderate comment
- `DELETE /api/admin/comments/:id` - Delete comment
- `GET /api/admin/newsletter` - All subscribers
- `DELETE /api/admin/newsletter/:id` - Delete subscriber
- `GET /api/admin/settings` - Get site settings
- `PUT /api/admin/settings` - Update site settings
- `GET /api/admin/static-pages` - Get all static pages
- `GET /api/admin/static-pages/:id` - Get static page by ID
- `PUT /api/admin/static-pages/:id` - Update static page (title, content)
- `POST /api/upload/recipe-image` - Upload single image (returns {url: string})
- `POST /api/upload/step-images` - Upload up to 5 step images (returns {urls: string[]})

### Authentication Flow

**Current Implementation**:
1. User logs in via `POST /api/auth/login` with username/password
2. Backend verifies credentials (bcrypt) and returns JWT token
3. Frontend stores token (localStorage or memory)
4. Protected requests include `Authorization: Bearer <token>` header
5. Backend middleware `authenticateToken` verifies JWT
6. Admin-only routes also check `requireAdmin` middleware (role: ADMIN or EDITOR)

**Frontend Protection**:
- `ProtectedRoute` component in `App.tsx` checks for valid token
- All admin routes wrapped in `ProtectedRoute` + `AdminLayout`

**Default Credentials** (after seed):
- Username: `admin`
- Password: `admin123`

## Database Configuration

**Connection**: PostgreSQL via Prisma
**URL Format**: `postgresql://user:password@localhost:5432/soroka-food`

**Important**: Special characters in passwords must be URL-encoded in `.env`:
- `#` → `%23`
- `@` → `%40`
- `&` → `%26`

**Location**: `soroka-food-backend/.env`

**Initial Setup**:
1. Start PostgreSQL: `net start postgresql-x64-17`
2. Create database: `createdb soroka-food`
3. Run migrations: `npm run prisma:migrate`
4. Seed data: `npm run prisma:seed`

## Type System

All TypeScript types defined in `soroka-food-app/src/types/index.ts` match the Prisma schema in `soroka-food-backend/prisma/schema.prisma`.

**Key Types**:
- `Recipe` - Basic recipe (id, title, description, metadata, status: 'PUBLISHED' | 'DRAFT')
- `RecipeDetail` extends `Recipe` with ingredients, instructions, nutrition, tips
- `Ingredient` - {name: string, amount: string}
- `InstructionStep` - {stepNumber: number, text: string, images?: string[]}
- `Nutrition` - {calories, protein, fat, carbs}
- `Comment` - with status: 'APPROVED' | 'PENDING' | 'SPAM'
- `Category` - {id, name, slug, description}
- `User` - {id, username, email, role: 'ADMIN' | 'EDITOR'}
- `AdminStats` - dashboard metrics
- `SiteSettings` - site configuration
- `StaticPage` - {id, slug, title, content, createdAt, updatedAt}

**Prisma JSON Fields**:
Recipes store complex data as JSON in PostgreSQL:
- `ingredients: Json` - array of Ingredient objects
- `instructions: Json` - array of InstructionStep objects
- `nutrition: Json` - Nutrition object
- `tips: Json` - array of strings
- `tags: String[]` - native array type

## Component Organization

**Frontend** (`soroka-food-app/src/`):
- `components/` - Reusable components
  - `Header` - Dynamic header with logo and site name from settings
  - `Footer`, `RecipeCard`, `Pagination`, `Breadcrumbs`
  - `Sidebar`, `Newsletter`, `SocialLinks`
  - `SiteStats` - Real-time site statistics component
- `pages/` - Public pages
  - `Home.tsx` - Main page with tab filters
  - `RecipeDetail.tsx` - Detailed recipe view
  - `CategoryPage.tsx` - Recipes by category
  - `CuisinePage.tsx` - Recipes by cuisine type
  - `SearchResults.tsx` - Search results page
  - `BestRecipes.tsx` - Popular recipes
  - `About.tsx`, `Contact.tsx`, `Rules.tsx`, `Advertising.tsx` - Static pages
- `pages/admin/` - Admin pages (Dashboard, AdminRecipes, RecipeForm, AdminStaticPages, etc.)
- `hooks/` - Custom React hooks
  - `useCategories.ts` - Fetches categories from API
  - `useSidebarData.ts` - Generates dynamic sidebar sections
- `contexts/` - React Context providers
  - `SettingsContext.tsx` - Global settings state (loads once, prevents redundant API calls)
- `services/` - API client (api.ts) with all backend endpoints
- `utils/` - Helper functions (image.ts for image URL handling)
- `styles/` - Page-specific CSS
  - `Home.css`, `CategoryPage.css`, `StaticPage.css`
- `types/` - TypeScript type definitions

**Backend** (`soroka-food-backend/src/`):
- `controllers/` - Request handlers (authController, recipeController, adminController, staticPageController, etc.)
- `routes/` - Express routers (authRoutes, recipeRoutes, adminRoutes, staticPageRoutes, uploadRoutes, etc.)
- `middleware/` - auth, errorHandler, upload (multer), rateLimiter, validation, imageValidation
- `validators/` - Zod schemas (auth, recipe, comment)
- `config/` - database.ts (Prisma client)
- `utils/` - jwt.ts, password.ts (bcrypt helpers), imageProcessor.ts (Sharp)

## Styling Approach

- Plain CSS (no preprocessors)
- Component-scoped CSS files (e.g., `Header.tsx` + `Header.css`)
- Global styles: `App.css`, `index.css`
- Admin pages share `AdminCommon.css`
- No CSS-in-JS or utility frameworks
- **Typography**: Google Fonts Montserrat (300-700 weights) used for logo branding
  - Montserrat Light (300) for main site logo text
  - Loaded in `index.html` with preconnect optimization

## File Upload Pattern

**Backend** (`soroka-food-backend/src/middleware/upload.ts`):
- Multer configured with `diskStorage`
- Saves to `public/uploads/` with unique filenames
- Validates: only images (jpeg, jpg, png, webp)
- Max size: 5MB (configurable in `.env`)
- Returns relative URL: `/uploads/filename.jpg`

**Frontend** (`soroka-food-app/src/utils/image.ts`):
- Helper function `getImageUrl(imagePath)` converts relative paths to full URLs
- Automatically adds `http://localhost:3000` to relative paths
- Handles null/undefined values with placeholder fallback
- Used across all components for consistent image display

**Upload Endpoints**:
- Single image: `POST /api/upload/recipe-image` → returns `{url: "/uploads/filename.jpg"}`
- Multiple images: `POST /api/upload/step-images` → returns `{urls: ["/uploads/file1.jpg", ...]}`
- Both require JWT authentication and admin role

**Usage in Components**:
```typescript
import { getImageUrl } from '../utils/image';
<img src={getImageUrl(recipe.image)} alt={recipe.title} />
```

## Important Patterns

**Recipe Form** (`soroka-food-app/src/pages/admin/RecipeForm.tsx`):
- Handles both create and edit modes based on route params
- `/admin/recipes/new` - create mode (uses `api.admin.recipes.create()`)
- `/admin/recipes/:id/edit` - edit mode (uses `api.admin.recipes.getById()` and `update()`)
- Dynamic ingredient/instruction management (add/remove)
- File upload integration:
  - Main recipe image with preview
  - Multiple step images (up to 5 per step) with preview
  - Real-time upload status indicators
- Fetches categories from API for selection
- Supports DRAFT and PUBLISHED status

**Error Handling**:
- Backend uses `AppError` class for operational errors
- Global `errorHandler` middleware catches all errors
- `asyncHandler` wrapper for async route handlers prevents unhandled rejections

**Pagination Pattern**:
All list endpoints support:
- `?page=1` - page number (default: 1)
- `?limit=9` - items per page (default varies)
- Returns: `{data: [...], pagination: {page, limit, total, totalPages}}`

**API Response Formats**:
Backend endpoints follow these conventions:
- **List endpoints**: `{data: [...], pagination: {...}}` (e.g., recipes, admin recipes)
- **Single resource**: Direct object (e.g., recipe, category)
- **Simple collections**: Direct array (e.g., categories, comments, newsletter subscribers)
- **Upload responses**: `{url: string}` or `{urls: string[]}`
- **Settings**: Nested objects with `socialLinks` and `seo` sub-objects
- **Auth**: `{token: string, user: {...}}`

All arrays must be checked with `Array.isArray()` before mapping to prevent runtime errors.

**Comment Moderation Workflow**:
1. User submits comment → status: PENDING
2. Admin views in `/admin/comments`
3. Admin sets status: APPROVED, PENDING, or SPAM
4. Only APPROVED comments visible on public site

**Recipe Filtering & Sorting**:
The `GET /api/recipes` endpoint supports filtering via query parameter `?sort=`:
- `sort=newest` - Sort by creation date (descending)
- `sort=popular` - Sort by views count (descending)
- `sort=photo` - Filter recipes that have images only

Frontend implementation uses tabs that update the sort parameter:
```typescript
const response = await api.recipes.getAll(currentPage, recipesPerPage, sortParam);
```

**Search Functionality**:
- Search endpoint: `GET /api/recipes/search?q=query`
- Searches across: recipe title, description, and tags
- Case-insensitive search using Prisma's `contains` with `mode: 'insensitive'`
- Recipe tags in RecipeDetail link to search (e.g., clicking "Десерт" tag → `/search?q=Десерт`)
- Full pagination support

**Dynamic Sidebar Categories**:
Uses custom hooks for data fetching:
```typescript
// useCategories.ts - Fetches all categories from API
// useSidebarData.ts - Transforms categories into sidebar sections

const { sidebarSections } = useSidebarData();
```

Sidebar sections are dynamically generated:
- **"Популярно сейчас"** - Top 5 categories by recipe count
- **"Категории блюд"** - All categories from database
- **"По типу кухни"** - Static links to cuisine types

**Real-time Site Statistics**:
The `SiteStats` component automatically fetches statistics:
- Published recipes count
- Total users count
- Approved comments count

Data is fetched from `GET /api/recipes/stats` endpoint and displayed with number formatting.

**Static Pages Management**:
Static pages (About, Contact, Rules, Advertising) are now dynamic and editable through the admin panel:
- Content stored in database (`static_pages` table)
- Each page has: `id`, `slug`, `title`, `content` (HTML), `createdAt`, `updatedAt`
- Public pages fetch content from API: `GET /api/static-pages/:slug`
- Admin can edit via `/admin/static-pages`:
  - Visual editor with HTML support
  - Side-by-side page list and content editor
  - Real-time preview of changes
  - HTML formatting helpers (h2, h3, p, ul, li, a tags)
- Initial content seeded during database setup
- All static pages (About.tsx, Contact.tsx, Rules.tsx, Advertising.tsx) use `api.staticPages.getBySlug()` and render with `dangerouslySetInnerHTML`

**Recipe Detail Enhancements**:
The RecipeDetail page (`/recipe/:id`) includes two sidebars with related content:
- **Left sidebar "Похожие рецепты"**: Shows first 5 related recipes (titles only, linked)
- **Right sidebar "Популярные рецепты"**: Shows recipes 6-9 with images and metadata
- Related recipes loaded from `api.recipes.getAll(1, 10)` and filtered to exclude current recipe
- All recipe links are functional and navigate to recipe detail pages
- Images processed with `getImageUrl()` helper for correct display
- Fallback messages shown when insufficient recipes available

## API Integration

**Frontend API Client** (`soroka-food-app/src/services/api.ts`):

The application uses a centralized API client with the following features:
- Token management (localStorage-based with `tokenManager`)
- Auto-logout on 401 responses
- Standardized error handling with `ApiError` class
- Type-safe methods for all endpoints

**Key API Sections**:
```typescript
// Authentication
api.auth.login(username, password)           // Login and store token

// Public Recipes
api.recipes.getAll(page, limit, sort)        // Get recipes with optional sort (newest|popular|photo)
api.recipes.getById(id)                      // Get recipe details
api.recipes.search(query, page, limit)       // Search recipes by query
api.recipes.getByCategory(slug, page, limit) // Get recipes by category
api.recipes.getByCuisine(type, page, limit)  // Get recipes by cuisine type
api.recipes.getStats()                       // Get public site statistics

// Categories
api.categories.getAll()                      // Get all categories with counts

// Static Pages
api.staticPages.getBySlug(slug)              // Get static page by slug (about, contact, rules, advertising)

// Admin
api.admin.recipes.getAll(page, limit)        // Admin recipes (all statuses)
api.admin.recipes.getById(id)                // Admin recipe (for editing)
api.admin.recipes.create(data)               // Create recipe
api.admin.recipes.update(id, data)           // Update recipe

// Admin Static Pages
api.admin.staticPages.getAll()               // Get all static pages
api.admin.staticPages.getById(id)            // Get static page by ID
api.admin.staticPages.update(id, data)       // Update static page (title, content)

// Upload
api.upload.recipeImage(file)                 // Upload main image
api.upload.stepImages(files)                 // Upload step images
```

**Component-API Integration**:
- **App.tsx** - Loads site settings on mount; updates document title dynamically
- **Header** - Fetches and displays logo and site name from settings (`api.settings.getPublic()`)
- **Home.tsx** - Uses tab filters to sort recipes (newest/popular/photo)
- **CategoryPage.tsx** - Fetches recipes by category slug
- **CuisinePage.tsx** - Fetches recipes by cuisine type
- **SearchResults.tsx** - Searches recipes by query string
- **BestRecipes.tsx** - Fetches popular recipes (sorted by views)
- **RecipeDetail.tsx** - Fetches recipe details, comments, and 10 related recipes; displays in sidebars; tags link to search
- **Sidebar** (via useSidebarData) - Dynamically loads categories from database
- **SiteStats** - Fetches and displays real-time site statistics
- **Static pages** (About, Contact, Rules, Advertising) - Fetch content from API by slug
- All admin pages - Full CRUD operations
- **RecipeForm** - Create/edit with image upload
- **AdminSettings** - Settings with logo upload and site name configuration
- **AdminStaticPages** - Edit static page content with HTML editor

## Development Workflow

**Development Mode (Two Servers)**:
```bash
npm run dev  # From project root - starts both frontend and backend
```
- Frontend runs on `http://localhost:5173` (Vite dev server)
- Backend runs on `http://localhost:3000` (Express API server)
- Hot-reload enabled for both
- CORS configured for cross-origin requests

**Production Mode (Single Server)**:
```bash
npm run build       # Build both frontend and backend
npm run start:prod  # Start production server
```
- Backend runs on `http://localhost:3000`
- Backend serves built frontend static files from `soroka-food-app/dist`
- All routes on single port (no CORS needed)
- SPA fallback: non-API routes serve `index.html`
- Set `NODE_ENV=production` in backend `.env` for production optimizations

**Database Changes**:
1. Edit `soroka-food-backend/prisma/schema.prisma`
2. Run `npm run prisma:migrate` (creates migration)
3. Run `npm run prisma:generate` (updates Prisma Client)
4. Update TypeScript types in `soroka-food-app/src/types/index.ts` if needed

**Adding New Feature**:
1. **Backend**: Create controller → route → add to `src/index.ts`
2. **Frontend**: Create component/page → add route in `App.tsx`
3. **Integration**: Add API call in service layer

## Project Structure Summary

```
SorokaFood/
├── soroka-food-app/          # Frontend
│   └── src/
│       ├── components/       # Reusable UI components
│       │   ├── Header/
│       │   ├── Footer/
│       │   ├── Sidebar/
│       │   ├── SiteStats/   # Real-time statistics
│       │   └── ...
│       ├── pages/           # Public pages
│       │   ├── Home.tsx
│       │   ├── RecipeDetail.tsx
│       │   ├── CategoryPage.tsx
│       │   ├── CuisinePage.tsx
│       │   ├── SearchResults.tsx
│       │   ├── BestRecipes.tsx
│       │   ├── About.tsx, Contact.tsx, Rules.tsx, Advertising.tsx
│       │   └── admin/       # Admin pages
│       ├── hooks/           # Custom React hooks
│       │   ├── useCategories.ts
│       │   └── useSidebarData.ts
│       ├── contexts/        # React Context providers
│       │   └── SettingsContext.tsx  # Global settings state
│       ├── services/        # API client
│       ├── utils/           # Helper functions
│       ├── styles/          # CSS files
│       └── types/           # TypeScript types
├── soroka-food-backend/      # Backend
│   ├── src/
│   │   ├── controllers/     # Request handlers
│   │   │   ├── recipeController.ts  # Includes search, cuisines, stats
│   │   │   ├── categoryController.ts
│   │   │   ├── staticPageController.ts  # Static pages management
│   │   │   └── ...
│   │   ├── routes/          # Express routes
│   │   ├── middleware/      # Auth, errors, upload
│   │   └── config/          # Database config
│   ├── prisma/
│   │   ├── schema.prisma    # Database schema
│   │   └── seed.ts          # Initial data
│   └── public/uploads/      # Uploaded images
├── package.json             # Root - runs both apps
├── CLAUDE.md               # This file
├── QUICKSTART.md           # Quick setup guide
└── README.md               # Full documentation
```

## Performance Optimizations

### Settings Context (Global State)
To avoid redundant API calls, site settings are loaded once and cached globally:

**Implementation** (`soroka-food-app/src/contexts/SettingsContext.tsx`):
```typescript
import { SettingsProvider } from './contexts/SettingsContext';

// In App.tsx
<SettingsProvider>
  <Router>
    {/* App content */}
  </Router>
</SettingsProvider>

// In any component
import { useSettings } from '../contexts/SettingsContext';
const { settings, loading } = useSettings();
```

**Benefits**:
- Settings loaded once on app mount
- All components share the same settings instance
- No redundant API calls when navigating between pages
- Automatic document title update from settings

**Components using SettingsContext**:
- Header (logo and site name)
- RecipeDetail (dynamic title: "Recipe - Site Name")
- Home, CategoryPage, CuisinePage, BestRecipes, SearchResults (social links in footer)

## Important Notes

### Image Handling
- **All images are stored in**: `soroka-food-backend/public/uploads/`
- **Backend returns**: Relative paths like `/uploads/filename.jpg`
- **Frontend uses**: `getImageUrl()` helper to convert to full URLs
- **Never hardcode**: URLs like `http://localhost:3000${image}` - always use `getImageUrl()`
- **Step images**: Displayed in grid layout on recipe detail page

### Admin vs Public Endpoints
- **Public recipe endpoint** (`GET /api/recipes/:id`): Only returns PUBLISHED recipes, increments views
- **Admin recipe endpoint** (`GET /api/admin/recipes/:id`): Returns all recipes (including DRAFT), for editing
- Always use admin endpoint in RecipeForm for editing

### Security
- All admin routes require JWT token AND admin/editor role
- Passwords hashed with bcrypt (10 rounds)
- File uploads restricted to images only (jpeg, jpg, png, webp)
- Max upload size: 5MB
- Upload endpoints protected with authentication

## Security & Production-Ready Features

### Security Middleware

**Helmet** (`soroka-food-backend/src/index.ts`):
- Adds security HTTP headers (X-Content-Type-Options, X-Frame-Options, etc.)
- Content Security Policy (CSP) configured for Google Fonts and external images
- Cross-Origin Embedder Policy disabled to allow loading external images

**CORS Configuration**:
- Environment-based allowed origins via `ALLOWED_ORIGINS` in `.env`
- Development: `http://localhost:5173`
- Production: Set your domain(s) in `.env` (comma-separated)
- Credentials enabled for cookie/auth support
- Specific methods and headers allowed

**Rate Limiting** (`soroka-food-backend/src/middleware/rateLimiter.ts`):
Rate limiters protect against abuse while allowing normal usage:

- **apiLimiter** (General API): 1000 requests per 15 minutes (~1 req/sec average)
  - Applied to all `/api/*` routes
  - Liberal limit for normal browsing with multiple API calls per page

- **loginLimiter** (Brute-force protection): 5 attempts per 15 minutes
  - Applied to `POST /api/auth/login`
  - Skips successful requests (doesn't count valid logins)

- **registerLimiter** (Account creation): 3 registrations per hour
  - Applied to `POST /api/auth/register` (currently disabled in production)

- **uploadLimiter** (File uploads): 50 uploads per hour
  - Applied to all `/api/upload/*` routes

- **commentLimiter** (Spam protection): 10 comments per 15 minutes
  - Applied to `POST /api/comments`

All rate limiters use IP-based tracking and return standard HTTP headers (RateLimit-*).

### Input Validation with Zod

**Validation Middleware** (`soroka-food-backend/src/middleware/validation.ts`):
```typescript
import { validate } from '../middleware/validation';
import { loginSchema } from '../validators/auth.validator';

router.post('/login', validate(loginSchema), asyncHandler(login));
```

**Validators** (`soroka-food-backend/src/validators/`):
- **auth.validator.ts**: Login/register validation
  - Username: 3-50 chars, alphanumeric + underscore
  - Password: min 8 chars, requires uppercase, lowercase, and number
  - Email: valid email format

- **recipe.validator.ts**: Recipe creation/update validation
  - Title: 3-255 chars
  - Description: 10-1000 chars
  - Cooking time: positive integer, max 1440 minutes (24 hours)
  - Servings: positive integer, max 100
  - Ingredients: min 1, each with name and amount
  - Instructions: min 1 step, ordered by stepNumber
  - Status: enum ('PUBLISHED' | 'DRAFT')

- **comment.validator.ts**: Comment submission validation
  - Author: 2-100 chars
  - Email: valid format
  - Rating: 1-5 integer
  - Text: 10-1000 chars

Validation errors return 400 status with detailed field-level error messages.

### Image Validation with Sharp

**Image Validation Middleware** (`soroka-food-backend/src/middleware/imageValidation.ts`):

Validates uploaded images using Sharp library:
- **Format check**: Only jpeg, jpg, png, webp allowed
- **Dimension check**: Max 5000x5000 pixels
- **Integrity check**: Verifies file is valid image (not corrupted)
- **Auto-cleanup**: Deletes invalid files immediately
- **Multiple files support**: `validateMultipleImages()` for batch uploads

Applied to upload routes:
```typescript
router.post('/recipe-image', uploadLimiter, uploadSingle, validateImage, asyncHandler(...));
router.post('/step-images', uploadLimiter, uploadMultiple, validateMultipleImages, asyncHandler(...));
```

**Image Processing Utils** (`soroka-food-backend/src/utils/imageProcessor.ts`):
Ready for future optimization features:
- `optimizeImage()`: Resize and compress images (max width, quality control)
- `convertToWebP()`: Convert to WebP format for better compression
- `createThumbnail()`: Generate thumbnails with custom dimensions

### HTML Sanitization (XSS Protection)

**Frontend Sanitization** (`soroka-food-app/src/utils/sanitize.ts`):

DOMPurify library sanitizes all user-generated HTML content:
```typescript
import { sanitizeHTML } from '../utils/sanitize';

<div dangerouslySetInnerHTML={{ __html: sanitizeHTML(page.content) }} />
```

**Allowed HTML tags**: p, br, strong, em, u, h2, h3, ul, ol, li, a
**Allowed attributes**: href, target, rel
**Data attributes**: Disabled for security

Applied to:
- Static pages (About, Contact, Rules, Advertising)
- All admin-editable HTML content
- User comments (future enhancement)

Prevents XSS attacks by stripping dangerous HTML/JS from user input.

### Environment Variables

**Backend** (`soroka-food-backend/.env`):
```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/soroka-food

# JWT Authentication
JWT_SECRET=your-cryptographically-strong-secret-here  # REQUIRED (no fallback)
JWT_EXPIRES_IN=7d

# Server
PORT=3000
NODE_ENV=development  # or 'production'

# CORS (comma-separated domains)
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000

# File Upload
MAX_FILE_SIZE=5242880  # 5MB in bytes
```

**Frontend** (`soroka-food-app/.env` - optional):
```env
# API URL for development
VITE_API_URL=http://localhost:3000/api

# Environment
VITE_APP_ENV=development
```

**Important Security Notes**:
- `.env.example` files provided for reference (no real secrets)
- JWT_SECRET must be set (no fallback in code)
- Generate strong JWT secret: `node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"`
- Never commit `.env` files to git
- URL-encode special characters in DATABASE_URL passwords

### Production Configuration

**Environment-based Behavior**:

The application detects `NODE_ENV=production` and adjusts:
1. **Frontend serving**: Backend serves built frontend from `soroka-food-app/dist`
2. **SPA fallback**: All non-API routes serve `index.html` for client-side routing
3. **CORS**: Use production domains in `ALLOWED_ORIGINS`
4. **Error messages**: Less verbose in production
5. **Logging**: Can be enhanced with winston (future)

**Production Server Start**:
```bash
# Build both frontend and backend
npm run build

# Start production server (single port 3000)
npm run start:prod
```

**Production Checklist**:
- [ ] Set strong `JWT_SECRET` (64+ char random string)
- [ ] Configure `ALLOWED_ORIGINS` with production domain(s)
- [ ] Set `NODE_ENV=production` in backend `.env`
- [ ] Verify `.env` files are in `.gitignore`
- [ ] Test production build locally before deploying
- [ ] Disable public registration endpoint (already done)
- [ ] Configure database connection for production
- [ ] Set up SSL/HTTPS (recommended via reverse proxy)

**Server Instance Fix**:
Production server keeps running by storing HTTP server instance:
```typescript
const server = app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
```
This prevents the Node.js process from exiting after startup.

### Backend File Structure (Security-related)

```
soroka-food-backend/src/
├── middleware/
│   ├── auth.ts              # JWT authentication + role checks
│   ├── errorHandler.ts      # Global error handling + AppError class
│   ├── rateLimiter.ts       # Rate limiting configurations
│   ├── validation.ts        # Zod validation middleware
│   ├── imageValidation.ts   # Sharp image validation
│   └── upload.ts            # Multer file upload config
├── validators/
│   ├── auth.validator.ts    # Login/register schemas
│   ├── recipe.validator.ts  # Recipe CRUD schemas
│   └── comment.validator.ts # Comment submission schema
├── utils/
│   ├── jwt.ts               # JWT sign/verify helpers
│   ├── password.ts          # bcrypt hash/compare
│   └── imageProcessor.ts    # Sharp image optimization
└── routes/
    ├── authRoutes.ts        # Login + register (register disabled)
    ├── adminRoutes.ts       # Protected admin endpoints
    └── uploadRoutes.ts      # Protected upload endpoints
```

### Frontend File Structure (Security-related)

```
soroka-food-app/src/
├── utils/
│   ├── sanitize.ts          # DOMPurify HTML sanitization
│   └── image.ts             # Image URL helper
├── contexts/
│   └── SettingsContext.tsx  # Centralized settings (performance)
└── services/
    └── api.ts               # API client with token management
```

## Common Issues

**PostgreSQL Connection**: Ensure PostgreSQL is running and credentials in `.env` are correct.

**Migration Lock**: If "advisory lock timeout" occurs, restart PostgreSQL service.

**Port Conflicts**: Backend (3000) or Frontend (5173) ports may be in use. Close other apps or change ports.

**CORS Issues**: Backend CORS is configured for `http://localhost:5173`. Update if frontend port changes.

**Images not displaying**: Ensure you're using `getImageUrl()` helper function, not hardcoded URLs.

**404 on draft recipes**: Use admin endpoint (`api.admin.recipes.getById()`) not public endpoint for editing.

## New Features (Latest Updates)

### Search & Discovery
- **Full-text search**: Search recipes by title, description, or tags
- **Tag-based navigation**: Click any recipe tag to search for similar recipes
- **Cuisine filtering**: Browse recipes by cuisine type (Russian, European, Asian, Eastern)
- **Category pages**: Dedicated pages for each recipe category
- **Best recipes page**: View most popular recipes sorted by views

### Dynamic Content
- **Dynamic sidebar**: Categories are loaded from database, not hardcoded
- **Popular categories**: Top 5 categories by recipe count displayed in sidebar
- **Real-time statistics**: Site statistics (recipes, users, comments) fetched from API
- **Tab filtering**: Filter recipes on home page (All/Newest/Popular/With Photo)

### Static Pages (Dynamic & Editable)
- `/about` - About the site and team (editable via admin panel)
- `/contact` - Contact information and business hours (editable via admin panel)
- `/rules` - Site rules and user policies (editable via admin panel)
- `/advertising` - Advertising opportunities and pricing (editable via admin panel)
- Content stored in database and manageable through `/admin/static-pages`
- Supports HTML formatting for rich content
- Includes visual editor with formatting helpers

### Custom Hooks
```typescript
// Fetch all categories with counts
const { categories, loading, error } = useCategories();

// Generate dynamic sidebar sections
const { sidebarSections } = useSidebarData();

// Access global settings state (from SettingsContext)
const { settings, loading } = useSettings();
```

### Backend Enhancements
- **Recipe sorting**: Support for `?sort=newest|popular|photo` parameter
- **Search endpoint**: Case-insensitive search across multiple fields
- **Cuisine filtering**: Filter by cuisine type via tags
- **Public statistics**: Endpoint for public site statistics
- **Static pages API**: Public and admin endpoints for managing static content
- All recipe-related endpoints in `recipeController.ts`

### Recent Improvements (Latest)

**Static Pages Management System**:
- Complete CRUD system for managing static page content
- Database-driven content (no hardcoded text in components)
- Admin interface at `/admin/static-pages` with:
  - Side-by-side page list and content editor
  - HTML code editor with syntax highlighting
  - Real-time save functionality
  - Formatting helpers and guides
- Initial content automatically seeded during setup
- All pages (About, Contact, Rules, Advertising) fetch from API

**Recipe Detail Page Enhancements**:
- Fixed image display in "Популярные рецепты" section (now uses `getImageUrl()`)
- Made "Похожие рецепты" sidebar functional with real data
- Loads 10 related recipes and distributes across sidebars:
  - Left: First 5 recipes (titles only)
  - Right: Recipes 6-9 (with images and metadata)
- All recipe links are clickable and navigate correctly
- Proper fallback messages when insufficient recipes available
- Consistent image URL handling across all sections

**Dynamic Site Branding System**:
- **Header component** now dynamically loads and displays site settings:
  - Logo image (if uploaded by admin) positioned left
  - Site name (from settings) positioned right of logo
  - Both loaded from `/api/settings` endpoint via SettingsContext
  - Automatic fallback to default values if API fails
- **Typography enhancement**:
  - Integrated Google Fonts Montserrat (weights 300-700)
  - Logo uses Montserrat Light (weight 300) as free alternative to Avenir LT 35
  - Applied professional typography settings (kerning, optical sizing, variants)
- **Dynamic document title**:
  - Browser tab title automatically updates from site settings
  - Implemented in SettingsContext (loads once)
  - Fallback to "Soroka Food" if settings unavailable
- **Admin control**:
  - Admin can upload logo and set site name via `/admin/settings`
  - Changes instantly reflected across all pages
  - Logo preview in admin settings panel

**Settings Performance Optimization** (2025-01-26):
- **Created SettingsContext** to eliminate redundant API calls
- Settings now loaded once on app mount instead of on every page navigation
- Reduced from 8+ API calls per navigation to 1 call per session
- All components (Header, Footer, RecipeDetail, etc.) now use `useSettings()` hook
- Automatic document title management in context provider
- Improved page load performance and reduced server load

**Production Deployment Setup** (2025-01-26):
- **Backend serves frontend** in production mode via Express static middleware
- Single-server architecture: backend on port 3000 serves both API and frontend
- SPA fallback routing: all non-API routes serve `index.html`
- Cross-env package added for Windows compatibility with `NODE_ENV`
- Command: `npm run start:prod` builds and runs everything on one port
- Express 5 compatibility fix: replaced `app.get('*')` with `app.use()` middleware
- Production server fix: Server instance stored to prevent process exit

**Security & Production-Ready Enhancements** (2025-10-26):
- **Helmet**: Security HTTP headers with CSP configuration
- **CORS**: Environment-based allowed origins configuration
- **Rate Limiting**: IP-based rate limiting for all endpoints
  - General API: 1000 req/15min (adjusted from 100 for usability)
  - Login: 5 attempts/15min (brute-force protection)
  - Register: 3 accounts/hour
  - Uploads: 50 files/hour
  - Comments: 10 submissions/15min
- **Input Validation**: Zod schemas for all user inputs
  - Auth validation (username, email, password strength)
  - Recipe validation (title, description, ingredients, instructions)
  - Comment validation (author, email, rating, text)
- **Image Validation**: Sharp library validates all uploads
  - Format check (jpeg, jpg, png, webp only)
  - Dimension check (max 5000x5000)
  - Integrity verification
  - Auto-cleanup of invalid files
- **HTML Sanitization**: DOMPurify on frontend prevents XSS
  - Applied to all static pages
  - Configurable allowed tags and attributes
- **Environment Variables**: `.env.example` files for both frontend/backend
- **JWT Security**: No fallback secret, requires strong JWT_SECRET
- **Admin Registration**: Disabled public registration endpoint for production

All security features tested and production-ready. See `PRODUCTION_PLAN.md` for detailed implementation tracking (10/37 tasks completed, 27% progress).
