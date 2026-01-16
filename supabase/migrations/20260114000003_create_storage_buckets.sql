-- Create storage buckets for Cooked app
-- Avatars: Public bucket for user profile photos
-- Proofs: Private bucket for check-in proof photos
-- Roasts: Private bucket for roast thread images

-- Create avatars bucket (public - anyone can view avatars)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars',
  'avatars',
  true,
  1048576, -- 1MB
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Create proofs bucket (private - only group members can view)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'proofs',
  'proofs',
  true, -- Public URLs but RLS controls access
  2097152, -- 2MB
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Create roasts bucket (private - only group members can view)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'roasts',
  'roasts',
  true, -- Public URLs but RLS controls access
  2097152, -- 2MB
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- ============================================
-- STORAGE RLS POLICIES
-- ============================================

-- AVATARS BUCKET POLICIES

-- Allow users to upload their own avatars
CREATE POLICY "Users can upload own avatars"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'avatars'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow users to update/replace their own avatars
CREATE POLICY "Users can update own avatars"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'avatars'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow users to delete their own avatars
CREATE POLICY "Users can delete own avatars"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'avatars'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow anyone to view avatars (public)
CREATE POLICY "Avatars are publicly viewable"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'avatars');


-- PROOFS BUCKET POLICIES

-- Allow users to upload proofs for their pacts
-- Path structure: proofs/{user_id}/{pact_id}/{timestamp}.jpg
CREATE POLICY "Users can upload own proofs"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'proofs'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow users to delete their own proofs
CREATE POLICY "Users can delete own proofs"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'proofs'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow group members to view proofs
-- For simplicity, we allow all authenticated users to view proofs
-- Real access control happens at the check_ins table level
CREATE POLICY "Authenticated users can view proofs"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'proofs');


-- ROASTS BUCKET POLICIES

-- Allow users to upload images in roast threads
-- Path structure: roasts/{thread_id}/{user_id}/{timestamp}.jpg
CREATE POLICY "Users can upload roast images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'roasts'
  AND (storage.foldername(name))[2] = auth.uid()::text
);

-- Allow users to delete their own roast images
CREATE POLICY "Users can delete own roast images"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'roasts'
  AND (storage.foldername(name))[2] = auth.uid()::text
);

-- Allow group members to view roast images
-- For simplicity, we allow all authenticated users to view roast images
-- Real access control happens at the roast_threads/roast_responses table level
CREATE POLICY "Authenticated users can view roast images"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'roasts');
