-- menu_state table
create table if not exists public.menu_state (
  id text primary key,
  payload jsonb not null,
  updated_at timestamptz default now()
);

-- seed empty record so anon read always returns a row
insert into public.menu_state (id, payload, updated_at)
values ('main', '{}'::jsonb, now())
on conflict (id) do nothing;

alter table public.menu_state enable row level security;

-- drop old permissive policies if they exist
drop policy if exists menu_state_read on public.menu_state;
drop policy if exists menu_state_insert on public.menu_state;
drop policy if exists menu_state_update on public.menu_state;
drop policy if exists menu_state_delete on public.menu_state;
drop policy if exists "Public can read menu" on public.menu_state;
drop policy if exists "Authenticated admin can insert menu" on public.menu_state;
drop policy if exists "Authenticated admin can update menu" on public.menu_state;
drop policy if exists "Authenticated admin can delete menu" on public.menu_state;

-- anon + authenticated can read
create policy "select_menu_state"
  on public.menu_state for select
  to anon, authenticated
  using (true);

-- only authenticated (admin signed-in via Supabase Auth) can write
create policy "insert_menu_state"
  on public.menu_state for insert
  to authenticated
  with check (true);

create policy "update_menu_state"
  on public.menu_state for update
  to authenticated
  using (true)
  with check (true);

create policy "delete_menu_state"
  on public.menu_state for delete
  to authenticated
  using (true);

-- schema grants
grant usage on schema public to anon, authenticated;
grant select on public.menu_state to anon;
grant select, insert, update, delete on public.menu_state to authenticated;

-- Storage bucket for menu images
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'menu-images',
  'menu-images',
  true,
  5242880,
  array['image/jpeg','image/png','image/webp','image/gif','image/avif']
)
on conflict (id) do nothing;

drop policy if exists "Public read menu images" on storage.objects;
drop policy if exists "Authenticated upload menu images" on storage.objects;
drop policy if exists "Authenticated update menu images" on storage.objects;
drop policy if exists "Authenticated delete menu images" on storage.objects;

create policy "Public read menu images"
  on storage.objects for select
  to anon, authenticated
  using (bucket_id = 'menu-images');

create policy "Authenticated upload menu images"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'menu-images');

create policy "Authenticated update menu images"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'menu-images');

create policy "Authenticated delete menu images"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'menu-images');
