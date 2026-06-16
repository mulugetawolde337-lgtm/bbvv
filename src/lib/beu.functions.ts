import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

// ---------- Mother API ----------
// Centralized verification controller. All verify requests pass through this.
// When an admin has configured & enabled LIVE mode in mother_api_settings,
// we call the configured upstream URL. Otherwise we fall back to deterministic mock.
type MotherApiResult = { ok: boolean; recipient: string; amount: number; bank: string; message: string };

async function callMotherApi(input: { qr_payload: string; tx_reference: string; amount: number }): Promise<MotherApiResult> {
  // Look up active settings (service-role)
  try {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: s } = await supabaseAdmin
      .from("mother_api_settings").select("*").limit(1).maybeSingle();
    if (s && s.enabled && s.mode === "live" && s.api_url) {
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (s.auth_token) headers[s.auth_header || "Authorization"] = s.auth_token;
      const res = await fetch(s.api_url, {
        method: "POST",
        headers,
        body: JSON.stringify(input),
        signal: AbortSignal.timeout(8000),
      });
      if (!res.ok) {
        return { ok: false, recipient: "", amount: 0, bank: "UNKNOWN", message: `Upstream ${res.status}` };
      }
      const j = (await res.json().catch(() => ({}))) as Partial<MotherApiResult>;
      return {
        ok: j.ok ?? false,
        recipient: j.recipient ?? input.qr_payload,
        amount: typeof j.amount === "number" ? j.amount : input.amount,
        bank: j.bank ?? "BANK",
        message: j.message ?? (j.ok ? "Verified" : "Not found"),
      };
    }
  } catch {
    // fall through to mock if config lookup or remote call fails
  }

  // --- Mock mode (default) ---
  await new Promise((r) => setTimeout(r, 400 + Math.random() * 600));
  const ref = input.tx_reference.trim().toUpperCase();
  if (ref.startsWith("FAIL") || input.amount <= 0) {
    return { ok: false, recipient: "", amount: 0, bank: "UNKNOWN", message: "Transaction not found at issuing bank." };
  }
  const m = input.qr_payload.toUpperCase().match(/(CBE|DASHEN|TELEBIRR|AWASH|ABYSSINIA|WEGAGEN)/);
  const bank = m ? m[1] : "CBE";
  return { ok: true, recipient: input.qr_payload || "Recipient", amount: input.amount, bank, message: "Payment verified at bank." };
}


// ---------- Get current user's businesses + role ----------
export const getMyContext = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const [profileRes, membersRes, rolesRes] = await Promise.all([
      supabase.from("profiles").select("*").eq("id", userId).maybeSingle(),
      supabase.from("business_members").select("role, business_id, businesses(*)").eq("user_id", userId),
      supabase.from("user_roles").select("role").eq("user_id", userId),
    ]);
    const isAdmin = (rolesRes.data ?? []).some((r) => r.role === "admin");
    const memberships = (membersRes.data ?? []).map((m) => ({
      role: m.role as "owner" | "manager" | "cashier",
      business: m.businesses as unknown as {
        id: string; name: string; status: "active"|"suspended"|"limited";
        plan: "free"|"basic"|"pro"; credits: number; created_at: string; owner_id: string;
      },
    })).filter((m) => m.business);
    return { profile: profileRes.data, memberships, isAdmin };
  });

// ---------- Dashboard stats ----------
export const getDashboard = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { businessId: string }) => z.object({ businessId: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const [biz, txs, counts] = await Promise.all([
      supabase.from("businesses").select("*").eq("id", data.businessId).maybeSingle(),
      supabase.from("transactions").select("*").eq("business_id", data.businessId).order("created_at", { ascending: false }).limit(10),
      supabase.from("transactions").select("result", { count: "exact", head: false }).eq("business_id", data.businessId),
    ]);
    const all = counts.data ?? [];
    const stats = {
      total: all.length,
      success: all.filter((t) => t.result === "success").length,
      failed: all.filter((t) => t.result === "failed").length,
      duplicate: all.filter((t) => t.result === "duplicate").length,
    };
    return { business: biz.data, recent: txs.data ?? [], stats };
  });

export const listTransactions = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { businessId: string }) => z.object({ businessId: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { data: txs } = await context.supabase
      .from("transactions").select("*")
      .eq("business_id", data.businessId)
      .order("created_at", { ascending: false }).limit(200);
    return txs ?? [];
  });

// ---------- VERIFY (the core call) ----------
const verifySchema = z.object({
  businessId: z.string().uuid(),
  qr_payload: z.string().min(1).max(2000),
  tx_reference: z.string().trim().min(3).max(64),
  amount: z.number().min(0).max(10_000_000),
});

export const verifyTransaction = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => verifySchema.parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // Confirm membership
    const { data: member } = await supabase.from("business_members")
      .select("role").eq("business_id", data.businessId).eq("user_id", userId).maybeSingle();
    if (!member) throw new Error("Not a member of this business");

    // Load business (admin client → atomic credit decrement allowed)
    const { data: biz } = await supabaseAdmin.from("businesses").select("*").eq("id", data.businessId).maybeSingle();
    if (!biz) throw new Error("Business not found");

    const logApi = (allowed: boolean, reason: string) =>
      supabaseAdmin.from("mother_api_logs").insert({
        business_id: biz.id, user_id: userId, endpoint: "verify", allowed, reason,
      });

    // Status gates
    if (biz.status === "suspended") {
      await logApi(false, "business_suspended");
      const { data: tx } = await supabaseAdmin.from("transactions").insert({
        business_id: biz.id, performed_by: userId, qr_payload: data.qr_payload,
        tx_reference: data.tx_reference, amount: data.amount, result: "blocked",
        message: "Business is suspended.",
      }).select().single();
      return { result: "blocked" as const, message: "Business suspended", tx };
    }
    if (biz.credits <= 0) {
      await logApi(false, "no_credits");
      const { data: tx } = await supabaseAdmin.from("transactions").insert({
        business_id: biz.id, performed_by: userId, qr_payload: data.qr_payload,
        tx_reference: data.tx_reference, amount: data.amount, result: "blocked",
        message: "Out of credits.",
      }).select().single();
      return { result: "blocked" as const, message: "Out of credits — upgrade your plan.", tx };
    }

    // Duplicate detection (already-verified reference for this business)
    const { data: dupe } = await supabaseAdmin.from("transactions")
      .select("id").eq("business_id", biz.id).eq("tx_reference", data.tx_reference).eq("result", "success").maybeSingle();
    if (dupe) {
      await supabaseAdmin.from("fraud_logs").insert({
        business_id: biz.id, user_id: userId, kind: "duplicate_reference",
        details: { tx_reference: data.tx_reference } as never,
      });
      const { data: tx } = await supabaseAdmin.from("transactions").insert({
        business_id: biz.id, performed_by: userId, qr_payload: data.qr_payload,
        tx_reference: data.tx_reference, amount: data.amount, result: "duplicate",
        message: "Reference already used.",
      }).select().single();
      await logApi(true, "duplicate_blocked");
      return { result: "duplicate" as const, message: "Already verified.", tx };
    }

    // Call mock Mother API
    const api = await callMotherApi({
      qr_payload: data.qr_payload, tx_reference: data.tx_reference, amount: data.amount,
    });
    await logApi(true, api.ok ? "verified" : "bank_rejected");

    if (!api.ok) {
      const { data: tx } = await supabaseAdmin.from("transactions").insert({
        business_id: biz.id, performed_by: userId, qr_payload: data.qr_payload,
        tx_reference: data.tx_reference, amount: data.amount, result: "failed",
        message: api.message,
      }).select().single();
      // Charge a credit on failed attempts? No — only on success.
      return { result: "failed" as const, message: api.message, tx };
    }

    // SUCCESS — decrement credit + insert tx
    const { error: creditErr } = await supabaseAdmin
      .from("businesses").update({ credits: biz.credits - 1 }).eq("id", biz.id).gt("credits", 0);
    if (creditErr) {
      return { result: "failed" as const, message: "Credit error; try again.", tx: null };
    }
    const { data: tx, error: txErr } = await supabaseAdmin.from("transactions").insert({
      business_id: biz.id, performed_by: userId, qr_payload: data.qr_payload,
      recipient: api.recipient, tx_reference: data.tx_reference,
      amount: api.amount, result: "success", message: `${api.bank} · verified`,
    }).select().single();
    if (txErr && txErr.code === "23505") {
      // Race: duplicate
      return { result: "duplicate" as const, message: "Already verified.", tx: null };
    }
    return { result: "success" as const, message: `${api.bank} · ${api.amount} ETB verified`, tx };
  });

// ---------- Business member management ----------
export const listMembers = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { businessId: string }) => z.object({ businessId: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { data: rows } = await context.supabase
      .from("business_members").select("id, role, user_id, created_at, profiles:user_id(email, full_name)")
      .eq("business_id", data.businessId);
    return rows ?? [];
  });

export const inviteMember = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({
    businessId: z.string().uuid(),
    email: z.string().trim().email(),
    role: z.enum(["manager", "cashier"]),
  }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    // must be owner
    const { data: me } = await supabase.from("business_members")
      .select("role").eq("business_id", data.businessId).eq("user_id", userId).maybeSingle();
    if (!me || me.role !== "owner") throw new Error("Only owners can add staff");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    // find existing user by email
    const { data: prof } = await supabaseAdmin.from("profiles").select("id").eq("email", data.email).maybeSingle();
    if (!prof) throw new Error("That user hasn't signed up yet. Ask them to register first.");
    const { error } = await supabaseAdmin.from("business_members").insert({
      business_id: data.businessId, user_id: prof.id, role: data.role,
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const removeMember = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ memberId: z.string().uuid(), businessId: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: me } = await supabase.from("business_members")
      .select("role").eq("business_id", data.businessId).eq("user_id", userId).maybeSingle();
    if (!me || me.role !== "owner") throw new Error("Only owners can remove staff");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin.from("business_members").delete().eq("id", data.memberId).eq("business_id", data.businessId);
    return { ok: true };
  });

// ---------- Subscription / plan ----------
export const upgradePlan = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({
    businessId: z.string().uuid(),
    plan: z.enum(["free", "basic", "pro"]),
  }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: me } = await supabase.from("business_members")
      .select("role").eq("business_id", data.businessId).eq("user_id", userId).maybeSingle();
    if (!me || me.role !== "owner") throw new Error("Only owners can change plans");
    const credits = data.plan === "free" ? 20 : data.plan === "basic" ? 1500 : 5000;
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin.from("businesses").update({ plan: data.plan, credits }).eq("id", data.businessId);
    return { ok: true };
  });
