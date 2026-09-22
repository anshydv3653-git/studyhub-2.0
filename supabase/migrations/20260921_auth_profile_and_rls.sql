-- Migration: 20260921_auth_profile_and_rls.sql
-- StudyHub 2.0 - Complete Auth & Profile Automation + RLS Security
--
-- What this does:
-- 1. Automates profile creation via a database trigger on auth.users (SECURITY DEFINER).
--    Whenever a user registers via email or logs in via Google OAuth for the first time,
--    a corresponding row is created in public.profiles with ON CONFLICT (id) DO NOTHING.
--    This completely eliminates 409 unique constraint errors.
-- 2. Configures Row Level Security (RLS) for public.profiles:
--    - Users can read and update their own profile.
--    - Founder (sparkai.automation@gmail.com) can view all student profiles for admin management.
-- 3. Configures Row Level Security (RLS) for public.blocked_users:
--    - Any authenticated user can read blocked status (to check if they are blocked).
--    - Only Founder (sparkai.automation@gmail.com) can insert or delete blocked users.

-- 1. FUNCTION & TRIGGER FOR AUTOMATIC PROFILE CREATION
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  student_name text;
BEGIN
  -- Extract name from OAuth metadata or user metadata, fallback to email prefix
  student_name := COALESCE(
    NULLIF(TRIM(NEW.raw_user_meta_data->>'full_name'), ''),
    NULLIF(TRIM(NEW.raw_user_meta_data->>'name'), ''),
    SPLIT_PART(NEW.email, '@', 1),
    'Student'
  );

  -- Insert profile; DO NOTHING on conflict to prevent 409 errors
  INSERT INTO public.profiles (id, name, class_id, created_at)
  VALUES (
    NEW.id,
    student_name,
    NULL, -- student selects class on onboarding (or defaults to Class 10: 2)
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    name = CASE 
      WHEN public.profiles.name IS NULL OR public.profiles.name = '' 
      THEN EXCLUDED.name 
      ELSE public.profiles.name 
    END;

  RETURN NEW;
END;
$$;

-- Drop trigger if already exists and recreate
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 2. ROW LEVEL SECURITY ON PROFILES
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own profile" ON public.profiles;
CREATE POLICY "Users can read own profile"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() = id OR (auth.jwt()->>'email') = 'sparkai.automation@gmail.com'
  );

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile"
  ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile"
  ON public.profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- 3. ROW LEVEL SECURITY ON BLOCKED_USERS
ALTER TABLE public.blocked_users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can check blocked status" ON public.blocked_users;
CREATE POLICY "Users can check blocked status"
  ON public.blocked_users
  FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Founder can insert blocked users" ON public.blocked_users;
CREATE POLICY "Founder can insert blocked users"
  ON public.blocked_users
  FOR INSERT
  TO authenticated
  WITH CHECK (
    (auth.jwt()->>'email') = 'sparkai.automation@gmail.com'
  );

DROP POLICY IF EXISTS "Founder can delete blocked users" ON public.blocked_users;
CREATE POLICY "Founder can delete blocked users"
  ON public.blocked_users
  FOR DELETE
  TO authenticated
  USING (
    (auth.jwt()->>'email') = 'sparkai.automation@gmail.com'
  );
