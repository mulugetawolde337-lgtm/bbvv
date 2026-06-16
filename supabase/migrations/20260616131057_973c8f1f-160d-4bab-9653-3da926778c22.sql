
-- Explicit deny policies (defense in depth) — service_role bypasses RLS
create policy "no client writes" on public.transactions for insert to authenticated with check (false);
create policy "no client updates" on public.transactions for update to authenticated using (false);
create policy "no client deletes" on public.transactions for delete to authenticated using (false);

create policy "no client writes" on public.user_roles for insert to authenticated with check (false);
create policy "no client updates" on public.user_roles for update to authenticated using (false);
create policy "no client deletes" on public.user_roles for delete to authenticated using (false);

create policy "no client writes" on public.fraud_logs for insert to authenticated with check (false);
create policy "no client updates" on public.fraud_logs for update to authenticated using (false);
create policy "no client deletes" on public.fraud_logs for delete to authenticated using (false);

create policy "no client writes" on public.mother_api_logs for insert to authenticated with check (false);
create policy "no client updates" on public.mother_api_logs for update to authenticated using (false);
create policy "no client deletes" on public.mother_api_logs for delete to authenticated using (false);

-- Revoke direct EXECUTE on has_role from clients; it's invoked from RLS policies (security definer), which doesn't require grant.
revoke execute on function public.has_role(uuid, app_role) from anon, authenticated, public;
