
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE TABLE public.mother_api_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  mode text NOT NULL DEFAULT 'mock' CHECK (mode IN ('mock','live')),
  api_url text,
  auth_header text NOT NULL DEFAULT 'Authorization',
  auth_token text,
  enabled boolean NOT NULL DEFAULT false,
  notes text,
  updated_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.mother_api_settings TO authenticated;
GRANT ALL ON public.mother_api_settings TO service_role;

ALTER TABLE public.mother_api_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins view mother api settings"
ON public.mother_api_settings FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins insert mother api settings"
ON public.mother_api_settings FOR INSERT TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins update mother api settings"
ON public.mother_api_settings FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins delete mother api settings"
ON public.mother_api_settings FOR DELETE TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_mother_api_settings_updated_at
BEFORE UPDATE ON public.mother_api_settings
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.mother_api_settings (mode, enabled) VALUES ('mock', false);
