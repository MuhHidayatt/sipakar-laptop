-- Create storage bucket for consultation images
INSERT INTO storage.buckets (id, name, public)
VALUES ('consultation-images', 'consultation-images', true);

-- Create policy for users to upload their own images
CREATE POLICY "Users can upload consultation images"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'consultation-images' AND auth.uid() IS NOT NULL);

-- Create policy for anyone to view consultation images
CREATE POLICY "Anyone can view consultation images"
ON storage.objects
FOR SELECT
USING (bucket_id = 'consultation-images');

-- Create policy for users to delete their own images
CREATE POLICY "Users can delete own consultation images"
ON storage.objects
FOR DELETE
USING (bucket_id = 'consultation-images' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Add column to store image URLs in konsultasi table
ALTER TABLE public.konsultasi
ADD COLUMN image_urls TEXT[] DEFAULT ARRAY[]::TEXT[];