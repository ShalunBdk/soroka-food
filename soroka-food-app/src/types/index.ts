export interface Recipe {
  id: number;
  title: string;
  description: string;
  image: string;
  prepTime?: number; // preparation time in minutes (optional)
  cookingTime: number; // cooking time in minutes
  calories: number;
  servings: number;
  author: string;
  date: string;
  views: number;
  rating: number;
  category: string[];
  tags: string[];
  status?: 'published' | 'draft'; // Статус рецепта
}

export interface RecipeDetail extends Recipe {
  ingredients: Ingredient[];
  instructions: InstructionStep[];
  nutrition: Nutrition;
  tips: string[];
}

export interface Ingredient {
  name: string;
  amount: string; // Full amount string (for backward compatibility and display)
  quantity?: number; // Numeric quantity for auto-scaling
  unit?: string; // Unit of measurement (г, кг, мл, л, шт, ст.л., ч.л., стакан, etc.)
  category?: string; // Optional category for grouping (e.g., "Для соуса", "Для основного блюда")
}

export interface InstructionStep {
  stepNumber: number;
  text: string;
  images?: string[]; // Массив URL изображений (до 5 штук)
}

export interface Nutrition {
  calories: number;
  protein: number;
  fat: number;
  carbs: number;
}

export interface Comment {
  id: number;
  author: string;
  date: string;
  rating: number;
  text: string;
}

export interface Category {
  id: number;
  name: string;
  slug: string;
}

export interface SidebarLink {
  title: string;
  url: string;
}

export interface SidebarSection {
  title: string;
  links: SidebarLink[];
}

// Admin types
export type UserRole = 'SUPER_ADMIN' | 'ADMIN' | 'MODERATOR';

export interface User {
  id: number;
  username: string;
  email: string;
  role: UserRole;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AdminStats {
  totalRecipes: number;
  publishedRecipes: number;
  draftRecipes: number;
  totalComments: number;
  pendingComments: number;
  totalSubscribers: number;
  totalViews: number;
  avgViewsPerRecipe: number;
}

export interface NewsletterSubscriber {
  id: number;
  email: string;
  subscribedDate: string;
  status: 'active' | 'unsubscribed';
}

export interface ExtendedCategory extends Category {
  description?: string;
  recipeCount: number;
}

export interface RecipeStatus {
  status: 'published' | 'draft';
}

export interface SiteSettings {
  siteName: string;
  siteDescription: string;
  logo?: string;
  socialLinks: {
    youtube?: string;
    instagram?: string;
    telegram?: string;
    tiktok?: string;
  };
  seo: {
    metaTitle?: string;
    metaDescription?: string;
    metaKeywords?: string;
  };
}

export interface CommentWithRecipe extends Comment {
  recipeName: string;
  recipeId: number;
  status: 'approved' | 'pending' | 'spam';
}

export interface StaticPage {
  id: number;
  slug: string;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

// Admin logs
export interface AdminLog {
  id: number;
  userId: number;
  user: {
    id: number;
    username: string;
    role: UserRole;
  };
  action: string;
  resource: string;
  resourceId?: number;
  details?: any;
  ipAddress?: string;
  userAgent?: string;
  createdAt: string;
}

export interface AdminLogsResponse {
  data: AdminLog[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface AdminLogsStats {
  totalLogs: number;
  topActions: Array<{
    action: string;
    count: number;
  }>;
  topUsers: Array<{
    userId: number;
    username: string;
    role: string;
    count: number;
  }>;
  activityByDay: Array<{
    date: string;
    count: number;
  }>;
}
