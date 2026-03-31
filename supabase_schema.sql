-- Supabase Per-User Schema for TotTube App

-- Note: The "users" themselves (email/password) are handled automatically by Supabase Auth mechanism via the `auth.users` table.

-- ==============================================================================
-- 1. SETTINGS / APP INFO TABLE
-- Stores parent email, PIN, daily limits, and setup status tied to their user_id.
-- ==============================================================================

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

-- Allow authenticated users to view and update only their own settings
CREATE POLICY "Users can view own settings" ON public.tottube_settings
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own settings" ON public.tottube_settings
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own settings" ON public.tottube_settings
    FOR UPDATE USING (auth.uid() = user_id);


-- ==============================================================================
-- 2. CHANNELS TABLE
-- Stores the approved YouTube channels mapped to a specific parent (user_id).
-- ==============================================================================

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
    UNIQUE (user_id, "channelId") -- Prevents a user from adding the same channel twice
);

ALTER TABLE public.tottube_channels ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own channels" ON public.tottube_channels
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own channels" ON public.tottube_channels
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own channels" ON public.tottube_channels
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own channels" ON public.tottube_channels
    FOR DELETE USING (auth.uid() = user_id);


-- ==============================================================================
-- 3. SHORTCUTS TABLE
-- Stores the visual search image shortcuts created by the parent.
-- ==============================================================================

CREATE TABLE public.tottube_shortcuts (
    id UUID DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    keyword TEXT NOT NULL,
    "imageUrl" TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    PRIMARY KEY (id)
);

ALTER TABLE public.tottube_shortcuts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own shortcuts" ON public.tottube_shortcuts
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own shortcuts" ON public.tottube_shortcuts
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own shortcuts" ON public.tottube_shortcuts
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own shortcuts" ON public.tottube_shortcuts
    FOR DELETE USING (auth.uid() = user_id);

-- ==============================================================================
-- 4. TRIGGER FOR NEW USERS (Optional Helper)
-- Automatically creates a default settings row when a parent signs up via Supabase Auth
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.tottube_settings (user_id, email, "isSetup")
  VALUES (new.id, new.email, false);
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
