-- One-time setup that lives outside Prisma's schema (auth trigger + storage),
-- since Prisma only manages the public schema tables.

-- 1. Auto-create a profiles row whenever someone signs up via Supabase Auth.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, name, role)
  values (new.id, new.email, new.raw_user_meta_data->>'name', 'MEMBER');
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 2. Private storage bucket for invoice/receipt attachments.
insert into storage.buckets (id, name, public)
values ('attachments', 'attachments', false)
on conflict (id) do nothing;

-- 3. Let any authenticated user upload/read/delete within that bucket.
drop policy if exists "Authenticated users can upload attachments" on storage.objects;
create policy "Authenticated users can upload attachments"
on storage.objects for insert
to authenticated
with check (bucket_id = 'attachments');

drop policy if exists "Authenticated users can read attachments" on storage.objects;
create policy "Authenticated users can read attachments"
on storage.objects for select
to authenticated
using (bucket_id = 'attachments');

drop policy if exists "Authenticated users can delete attachments" on storage.objects;
create policy "Authenticated users can delete attachments"
on storage.objects for delete
to authenticated
using (bucket_id = 'attachments');
