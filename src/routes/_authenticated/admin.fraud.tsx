import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { AppShell, PageHeader } from "@/components/AppShell";
import { adminFraudLogs } from "@/lib/admin.functions";
import { AlertTriangle } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/fraud")({
  component: AdminFraud,
});

function AdminFraud() {
  const fetch = useServerFn(adminFraudLogs);
  const q = useQuery({ queryKey: ["admin-fraud"], queryFn: () => fetch(), refetchInterval: 6000 });
  return (
    <AppShell>
      <PageHeader title="Fraud logs" subtitle="Duplicate references, mismatched recipients, suspicious patterns." />
      <div className="p-4 md:p-6">
        <div className="space-y-2">
          {(q.data ?? []).map((l) => (
            <div key={l.id} className="rounded-xl border border-destructive/30 bg-destructive/5 p-4">
              <div className="flex items-center gap-2 text-destructive font-semibold"><AlertTriangle className="h-4 w-4" /> {l.kind}</div>
              <div className="mt-1 text-xs text-muted-foreground">{(l.businesses as unknown as { name?: string } | null)?.name ?? "—"} · {new Date(l.created_at).toLocaleString()}</div>
              <pre className="mt-2 overflow-auto text-xs font-mono text-muted-foreground">{JSON.stringify(l.details, null, 2)}</pre>
            </div>
          ))}
          {!q.data?.length && <div className="rounded-xl border border-border bg-card p-10 text-center text-muted-foreground">No fraud events detected.</div>}
        </div>
      </div>
    </AppShell>
  );
}
