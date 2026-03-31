-- ==============================================================================
-- MIGRATION SCRIPT: Add Kids column to Settings
-- ==============================================================================

-- 1. Add kids column as jsonb to store the profiles list
ALTER TABLE public.tottube_settings 
ADD COLUMN IF NOT EXISTS kids JSONB DEFAULT '[]'::jsonb;

-- 2. Verify settings table RLS (already enabled, but ensuring it's robust)
-- (Existing policies cover the entire row, so new columns are automatically protected)
