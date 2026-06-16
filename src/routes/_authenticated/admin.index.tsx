import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { AppShell, PageHeader } from "@/components/AppShell";
import { adminStats } from "@/lib/admin.functions";
import { Building2, Activity, Shield, AlertTriangle } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/")({
  component: AdminHome,
});

function AdminHome() {
  const fetch = useServerFn(adminStats);
  const q = useQuery({ queryKey: ["admin-stats"], queryFn: () => fetch(), refetchInterval: 5000 });
  const s = q.data;
  return (
    <AppShell>
      <PageHeader title="Beu Control Panel" subtitle="System-wide health & verification activity." />
      <div className="space-y-5 p-4 md:p-6">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Stat label="Businesses" value={s?.businesses ?? 0} icon={Building2} />
          <Stat label="Active" value={s?.active ?? 0} className="text-success" />
          <Stat label="Suspended" value={s?.suspended ?? 0} className="text-destructive" />
          <Stat label="Total verifications" value={s?.transactions ?? 0} icon={Activity} />
          <Stat label="Successful" value={s?.success ?? 0} className="text-success" />
          <Stat label="API calls (Mother)" value={s?.apiCalls ?? 0} icon={Shield} />
          <Stat label="Blocked calls" value={s?.blockedCalls ?? 0} className="text-warning" />
          <Stat label="Fraud events" value={s?.fraud ?? 0} icon={AlertTriangle} className="text-destructive" />
        </div>
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
          <QuickLink to="/admin/mother-api" title="⚡ Mother API" desc="Configure the central verification endpoint." highlight />
          <QuickLink to="/admin/businesses" title="Manage businesses" desc="Suspend, top up credits, change plans." />
          <QuickLink to="/admin/api-usage" title="API usage" desc="Every Mother API call, allowed or blocked." />
          <QuickLink to="/admin/fraud" title="Fraud logs" desc="Duplicates and suspicious activity." />
        </div>

      </div>
    </AppShell>
  );
}

function Stat({ label, value, icon: Icon, className = "" }: { label: string; value: number; icon?: React.ComponentType<{ className?: string }>; className?: string }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <div className="flex items-center justify-between text-xs uppercase tracking-widest text-muted-foreground">
        {label}{Icon && <Icon className={`h-4 w-4 ${className || "text-primary"}`} />}
      </div>
      <div className={`mt-2 font-mono text-3xl font-bold ${className || "text-foreground"}`}>{value}</div>
    </div>
  );
}
function QuickLink({ to, title, desc, highlight = false }: { to: "/admin/businesses" | "/admin/api-usage" | "/admin/fraud" | "/admin/mother-api"; title: string; desc: string; highlight?: boolean }) {
  return (
    <Link to={to} className={`rounded-2xl border bg-card p-5 transition-colors ${highlight ? "border-primary/60 beu-glow" : "border-border hover:border-primary/40"}`}>
      <div className="font-semibold">{title}</div>
      <div className="mt-1 text-sm text-muted-foreground">{desc}</div>
      <div className="mt-3 text-xs text-primary">Open →</div>
    </Link>
  );
}

