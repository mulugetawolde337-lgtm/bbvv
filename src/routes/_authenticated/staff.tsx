import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { AppShell, PageHeader, useActiveBusiness } from "@/components/AppShell";
import { listMembers, inviteMember, removeMember } from "@/lib/beu.functions";
import { Trash2, UserPlus } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/staff")({
  component: StaffPage,
});

function StaffPage() {
  const { active } = useActiveBusiness();
  const isOwner = active?.role === "owner";
  const fetchMembers = useServerFn(listMembers);
  const invite = useServerFn(inviteMember);
  const remove = useServerFn(removeMember);
  const qc = useQueryClient();
  const q = useQuery({
    queryKey: ["members", active?.business.id],
    queryFn: () => fetchMembers({ data: { businessId: active!.business.id } }),
    enabled: !!active,
  });
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"manager" | "cashier">("cashier");
  const [busy, setBusy] = useState(false);

  async function onInvite(e: React.FormEvent) {
    e.preventDefault();
    if (!active) return;
    setBusy(true);
    try {
      await invite({ data: { businessId: active.business.id, email: email.trim(), role } });
      toast.success("Staff added");
      setEmail("");
      qc.invalidateQueries({ queryKey: ["members"] });
    } catch (err: unknown) { toast.error(err instanceof Error ? err.message : "Failed"); }
    finally { setBusy(false); }
  }

  return (
    <AppShell>
      <PageHeader title="Staff" subtitle="Owners, managers and cashiers for this business." />
      <div className="grid gap-5 p-4 md:p-6 lg:grid-cols-3">
        <div className="rounded-2xl border border-border bg-card lg:col-span-2">
          <div className="border-b border-border px-5 py-3 font-semibold">Team members</div>
          <ul className="divide-y divide-border">
            {(q.data ?? []).map((m) => {
              const prof = m.profiles as unknown as { email?: string; full_name?: string } | null;
              return (
                <li key={m.id} className="flex items-center justify-between px-5 py-3">
                  <div>
                    <div className="font-medium">{prof?.full_name ?? prof?.email ?? "—"}</div>
                    <div className="text-xs text-muted-foreground">{prof?.email}</div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="rounded-full border border-border px-2.5 py-0.5 text-xs capitalize text-primary">{m.role}</span>
                    {isOwner && m.role !== "owner" && (
                      <button onClick={async () => {
                        await remove({ data: { memberId: m.id, businessId: active!.business.id } });
                        qc.invalidateQueries({ queryKey: ["members"] });
                      }} className="text-muted-foreground hover:text-destructive">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </li>
              );
            })}
            {!q.data?.length && <li className="px-5 py-8 text-center text-sm text-muted-foreground">No staff yet.</li>}
          </ul>
        </div>

        {isOwner ? (
          <form onSubmit={onInvite} className="rounded-2xl border border-border bg-card p-5 space-y-3 h-fit">
            <div className="font-semibold flex items-center gap-2"><UserPlus className="h-4 w-4 text-primary" /> Add staff</div>
            <p className="text-xs text-muted-foreground">The user must already have a Beu account.</p>
            <label className="block text-xs"><span className="text-muted-foreground">Email</span>
              <input className="input mt-1" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required /></label>
            <label className="block text-xs"><span className="text-muted-foreground">Role</span>
              <select className="input mt-1" value={role} onChange={(e) => setRole(e.target.value as "manager" | "cashier")}>
                <option value="cashier">Cashier — verify only</option>
                <option value="manager">Manager — reports + staff</option>
              </select></label>
            <button disabled={busy} className="w-full rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">{busy ? "…" : "Add"}</button>
          </form>
        ) : (
          <div className="rounded-2xl border border-border bg-card p-5 text-sm text-muted-foreground">Only owners can manage staff.</div>
        )}
      </div>
      <style>{`.input { width:100%; background:var(--input); border:1px solid var(--border); color:var(--foreground); border-radius:var(--radius-md); padding:0.55rem 0.7rem; font-size:0.875rem; outline:none; }`}</style>
    </AppShell>
  );
}
