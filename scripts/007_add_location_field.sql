-- Add location field to profiles table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles'
    AND column_name = 'location'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN location TEXT;
  END IF;
END $$;

-- Add comment to the new column
COMMENT ON COLUMN public.profiles.location IS 'User location (e.g., city, country)';

-- Update RLS policies to include the new location field
-- The existing policies should already allow updates to all fields, but let's ensure it
CREATE POLICY "profiles_update_own_with_location" ON public.profiles
  FOR UPDATE USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Update the trigger function to include location field
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name, wallet_address, location)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data ->> 'display_name', 'Anonymous'),
    COALESCE(new.raw_user_meta_data ->> 'wallet_address', NULL),
    COALESCE(new.raw_user_meta_data ->> 'location', NULL)
  )
  ON CONFLICT (id) DO NOTHING;

  RETURN new;
END;
$$;

-- Recreate the trigger to ensure it uses the updated function
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Create index for location queries if needed
CREATE INDEX IF NOT EXISTS idx_profiles_location ON public.profiles(location) WHERE location IS NOT NULL;

-- Test the updated structure
SELECT
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'profiles'
  AND table_schema = 'public'
ORDER BY ordinal_position;
