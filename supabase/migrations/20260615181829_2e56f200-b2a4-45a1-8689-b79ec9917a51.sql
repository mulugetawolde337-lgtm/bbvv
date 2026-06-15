
revoke execute on function public.has_role(uuid, public.app_role) from authenticated;
revoke execute on function public.is_business_member(uuid, uuid) from authenticated;
revoke execute on function public.is_business_role(uuid, uuid, public.app_role) from authenticated;
