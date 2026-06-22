create table if not exists venues (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique not null,
  logo text not null,
  hero_image text not null,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists categories (
  id uuid primary key default gen_random_uuid(),
  venue_id uuid not null references venues(id),
  name jsonb not null,
  sort_order int not null default 0,
  active boolean not null default true
);

create table if not exists products (
  id uuid primary key default gen_random_uuid(),
  venue_id uuid not null references venues(id),
  category_id uuid not null references categories(id),
  name jsonb not null,
  description jsonb not null,
  price numeric(10,2) not null,
  image text not null,
  badges text[] not null default '{}',
  active boolean not null default true
);
