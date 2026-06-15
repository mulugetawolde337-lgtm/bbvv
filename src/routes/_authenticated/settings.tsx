import { createFileRoute } from "@tanstack/react-router";
import { AppShell, PageHeader, useActiveBusiness } from "@/components/AppShell";

export const Route = createFileRoute("/_authenticated/settings")({
  component: SettingsPage,
});

function SettingsPage() {
  const { ctx, active } = useActiveBusiness();
  return (
    <AppShell>
      <PageHeader title="Settings" subtitle="Your account and business details." />
      <div className="grid gap-5 p-4 md:p-6 lg:grid-cols-2">
        <Card title="Account">
          <Row k="Name" v={ctx?.profile?.full_name ?? "—"} />
          <Row k="Email" v={ctx?.profile?.email ?? "—"} />
          <Row k="Role" v={ctx?.isAdmin ? "Beu super-admin" : "Business user"} />
        </Card>
        <Card title="Current business">
          <Row k="Business" v={active?.business.name ?? "—"} />
          <Row k="Status" v={active?.business.status ?? "—"} />
          <Row k="Plan" v={active?.business.plan?.toUpperCase() ?? "—"} />
          <Row k="Credits" v={String(active?.business.credits ?? "—")} />
          <Row k="Your role" v={active?.role ?? "—"} />
        </Card>
      </div>
    </AppShell>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-border bg-card">
      <div className="border-b border-border px-5 py-3 font-semibold">{title}</div>
      <div className="divide-y divide-border">{children}</div>
    </div>
  );
}
function Row({ k, v }: { k: string; v: string }) {
  return <div className="flex items-center justify-between px-5 py-3 text-sm"><span className="text-muted-foreground">{k}</span><span className="font-medium capitalize">{v}</span></div>;
}
