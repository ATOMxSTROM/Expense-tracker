# Setup

One-time steps to connect this app to your Supabase project. Run the SQL snippets in **Supabase Dashboard → SQL Editor**.

## 1. Environment variables

Copy `.env.example` to `.env` and fill in the 4 values from your Supabase project (Settings → API, Settings → Database). See `.env.example` for exactly where each one lives.

## 2. Auto-create a profile row on signup

Our app stores roles in `public.profiles`, separate from Supabase's own `auth.users`. This trigger keeps them in sync — every time someone signs up, a matching profile row is created with the default role `MEMBER`.

```sql
create function public.handle_new_user()
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

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
```

Run this **after** `npm run db:migrate` (the `profiles` table must exist first).

## 3. Storage bucket for invoice attachments

In **Storage**, create a new bucket named `attachments` (keep it **private**, not public — financial documents shouldn't be world-readable).

Then add policies so logged-in users can upload/view files in it:

```sql
create policy "Authenticated users can upload attachments"
on storage.objects for insert
to authenticated
with check (bucket_id = 'attachments');

create policy "Authenticated users can read attachments"
on storage.objects for select
to authenticated
using (bucket_id = 'attachments');

create policy "Authenticated users can delete attachments"
on storage.objects for delete
to authenticated
using (bucket_id = 'attachments');
```

## 4. Email confirmation (optional, for faster testing)

By default Supabase requires email confirmation before a new signup gets a session. For an internal team tool this is an unnecessary step. To skip it: **Authentication → Sign In / Providers → Email → turn off "Confirm email"**. (Leave it on if you'd rather keep that verification step.)

## 5. Run migrations + seed default categories

```
npm run db:migrate -- --name init
npm run db:seed
```

## 6. Create your account and promote yourself to Owner

1. `npm run dev`, go to `/signup`, create your own account. You'll land as role `MEMBER` (set by the trigger in step 2).
2. In Supabase SQL Editor, promote yourself:

```sql
update public.profiles set role = 'OWNER' where email = 'your-email@example.com';
```

3. Refresh the app — you should now see the full dashboard and be able to manage everything.

After that, anyone else who signs up stays `MEMBER` until an Owner/Admin promotes them the same way (no UI for role management yet — Phase 1 doesn't include a team-management screen).
