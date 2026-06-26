import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { MenuState } from '../types';
import { isMenuState, loadLocalMenu, normalizeMenuState, saveLocalMenu } from './localMenu';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL?.trim();
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim();

const isConfiguredValue = (value: string | undefined) => Boolean(value && !value.startsWith('INSERIRE_'));

export const hasSupabaseConfig = isConfiguredValue(supabaseUrl) && isConfiguredValue(supabaseAnonKey);

const createSupabaseClient = (): SupabaseClient | null => {
  if (!hasSupabaseConfig || !supabaseUrl || !supabaseAnonKey) {
    return null;
  }

  return createClient(supabaseUrl, supabaseAnonKey);
};

export const supabase: SupabaseClient | null = createSupabaseClient();

const SNAPSHOT_ID = 'main';

export const loadMenuSnapshot = async (): Promise<MenuState> => {
  if (!supabase) {
    return loadLocalMenu();
  }

  const { data, error } = await supabase.from('menu_state').select('payload').eq('id', SNAPSHOT_ID).maybeSingle();

  if (error || !isMenuState(data?.payload)) {
    if (error) {
      console.warn('Supabase load failed, using local menu fallback.', error.message);
    }
    return loadLocalMenu();
  }

  const normalized = normalizeMenuState(data.payload);
  saveLocalMenu(normalized);
  return normalized;
};

export const saveMenuSnapshot = async (state: MenuState): Promise<void> => {
  saveLocalMenu(state);

  if (!supabase) {
    return;
  }

  const { error } = await supabase.from('menu_state').upsert({
    id: SNAPSHOT_ID,
    payload: { ...state, updatedAt: new Date().toISOString() },
    updated_at: new Date().toISOString()
  });

  if (error) {
    console.warn('Supabase save failed, data kept locally.', error.message);
  }
};
