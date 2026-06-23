
-- 1. business_members: add WITH CHECK on UPDATE to prevent role escalation
DROP POLICY IF EXISTS "members updatable by owner or admin" ON public.business_members;
CREATE POLICY "members updatable by owner or admin"
ON public.business_members
FOR UPDATE
TO authenticated
USING (
  public.is_business_role(auth.uid(), business_id, 'owner'::app_role)
  OR public.has_role(auth.uid(), 'admin'::app_role)
)
WITH CHECK (
  public.has_role(auth.uid(), 'admin'::app_role)
  OR (
    public.is_business_role(auth.uid(), business_id, 'owner'::app_role)
    AND role <> 'owner'::app_role
    AND user_id <> auth.uid()
  )
);

-- 2. businesses: restrict update policies to {authenticated}
DROP POLICY IF EXISTS "businesses updatable by admin" ON public.businesses;
CREATE POLICY "businesses updatable by admin"
ON public.businesses
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "businesses updatable by owner (safe fields)" ON public.businesses;
CREATE POLICY "businesses updatable by owner (safe fields)"
ON public.businesses
FOR UPDATE
TO authenticated
USING (public.is_business_role(auth.uid(), id, 'owner'::app_role))
WITH CHECK (
  public.is_business_role(auth.uid(), id, 'owner'::app_role)
  AND credits = (SELECT b.credits FROM public.businesses b WHERE b.id = businesses.id)
  AND plan = (SELECT b.plan FROM public.businesses b WHERE b.id = businesses.id)
  AND rate_limit_per_min = (SELECT b.rate_limit_per_min FROM public.businesses b WHERE b.id = businesses.id)
  AND status = (SELECT b.status FROM public.businesses b WHERE b.id = businesses.id)
  AND owner_id = (SELECT b.owner_id FROM public.businesses b WHERE b.id = businesses.id)
);

-- 3. fraud_logs: restrict SELECT policy to {authenticated}
DROP POLICY IF EXISTS "fraud logs admin or owner" ON public.fraud_logs;
CREATE POLICY "fraud logs admin or owner"
ON public.fraud_logs
FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin'::app_role)
  OR (business_id IS NOT NULL AND public.is_business_role(auth.uid(), business_id, 'owner'::app_role))
);
