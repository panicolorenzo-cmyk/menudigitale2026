
-- ─────────────────────────────────────────────────────────────────
-- 1. Switch is_admin() to SECURITY INVOKER
--
-- SECURITY INVOKER is safe here because admin_users has an RLS SELECT
-- policy that lets authenticated users read their own row.
-- The function checks EXISTS(... WHERE user_id = auth.uid()), which
-- evaluates correctly under the caller's row-level security context.
-- This eliminates the "anon/authenticated can call SECURITY DEFINER"
-- warnings for is_admin entirely.
-- ─────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY INVOKER STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.admin_users WHERE user_id = auth.uid()
  )
$$;

-- ─────────────────────────────────────────────────────────────────
-- 2. Revoke default PUBLIC execute grant on both functions.
--    PostgreSQL grants EXECUTE to PUBLIC by default on new functions,
--    so REVOKE FROM anon alone is insufficient.
-- ─────────────────────────────────────────────────────────────────
REVOKE EXECUTE ON FUNCTION public.is_admin() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.register_first_admin() FROM PUBLIC;

-- Re-grant only what is needed:
-- is_admin: authenticated must be able to call it (RLS policies invoke it)
-- register_first_admin: authenticated must call it for the bootstrap flow
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.register_first_admin() TO authenticated;

-- ─────────────────────────────────────────────────────────────────
-- 3. Fix storage bucket listing.
--
-- Public-bucket files are served via CDN URL without RLS.
-- The broad anon SELECT policy on storage.objects lets any client
-- enumerate all uploaded filenames — not needed and not intended.
--
-- Replace with an admin-only SELECT so the admin panel can manage
-- files while preventing public enumeration.
-- ─────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Public read menu images" ON storage.objects;

CREATE POLICY "Admin read menu images"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'menu-images' AND public.is_admin());
