import { createFileRoute } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { AppShell, PageHeader, useActiveBusiness } from "@/components/AppShell";
import { upgradePlan } from "@/lib/beu.functions";
import { Check } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/subscription")({
  component: SubscriptionPage,
});

const plans = [
  { id: "free", name: "Free", price: "0 ETB", credits: 20, features: ["1 cashier", "Basic fraud checks"] },
  { id: "basic", name: "Basic", price: "1,500 ETB/mo", credits: 1500, features: ["Up to 5 staff", "All fraud rules"] },
  { id: "pro", name: "Pro", price: "5,000 ETB/mo", credits: 5000, features: ["Unlimited staff", "Priority support"] },
] as const;

function SubscriptionPage() {
  const { active, refetch } = useActiveBusiness();
  const upgrade = useServerFn(upgradePlan);
  const qc = useQueryClient();
  const isOwner = active?.role === "owner";

  async function choose(id: "free" | "basic" | "pro") {
    if (!active || !isOwner) return;
    try {
      await upgrade({ data: { businessId: active.business.id, plan: id } });
      toast.success(`Plan updated → ${id}`);
      refetch();
      qc.invalidateQueries({ queryKey: ["dashboard"] });
    } catch (e: unknown) { toast.error(e instanceof Error ? e.message : "Failed"); }
  }

  return (
    <AppShell>
      <PageHeader title="Subscription" subtitle={active ? `Current plan: ${active.business.plan.toUpperCase()} · ${active.business.credits} credits` : ""} />
      <div className="p-4 md:p-6">
        <div className="grid gap-4 md:grid-cols-3">
          {plans.map((p) => {
            const current = active?.business.plan === p.id;
            return (
              <div key={p.id} className={`rounded-2xl border p-6 ${current ? "border-primary beu-glow bg-primary/5" : "border-border bg-card"}`}>
                <div className="text-sm text-muted-foreground">{p.name}</div>
                <div className="mt-1 text-3xl font-bold">{p.price}</div>
                <div className="mt-1 text-sm text-primary">{p.credits.toLocaleString()} verifications</div>
                <ul className="mt-5 space-y-2 text-sm">
                  {p.features.map((f) => <li key={f} className="flex gap-2"><Check className="h-4 w-4 text-primary" /> {f}</li>)}
                </ul>
                <button disabled={!isOwner || current} onClick={() => choose(p.id)}
                  className={`mt-6 w-full rounded-md px-3 py-2 text-sm font-semibold ${current ? "bg-muted text-muted-foreground" : "bg-primary text-primary-foreground hover:bg-primary/90"} disabled:opacity-60`}>
                  {current ? "Current plan" : isOwner ? "Switch" : "Owner only"}
                </button>
              </div>
            );
          })}
        </div>
        <p className="mt-4 text-xs text-muted-foreground">Mock billing — switching a plan resets your credits to the plan total instantly.</p>
      </div>
    </AppShell>
  );
}
