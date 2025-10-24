export interface Recipe {
  id: number;
  title: string;
  description: string;
  image: string;
  cookingTime: number; // in minutes
  calories: number;
  servings: number;
  author: string;
  date: string;
  views: number;
  rating: number;
  category: string[];
  tags: string[];
}

export interface RecipeDetail extends Recipe {
  ingredients: Ingredient[];
  instructions: InstructionStep[];
  nutrition: Nutrition;
  tips: string[];
}

export interface Ingredient {
  name: string;
  amount: string;
}

export interface InstructionStep {
  stepNumber: number;
  text: string;
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
