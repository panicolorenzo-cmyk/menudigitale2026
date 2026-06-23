import { demoMenu } from '../data/demoMenu';
import type { MenuState } from '../types';

const STORAGE_KEY = 'menu-digitale-2026-state';

const cloneDemo = (): MenuState => JSON.parse(JSON.stringify(demoMenu)) as MenuState;

const isMenuState = (value: unknown): value is MenuState => {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const candidate = value as Partial<MenuState>;
  return Array.isArray(candidate.restaurants) && Array.isArray(candidate.categories) && Array.isArray(candidate.dishes);
};

export const loadLocalMenu = (): MenuState => {
  if (typeof window === 'undefined') {
    return cloneDemo();
  }

  const stored = window.localStorage.getItem(STORAGE_KEY);
  if (!stored) {
    return cloneDemo();
  }

  try {
    const parsed = JSON.parse(stored) as unknown;
    return isMenuState(parsed) ? parsed : cloneDemo();
  } catch {
    return cloneDemo();
  }
};

export const saveLocalMenu = (state: MenuState) => {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...state, updatedAt: new Date().toISOString() }));
};
