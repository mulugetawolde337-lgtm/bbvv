import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { AppShell, PageHeader } from "@/components/AppShell";
import { adminListBusinesses, adminUpdateBusiness } from "@/lib/admin.functions";
import { Power, Plus } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/admin/businesses")({
  component: AdminBusinesses,
});

function AdminBusinesses() {
  const fetch = useServerFn(adminListBusinesses);
  const update = useServerFn(adminUpdateBusiness);
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ["admin-businesses"], queryFn: () => fetch() });

  async function patch(id: string, payload: { status?: "active"|"suspended"|"limited"; credits?: number; plan?: "free"|"basic"|"pro" }) {
    try {
      await update({ data: { id, ...payload } });
      toast.success("Updated");
      qc.invalidateQueries({ queryKey: ["admin-businesses"] });
      qc.invalidateQueries({ queryKey: ["admin-stats"] });
    } catch (e: unknown) { toast.error(e instanceof Error ? e.message : "Failed"); }
  }

  return (
    <AppShell>
      <PageHeader title="Businesses" subtitle="Central kill-switch and credit overrides." />
      <div className="p-4 md:p-6">
        <div className="overflow-hidden rounded-2xl border border-border bg-card">
          <table className="w-full text-sm">
            <thead className="bg-muted/30 text-left text-xs uppercase tracking-widest text-muted-foreground">
              <tr>
                <th className="px-4 py-3">Business</th>
                <th className="px-4 py-3">Owner</th>
                <th className="px-4 py-3">Signed up</th>
                <th className="px-4 py-3">Last sign-in</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Plan</th>
                <th className="px-4 py-3 text-right">Credits</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {(q.data ?? []).map((b) => (
                <tr key={b.id} className="border-t border-border">
                  <td className="px-4 py-3">
                    <div className="font-semibold">{b.name}</div>
                    <div className="font-mono text-[10px] text-muted-foreground">{b.id.slice(0, 8)}</div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-medium">{b.owner_name ?? "—"}</div>
                    <div className="text-xs text-muted-foreground">{b.owner_email ?? "—"}</div>
                    {b.owner_confirmed === false && (
                      <div className="mt-1 inline-block rounded bg-warning/10 px-1.5 py-0.5 text-[10px] text-warning">unconfirmed</div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">
                    {new Date(b.created_at).toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">
                    {b.owner_last_sign_in ? new Date(b.owner_last_sign_in).toLocaleString() : "never"}
                  </td>
                  <td className="px-4 py-3">
                    <select value={b.status} onChange={(e) => patch(b.id, { status: e.target.value as never })} className="bg-input border border-border rounded px-2 py-1 text-xs">
                      <option value="active">active</option>
                      <option value="limited">limited</option>
                      <option value="suspended">suspended</option>
                    </select>
                  </td>
                  <td className="px-4 py-3">
                    <select value={b.plan} onChange={(e) => patch(b.id, { plan: e.target.value as never })} className="bg-input border border-border rounded px-2 py-1 text-xs">
                      <option value="free">free</option><option value="basic">basic</option><option value="pro">pro</option>
                    </select>
                  </td>
                  <td className="px-4 py-3 text-right font-mono">{b.credits}</td>
                  <td className="px-4 py-3 text-right">
                    <button onClick={() => patch(b.id, { credits: b.credits + 100 })} className="rounded border border-border px-2 py-1 text-xs hover:bg-accent inline-flex items-center gap-1"><Plus className="h-3 w-3" /> 100</button>
                    <button onClick={() => patch(b.id, { status: b.status === "suspended" ? "active" : "suspended" })} className="ml-2 rounded border border-border px-2 py-1 text-xs hover:bg-accent inline-flex items-center gap-1"><Power className="h-3 w-3" /> {b.status === "suspended" ? "Resume" : "Suspend"}</button>
                  </td>
                </tr>
              ))}
              {!q.data?.length && <tr><td colSpan={8} className="px-4 py-10 text-center text-muted-foreground">No businesses yet.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </AppShell>
  );
}
