import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Scanner } from "@yudiel/react-qr-scanner";
import { useServerFn } from "@tanstack/react-start";
import { useQueryClient } from "@tanstack/react-query";
import { AppShell, PageHeader, useActiveBusiness } from "@/components/AppShell";
import { verifyTransaction } from "@/lib/beu.functions";
import { Camera, CheckCircle2, XCircle, Copy, Ban, Loader2, ScanLine } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/scanner")({
  component: ScannerPage,
});

type Result = { result: "success" | "failed" | "duplicate" | "blocked"; message: string; tx: { id: string; amount: number | null; recipient: string | null; tx_reference: string | null; created_at: string } | null };

function ScannerPage() {
  const { active } = useActiveBusiness();
  const [scanning, setScanning] = useState(false);
  const [qr, setQr] = useState("");
  const [ref, setRef] = useState("");
  const [amount, setAmount] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const verify = useServerFn(verifyTransaction);
  const qc = useQueryClient();

  function onScan(detected: { rawValue: string }[]) {
    if (detected[0]?.rawValue) {
      setQr(detected[0].rawValue);
      setScanning(false);
      toast.success("QR detected", { description: detected[0].rawValue.slice(0, 60) });
    }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!active) return;
    setBusy(true);
    setResult(null);
    try {
      const r = await verify({ data: {
        businessId: active.business.id,
        qr_payload: qr.trim() || "MANUAL",
        tx_reference: ref.trim(),
        amount: Number(amount) || 0,
      }});
      setResult(r as Result);
      qc.invalidateQueries({ queryKey: ["dashboard"] });
      qc.invalidateQueries({ queryKey: ["transactions"] });
      qc.invalidateQueries({ queryKey: ["beu-context"] });
      if (r.result === "success") {
        setRef(""); setAmount("");
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Verification error");
    } finally { setBusy(false); }
  }

  return (
    <AppShell>
      <PageHeader title="Scan & verify" subtitle="Point the camera at the recipient's bank QR, then enter the transaction reference." />
      <div className="grid gap-5 p-4 md:p-6 lg:grid-cols-2">
        {/* Scanner */}
        <div className="rounded-2xl border border-border bg-card p-4">
          <div className="mb-3 flex items-center justify-between">
            <div className="font-semibold flex items-center gap-2"><ScanLine className="h-4 w-4 text-primary" /> QR Scanner</div>
            <button onClick={() => setScanning((v) => !v)} className="rounded-md border border-border px-3 py-1.5 text-xs font-semibold hover:bg-accent">
              {scanning ? "Stop" : "Start camera"}
            </button>
          </div>
          <div className="aspect-square w-full overflow-hidden rounded-xl bg-black/60 border border-border relative">
            {scanning ? (
              <Scanner onScan={onScan} onError={(e) => toast.error(e instanceof Error ? e.message : "Camera error")}
                constraints={{ facingMode: "environment" }} styles={{ container: { width: "100%", height: "100%" } }} />
            ) : (
              <div className="flex h-full flex-col items-center justify-center gap-3 text-muted-foreground">
                <Camera className="h-10 w-10 text-primary/50" />
                <div className="text-sm">Camera off</div>
                <button onClick={() => setScanning(true)} className="rounded-md bg-primary px-4 py-1.5 text-xs font-semibold text-primary-foreground">Enable camera</button>
              </div>
            )}
            <div className="pointer-events-none absolute inset-6 rounded-lg border-2 border-primary/50" />
          </div>
          <label className="mt-3 block text-xs">
            <span className="text-muted-foreground">QR payload</span>
            <input className="input mt-1 font-mono" value={qr} onChange={(e) => setQr(e.target.value)} placeholder="CBE:1000-3456 / TELEBIRR:..." />
          </label>
        </div>

        {/* Verify form */}
        <form onSubmit={submit} className="rounded-2xl border border-border bg-card p-4 space-y-4">
          <div className="font-semibold">Verify transaction</div>
          <label className="block text-xs">
            <span className="text-muted-foreground">Transaction reference</span>
            <input className="input mt-1 font-mono uppercase" value={ref} onChange={(e) => setRef(e.target.value)} required placeholder="ETB7X9Q2K" />
          </label>
          <label className="block text-xs">
            <span className="text-muted-foreground">Amount (ETB)</span>
            <input className="input mt-1 font-mono" value={amount} onChange={(e) => setAmount(e.target.value)} required type="number" min="0" step="0.01" placeholder="0.00" />
          </label>
          <button disabled={busy || !active} className="w-full rounded-md bg-primary px-4 py-3 text-sm font-bold text-primary-foreground hover:bg-primary/90 beu-glow disabled:opacity-60 flex items-center justify-center gap-2">
            {busy ? <><Loader2 className="h-4 w-4 animate-spin" /> Verifying…</> : <>⚡ Verify now</>}
          </button>
          <p className="text-[11px] text-muted-foreground">
            Tip: try ref <span className="font-mono">ETB7X9Q2K</span> for success, <span className="font-mono">FAIL123</span> for failed.
          </p>

          {result && <ResultPanel r={result} />}
        </form>
      </div>
      <style>{`.input { width:100%; background:var(--input); border:1px solid var(--border); color:var(--foreground); border-radius:var(--radius-md); padding:0.6rem 0.75rem; font-size:0.9rem; outline:none; } .input:focus { border-color: var(--ring); box-shadow: 0 0 0 2px oklch(0.88 0.19 95 / 0.25); }`}</style>
    </AppShell>
  );
}

function ResultPanel({ r }: { r: Result }) {
  const cfg = {
    success: { bg: "bg-success/10 border-success/40 text-success", Icon: CheckCircle2, label: "SUCCESS" },
    failed: { bg: "bg-destructive/10 border-destructive/40 text-destructive", Icon: XCircle, label: "FAILED" },
    duplicate: { bg: "bg-warning/10 border-warning/40 text-warning", Icon: Copy, label: "DUPLICATE" },
    blocked: { bg: "bg-muted/40 border-border text-muted-foreground", Icon: Ban, label: "BLOCKED" },
  }[r.result];
  return (
    <div className={`rounded-xl border-2 p-4 ${cfg.bg}`}>
      <div className="flex items-center gap-3">
        <cfg.Icon className="h-7 w-7" />
        <div>
          <div className="text-xs uppercase tracking-widest">{cfg.label}</div>
          <div className="font-semibold text-foreground">{r.message}</div>
        </div>
      </div>
      {r.tx && (
        <div className="mt-3 grid gap-1.5 border-t border-current/20 pt-3 text-xs text-foreground">
          {r.tx.amount && <Row k="Amount" v={`${Number(r.tx.amount).toFixed(2)} ETB`} />}
          {r.tx.tx_reference && <Row k="Reference" v={r.tx.tx_reference} mono />}
          {r.tx.recipient && <Row k="Recipient" v={r.tx.recipient} mono />}
          <Row k="Time" v={new Date(r.tx.created_at).toLocaleString()} />
        </div>
      )}
    </div>
  );
}
function Row({ k, v, mono = false }: { k: string; v: string; mono?: boolean }) {
  return <div className="flex justify-between gap-2"><span className="text-muted-foreground">{k}</span><span className={mono ? "font-mono" : ""}>{v}</span></div>;
}
