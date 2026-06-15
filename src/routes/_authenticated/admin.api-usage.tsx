import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { AppShell, PageHeader } from "@/components/AppShell";
import { adminApiLogs } from "@/lib/admin.functions";
import { CheckCircle2, XCircle } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/api-usage")({
  component: AdminApi,
});

function AdminApi() {
  const fetch = useServerFn(adminApiLogs);
  const q = useQuery({ queryKey: ["admin-api"], queryFn: () => fetch(), refetchInterval: 5000 });
  return (
    <AppShell>
      <PageHeader title="Mother API usage" subtitle="Every verification request, allowed or blocked." />
      <div className="p-4 md:p-6">
        <div className="overflow-hidden rounded-2xl border border-border bg-card">
          <table className="w-full text-sm">
            <thead className="bg-muted/30 text-left text-xs uppercase tracking-widest text-muted-foreground">
              <tr><th className="px-4 py-3">Allowed</th><th className="px-4 py-3">Business</th><th className="px-4 py-3">Reason</th><th className="px-4 py-3">Time</th></tr>
            </thead>
            <tbody>
              {(q.data ?? []).map((l) => (
                <tr key={l.id} className="border-t border-border">
                  <td className="px-4 py-3">{l.allowed ? <CheckCircle2 className="h-4 w-4 text-success" /> : <XCircle className="h-4 w-4 text-destructive" />}</td>
                  <td className="px-4 py-3">{(l.businesses as unknown as { name?: string } | null)?.name ?? "—"}</td>
                  <td className="px-4 py-3 font-mono text-xs">{l.reason}</td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{new Date(l.created_at).toLocaleString()}</td>
                </tr>
              ))}
              {!q.data?.length && <tr><td colSpan={4} className="px-4 py-10 text-center text-muted-foreground">No API calls yet.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </AppShell>
  );
}
