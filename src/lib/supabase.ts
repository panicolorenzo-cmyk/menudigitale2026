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

  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: false,
      detectSessionInUrl: false,
      persistSession: false
    }
  });
};

export const supabase: SupabaseClient | null = createSupabaseClient();

const SNAPSHOT_ID = 'main';
let queuedSnapshot: MenuState | null = null;
let saveInProgress = false;

const persistMenuSnapshot = async (state: MenuState): Promise<void> => {
  if (!supabase) {
    return;
  }

  const { error } = await supabase.from('menu_state').upsert({
    id: SNAPSHOT_ID,
    payload: state,
    updated_at: state.updatedAt
  });

  if (error) {
    console.warn('Supabase save failed, data kept locally.', error.message);
  }
};

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
  const normalized = normalizeMenuState({ ...state, updatedAt: new Date().toISOString() });
  saveLocalMenu(normalized);

  if (!supabase) {
    return;
  }

  queuedSnapshot = normalized;

  if (saveInProgress) {
    return;
  }

  saveInProgress = true;

  try {
    while (queuedSnapshot) {
      const nextSnapshot = queuedSnapshot;
      queuedSnapshot = null;
      await persistMenuSnapshot(nextSnapshot);
    }
  } finally {
    saveInProgress = false;
  }
};
