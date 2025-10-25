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
npm run dev              # Start BOTH frontend and backend (recommended)
npm run dev:frontend     # Start only frontend (http://localhost:5173)
npm run dev:backend      # Start only backend (http://localhost:3000)

npm run build            # Build both frontend and backend
npm run start            # Run production builds of both

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
- `services/` - API client (api.ts) with all backend endpoints
- `utils/` - Helper functions (image.ts for image URL handling)
- `styles/` - Page-specific CSS
  - `Home.css`, `CategoryPage.css`, `StaticPage.css`
- `types/` - TypeScript type definitions

**Backend** (`soroka-food-backend/src/`):
- `controllers/` - Request handlers (authController, recipeController, adminController, staticPageController, etc.)
- `routes/` - Express routers (authRoutes, recipeRoutes, adminRoutes, staticPageRoutes, uploadRoutes, etc.)
- `middleware/` - auth, errorHandler, upload (multer)
- `config/` - database.ts (Prisma client)
- `utils/` - jwt.ts, password.ts (bcrypt helpers)

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

**Running the App**:
```bash
npm run dev  # From project root - starts both frontend and backend
```

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
  - Both loaded from `/api/settings` endpoint
  - Automatic fallback to default values if API fails
- **Typography enhancement**:
  - Integrated Google Fonts Montserrat (weights 300-700)
  - Logo uses Montserrat Light (weight 300) as free alternative to Avenir LT 35
  - Applied professional typography settings (kerning, optical sizing, variants)
- **Dynamic document title**:
  - Browser tab title automatically updates from site settings
  - Implemented in `App.tsx` via `useEffect` hook
  - Fallback to "Soroka Food" if settings unavailable
- **Admin control**:
  - Admin can upload logo and set site name via `/admin/settings`
  - Changes instantly reflected across all pages
  - Logo preview in admin settings panel
