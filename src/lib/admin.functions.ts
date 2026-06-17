import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

async function assertAdmin(context: { supabase: ReturnType<typeof Object>; userId: string }) {
  // Use admin client to bypass RLS for the role check
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data } = await supabaseAdmin.from("user_roles").select("role").eq("user_id", context.userId).eq("role", "admin").maybeSingle();
  if (!data) throw new Error("Admin only");
}

export const adminListBusinesses = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context as never);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: businesses } = await supabaseAdmin
      .from("businesses").select("*").order("created_at", { ascending: false });
    const ownerIds = Array.from(new Set((businesses ?? []).map((b) => b.owner_id).filter(Boolean))) as string[];
    const [{ data: profiles }, authList] = await Promise.all([
      ownerIds.length
        ? supabaseAdmin.from("profiles").select("id, email, full_name").in("id", ownerIds)
        : Promise.resolve({ data: [] as { id: string; email: string | null; full_name: string | null }[] }),
      supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 200 }),
    ]);
    const profileMap = new Map((profiles ?? []).map((p) => [p.id, p]));
    const authMap = new Map((authList.data?.users ?? []).map((u) => [u.id, u]));
    return (businesses ?? []).map((b) => {
      const p = b.owner_id ? profileMap.get(b.owner_id) : null;
      const a = b.owner_id ? authMap.get(b.owner_id) : null;
      return {
        ...b,
        owner_email: p?.email ?? a?.email ?? null,
        owner_name: p?.full_name ?? null,
        owner_last_sign_in: a?.last_sign_in_at ?? null,
        owner_confirmed: a ? !!a.email_confirmed_at : null,
      };
    });
  });

export const adminUpdateBusiness = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({
    id: z.string().uuid(),
    status: z.enum(["active", "suspended", "limited"]).optional(),
    credits: z.number().int().min(0).max(1_000_000).optional(),
    plan: z.enum(["free", "basic", "pro"]).optional(),
  }).parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context as never);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const patch: { status?: "active"|"suspended"|"limited"; credits?: number; plan?: "free"|"basic"|"pro" } = {};
    if (data.status) patch.status = data.status;
    if (typeof data.credits === "number") patch.credits = data.credits;
    if (data.plan) patch.plan = data.plan;
    await supabaseAdmin.from("businesses").update(patch).eq("id", data.id);
    return { ok: true };
  });

export const adminApiLogs = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context as never);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data } = await supabaseAdmin.from("mother_api_logs").select("*, businesses(name)").order("created_at", { ascending: false }).limit(200);
    return data ?? [];
  });

export const adminFraudLogs = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context as never);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data } = await supabaseAdmin.from("fraud_logs").select("*, businesses(name)").order("created_at", { ascending: false }).limit(200);
    return data ?? [];
  });

export const adminStats = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context as never);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const [biz, txs, logs, fraud] = await Promise.all([
      supabaseAdmin.from("businesses").select("status"),
      supabaseAdmin.from("transactions").select("result"),
      supabaseAdmin.from("mother_api_logs").select("allowed"),
      supabaseAdmin.from("fraud_logs").select("id"),
    ]);
    return {
      businesses: biz.data?.length ?? 0,
      active: biz.data?.filter((b) => b.status === "active").length ?? 0,
      suspended: biz.data?.filter((b) => b.status === "suspended").length ?? 0,
      transactions: txs.data?.length ?? 0,
      success: txs.data?.filter((t) => t.result === "success").length ?? 0,
      apiCalls: logs.data?.length ?? 0,
      blockedCalls: logs.data?.filter((l) => !l.allowed).length ?? 0,
      fraud: fraud.data?.length ?? 0,
    };
  });
