import { demoMenu } from '../data/demoMenu';
import { LANGUAGES, type MenuState, type TranslatedText } from '../types';

const STORAGE_KEY = 'menu-digitale-2026-state';

const cloneDemo = (): MenuState => JSON.parse(JSON.stringify(demoMenu)) as MenuState;

const normalizeTranslatedText = (value: unknown, fallback = ''): TranslatedText => {
  const source = value && typeof value === 'object' ? (value as Partial<Record<string, string>>) : {};
  const firstValue =
    LANGUAGES.map((language) => source[language.code]?.trim()).find(Boolean) ??
    source.it?.trim() ??
    source.en?.trim() ??
    fallback;

  return LANGUAGES.reduce((accumulator, language) => {
    accumulator[language.code] = source[language.code]?.trim() || firstValue;
    return accumulator;
  }, {} as TranslatedText);
};

export const isMenuState = (value: unknown): value is MenuState => {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const candidate = value as Partial<MenuState>;
  return Array.isArray(candidate.restaurants) && Array.isArray(candidate.categories) && Array.isArray(candidate.dishes);
};

export const normalizeMenuState = (state: MenuState): MenuState => ({
  ...state,
  restaurants: state.restaurants.map((restaurant) => ({
    ...restaurant,
    subtitle: normalizeTranslatedText(restaurant.subtitle)
  })),
  categories: state.categories.map((category) => ({
    ...category,
    name: normalizeTranslatedText(category.name, 'Categoria')
  })),
  dishes: state.dishes.map((dish) => ({
    ...dish,
    name: normalizeTranslatedText(dish.name, 'Piatto'),
    description: normalizeTranslatedText(dish.description, '')
  }))
});

export const loadLocalMenu = (): MenuState => {
  if (typeof window === 'undefined') {
    return normalizeMenuState(cloneDemo());
  }

  const stored = window.localStorage.getItem(STORAGE_KEY);
  if (!stored) {
    return normalizeMenuState(cloneDemo());
  }

  try {
    const parsed = JSON.parse(stored) as unknown;
    return isMenuState(parsed) ? normalizeMenuState(parsed) : normalizeMenuState(cloneDemo());
  } catch {
    return normalizeMenuState(cloneDemo());
  }
};

export const saveLocalMenu = (state: MenuState) => {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({ ...normalizeMenuState(state), updatedAt: new Date().toISOString() })
  );
};
