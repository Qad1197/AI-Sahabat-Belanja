
export enum Lifestyle {
  SEDERHANA = 'Sederhana',
  NORMAL = 'Normal',
  MEWAH = 'Mewah'
}

export interface NutritionalInfo {
  calories: number;
  protein: number;
  carbs: number;
}

export interface IngredientDetail {
  name: string;
  quantity: string;
  unitPrice: number;
  totalPrice: number;
}

export interface ShoppingItem {
  name: string;
  quantity: string;
  category: 'Protein' | 'Sayur' | 'Bumbu' | 'Karbohidrat' | 'Buah' | 'Lainnya';
  estimatedPrice: number;
}

export interface Meal {
  title: string;
  ingredients: IngredientDetail[];
  nutrition: NutritionalInfo;
}

export interface DayPlan {
  day: number;
  breakfast: Meal;
  lunch: Meal;
  dinner: Meal;
  dailyTotal: NutritionalInfo;
}

export interface SourceLink {
  uri: string;
  title: string;
}

export interface GenerationResult {
  dailyPlans: DayPlan[];
  shoppingList: ShoppingItem[];
  totalEstimatedCost: number;
  budgetAnalysis: string;
  tips: string[];
  sourceLinks?: SourceLink[];
}

export interface UserPreferences {
  budget: number;
  durationDays: number;
  portionsPerMeal: number;
  numberOfPeople: number;
  lifestyle: Lifestyle;
  city: string;
}

export interface HistoryItem {
  id: string;
  timestamp: number;
  prefs: UserPreferences;
  result: GenerationResult;
}

export interface UserProfile {
  email: string;
  name: string;
  role: 'user' | 'admin';
  photo?: string;
  favorites: HistoryItem[];
  history: HistoryItem[];
}
