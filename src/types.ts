export type Language = 'it' | 'en' | 'fr' | 'de' | 'es';
export type Badge = 'recommended' | 'vegetarian' | 'glutenFree' | 'spicy';

export interface Venue {
  id: string;
  name: string;
  slug: string;
  logo: string;
  heroImage: string;
  active: boolean;
}

export interface Category {
  id: string;
  venueId: string;
  name: Record<Language, string>;
  order: number;
  active: boolean;
}

export interface Product {
  id: string;
  venueId: string;
  categoryId: string;
  name: Record<Language, string>;
  description: Record<Language, string>;
  price: number;
  image: string;
  badges: Badge[];
  active: boolean;
}
