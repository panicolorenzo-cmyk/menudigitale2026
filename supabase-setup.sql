create table if not exists public.menu_state (
id text primary key,
payload jsonb not null,
updated_at timestamptz default now()
);

alter table public.menu_state disable row level security;

insert into public.menu_state (id, payload, updated_at)
values ('main', '{}'::jsonb, now())
on conflict (id) do nothing;
