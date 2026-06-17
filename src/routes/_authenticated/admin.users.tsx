import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { AppShell, PageHeader } from "@/components/AppShell";
import {
  adminListUsers, adminResetPassword, adminToggleRole, adminCreateUser,
} from "@/lib/admin-users.functions";
import { Shield, KeyRound, UserPlus, CheckCircle2, XCircle } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/admin/users")({
  component: AdminUsers,
});

function AdminUsers() {
  const list = useServerFn(adminListUsers);
  const reset = useServerFn(adminResetPassword);
  const toggle = useServerFn(adminToggleRole);
  const create = useServerFn(adminCreateUser);
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ["admin-users"], queryFn: () => list() });

  const [showCreate, setShowCreate] = useState(false);
  const [nEmail, setNEmail] = useState("");
  const [nPass, setNPass] = useState("");
  const [nName, setNName] = useState("");
  const [nAdmin, setNAdmin] = useState(false);

  async function doReset(userId: string, email: string) {
    const pw = prompt(`New password for ${email} (min 6 chars):`);
    if (!pw || pw.length < 6) return;
    try {
      await reset({ data: { userId, newPassword: pw } });
      toast.success("Password updated");
    } catch (e: unknown) { toast.error(e instanceof Error ? e.message : "Failed"); }
  }

  async function doToggle(userId: string, isAdmin: boolean) {
    try {
      await toggle({ data: { userId, role: "admin", grant: !isAdmin } });
      toast.success(isAdmin ? "Admin removed" : "Admin granted");
      qc.invalidateQueries({ queryKey: ["admin-users"] });
    } catch (e: unknown) { toast.error(e instanceof Error ? e.message : "Failed"); }
  }

  async function doCreate(e: React.FormEvent) {
    e.preventDefault();
    try {
      await create({ data: { email: nEmail, password: nPass, full_name: nName, makeAdmin: nAdmin } });
      toast.success("User created");
      setShowCreate(false); setNEmail(""); setNPass(""); setNName(""); setNAdmin(false);
      qc.invalidateQueries({ queryKey: ["admin-users"] });
    } catch (e: unknown) { toast.error(e instanceof Error ? e.message : "Failed"); }
  }

  return (
    <AppShell>
      <PageHeader title="Users" subtitle="Every signup — reset passwords or grant admin." action={
        <button onClick={() => setShowCreate((v) => !v)} className="inline-flex items-center gap-2 rounded-md bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:bg-primary/90">
          <UserPlus className="h-3.5 w-3.5" /> New user
        </button>
      } />

      <div className="space-y-4 p-4 md:p-6">
        {showCreate && (
          <form onSubmit={doCreate} className="grid gap-3 rounded-2xl border border-border bg-card p-4 md:grid-cols-5">
            <input className="input md:col-span-2" placeholder="Full name" value={nName} onChange={(e) => setNName(e.target.value)} required />
            <input className="input md:col-span-2" placeholder="email@example.com" type="email" value={nEmail} onChange={(e) => setNEmail(e.target.value)} required />
            <input className="input" placeholder="Password (min 6)" type="text" value={nPass} onChange={(e) => setNPass(e.target.value)} required minLength={6} />
            <label className="flex items-center gap-2 text-xs text-muted-foreground md:col-span-4">
              <input type="checkbox" checked={nAdmin} onChange={(e) => setNAdmin(e.target.checked)} />
              Grant god-admin (full /admin access)
            </label>
            <button className="rounded-md bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground">Create</button>
          </form>
        )}

        <div className="overflow-hidden rounded-2xl border border-border bg-card">
          <table className="w-full text-sm">
            <thead className="bg-muted/30 text-left text-xs uppercase tracking-widest text-muted-foreground">
              <tr>
                <th className="px-4 py-3">User</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Last sign-in</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {(q.data ?? []).map((u) => {
                const isAdmin = u.roles.includes("admin");
                return (
                  <tr key={u.id} className="border-t border-border">
                    <td className="px-4 py-3">
                      <div className="font-semibold flex items-center gap-2">
                        {u.email}
                        {isAdmin && <span className="rounded bg-primary/15 px-1.5 py-0.5 text-[10px] font-bold text-primary">ADMIN</span>}
                      </div>
                      <div className="text-xs text-muted-foreground">{u.full_name || "—"}</div>
                    </td>
                    <td className="px-4 py-3">
                      {u.confirmed
                        ? <span className="inline-flex items-center gap-1 text-emerald-500 text-xs"><CheckCircle2 className="h-3 w-3" /> confirmed</span>
                        : <span className="inline-flex items-center gap-1 text-amber-500 text-xs"><XCircle className="h-3 w-3" /> unconfirmed</span>}
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">
                      {u.last_sign_in_at ? new Date(u.last_sign_in_at).toLocaleString() : "never"}
                    </td>
                    <td className="px-4 py-3 text-right space-x-2">
                      <button onClick={() => doReset(u.id, u.email)} className="rounded border border-border px-2 py-1 text-xs hover:bg-accent inline-flex items-center gap-1">
                        <KeyRound className="h-3 w-3" /> Reset password
                      </button>
                      <button onClick={() => doToggle(u.id, isAdmin)} className="rounded border border-border px-2 py-1 text-xs hover:bg-accent inline-flex items-center gap-1">
                        <Shield className="h-3 w-3" /> {isAdmin ? "Revoke admin" : "Make admin"}
                      </button>
                    </td>
                  </tr>
                );
              })}
              {!q.data?.length && <tr><td colSpan={4} className="px-4 py-10 text-center text-muted-foreground">No users yet.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
      <style>{`.input { background:var(--input); border:1px solid var(--border); color:var(--foreground); border-radius:var(--radius-md); padding:0.5rem 0.7rem; font-size:0.85rem; outline:none; } .input:focus { border-color: var(--ring); }`}</style>
    </AppShell>
  );
}
