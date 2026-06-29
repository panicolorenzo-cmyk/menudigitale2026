
-- Fix register_first_admin:
-- 1. Use advisory lock (double-checked locking) to prevent concurrent first-admin races
-- 2. Ensure no SECURITY DEFINER warning by confirming search_path is set
-- 3. Revoke direct execute from anon (only authenticated should call this)

REVOKE EXECUTE ON FUNCTION public.register_first_admin() FROM anon;

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

  -- Fast path: if any admin already exists, just confirm whether this user is one
  IF EXISTS (SELECT 1 FROM public.admin_users LIMIT 1) THEN
    RETURN EXISTS (SELECT 1 FROM public.admin_users WHERE user_id = _uid);
  END IF;

  -- Acquire advisory transaction lock to prevent concurrent first-admin race
  PERFORM pg_advisory_xact_lock(hashtext('register_first_admin_bootstrap'));

  -- Re-check after acquiring the lock (another transaction may have inserted meanwhile)
  IF EXISTS (SELECT 1 FROM public.admin_users LIMIT 1) THEN
    RETURN EXISTS (SELECT 1 FROM public.admin_users WHERE user_id = _uid);
  END IF;

  INSERT INTO public.admin_users (user_id) VALUES (_uid)
  ON CONFLICT DO NOTHING;
  RETURN true;
END;
$$;

-- Keep grant to authenticated only (needed for bootstrap and admin check)
GRANT EXECUTE ON FUNCTION public.register_first_admin() TO authenticated;

-- Confirm is_admin is also only for authenticated (not anon)
REVOKE EXECUTE ON FUNCTION public.is_admin() FROM anon;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;
