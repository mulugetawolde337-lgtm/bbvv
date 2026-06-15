import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { AppShell, PageHeader, useActiveBusiness } from "@/components/AppShell";
import { listTransactions } from "@/lib/beu.functions";
import { CheckCircle2, XCircle, Copy, Ban } from "lucide-react";

export const Route = createFileRoute("/_authenticated/transactions")({
  component: TransactionsPage,
});

function TransactionsPage() {
  const { active } = useActiveBusiness();
  const fetchTx = useServerFn(listTransactions);
  const q = useQuery({
    queryKey: ["transactions", active?.business.id],
    queryFn: () => fetchTx({ data: { businessId: active!.business.id } }),
    enabled: !!active,
    refetchInterval: 6000,
  });
  return (
    <AppShell>
      <PageHeader title="Transactions" subtitle="Every verification, with bank result and timestamp." />
      <div className="p-4 md:p-6">
        <div className="overflow-hidden rounded-2xl border border-border bg-card">
          <table className="w-full text-sm">
            <thead className="bg-muted/30 text-left text-xs uppercase tracking-widest text-muted-foreground">
              <tr><th className="px-4 py-3">Status</th><th className="px-4 py-3">Reference</th><th className="px-4 py-3">Recipient</th><th className="px-4 py-3 text-right">Amount</th><th className="px-4 py-3">Time</th></tr>
            </thead>
            <tbody>
              {(q.data ?? []).map((t) => {
                const Icon = t.result === "success" ? CheckCircle2 : t.result === "duplicate" ? Copy : t.result === "blocked" ? Ban : XCircle;
                const tone = t.result === "success" ? "text-success" : t.result === "duplicate" ? "text-warning" : t.result === "blocked" ? "text-muted-foreground" : "text-destructive";
                return (
                  <tr key={t.id} className="border-t border-border">
                    <td className="px-4 py-3"><span className={`inline-flex items-center gap-1.5 font-semibold ${tone}`}><Icon className="h-3.5 w-3.5" /> {t.result}</span></td>
                    <td className="px-4 py-3 font-mono text-xs">{t.tx_reference || "—"}</td>
                    <td className="px-4 py-3 font-mono text-xs">{t.recipient || t.qr_payload?.slice(0, 30) || "—"}</td>
                    <td className="px-4 py-3 text-right font-mono">{t.amount ? `${Number(t.amount).toFixed(2)} ETB` : "—"}</td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{new Date(t.created_at).toLocaleString()}</td>
                  </tr>
                );
              })}
              {!q.data?.length && <tr><td colSpan={5} className="px-4 py-10 text-center text-muted-foreground">No transactions yet.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </AppShell>
  );
}
