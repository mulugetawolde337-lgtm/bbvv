
-- Auto-create a business for every new signup (and on the existing trigger)
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  admin_count int;
  new_biz_id uuid;
  display_name text;
begin
  display_name := coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1));

  insert into public.profiles(id, email, full_name)
    values (new.id, new.email, display_name)
    on conflict (id) do nothing;

  select count(*) into admin_count from public.user_roles where role = 'admin';
  if admin_count = 0 then
    insert into public.user_roles(user_id, role) values (new.id, 'admin')
      on conflict do nothing;
  end if;

  -- Create a default business for this user if they don't already own one
  if not exists (select 1 from public.businesses where owner_id = new.id) then
    insert into public.businesses(name, owner_id)
      values (display_name || '''s Business', new.id)
      returning id into new_biz_id;

    insert into public.business_members(business_id, user_id, role)
      values (new_biz_id, new.id, 'owner')
      on conflict do nothing;
  end if;

  return new;
end;
$$;

-- Make sure the trigger is attached
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Backfill: create a business for every existing auth user that doesn't have one
do $$
declare u record; new_biz_id uuid; display_name text;
begin
  for u in
    select au.id, au.email, au.raw_user_meta_data
    from auth.users au
    where not exists (select 1 from public.businesses b where b.owner_id = au.id)
  loop
    display_name := coalesce(u.raw_user_meta_data->>'full_name', split_part(u.email, '@', 1));

    insert into public.profiles(id, email, full_name)
      values (u.id, u.email, display_name)
      on conflict (id) do nothing;

    insert into public.businesses(name, owner_id)
      values (display_name || '''s Business', u.id)
      returning id into new_biz_id;

    insert into public.business_members(business_id, user_id, role)
      values (new_biz_id, u.id, 'owner')
      on conflict do nothing;
  end loop;
end $$;
