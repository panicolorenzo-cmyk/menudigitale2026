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
      autoRefreshToken: true,
      detectSessionInUrl: false,
      persistSession: true
    }
  });
};

export const supabase: SupabaseClient | null = createSupabaseClient();

const SNAPSHOT_ID = 'main';
const IMAGE_BUCKET = 'menu-images';
let queuedSnapshot: MenuState | null = null;
let saveInProgress = false;

export const signInAdmin = async (email: string, password: string): Promise<{ error: string | null }> => {
  if (!supabase) {
    return { error: 'Supabase non configurato.' };
  }
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  return { error: error ? error.message : null };
};

export const signOutAdmin = async (): Promise<void> => {
  if (!supabase) return;
  await supabase.auth.signOut();
};

export const getAdminSession = async (): Promise<boolean> => {
  if (!supabase) return false;
  const { data } = await supabase.auth.getSession();
  return Boolean(data.session);
};

export const uploadMenuImage = async (file: File): Promise<string | null> => {
  if (!supabase) return null;
  const ext = file.name.split('.').pop() ?? 'jpg';
  const path = `dishes/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
  const { error } = await supabase.storage.from(IMAGE_BUCKET).upload(path, file, {
    cacheControl: '31536000',
    upsert: false
  });
  if (error) {
    console.warn('Image upload failed:', error.message);
    return null;
  }
  const { data } = supabase.storage.from(IMAGE_BUCKET).getPublicUrl(path);
  return data.publicUrl;
};

const persistMenuSnapshot = async (state: MenuState): Promise<boolean> => {
  if (!supabase) {
    return false;
  }

  const { error } = await supabase.from('menu_state').upsert({
    id: SNAPSHOT_ID,
    payload: state,
    updated_at: state.updatedAt
  });

  if (error) {
    console.error('[Menu] Salvataggio Supabase fallito:', error.message);
    return false;
  }

  return true;
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

  const remote = normalizeMenuState(data.payload);
  const local = loadLocalMenu();

  const remoteTime = remote.updatedAt ? new Date(remote.updatedAt).getTime() : 0;
  const localTime = local.updatedAt ? new Date(local.updatedAt).getTime() : 0;

  if (localTime > remoteTime) {
    // Local has newer edits (e.g. admin changes not yet synced) — keep them and try to push to Supabase
    void persistMenuSnapshot(local);
    return local;
  }

  saveLocalMenu(remote);
  return remote;
};

export const saveMenuSnapshot = async (state: MenuState): Promise<boolean> => {
  const normalized = normalizeMenuState({ ...state, updatedAt: new Date().toISOString() });
  saveLocalMenu(normalized);

  if (!supabase) {
    return true;
  }

  queuedSnapshot = normalized;

  if (saveInProgress) {
    return true;
  }

  saveInProgress = true;
  let success = false;

  try {
    while (queuedSnapshot) {
      const nextSnapshot = queuedSnapshot;
      queuedSnapshot = null;
      success = await persistMenuSnapshot(nextSnapshot);
      if (!success) {
        break;
      }
    }
  } finally {
    saveInProgress = false;
  }

  return success;
};
