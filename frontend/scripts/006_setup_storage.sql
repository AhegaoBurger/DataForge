-- Create storage bucket for avatar uploads
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars',
  'avatars',
  true,
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
) ON CONFLICT (id) DO NOTHING;

-- Create RLS policies for avatars bucket
-- Allow users to upload their own avatar
CREATE POLICY "Users can upload their own avatar" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'avatars' AND
    auth.uid()::text = (SPLIT_PART(name, '-', 1))[1]
  );

-- Allow users to update their own avatar
CREATE POLICY "Users can update their own avatar" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'avatars' AND
    auth.uid()::text = (SPLIT_PART(name, '-', 1))[1]
  );

-- Allow users to read their own avatar
CREATE POLICY "Users can read their own avatar" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'avatars' AND
    auth.uid()::text = (SPLIT_PART(name, '-', 1))[1]
  );

-- Allow public access to avatars (since they're profile pictures)
CREATE POLICY "Avatars are publicly accessible" ON storage.objects
  FOR SELECT USING (bucket_id = 'avatars');

-- Grant necessary permissions
GRANT ALL ON storage.buckets TO authenticated;
GRANT ALL ON storage.objects TO authenticated;
GRANT SELECT ON storage.buckets TO anon, authenticated;
GRANT SELECT ON storage.objects TO anon, authenticated;

-- Function to clean up old avatars when user uploads a new one
CREATE OR REPLACE FUNCTION public.cleanup_old_avatars()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Delete old avatars for this user when a new one is uploaded
  DELETE FROM storage.objects
  WHERE bucket_id = 'avatars'
    AND name LIKE NEW.id || '-%'
    AND name != NEW.name;

  RETURN NEW;
END;
$$;

-- Create trigger to cleanup old avatars
DROP TRIGGER IF EXISTS cleanup_old_avatars_trigger ON storage.objects;
CREATE TRIGGER cleanup_old_avatars_trigger
  AFTER INSERT ON storage.objects
  FOR EACH ROW
  WHEN (NEW.bucket_id = 'avatars')
  EXECUTE FUNCTION public.cleanup_old_avatars();

-- Create view for user avatars with public URLs
CREATE OR REPLACE VIEW public.user_avatars AS
SELECT
  p.id as user_id,
  p.display_name,
  p.avatar_url,
  CASE
    WHEN p.avatar_url IS NOT NULL THEN p.avatar_url
    ELSE NULL
  END as public_avatar_url
FROM public.profiles p;

-- Grant access to the view
GRANT SELECT ON public.user_avatars TO anon, authenticated;

-- Optional: Create a function to generate avatar URLs
CREATE OR REPLACE FUNCTION public.get_avatar_url(user_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  avatar_object RECORD;
BEGIN
  -- Get the latest avatar for the user
  SELECT name INTO avatar_object
  FROM storage.objects
  WHERE bucket_id = 'avatars'
    AND name LIKE user_id || '-%'
  ORDER BY created_at DESC
  LIMIT 1;

  IF FOUND THEN
    RETURN (
      SELECT public_url
      FROM storage.get_public_url('avatars', avatar_object.name)
    );
  END IF;

  RETURN NULL;
END;
$$;

-- Grant execute permission for the function
GRANT EXECUTE ON FUNCTION public.get_avatar_url(UUID) TO anon, authenticated;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_storage_objects_bucket_name ON storage.objects(bucket_id, name);
CREATE INDEX IF NOT EXISTS idx_profiles_avatar_url ON public.profiles(avatar_url) WHERE avatar_url IS NOT NULL;

-- Add column to profiles table for avatar management if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles'
    AND column_name = 'avatar_updated_at'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN avatar_updated_at TIMESTAMPTZ;
  END IF;
END $$;

-- Create trigger to update avatar_updated_at when avatar_url changes
CREATE OR REPLACE FUNCTION public.update_avatar_timestamp()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF OLD.avatar_url IS DISTINCT FROM NEW.avatar_url THEN
    NEW.avatar_updated_at = NOW();
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS update_avatar_timestamp_trigger ON public.profiles;
CREATE TRIGGER update_avatar_timestamp_trigger
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_avatar_timestamp();
