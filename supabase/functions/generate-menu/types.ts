export interface AnalyzedPattern {
  meal_types: Record<string, any>;
  [key: string]: any;
}

export interface MenuItem {
  meal: string;
  description: string;
  ingredients: {
    name: string;
    quantity: string;
    estimatedCost: number;
  }[];
}

export interface MenuDay {
  day: string;
  meals: MenuItem[];
}

export interface Menu {
  days: MenuDay[];
  totalCost: number;
}