-- Movie Night Picker — Supabase Schema
-- Run this in the Supabase SQL editor: https://app.supabase.com → SQL Editor

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ============================================================
-- TABLES
-- ============================================================

create table rooms (
  id               uuid primary key default uuid_generate_v4(),
  code             text unique not null,
  status           text not null default 'waiting'
                     check (status in ('waiting', 'active', 'finished')),
  majority_threshold int not null default 1,
  created_at       timestamptz not null default now()
);

create table room_members (
  id        uuid primary key default uuid_generate_v4(),
  room_id   uuid not null references rooms(id) on delete cascade,
  nickname  text not null,
  joined_at timestamptz not null default now()
);

create table room_movies (
  id            uuid primary key default uuid_generate_v4(),
  room_id       uuid not null references rooms(id) on delete cascade,
  tmdb_id       int not null,
  title         text not null,
  poster_url    text not null,
  overview      text not null default '',
  genres        text[] not null default '{}',
  vote_average  float not null default 0,
  display_order int not null
);

create table votes (
  id         uuid primary key default uuid_generate_v4(),
  room_id    uuid not null references rooms(id) on delete cascade,
  movie_id   uuid not null references room_movies(id) on delete cascade,
  member_id  uuid not null references room_members(id) on delete cascade,
  liked      boolean not null,
  voted_at   timestamptz not null default now(),
  unique (movie_id, member_id)
);

create table matches (
  id         uuid primary key default uuid_generate_v4(),
  room_id    uuid not null references rooms(id) on delete cascade,
  movie_id   uuid not null references room_movies(id) on delete cascade,
  matched_at timestamptz not null default now()
);

-- ============================================================
-- ROW LEVEL SECURITY
-- Permissive anon access for MVP — tighten for production
-- ============================================================

alter table rooms        enable row level security;
alter table room_members enable row level security;
alter table room_movies  enable row level security;
alter table votes        enable row level security;
alter table matches      enable row level security;

create policy "anon full access" on rooms        for all to anon using (true) with check (true);
create policy "anon full access" on room_members for all to anon using (true) with check (true);
create policy "anon full access" on room_movies  for all to anon using (true) with check (true);
create policy "anon full access" on votes        for all to anon using (true) with check (true);
create policy "anon full access" on matches      for all to anon using (true) with check (true);

-- ============================================================
-- REALTIME
-- Enable realtime broadcasts for the tables that need it
-- ============================================================

alter publication supabase_realtime add table rooms;
alter publication supabase_realtime add table room_members;
alter publication supabase_realtime add table votes;
alter publication supabase_realtime add table matches;
