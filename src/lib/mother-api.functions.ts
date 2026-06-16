import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

async function assertAdmin(userId: string) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data } = await supabaseAdmin.from("user_roles").select("role").eq("user_id", userId).eq("role", "admin").maybeSingle();
  if (!data) throw new Error("Admin only");
}



export const getMotherApiSettings = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data } = await supabaseAdmin
      .from("mother_api_settings")
      .select("*")
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle();
    return data;
  });

const updateSchema = z.object({
  mode: z.enum(["mock", "live"]),
  enabled: z.boolean(),
  api_url: z.string().trim().url().or(z.literal("")).nullable().optional(),
  auth_header: z.string().trim().min(1).max(64).default("Authorization"),
  auth_token: z.string().trim().max(2000).nullable().optional(),
  notes: z.string().trim().max(1000).nullable().optional(),
});

export const updateMotherApiSettings = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => updateSchema.parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: existing } = await supabaseAdmin
      .from("mother_api_settings").select("id").limit(1).maybeSingle();
    const payload = {
      mode: data.mode,
      enabled: data.enabled,
      api_url: data.api_url || null,
      auth_header: data.auth_header,
      auth_token: data.auth_token || null,
      notes: data.notes || null,
      updated_by: context.userId,
    };
    if (existing) {
      const { error } = await supabaseAdmin
        .from("mother_api_settings").update(payload).eq("id", existing.id);
      if (error) throw new Error(error.message);
    } else {
      const { error } = await supabaseAdmin
        .from("mother_api_settings").insert(payload);
      if (error) throw new Error(error.message);
    }
    return { ok: true };
  });

export const testMotherApi = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: s } = await supabaseAdmin
      .from("mother_api_settings").select("*").limit(1).maybeSingle();
    if (!s) return { ok: false, message: "No settings row" };
    if (s.mode === "mock") return { ok: true, message: "Mock mode active — no remote call needed." };
    if (!s.api_url) return { ok: false, message: "Live mode requires an API URL." };
    const started = Date.now();
    try {
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (s.auth_token) headers[s.auth_header] = s.auth_token;
      const res = await fetch(s.api_url, {
        method: "POST",
        headers,
        body: JSON.stringify({ ping: true, tx_reference: "BEU-PING", amount: 0 }),
        signal: AbortSignal.timeout(8000),
      });
      const text = await res.text();
      return {
        ok: res.ok,
        status: res.status,
        ms: Date.now() - started,
        message: res.ok ? "Endpoint reachable." : `HTTP ${res.status}`,
        body: text.slice(0, 400),
      };
    } catch (e) {
      return { ok: false, message: e instanceof Error ? e.message : "Unreachable" };
    }
  });
