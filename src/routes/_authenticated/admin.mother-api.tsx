import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { AppShell, PageHeader } from "@/components/AppShell";
import { getMotherApiSettings, updateMotherApiSettings, testMotherApi } from "@/lib/mother-api.functions";
import { Radio, Loader2, CheckCircle2, XCircle, Power } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/admin/mother-api")({
  component: MotherApiPage,
});

function MotherApiPage() {
  const fetchSettings = useServerFn(getMotherApiSettings);
  const save = useServerFn(updateMotherApiSettings);
  const test = useServerFn(testMotherApi);

  const q = useQuery({ queryKey: ["mother-api-settings"], queryFn: () => fetchSettings() });
  const s = q.data;

  const [mode, setMode] = useState<"mock" | "live">("mock");
  const [enabled, setEnabled] = useState(false);
  const [apiUrl, setApiUrl] = useState("");
  const [authHeader, setAuthHeader] = useState("Authorization");
  const [authToken, setAuthToken] = useState("");
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);
  const [testRes, setTestRes] = useState<{ ok: boolean; message: string; status?: number; ms?: number; body?: string } | null>(null);

  useEffect(() => {
    if (!s) return;
    setMode((s.mode as "mock" | "live") ?? "mock");
    setEnabled(!!s.enabled);
    setApiUrl(s.api_url ?? "");
    setAuthHeader(s.auth_header ?? "Authorization");
    setAuthToken(s.auth_token ?? "");
    setNotes(s.notes ?? "");
  }, [s]);

  async function onSave(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      await save({ data: { mode, enabled, api_url: apiUrl, auth_header: authHeader, auth_token: authToken, notes } });
      toast.success("Mother API settings saved");
      q.refetch();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Save failed");
    } finally { setBusy(false); }
  }

  async function onTest() {
    setBusy(true);
    setTestRes(null);
    try {
      const r = await test();
      setTestRes(r as typeof testRes);
    } catch (err) {
      setTestRes({ ok: false, message: err instanceof Error ? err.message : "Test failed" });
    } finally { setBusy(false); }
  }

  return (
    <AppShell>
      <PageHeader
        title="Mother API"
        subtitle="The central verification endpoint. When enabled in LIVE mode, every active customer's scan is verified through this URL."
      />
      <div className="grid gap-5 p-4 md:p-6 lg:grid-cols-3">
        <form onSubmit={onSave} className="lg:col-span-2 rounded-2xl border border-border bg-card p-5 space-y-4">
          <div className="flex items-center gap-2 font-semibold">
            <Radio className="h-4 w-4 text-primary" /> Endpoint configuration
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block text-xs">
              <span className="text-muted-foreground">Mode</span>
              <select className="input mt-1" value={mode} onChange={(e) => setMode(e.target.value as "mock" | "live")}>
                <option value="mock">Mock (built-in test verifier)</option>
                <option value="live">Live (call real API URL)</option>
              </select>
            </label>
            <label className="flex items-center gap-3 rounded-md border border-border bg-background px-3 py-2 mt-5">
              <Power className={`h-4 w-4 ${enabled ? "text-success" : "text-muted-foreground"}`} />
              <span className="flex-1 text-sm">Enabled across all active customers</span>
              <input type="checkbox" checked={enabled} onChange={(e) => setEnabled(e.target.checked)} className="h-5 w-5 accent-[var(--primary)]" />
            </label>
          </div>

          <label className="block text-xs">
            <span className="text-muted-foreground">API URL (POST)</span>
            <input className="input mt-1 font-mono" value={apiUrl} onChange={(e) => setApiUrl(e.target.value)}
              placeholder="https://api.your-bank-gateway.et/verify" />
          </label>

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block text-xs">
              <span className="text-muted-foreground">Auth header name</span>
              <input className="input mt-1 font-mono" value={authHeader} onChange={(e) => setAuthHeader(e.target.value)} placeholder="Authorization" />
            </label>
            <label className="block text-xs">
              <span className="text-muted-foreground">Auth token / Bearer value</span>
              <input type="password" className="input mt-1 font-mono" value={authToken} onChange={(e) => setAuthToken(e.target.value)} placeholder="Bearer sk_live_..." />
            </label>
          </div>

          <label className="block text-xs">
            <span className="text-muted-foreground">Notes (internal)</span>
            <textarea className="input mt-1" rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="e.g. CBE prod gateway, contact: ops@..." />
          </label>

          <div className="flex flex-wrap gap-2 pt-2">
            <button disabled={busy} className="rounded-md bg-primary px-5 py-2.5 text-sm font-bold text-primary-foreground hover:bg-primary/90 beu-glow disabled:opacity-60 flex items-center gap-2">
              {busy ? <><Loader2 className="h-4 w-4 animate-spin" /> Saving…</> : <>Save settings</>}
            </button>
            <button type="button" disabled={busy} onClick={onTest} className="rounded-md border border-border px-5 py-2.5 text-sm font-semibold hover:bg-accent disabled:opacity-60">
              Test endpoint
            </button>
          </div>

          {testRes && (
            <div className={`rounded-xl border-2 p-4 ${testRes.ok ? "border-success/40 bg-success/10 text-success" : "border-destructive/40 bg-destructive/10 text-destructive"}`}>
              <div className="flex items-center gap-2">
                {testRes.ok ? <CheckCircle2 className="h-5 w-5" /> : <XCircle className="h-5 w-5" />}
                <span className="font-semibold text-foreground">{testRes.message}</span>
                {testRes.status && <span className="ml-auto text-xs">HTTP {testRes.status} · {testRes.ms}ms</span>}
              </div>
              {testRes.body && <pre className="mt-2 max-h-40 overflow-auto rounded bg-background/40 p-2 text-[11px] text-foreground">{testRes.body}</pre>}
            </div>
          )}
        </form>

        <aside className="rounded-2xl border border-border bg-card p-5 space-y-3 text-sm">
          <div className="font-semibold">How it works</div>
          <p className="text-muted-foreground">
            When <span className="text-foreground font-medium">LIVE</span> mode is enabled, every verification across every active customer
            is forwarded as a <span className="font-mono text-foreground">POST</span> to your URL with this body:
          </p>
          <pre className="rounded-md border border-border bg-background p-3 text-[11px] font-mono leading-relaxed text-foreground">{`{
  "qr_payload": "CBE:1000-3456",
  "tx_reference": "ETB7X9Q2K",
  "amount": 250.00
}`}</pre>
          <div className="font-semibold pt-2">Expected response</div>
          <pre className="rounded-md border border-border bg-background p-3 text-[11px] font-mono leading-relaxed text-foreground">{`{
  "ok": true,
  "recipient": "Sami's Café",
  "amount": 250.00,
  "bank": "CBE",
  "message": "Verified"
}`}</pre>
          <div className="rounded-md border border-warning/40 bg-warning/10 p-3 text-xs text-foreground">
            ⚠ Switching to LIVE mode affects <span className="font-semibold">every</span> active business immediately.
          </div>
        </aside>
      </div>
      <style>{`.input { width:100%; background:var(--input); border:1px solid var(--border); color:var(--foreground); border-radius:var(--radius-md); padding:0.55rem 0.7rem; font-size:0.85rem; outline:none; } .input:focus { border-color: var(--ring); box-shadow: 0 0 0 2px oklch(0.88 0.19 95 / 0.25); }`}</style>
    </AppShell>
  );
}
