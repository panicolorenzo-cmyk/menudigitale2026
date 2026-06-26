create table if not exists public.menu_state (
id text primary key,
payload jsonb not null,
updated_at timestamptz default now()
);

insert into public.menu_state (id, payload, updated_at)
values ('main', '{}'::jsonb, now())
on conflict (id) do nothing;

alter table public.menu_state enable row level security;

grant usage on schema public to anon, authenticated;
grant select, insert, update on public.menu_state to anon, authenticated;

drop policy if exists menu_state_read on public.menu_state;
drop policy if exists menu_state_insert on public.menu_state;
drop policy if exists menu_state_update on public.menu_state;

create policy menu_state_read
on public.menu_state
for select
to anon, authenticated
using (id = 'main');

create policy menu_state_insert
on public.menu_state
for insert
to anon, authenticated
with check (id = 'main');

create policy menu_state_update
on public.menu_state
for update
to anon, authenticated
using (id = 'main')
with check (id = 'main');
