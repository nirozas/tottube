-- ==============================================================================
-- MIGRATION SCRIPT: Create Shortcuts Table
-- Run this in your Supabase SQL Editor if "Quick searches" are not saving.
-- ==============================================================================

-- 1. Create the Shortcuts Table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.tottube_shortcuts (
    id UUID DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    keyword TEXT NOT NULL,
    "imageUrl" TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    PRIMARY KEY (id)
);

-- 2. Enable Row Level Security
ALTER TABLE public.tottube_shortcuts ENABLE ROW LEVEL SECURITY;

-- 3. Create RLS Policies
-- Note: We use DROP POLICY IF EXISTS to allow re-running this script without errors

DROP POLICY IF EXISTS "Users can view own shortcuts" ON public.tottube_shortcuts;
CREATE POLICY "Users can view own shortcuts" ON public.tottube_shortcuts
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own shortcuts" ON public.tottube_shortcuts;
CREATE POLICY "Users can insert own shortcuts" ON public.tottube_shortcuts
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own shortcuts" ON public.tottube_shortcuts;
CREATE POLICY "Users can update own shortcuts" ON public.tottube_shortcuts
    FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own shortcuts" ON public.tottube_shortcuts;
CREATE POLICY "Users can delete own shortcuts" ON public.tottube_shortcuts
    FOR DELETE USING (auth.uid() = user_id);

-- 4. Verify existing settings table (ensure it's not trying to store shortcuts in a column)
-- The tottube_settings table should remain simple, shortcuts are managed in the table above.
