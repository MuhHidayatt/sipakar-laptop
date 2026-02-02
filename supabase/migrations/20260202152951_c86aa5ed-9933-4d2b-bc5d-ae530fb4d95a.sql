-- Add columns for image-based consultation
ALTER TABLE public.konsultasi 
ADD COLUMN tipe_konsultasi text DEFAULT 'gejala',
ADD COLUMN image_analysis jsonb;

-- Add comment for clarity
COMMENT ON COLUMN public.konsultasi.tipe_konsultasi IS 'Type of consultation: gejala (symptom-based) or gambar (image-based)';
COMMENT ON COLUMN public.konsultasi.image_analysis IS 'JSON data containing image analysis results from AI';