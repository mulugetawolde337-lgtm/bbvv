
-- 1) Restrict UPDATE on businesses: owners can edit non-billing fields; admins can edit anything
DROP POLICY IF EXISTS "businesses updatable by owner or admin" ON public.businesses;

CREATE POLICY "businesses updatable by admin"
ON public.businesses FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "businesses updatable by owner (safe fields)"
ON public.businesses FOR UPDATE
USING (public.is_business_role(auth.uid(), id, 'owner'::app_role))
WITH CHECK (
  public.is_business_role(auth.uid(), id, 'owner'::app_role)
  AND credits             = (SELECT b.credits             FROM public.businesses b WHERE b.id = businesses.id)
  AND plan                = (SELECT b.plan                FROM public.businesses b WHERE b.id = businesses.id)
  AND rate_limit_per_min  = (SELECT b.rate_limit_per_min  FROM public.businesses b WHERE b.id = businesses.id)
  AND status              = (SELECT b.status              FROM public.businesses b WHERE b.id = businesses.id)
  AND owner_id            = (SELECT b.owner_id            FROM public.businesses b WHERE b.id = businesses.id)
);

-- 2) Restrict fraud_logs SELECT to owners + admins (not all members)
DROP POLICY IF EXISTS "fraud logs admin or member" ON public.fraud_logs;

CREATE POLICY "fraud logs admin or owner"
ON public.fraud_logs FOR SELECT
USING (
  public.has_role(auth.uid(), 'admin'::app_role)
  OR (business_id IS NOT NULL AND public.is_business_role(auth.uid(), business_id, 'owner'::app_role))
);

-- 3) Revoke direct EXECUTE on SECURITY DEFINER helpers from API roles.
--    RLS policies still evaluate them (policy execution is not gated by EXECUTE
--    privilege at the API role), but they can no longer be called as RPCs.
REVOKE EXECUTE ON FUNCTION public.is_business_member(uuid, uuid) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.is_business_role(uuid, uuid, app_role) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM PUBLIC, anon, authenticated;
