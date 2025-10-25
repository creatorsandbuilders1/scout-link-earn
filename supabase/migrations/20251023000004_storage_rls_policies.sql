-- =====================================================
-- Storage RLS Policies for Wallet-First Architecture
-- =====================================================
-- This migration creates Row Level Security policies for
-- the avatars and posts-images storage buckets.
--
-- IMPORTANT: These policies work with our wallet-first
-- authentication where auth.uid() returns the user's
-- Stacks wallet address from a custom JWT.
-- =====================================================

-- =====================================================
-- AVATARS BUCKET POLICIES
-- =====================================================

-- Allow public read access to all avatars
CREATE POLICY "Allow public read access on avatars"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'avatars');

-- Allow authenticated users to upload to their own folder
-- The folder name must match their auth.uid() (Stacks address)
CREATE POLICY "Allow authenticated users to upload own avatar"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'avatars' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow authenticated users to update files in their own folder
CREATE POLICY "Allow authenticated users to update own avatar"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'avatars' AND
  (storage.foldername(name))[1] = auth.uid()::text
)
WITH CHECK (
  bucket_id = 'avatars' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow authenticated users to delete files in their own folder
CREATE POLICY "Allow authenticated users to delete own avatar"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'avatars' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- =====================================================
-- POSTS-IMAGES BUCKET POLICIES
-- =====================================================

-- Allow public read access to all post images
CREATE POLICY "Allow public read access on post images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'posts-images');

-- Allow authenticated users to upload to their own folder
-- The folder name must match their auth.uid() (Stacks address)
CREATE POLICY "Allow authenticated users to upload own post images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'posts-images' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow authenticated users to update files in their own folder
CREATE POLICY "Allow authenticated users to update own post images"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'posts-images' AND
  (storage.foldername(name))[1] = auth.uid()::text
)
WITH CHECK (
  bucket_id = 'posts-images' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow authenticated users to delete files in their own folder
CREATE POLICY "Allow authenticated users to delete own post images"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'posts-images' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- =====================================================
-- NOTES
-- =====================================================
-- 1. These policies require authenticated users with a valid JWT
-- 2. The JWT must have the user's Stacks address in the 'sub' claim
-- 3. Frontend code must call get-auth-jwt Edge Function before upload
-- 4. The folder structure is: {stacks_address}/{filename}
-- 5. Public read access allows anyone to view uploaded files
-- =====================================================
