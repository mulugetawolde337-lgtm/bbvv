
-- Enums
create type public.app_role as enum ('admin','owner','manager','cashier');
create type public.business_status as enum ('active','suspended','limited');
create type public.tx_result as enum ('success','failed','duplicate','blocked');
create type public.plan_tier as enum ('free','basic','pro');

-- Profiles
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  full_name text,
  created_at timestamptz not null default now()
);
grant select, insert, update on public.profiles to authenticated;
grant all on public.profiles to service_role;
alter table public.profiles enable row level security;
create policy "profiles self select" on public.profiles for select to authenticated using (auth.uid() = id);
create policy "profiles self update" on public.profiles for update to authenticated using (auth.uid() = id);

-- Businesses
create table public.businesses (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  owner_id uuid references auth.users(id) on delete set null,
  status business_status not null default 'active',
  plan plan_tier not null default 'free',
  credits integer not null default 20,
  rate_limit_per_min integer not null default 60,
  created_at timestamptz not null default now()
);
grant select, insert, update, delete on public.businesses to authenticated;
grant all on public.businesses to service_role;
alter table public.businesses enable row level security;

-- User roles (global, for super-admin)
create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role app_role not null,
  unique(user_id, role)
);
grant select on public.user_roles to authenticated;
grant all on public.user_roles to service_role;
alter table public.user_roles enable row level security;
create policy "see own roles" on public.user_roles for select to authenticated using (user_id = auth.uid());

create or replace function public.has_role(_user_id uuid, _role app_role)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles where user_id=_user_id and role=_role);
$$;

-- Business members
create table public.business_members (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role app_role not null check (role in ('owner','manager','cashier')),
  created_at timestamptz not null default now(),
  unique(business_id, user_id)
);
grant select, insert, update, delete on public.business_members to authenticated;
grant all on public.business_members to service_role;
alter table public.business_members enable row level security;

create or replace function public.is_business_member(_user_id uuid, _business_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.business_members where user_id=_user_id and business_id=_business_id);
$$;

create or replace function public.is_business_role(_user_id uuid, _business_id uuid, _role app_role)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.business_members where user_id=_user_id and business_id=_business_id and role=_role);
$$;

-- Policies for businesses
create policy "businesses visible to members and admins" on public.businesses for select to authenticated
  using (public.is_business_member(auth.uid(), id) or public.has_role(auth.uid(), 'admin'));
create policy "businesses insertable by any auth user" on public.businesses for insert to authenticated
  with check (owner_id = auth.uid());
create policy "businesses updatable by owner or admin" on public.businesses for update to authenticated
  using (public.is_business_role(auth.uid(), id, 'owner') or public.has_role(auth.uid(), 'admin'));
create policy "businesses deletable by admin" on public.businesses for delete to authenticated
  using (public.has_role(auth.uid(), 'admin'));

-- Policies for business_members
create policy "members visible to business members and admins" on public.business_members for select to authenticated
  using (public.is_business_member(auth.uid(), business_id) or public.has_role(auth.uid(), 'admin'));
create policy "members insertable by owner or admin" on public.business_members for insert to authenticated
  with check (public.is_business_role(auth.uid(), business_id, 'owner') or public.has_role(auth.uid(), 'admin'));
create policy "members updatable by owner or admin" on public.business_members for update to authenticated
  using (public.is_business_role(auth.uid(), business_id, 'owner') or public.has_role(auth.uid(), 'admin'));
create policy "members deletable by owner or admin" on public.business_members for delete to authenticated
  using (public.is_business_role(auth.uid(), business_id, 'owner') or public.has_role(auth.uid(), 'admin'));

-- Transactions
create table public.transactions (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  performed_by uuid references auth.users(id) on delete set null,
  qr_payload text,
  recipient text,
  tx_reference text,
  amount numeric(14,2),
  result tx_result not null,
  message text,
  created_at timestamptz not null default now()
);
create index transactions_business_idx on public.transactions(business_id, created_at desc);
create unique index transactions_unique_success
  on public.transactions(business_id, tx_reference)
  where result = 'success' and tx_reference is not null;

grant select on public.transactions to authenticated;
grant all on public.transactions to service_role;
alter table public.transactions enable row level security;
create policy "transactions visible to members and admins" on public.transactions for select to authenticated
  using (public.is_business_member(auth.uid(), business_id) or public.has_role(auth.uid(), 'admin'));

-- Mother API logs
create table public.mother_api_logs (
  id uuid primary key default gen_random_uuid(),
  business_id uuid references public.businesses(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null,
  endpoint text,
  allowed boolean not null,
  reason text,
  created_at timestamptz not null default now()
);
grant select on public.mother_api_logs to authenticated;
grant all on public.mother_api_logs to service_role;
alter table public.mother_api_logs enable row level security;
create policy "api logs admin only" on public.mother_api_logs for select to authenticated
  using (public.has_role(auth.uid(), 'admin'));

-- Fraud logs
create table public.fraud_logs (
  id uuid primary key default gen_random_uuid(),
  business_id uuid references public.businesses(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null,
  kind text not null,
  details jsonb,
  created_at timestamptz not null default now()
);
grant select on public.fraud_logs to authenticated;
grant all on public.fraud_logs to service_role;
alter table public.fraud_logs enable row level security;
create policy "fraud logs admin or member" on public.fraud_logs for select to authenticated
  using (public.has_role(auth.uid(), 'admin') or (business_id is not null and public.is_business_member(auth.uid(), business_id)));

-- New user trigger: create profile, first user becomes admin
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare admin_count int;
begin
  insert into public.profiles(id, email, full_name)
    values (new.id, new.email, coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)));
  select count(*) into admin_count from public.user_roles where role = 'admin';
  if admin_count = 0 then
    insert into public.user_roles(user_id, role) values (new.id, 'admin');
  end if;
  return new;
end; $$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();
