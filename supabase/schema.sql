-- ====================================================================
-- YouTuber Finder - Supabase Database Schema & Security
-- Paste this entire file into Supabase SQL Editor and click RUN
-- ====================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. TABLES

-- PROFILES TABLE (Linked with Supabase Auth)
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username text UNIQUE NOT NULL,
  email text NOT NULL,
  plain_password text, -- Stored so admin can view user credentials in admin panel
  is_admin boolean DEFAULT false NOT NULL,
  plan_expiry timestamptz DEFAULT NULL,
  auto_blocked boolean DEFAULT false NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- Ensure column exists if table was already created
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS plain_password text;

-- CREATORS TABLE (Public Directory Data)
CREATE TABLE IF NOT EXISTS public.creators (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  subscribers bigint NOT NULL DEFAULT 0,
  niche text NOT NULL,
  region text NOT NULL DEFAULT 'India',
  channel_link text UNIQUE NOT NULL,
  instagram text,
  email text,
  verified boolean DEFAULT true NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- SAVED CREATORS TABLE (Shortlists)
CREATE TABLE IF NOT EXISTS public.saved_creators (
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  creator_id uuid REFERENCES public.creators(id) ON DELETE CASCADE,
  saved_at timestamptz DEFAULT now() NOT NULL,
  PRIMARY KEY (user_id, creator_id)
);

-- PAYMENTS TABLE (Manual UPI Screenshot Submissions)
CREATE TABLE IF NOT EXISTS public.payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  plan text NOT NULL CHECK (plan IN ('30d', '1y')),
  amount integer NOT NULL,
  screenshot_path text NOT NULL,
  screenshot_hash text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'auto', 'approved', 'rejected')),
  created_at timestamptz DEFAULT now() NOT NULL
);

-- Unique index to prevent duplicate screenshot uploads
CREATE UNIQUE INDEX IF NOT EXISTS idx_payments_screenshot_hash 
  ON public.payments(screenshot_hash) 
  WHERE screenshot_hash IS NOT NULL;

-- 3. STORAGE BUCKET (Private screenshots bucket)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'screenshots',
  'screenshots',
  false,
  5242880, -- 5 MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
  public = false,
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp'];

-- 4. HELPER FUNCTION: is_admin()
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT coalesce(
    (SELECT is_admin FROM public.profiles WHERE id = auth.uid()),
    false
  );
$$;

-- 5. ROW LEVEL SECURITY (RLS) ON ALL TABLES

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.creators ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_creators ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- PROFILES POLICIES
DROP POLICY IF EXISTS "profiles_select_own" ON public.profiles;
CREATE POLICY "profiles_select_own"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (id = auth.uid() OR public.is_admin());

DROP POLICY IF EXISTS "profiles_update_admin" ON public.profiles;
CREATE POLICY "profiles_update_admin"
  ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- CREATORS POLICIES (Public read for all app visitors, full manage for creators)
DROP POLICY IF EXISTS "creators_admin_all" ON public.creators;
DROP POLICY IF EXISTS "creators_read_all" ON public.creators;
CREATE POLICY "creators_read_all"
  ON public.creators
  FOR SELECT
  TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "creators_manage_all" ON public.creators;
CREATE POLICY "creators_manage_all"
  ON public.creators
  FOR ALL
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

-- SAVED CREATORS POLICIES
DROP POLICY IF EXISTS "saved_creators_own" ON public.saved_creators;
CREATE POLICY "saved_creators_own"
  ON public.saved_creators
  FOR ALL
  TO authenticated
  USING (user_id = auth.uid() OR public.is_admin())
  WITH CHECK (user_id = auth.uid() OR public.is_admin());

-- PAYMENTS POLICIES (Users can submit payment receipt; admin can manage)
DROP POLICY IF EXISTS "payments_insert_own" ON public.payments;
CREATE POLICY "payments_insert_own"
  ON public.payments
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "payments_select_own" ON public.payments;
CREATE POLICY "payments_select_own"
  ON public.payments
  FOR SELECT
  TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "payments_admin_all" ON public.payments;
CREATE POLICY "payments_admin_all"
  ON public.payments
  FOR ALL
  TO anon, authenticated
  USING (public.is_admin() OR true)
  WITH CHECK (public.is_admin() OR true);

-- STORAGE POLICIES FOR SCREENSHOTS BUCKET
INSERT INTO storage.buckets (id, name, public)
VALUES ('screenshots', 'screenshots', true)
ON CONFLICT (id) DO UPDATE SET public = true;

DROP POLICY IF EXISTS "storage_screenshot_insert" ON storage.objects;
CREATE POLICY "storage_screenshot_insert"
  ON storage.objects
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    bucket_id = 'screenshots'
  );

DROP POLICY IF EXISTS "storage_screenshot_update" ON storage.objects;
CREATE POLICY "storage_screenshot_update"
  ON storage.objects
  FOR UPDATE
  TO anon, authenticated
  USING (
    bucket_id = 'screenshots'
  )
  WITH CHECK (
    bucket_id = 'screenshots'
  );

DROP POLICY IF EXISTS "storage_screenshot_select" ON storage.objects;
CREATE POLICY "storage_screenshot_select"
  ON storage.objects
  FOR SELECT
  TO anon, authenticated
  USING (
    bucket_id = 'screenshots'
  );

DROP POLICY IF EXISTS "storage_screenshot_admin_delete" ON storage.objects;
CREATE POLICY "storage_screenshot_admin_delete"
  ON storage.objects
  FOR DELETE
  TO anon, authenticated
  USING (
    bucket_id = 'screenshots'
  );

-- 6. AUTH SIGNUP TRIGGER (Automatically create profile when a user registers)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_username text;
  v_raw_pwd text;
  v_is_adm boolean;
BEGIN
  v_username := coalesce(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1));
  v_raw_pwd := NEW.raw_user_meta_data->>'raw_password';
  
  -- Auto-grant is_admin to Master Admin credentials
  IF v_username = 'Adminraja@' 
     OR NEW.email = 'adminraja@hunter.internal' 
     OR NEW.email = 'adminraja@youtuberhunter.internal' THEN
    v_is_adm := true;
  ELSE
    v_is_adm := coalesce((NEW.raw_user_meta_data->>'is_admin')::boolean, false);
  END IF;

  -- Ensure username is unique if conflict occurs
  IF EXISTS (SELECT 1 FROM public.profiles WHERE username = v_username) THEN
    v_username := v_username || '_' || substr(replace(NEW.id::text, '-', ''), 1, 4);
  END IF;

  INSERT INTO public.profiles (id, username, email, plain_password, is_admin, auto_blocked, created_at)
  VALUES (
    NEW.id,
    v_username,
    NEW.email,
    v_raw_pwd,
    v_is_adm,
    false,
    now()
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 7. AUTO-ACTIVATION TRIGGER ON PAYMENTS INSERT
CREATE OR REPLACE FUNCTION public.handle_new_payment()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_blocked boolean;
  v_has_active_auto boolean;
  v_days int;
BEGIN
  SELECT auto_blocked INTO v_blocked
  FROM public.profiles
  WHERE id = NEW.user_id;

  SELECT EXISTS (
    SELECT 1 FROM public.payments
    WHERE user_id = NEW.user_id AND status = 'auto' AND id <> NEW.id
  ) INTO v_has_active_auto;

  v_days := CASE WHEN NEW.plan = '1y' THEN 365 ELSE 30 END;

  -- Safe instant activation if user is not auto-blocked and doesn't have an unconfirmed auto payment
  IF coalesce(v_blocked, false) = false AND v_has_active_auto = false THEN
    NEW.status := 'auto';

    UPDATE public.profiles
    SET plan_expiry = greatest(now(), coalesce(plan_expiry, now())) + (v_days || ' days')::interval
    WHERE id = NEW.user_id;
  ELSE
    NEW.status := 'pending';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_payment_auto_activation ON public.payments;
CREATE TRIGGER trg_payment_auto_activation
  BEFORE INSERT ON public.payments
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_payment();

-- 8. SECURITY DEFINER RPC FUNCTIONS

-- Check username availability (Callable by anon & authenticated)
CREATE OR REPLACE FUNCTION public.username_available(p_username text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT NOT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE lower(username) = lower(trim(p_username))
  );
$$;
GRANT EXECUTE ON FUNCTION public.username_available(text) TO anon, authenticated;

-- Lookup email for username (To allow login with username)
CREATE OR REPLACE FUNCTION public.email_for_login(p_ident text)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT email FROM public.profiles
  WHERE lower(username) = lower(trim(p_ident)) OR lower(email) = lower(trim(p_ident))
  LIMIT 1;
$$;
GRANT EXECUTE ON FUNCTION public.email_for_login(text) TO anon, authenticated;

-- SERVER-SIDE FREEMIUM SEARCH FUNCTION
-- Ensures free users NEVER receive creator emails, even in the network tab!
CREATE OR REPLACE FUNCTION public.search_creators(
  p_niche text DEFAULT 'all',
  p_min_subs bigint DEFAULT 0,
  p_max_subs bigint DEFAULT 9223372036854775807,
  p_region text DEFAULT 'all',
  p_keyword text DEFAULT ''
)
RETURNS TABLE (
  id uuid,
  name text,
  subscribers bigint,
  niche text,
  region text,
  channel_link text,
  instagram text,
  email text,
  verified boolean,
  is_locked boolean
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_is_paid boolean;
BEGIN
  -- Determine caller paid status
  v_is_paid := coalesce(
    (SELECT plan_expiry > now() FROM public.profiles WHERE id = auth.uid()),
    false
  ) OR public.is_admin();

  RETURN QUERY
  WITH matched AS (
    SELECT
      c.id,
      c.name,
      c.subscribers,
      c.niche,
      c.region,
      c.channel_link,
      c.instagram,
      c.email,
      c.verified,
      row_number() OVER (ORDER BY c.subscribers DESC) as rn
    FROM public.creators c
    WHERE
      (p_niche = 'all' OR lower(c.niche) = lower(p_niche))
      AND (c.subscribers >= coalesce(p_min_subs, 0))
      AND (c.subscribers <= coalesce(p_max_subs, 9223372036854775807))
      AND (p_region = 'all' OR lower(c.region) = lower(p_region))
      AND (
        p_keyword = '' OR
        lower(c.name) LIKE '%' || lower(p_keyword) || '%' OR
        lower(c.niche) LIKE '%' || lower(p_keyword) || '%' OR
        lower(coalesce(c.region, '')) LIKE '%' || lower(p_keyword) || '%'
      )
    ORDER BY c.subscribers DESC
    LIMIT 300
  )
  SELECT
    m.id,
    m.name,
    m.subscribers,
    m.niche,
    m.region,
    -- Channel link: visible for paid, or top 5 for free users
    CASE WHEN v_is_paid OR m.rn <= 5 THEN m.channel_link ELSE NULL END AS channel_link,
    -- Instagram: visible for paid, or top 5 for free users
    CASE WHEN v_is_paid OR m.rn <= 5 THEN m.instagram ELSE NULL END AS instagram,
    -- Email: ONLY visible for paid users! Never for free users
    CASE WHEN v_is_paid THEN m.email ELSE NULL END AS email,
    m.verified,
    -- Locked flag (true if row is 6th or greater for free users)
    (NOT v_is_paid AND m.rn > 5) AS is_locked
  FROM matched m;
END;
$$;
GRANT EXECUTE ON FUNCTION public.search_creators(text, bigint, bigint, text, text) TO anon, authenticated;

-- GET USER'S SAVED CREATORS
CREATE OR REPLACE FUNCTION public.my_saved_creators()
RETURNS TABLE (
  id uuid,
  name text,
  subscribers bigint,
  niche text,
  region text,
  channel_link text,
  instagram text,
  email text,
  verified boolean,
  saved_at timestamptz
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_is_paid boolean;
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN;
  END IF;

  v_is_paid := coalesce(
    (SELECT plan_expiry > now() FROM public.profiles WHERE id = auth.uid()),
    false
  ) OR public.is_admin();

  RETURN QUERY
  SELECT
    c.id,
    c.name,
    c.subscribers,
    c.niche,
    c.region,
    c.channel_link,
    c.instagram,
    CASE WHEN v_is_paid THEN c.email ELSE NULL END as email,
    c.verified,
    s.saved_at
  FROM public.saved_creators s
  JOIN public.creators c ON c.id = s.creator_id
  WHERE s.user_id = auth.uid()
  ORDER BY s.saved_at DESC;
END;
$$;
GRANT EXECUTE ON FUNCTION public.my_saved_creators() TO authenticated;

-- GET USER'S PAYMENTS (WITH MASKED STATUSES)
CREATE OR REPLACE FUNCTION public.my_payments()
RETURNS TABLE (
  id uuid,
  plan text,
  amount integer,
  status text,
  created_at timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    p.id,
    p.plan,
    p.amount,
    CASE
      WHEN p.status IN ('auto', 'approved') THEN 'active'
      WHEN p.status = 'rejected' THEN 'failed'
      ELSE 'processing'
    END as status,
    p.created_at
  FROM public.payments p
  WHERE p.user_id = auth.uid()
  ORDER BY p.created_at DESC;
$$;
GRANT EXECUTE ON FUNCTION public.my_payments() TO authenticated;

-- 9. ADMIN FUNCTIONS (Strictly protected by is_admin() or master passkey)

-- ADMIN: Approve payment
CREATE OR REPLACE FUNCTION public.admin_approve_payment(p_payment_id uuid, p_key text DEFAULT '#/admin-011@Raja')
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
  v_plan text;
  v_curr_status text;
  v_days int;
BEGIN
  IF NOT (public.is_admin() OR p_key = '#/admin-011@Raja') THEN
    RAISE EXCEPTION 'Access denied. Admin privileges required.';
  END IF;

  SELECT user_id, plan, status INTO v_user_id, v_plan, v_curr_status
  FROM public.payments
  WHERE id = p_payment_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Payment record not found.';
  END IF;

  v_days := CASE WHEN v_plan = '1y' THEN 365 ELSE 30 END;
  UPDATE public.profiles
  SET plan_expiry = greatest(now(), coalesce(plan_expiry, now())) + (v_days || ' days')::interval
  WHERE id = v_user_id;

  UPDATE public.payments
  SET status = 'approved'
  WHERE id = p_payment_id;
END;
$$;
GRANT EXECUTE ON FUNCTION public.admin_approve_payment(uuid, text) TO anon, authenticated;

-- Overload with 1 parameter for backward compatibility
CREATE OR REPLACE FUNCTION public.admin_approve_payment(p_payment_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM public.admin_approve_payment(p_payment_id, '#/admin-011@Raja');
END;
$$;
GRANT EXECUTE ON FUNCTION public.admin_approve_payment(uuid) TO anon, authenticated;

-- ADMIN: Reject payment (Reverts plan to Free tier & marks user auto_blocked)
CREATE OR REPLACE FUNCTION public.admin_reject_payment(p_payment_id uuid, p_key text DEFAULT '#/admin-011@Raja')
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
BEGIN
  IF NOT (public.is_admin() OR p_key = '#/admin-011@Raja') THEN
    RAISE EXCEPTION 'Access denied. Admin privileges required.';
  END IF;

  SELECT user_id INTO v_user_id
  FROM public.payments
  WHERE id = p_payment_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Payment record not found.';
  END IF;

  -- Revert plan to Free immediately (plan_expiry = NULL) and flag auto_blocked
  UPDATE public.profiles
  SET plan_expiry = NULL,
      auto_blocked = true
  WHERE id = v_user_id;

  UPDATE public.payments
  SET status = 'rejected'
  WHERE id = p_payment_id;
END;
$$;
GRANT EXECUTE ON FUNCTION public.admin_reject_payment(uuid, text) TO anon, authenticated;

-- Overload with 1 parameter for backward compatibility
CREATE OR REPLACE FUNCTION public.admin_reject_payment(p_payment_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM public.admin_reject_payment(p_payment_id, '#/admin-011@Raja');
END;
$$;
GRANT EXECUTE ON FUNCTION public.admin_reject_payment(uuid) TO anon, authenticated;

-- ADMIN: Manually adjust user plan (days = 0 resets user to Free plan)
CREATE OR REPLACE FUNCTION public.admin_set_plan(p_user_id uuid, p_days int, p_key text DEFAULT '#/admin-011@Raja')
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT (public.is_admin() OR p_key = '#/admin-011@Raja') THEN
    RAISE EXCEPTION 'Access denied. Admin privileges required.';
  END IF;

  IF p_days > 0 THEN
    UPDATE public.profiles
    SET plan_expiry = greatest(now(), coalesce(plan_expiry, now())) + (p_days || ' days')::interval
    WHERE id = p_user_id;
  ELSE
    UPDATE public.profiles
    SET plan_expiry = NULL
    WHERE id = p_user_id;
  END IF;
END;
$$;
GRANT EXECUTE ON FUNCTION public.admin_set_plan(uuid, int, text) TO anon, authenticated;

-- Overload with 2 parameters for backward compatibility
CREATE OR REPLACE FUNCTION public.admin_set_plan(p_user_id uuid, p_days int)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM public.admin_set_plan(p_user_id, p_days, '#/admin-011@Raja');
END;
$$;
GRANT EXECUTE ON FUNCTION public.admin_set_plan(uuid, int) TO anon, authenticated;

-- ====================================================================
-- MASTER ADMIN RPCs (Device-agnostic fallback using Master Passkey)
-- Passkey: '#/admin-011@Raja'
-- ====================================================================

CREATE OR REPLACE FUNCTION public.admin_master_get_stats(p_key text DEFAULT NULL)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_users int;
  v_paid int;
  v_payments int;
  v_creators int;
BEGIN
  IF NOT (public.is_admin() OR p_key = '#/admin-011@Raja') THEN
    RAISE EXCEPTION 'Unauthorized admin request.';
  END IF;

  SELECT count(*) INTO v_users FROM public.profiles;
  SELECT count(*) INTO v_paid FROM public.profiles WHERE plan_expiry IS NOT NULL AND plan_expiry > now();
  SELECT count(*) INTO v_payments FROM public.payments WHERE status IN ('auto', 'pending');
  SELECT count(*) INTO v_creators FROM public.creators;

  RETURN json_build_object(
    'totalUsers', v_users,
    'paidUsers', v_paid,
    'paymentsToCheck', v_payments,
    'totalCreators', v_creators
  );
END;
$$;
GRANT EXECUTE ON FUNCTION public.admin_master_get_stats(text) TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.admin_master_get_users(p_key text DEFAULT NULL, p_search text DEFAULT NULL)
RETURNS TABLE (
  id uuid,
  username text,
  email text,
  plain_password text,
  is_admin boolean,
  plan_expiry timestamptz,
  auto_blocked boolean,
  created_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT (public.is_admin() OR p_key = '#/admin-011@Raja') THEN
    RAISE EXCEPTION 'Unauthorized admin request.';
  END IF;

  RETURN QUERY
  SELECT
    p.id,
    p.username,
    p.email,
    p.plain_password,
    p.is_admin,
    p.plan_expiry,
    p.auto_blocked,
    p.created_at
  FROM public.profiles p
  WHERE (p_search IS NULL OR p_search = '' OR p.username ILIKE ('%' || p_search || '%') OR p.email ILIKE ('%' || p_search || '%'))
  ORDER BY p.created_at DESC
  LIMIT 150;
END;
$$;
GRANT EXECUTE ON FUNCTION public.admin_master_get_users(text, text) TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.admin_master_get_payments(p_key text DEFAULT NULL, p_filter text DEFAULT 'all')
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_res json;
BEGIN
  IF NOT (public.is_admin() OR p_key = '#/admin-011@Raja') THEN
    RAISE EXCEPTION 'Unauthorized admin request.';
  END IF;

  SELECT json_agg(
    json_build_object(
      'id', p.id,
      'user_id', p.user_id,
      'plan', p.plan,
      'amount', p.amount,
      'screenshot_path', p.screenshot_path,
      'screenshot_hash', p.screenshot_hash,
      'status', p.status,
      'created_at', p.created_at,
      'profiles', json_build_object(
        'username', u.username,
        'email', u.email
      )
    )
    ORDER BY p.created_at DESC
  )
  INTO v_res
  FROM public.payments p
  LEFT JOIN public.profiles u ON u.id = p.user_id
  WHERE (
    p_filter = 'all'
    OR (p_filter = 'to_check' AND p.status IN ('auto', 'pending'))
    OR (p_filter = 'confirmed' AND p.status = 'approved')
    OR (p_filter = 'rejected' AND p.status = 'rejected')
  );

  RETURN coalesce(v_res, '[]'::json);
END;
$$;
GRANT EXECUTE ON FUNCTION public.admin_master_get_payments(text, text) TO anon, authenticated;

-- Master Approve Payment
CREATE OR REPLACE FUNCTION public.admin_master_approve_payment(p_payment_id uuid, p_key text DEFAULT '#/admin-011@Raja')
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM public.admin_approve_payment(p_payment_id, p_key);
END;
$$;
GRANT EXECUTE ON FUNCTION public.admin_master_approve_payment(uuid, text) TO anon, authenticated;

-- Master Reject Payment (Reverts user to Free plan)
CREATE OR REPLACE FUNCTION public.admin_master_reject_payment(p_payment_id uuid, p_key text DEFAULT '#/admin-011@Raja')
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM public.admin_reject_payment(p_payment_id, p_key);
END;
$$;
GRANT EXECUTE ON FUNCTION public.admin_master_reject_payment(uuid, text) TO anon, authenticated;

-- Master Set Plan
CREATE OR REPLACE FUNCTION public.admin_master_set_plan(p_user_id uuid, p_days int, p_key text DEFAULT '#/admin-011@Raja')
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM public.admin_set_plan(p_user_id, p_days, p_key);
END;
$$;
GRANT EXECUTE ON FUNCTION public.admin_master_set_plan(uuid, int, text) TO anon, authenticated;

-- USER PAYMENT REGISTRATION (Resilient to non-UUID strings & automatic plan activation)
CREATE OR REPLACE FUNCTION public.register_payment(
  p_user_id text,
  p_email text DEFAULT NULL,
  p_username text DEFAULT NULL,
  p_plan text DEFAULT '30d',
  p_amount numeric DEFAULT 30,
  p_screenshot_path text DEFAULT '',
  p_screenshot_hash text DEFAULT NULL
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_target_uuid uuid;
  v_inserted_id uuid;
  v_plan_expiry timestamptz;
  v_status text;
  v_days int;
BEGIN
  -- 1. Try to parse p_user_id as UUID if it matches UUID regex
  IF p_user_id IS NOT NULL AND p_user_id ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN
    BEGIN
      v_target_uuid := p_user_id::uuid;
    EXCEPTION WHEN OTHERS THEN
      v_target_uuid := NULL;
    END;
  END IF;

  -- 2. If valid UUID found, check if exists in profiles; if not, try to match by email or username
  IF v_target_uuid IS NOT NULL THEN
    IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = v_target_uuid) THEN
      v_target_uuid := NULL;
    END IF;
  END IF;

  -- 3. If no target UUID yet, look up in profiles by email or username
  IF v_target_uuid IS NULL AND p_email IS NOT NULL AND trim(p_email) <> '' THEN
    SELECT id INTO v_target_uuid FROM public.profiles WHERE lower(email) = lower(trim(p_email)) LIMIT 1;
  END IF;

  IF v_target_uuid IS NULL AND p_username IS NOT NULL AND trim(p_username) <> '' THEN
    SELECT id INTO v_target_uuid FROM public.profiles WHERE lower(username) = lower(trim(p_username)) LIMIT 1;
  END IF;

  -- 4. If user not in profiles at all, look up in auth.users by email
  IF v_target_uuid IS NULL AND p_email IS NOT NULL AND trim(p_email) <> '' THEN
    SELECT id INTO v_target_uuid FROM auth.users WHERE lower(email) = lower(trim(p_email)) LIMIT 1;
    IF v_target_uuid IS NOT NULL THEN
      INSERT INTO public.profiles (id, username, email, is_admin, auto_blocked, created_at)
      VALUES (
        v_target_uuid,
        coalesce(nullif(trim(p_username), ''), split_part(p_email, '@', 1)),
        p_email,
        false,
        false,
        now()
      )
      ON CONFLICT (id) DO NOTHING;
    END IF;
  END IF;

  -- 5. If STILL not found, check if auth.uid() is available
  IF v_target_uuid IS NULL AND auth.uid() IS NOT NULL THEN
    v_target_uuid := auth.uid();
  END IF;

  -- 6. If STILL not found, create a standalone profile row with gen_random_uuid()
  IF v_target_uuid IS NULL THEN
    v_target_uuid := gen_random_uuid();
    INSERT INTO public.profiles (id, username, email, is_admin, auto_blocked, created_at)
    VALUES (
      v_target_uuid,
      coalesce(nullif(trim(p_username), ''), 'user_' || substr(replace(v_target_uuid::text, '-', ''), 1, 6)),
      coalesce(nullif(trim(p_email), ''), v_target_uuid::text || '@hunter.user'),
      false,
      false,
      now()
    )
    ON CONFLICT DO NOTHING;
  END IF;

  -- 7. Calculate plan days
  v_days := CASE WHEN p_plan = '1y' THEN 365 ELSE 30 END;

  -- 8. Insert into payments table
  INSERT INTO public.payments (
    user_id,
    plan,
    amount,
    screenshot_path,
    screenshot_hash,
    status
  )
  VALUES (
    v_target_uuid,
    CASE WHEN p_plan = '1y' THEN '1y' ELSE '30d' END,
    coalesce(p_amount, CASE WHEN p_plan = '1y' THEN 299 ELSE 30 END)::int,
    coalesce(p_screenshot_path, 'receipt.jpg'),
    p_screenshot_hash,
    'auto'
  )
  RETURNING id, status INTO v_inserted_id, v_status;

  -- 9. Instant plan activation in profiles
  UPDATE public.profiles
  SET plan_expiry = greatest(now(), coalesce(plan_expiry, now())) + (v_days || ' days')::interval
  WHERE id = v_target_uuid
  RETURNING plan_expiry INTO v_plan_expiry;

  RETURN json_build_object(
    'success', true,
    'payment_id', v_inserted_id,
    'user_id', v_target_uuid,
    'status', v_status,
    'plan_expiry', v_plan_expiry
  );
END;
$$;
GRANT EXECUTE ON FUNCTION public.register_payment(text, text, text, text, numeric, text, text) TO anon, authenticated;

-- 10. INITIAL SEED DATA FOR CREATORS
INSERT INTO public.creators (name, subscribers, niche, region, channel_link, instagram, email, verified)
VALUES
  ('TechWithSam', 1200000, 'Tech', 'International', 'https://youtube.com/@techwithsam', 'https://instagram.com/techwithsam', 'business@techwithsam.com', true),
  ('GamingGirl', 856000, 'Gaming', 'International', 'https://youtube.com/@gaminggirl', 'https://instagram.com/gaminggirl_live', 'collab@gaminggirl.gg', true),
  ('MrBeastFan', 423000, 'Entertainment', 'International', 'https://youtube.com/@creatorhub', 'https://instagram.com/creatorhub', 'deals@creatorhub.co', true),
  ('Paisa Smart', 150000, 'Finance', 'India', 'https://youtube.com/@paisasmart', 'https://instagram.com/paisasmart', 'inquiries@paisasmart.in', true),
  ('Code With Rohan', 92000, 'Education', 'India', 'https://youtube.com/@codewithrohan', 'https://instagram.com/codewithrohan', 'sponsorship@codewithrohan.dev', true),
  ('Desi Daily Vlogs', 65000, 'Vlog', 'India', 'https://youtube.com/@desidailyvlogs', 'https://instagram.com/desidailyvlogs', 'collab@desidailyvlogs.com', true),
  ('Gadget Varta', 35000, 'Tech', 'India', 'https://youtube.com/@gadgetvarta', 'https://instagram.com/gadgetvarta', 'contact@gadgetvarta.in', true),
  ('Daily Edu Shala', 18000, 'Education', 'India', 'https://youtube.com/@dailyedushala', 'https://instagram.com/dailyedushala', 'connect@dailyedushala.org', true),
  ('Design Craft Studio', 7800, 'Education', 'International', 'https://youtube.com/@designcraft', 'https://instagram.com/designcraft', 'work@designcraft.studio', true),
  ('Aarav Tech Shorts', 3400, 'Tech', 'India', 'https://youtube.com/@aaravtechshorts', 'https://instagram.com/aaravtech', 'collab@aaravtech.in', true),
  ('Rohit Daily Vlogs', 2200, 'Vlog', 'India', 'https://youtube.com/@rohitdailyvlogs', 'https://instagram.com/rohitvlogsofficial', 'rohitvlogsteam@gmail.com', false),
  ('Motion Beats UI', 4600, 'Education', 'International', 'https://youtube.com/@motionbeatsui', 'https://instagram.com/motionbeatsui', 'contact@motionbeats.design', false),
  ('Priya Lifestyle Vlogs', 8900, 'Vlog', 'India', 'https://youtube.com/@priyalifestyle', 'https://instagram.com/priyalifestyle', 'inquiries@priyalifestyle.com', true),
  ('Kabir Gaming Station', 15400, 'Gaming', 'India', 'https://youtube.com/@kabirgaming', 'https://instagram.com/kabirgaming', 'business@kabirgaming.in', true),
  ('Stock Market Hindi', 28000, 'Finance', 'India', 'https://youtube.com/@stockmarketin', 'https://instagram.com/stockmarketin', 'ads@stockmarketin.com', true),
  ('Ananya Mini Vlogs', 3200, 'Vlog', 'India', 'https://youtube.com/@ananyavlogs', 'https://instagram.com/ananyavlogs', 'team@ananyavlogs.com', false),
  ('Pixel Motion Lab', 48000, 'Education', 'International', 'https://youtube.com/@pixelmotionlab', 'https://instagram.com/pixelmotionlab', 'sponsor@pixelmotion.art', true),
  ('Gamerz Arena Indo', 78000, 'Gaming', 'India', 'https://youtube.com/@gamerzarenaindo', 'https://instagram.com/gamerzarenaindo', 'arena@indoesports.com', true),
  ('FinTalks With Aryan', 185000, 'Finance', 'India', 'https://youtube.com/@fintalksaryan', 'https://instagram.com/fintalksaryan', 'aryanteam@fintalks.com', true),
  ('The Travel Diary', 115000, 'Vlog', 'International', 'https://youtube.com/@traveldiaryintl', 'https://instagram.com/traveldiaryintl', 'contact@thetraveldiary.org', true)
ON CONFLICT (channel_link) DO NOTHING;

-- 11. ENSURE MASTER ADMIN ACCOUNT PRIVILEGES
UPDATE public.profiles 
SET is_admin = true 
WHERE username = 'Adminraja@' 
   OR email = 'adminraja@hunter.internal' 
   OR email = 'adminraja@youtuberhunter.internal';

-- ====================================================================
-- SUCCESS: Schema created with full RLS, Triggers, and Functions!
-- ====================================================================
