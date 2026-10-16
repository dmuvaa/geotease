-- GeoTease content and results.
-- The running game serves published challenges from the server catalog
-- in lib/challenges. These tables are the matching store for Supabase,
-- and game_results / analytics_events are written when the service role
-- environment variables are set.

create table if not exists locations (
  id text primary key,
  name text not null,
  country text not null,
  country_code text not null,
  region text not null,
  latitude double precision not null,
  longitude double precision not null,
  type text not null,
  difficulty text not null,
  description text not null,
  source_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint locations_latitude_check check (latitude between -90 and 90),
  constraint locations_longitude_check check (longitude between -180 and 180)
);

create table if not exists challenges (
  id text primary key,
  mode text not null,
  location_id text not null references locations (id),
  title text not null,
  difficulty text not null,
  status text not null default 'draft',
  target_kind text not null default 'exact',
  tolerance_km double precision not null default 0,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  constraint challenges_mode_check check (mode in ('where_is_it', 'find_it', 'where_did_this_happen')),
  constraint challenges_status_check check (status in ('draft', 'published')),
  constraint challenges_target_check check (target_kind in ('exact', 'approximate'))
);

create table if not exists clues (
  id bigint generated always as identity primary key,
  challenge_id text not null references challenges (id) on delete cascade,
  sequence integer not null,
  text text not null,
  clue_type text not null,
  created_at timestamptz not null default now(),
  unique (challenge_id, sequence)
);

create table if not exists historical_events (
  id text primary key,
  title text not null,
  description text not null,
  year integer not null,
  location_id text not null references locations (id),
  category text not null,
  source_url text,
  challenge_id text references challenges (id),
  created_at timestamptz not null default now()
);

create table if not exists game_results (
  id text primary key,
  session_id text not null,
  display_name text not null,
  mode text not null,
  challenge_id text not null,
  score integer not null,
  distance_km double precision not null,
  clues_used integer not null,
  difficulty text not null,
  daily boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists game_results_created_at_idx on game_results (created_at desc);
create index if not exists game_results_session_idx on game_results (session_id, created_at desc);

create table if not exists analytics_events (
  id bigint generated always as identity primary key,
  event text not null,
  session_id text,
  properties jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists analytics_events_created_at_idx on analytics_events (created_at desc);

alter table locations enable row level security;
alter table challenges enable row level security;
alter table clues enable row level security;
alter table historical_events enable row level security;
alter table game_results enable row level security;
alter table analytics_events enable row level security;
