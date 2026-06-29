
-- ─────────────────────────────────────────────
-- admin_users: whitelist of authorised admins
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.admin_users (
  user_id    uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

-- Admins can verify their own record; no write policies via API
CREATE POLICY "admin_users_select_self"
  ON public.admin_users FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- ─────────────────────────────────────────────
-- Bootstrap: first authenticated user becomes admin
-- (safe: only runs when the table is empty)
-- ─────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.register_first_admin()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _uid uuid := auth.uid();
BEGIN
  IF _uid IS NULL THEN
    RETURN false;
  END IF;

  -- If at least one admin exists, just confirm whether this user is one of them
  IF EXISTS (SELECT 1 FROM public.admin_users LIMIT 1) THEN
    RETURN EXISTS (SELECT 1 FROM public.admin_users WHERE user_id = _uid);
  END IF;

  INSERT INTO public.admin_users (user_id) VALUES (_uid)
  ON CONFLICT DO NOTHING;
  RETURN true;
END;
$$;

GRANT EXECUTE ON FUNCTION public.register_first_admin() TO authenticated;

-- ─────────────────────────────────────────────
-- Helper: is the current JWT an admin?
-- ─────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.admin_users WHERE user_id = auth.uid()
  )
$$;

GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;

-- ─────────────────────────────────────────────
-- menu_state: tighten write policies to admin only
-- ─────────────────────────────────────────────
DROP POLICY IF EXISTS insert_menu_state ON public.menu_state;
DROP POLICY IF EXISTS update_menu_state ON public.menu_state;
DROP POLICY IF EXISTS delete_menu_state ON public.menu_state;

CREATE POLICY "insert_menu_state"
  ON public.menu_state FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin());

CREATE POLICY "update_menu_state"
  ON public.menu_state FOR UPDATE
  TO authenticated
  USING  (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "delete_menu_state"
  ON public.menu_state FOR DELETE
  TO authenticated
  USING (public.is_admin());

-- ─────────────────────────────────────────────
-- storage.objects (menu-images): tighten write policies to admin only
-- ─────────────────────────────────────────────
DROP POLICY IF EXISTS "Authenticated upload menu images"  ON storage.objects;
DROP POLICY IF EXISTS "Authenticated update menu images"  ON storage.objects;
DROP POLICY IF EXISTS "Authenticated delete menu images"  ON storage.objects;

CREATE POLICY "Admin upload menu images"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'menu-images' AND public.is_admin());

CREATE POLICY "Admin update menu images"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING  (bucket_id = 'menu-images' AND public.is_admin());

CREATE POLICY "Admin delete menu images"
  ON storage.objects FOR DELETE
  TO authenticated
  USING  (bucket_id = 'menu-images' AND public.is_admin());
