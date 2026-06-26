export const LANGUAGES = [
  { code: 'it', label: 'Italiano', short: 'IT' },
  { code: 'en', label: 'English', short: 'EN' },
  { code: 'fr', label: 'Français', short: 'FR' },
  { code: 'de', label: 'Deutsch', short: 'DE' },
  { code: 'es', label: 'Español', short: 'ES' },
  { code: 'ru', label: 'Русский', short: 'RU' }
] as const;

export type LanguageCode = (typeof LANGUAGES)[number]['code'];
export type RestaurantId = 'locanda22' | 'adelardi';
export type TranslatedText = Record<LanguageCode, string>;

export interface Restaurant {
  id: RestaurantId;
  slug: string;
  name: string;
  subtitle: TranslatedText;
  address: string;
  phone: string;
  heroImage: string;
  accent: string;
}

export interface Category {
  id: string;
  restaurantId: RestaurantId;
  name: TranslatedText;
  active: boolean;
  sortOrder: number;
}

export interface Dish {
  id: string;
  restaurantId: RestaurantId;
  categoryId: string;
  name: TranslatedText;
  description: TranslatedText;
  allergens: string[];
  price: number;
  image: string;
  active: boolean;
  featured?: boolean;
}

export interface MenuState {
  restaurants: Restaurant[];
  categories: Category[];
  dishes: Dish[];
  updatedAt: string;
}
