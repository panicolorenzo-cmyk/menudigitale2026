import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { MenuState } from '../types';
import { loadLocalMenu, saveLocalMenu } from './localMenu';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const hasSupabaseConfig = Boolean(supabaseUrl && supabaseAnonKey);

const createSupabaseClient = (): SupabaseClient | null => {
  if (!supabaseUrl || !supabaseAnonKey) {
    return null;
  }

  return createClient(supabaseUrl, supabaseAnonKey);
};

export const supabase: SupabaseClient | null = createSupabaseClient();

const SNAPSHOT_ID = 'menu-digitale-2026';

export const loadMenuSnapshot = async (): Promise<MenuState> => {
  if (!supabase) {
    return loadLocalMenu();
  }

  const { data, error } = await supabase
    .from('menu_state')
    .select('payload')
    .eq('id', SNAPSHOT_ID)
    .maybeSingle();

  if (error || !data?.payload) {
    return loadLocalMenu();
  }

  return data.payload as MenuState;
};

export const saveMenuSnapshot = async (state: MenuState): Promise<void> => {
  saveLocalMenu(state);

  if (!supabase) {
    return;
  }

  await supabase.from('menu_state').upsert({
    id: SNAPSHOT_ID,
    payload: { ...state, updatedAt: new Date().toISOString() },
    updated_at: new Date().toISOString()
  });
};
