-- Fix 1: Make consultation-images bucket private and update RLS policies

-- Make bucket private
UPDATE storage.buckets 
SET public = false 
WHERE id = 'consultation-images';

-- Drop the public SELECT policy
DROP POLICY IF EXISTS "Anyone can view consultation images" ON storage.objects;

-- Add policy for users to view their own consultation images
CREATE POLICY "Users can view own consultation images"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'consultation-images' 
  AND auth.uid() IS NOT NULL 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Add policy for admins to view all consultation images
CREATE POLICY "Admins can view all consultation images"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'consultation-images'
  AND public.has_role(auth.uid(), 'admin')
);