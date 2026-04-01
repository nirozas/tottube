-- Migration: Create Movie Vault Table
-- This table allows parents to save custom URLs (YouTube, Vimeo, or Direct MP4) 
-- into a curated collection for their kids.

create table if not exists tottube_movies (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade default auth.uid(),
  title text not null,
  "thumbnailUrl" text,
  "videoUrl" text not null,
  "addedAt" timestamp with time zone default now(),
  duration text,
  
  -- Prevent duplicate URLs for the same user
  constraint unique_movie_per_user unique (user_id, "videoUrl")
);

-- Enable Row Level Security
alter table tottube_movies enable row level security;

-- Policy: Users can view, insert, update and delete only their own movies
create policy "Users can view their own movies" on tottube_movies for select using (auth.uid() = user_id);
create policy "Users can insert their own movies" on tottube_movies for insert with check (auth.uid() = user_id);
create policy "Users can delete their own movies" on tottube_movies for delete using (auth.uid() = user_id);
create policy "Users can update their own movies" on tottube_movies for update using (auth.uid() = user_id);

-- Performance Index
create index if not exists idx_movies_user_id on tottube_movies(user_id);
