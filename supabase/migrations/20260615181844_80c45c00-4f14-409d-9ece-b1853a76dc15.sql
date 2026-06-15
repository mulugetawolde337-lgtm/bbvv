
grant execute on function public.has_role(uuid, public.app_role) to authenticated;
grant execute on function public.is_business_member(uuid, uuid) to authenticated;
grant execute on function public.is_business_role(uuid, uuid, public.app_role) to authenticated;
