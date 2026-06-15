import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { AppShell, PageHeader, useActiveBusiness } from "@/components/AppShell";
import { getDashboard } from "@/lib/beu.functions";
import { ScanLine, TrendingUp, Ban, Copy, CheckCircle2 } from "lucide-react";

export const Route = createFileRoute("/_authenticated/dashboard")({
  component: DashboardPage,
});

function DashboardPage() {
  const { active } = useActiveBusiness();
  const fetchDash = useServerFn(getDashboard);
  const q = useQuery({
    queryKey: ["dashboard", active?.business.id],
    queryFn: () => fetchDash({ data: { businessId: active!.business.id } }),
    enabled: !!active,
    refetchInterval: 5000,
  });
  return (
    <AppShell>
      <PageHeader
        title={active ? active.business.name : "Dashboard"}
        subtitle="Live verification feed and credit status."
        action={
          <Link to="/scanner" className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 inline-flex items-center gap-2">
            <ScanLine className="h-4 w-4" /> Scan & verify
          </Link>
        }
      />
      <div className="space-y-5 p-4 md:p-6">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Stat label="Credits left" value={q.data?.business?.credits ?? "—"} accent />
          <Stat label="Verifications" value={q.data?.stats.total ?? 0} icon={TrendingUp} />
          <Stat label="Successful" value={q.data?.stats.success ?? 0} icon={CheckCircle2} className="text-success" />
          <Stat label="Failed / Duplicate" value={(q.data?.stats.failed ?? 0) + (q.data?.stats.duplicate ?? 0)} icon={Ban} className="text-destructive" />
        </div>

        <div className="rounded-2xl border border-border bg-card">
          <div className="flex items-center justify-between border-b border-border px-5 py-3">
            <div className="font-semibold">Recent verifications</div>
            <Link to="/transactions" className="text-xs text-primary hover:underline">View all →</Link>
          </div>
          {q.data?.recent.length ? (
            <ul className="divide-y divide-border">
              {q.data.recent.map((t) => <TxRow key={t.id} t={t} />)}
            </ul>
          ) : (
            <div className="px-5 py-10 text-center text-sm text-muted-foreground">
              No verifications yet — head to the scanner to try your first one ⚡
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}

function Stat({ label, value, icon: Icon, className = "", accent = false }: { label: string; value: React.ReactNode; icon?: React.ComponentType<{ className?: string }>; className?: string; accent?: boolean }) {
  return (
    <div className={`rounded-2xl border bg-card p-5 ${accent ? "border-primary/40 beu-glow" : "border-border"}`}>
      <div className="flex items-center justify-between">
        <div className="text-xs uppercase tracking-widest text-muted-foreground">{label}</div>
        {Icon && <Icon className={`h-4 w-4 ${className || "text-primary"}`} />}
      </div>
      <div className={`mt-2 font-mono text-3xl font-bold ${accent ? "text-primary text-glow" : className}`}>{value}</div>
    </div>
  );
}

function TxRow({ t }: { t: { id: string; result: string; amount: number | null; recipient: string | null; tx_reference: string | null; created_at: string; message: string | null } }) {
  const tone = t.result === "success" ? "text-success bg-success/10" : t.result === "duplicate" ? "text-warning bg-warning/10" : t.result === "blocked" ? "text-muted-foreground bg-muted/20" : "text-destructive bg-destructive/10";
  const Icon = t.result === "success" ? CheckCircle2 : t.result === "duplicate" ? Copy : Ban;
  return (
    <li className="flex items-center justify-between gap-3 px-5 py-3 text-sm">
      <div className="flex items-center gap-3 min-w-0">
        <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${tone}`}><Icon className="h-4 w-4" /></span>
        <div className="min-w-0">
          <div className="truncate font-medium">{t.recipient || t.tx_reference || "Verification"}</div>
          <div className="truncate text-xs text-muted-foreground">{t.message ?? new Date(t.created_at).toLocaleString()}</div>
        </div>
      </div>
      <div className="text-right">
        <div className="font-mono font-semibold">{t.amount ? `${Number(t.amount).toFixed(2)} ETB` : "—"}</div>
        <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{t.result}</div>
      </div>
    </li>
  );
}
