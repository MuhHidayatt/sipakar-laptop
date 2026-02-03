-- Add RLS policy for users to delete their own consultations
CREATE POLICY "Users can delete their own consultations"
ON public.konsultasi
FOR DELETE
USING (auth.uid() = user_id);