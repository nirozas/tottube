-- ==============================================================================
-- MIGRATION SCRIPT: From Simple Schema to Multi-Parent (Per-User) Schema
-- ==============================================================================

-- WARNING: The previous schema used a hardcoded integer (id=1) for settings 
-- and channelId as the primary key. Since we are moving to a secure UUID 
-- foreign-key mapping tied to Supabase 'auth.users', the cleanest migration 
-- path for a development environment is to drop the old structure and recreate it.

-- 1. DROP EXISTING TABLES AND POLICIES
DROP TABLE IF EXISTS public.tottube_channels CASCADE;
DROP TABLE IF EXISTS public.tottube_settings CASCADE;
DROP TABLE IF EXISTS public.tottube_shortcuts CASCADE;

-- 2. RECREATE SETTINGS TABLE
CREATE TABLE public.tottube_settings (
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT,
    "dailyLimitMinutes" INTEGER NOT NULL DEFAULT 60,
    "adminPin" TEXT NOT NULL DEFAULT '1234',
    "isSetup" BOOLEAN NOT NULL DEFAULT false,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    PRIMARY KEY (user_id)
);

ALTER TABLE public.tottube_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own settings" ON public.tottube_settings FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own settings" ON public.tottube_settings FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own settings" ON public.tottube_settings FOR UPDATE USING (auth.uid() = user_id);

-- 3. RECREATE CHANNELS TABLE
CREATE TABLE public.tottube_channels (
    id UUID DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    "channelId" TEXT NOT NULL,
    name TEXT NOT NULL,
    handle TEXT,
    "avatarUrl" TEXT,
    "subscriberCount" TEXT,
    "addedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    PRIMARY KEY (id),
    UNIQUE (user_id, "channelId")
);

ALTER TABLE public.tottube_channels ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own channels" ON public.tottube_channels FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own channels" ON public.tottube_channels FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own channels" ON public.tottube_channels FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own channels" ON public.tottube_channels FOR DELETE USING (auth.uid() = user_id);

-- 4. CREATE SHORTCUTS TABLE
CREATE TABLE public.tottube_shortcuts (
    id UUID DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    keyword TEXT NOT NULL,
    "imageUrl" TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    PRIMARY KEY (id)
);

ALTER TABLE public.tottube_shortcuts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own shortcuts" ON public.tottube_shortcuts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own shortcuts" ON public.tottube_shortcuts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own shortcuts" ON public.tottube_shortcuts FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own shortcuts" ON public.tottube_shortcuts FOR DELETE USING (auth.uid() = user_id);

-- 5. CREATE AUTH TRIGGER
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.tottube_settings (user_id, email, "isSetup")
  VALUES (new.id, new.email, false);
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Check if trigger exists before creating it
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
