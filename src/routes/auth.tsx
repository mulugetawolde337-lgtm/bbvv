import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { Zap } from "lucide-react";
import { toast } from "sonner";

const searchSchema = z.object({ mode: z.enum(["signin", "signup"]).optional() });

export const Route = createFileRoute("/auth")({
  validateSearch: (s) => searchSchema.parse(s),
  head: () => ({ meta: [{ title: "Sign in — Beu Verify" }] }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const search = Route.useSearch();
  const [mode, setMode] = useState<"signin" | "signup">(search.mode ?? "signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/dashboard" });
    });
  }, [navigate]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email, password,
          options: { emailRedirectTo: window.location.origin, data: { full_name: name } },
        });
        if (error) throw error;
        if (data.session) {
          // create initial business
          const { error: bErr } = await supabase.from("businesses").insert({
            name: businessName || `${name || email.split("@")[0]}'s business`,
            owner_id: data.user!.id,
          }).select().single();
          if (!bErr) {
            const { data: biz } = await supabase.from("businesses").select("id").eq("owner_id", data.user!.id).order("created_at", { ascending: false }).limit(1).maybeSingle();
            if (biz) {
              await supabase.from("business_members").insert({ business_id: biz.id, user_id: data.user!.id, role: "owner" });
            }
          }
          toast.success("Welcome to Beu Verify ⚡");
          navigate({ to: "/dashboard" });
        } else {
          toast.success("Check your email to confirm your account.");
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("Welcome back ⚡");
        navigate({ to: "/dashboard" });
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Something went wrong";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="grid min-h-screen md:grid-cols-2">
        <div className="hidden flex-col justify-between border-r border-border/60 bg-card/40 p-10 md:flex">
          <Link to="/" className="flex items-center gap-2 font-semibold"><Zap className="h-5 w-5 text-primary" />BEU <span className="text-primary">VERIFY</span></Link>
          <div>
            <div className="text-4xl font-bold leading-tight">Verify the payment,<br /><span className="text-primary">not the screenshot.</span></div>
            <p className="mt-4 text-sm text-muted-foreground max-w-sm">Join Ethiopian merchants using Beu to validate every bank & Telebirr transaction in real time.</p>
          </div>
          <div className="text-xs text-muted-foreground">Powered by the Mother API ⚡</div>
        </div>

        <div className="flex items-center justify-center p-6">
          <form onSubmit={onSubmit} className="w-full max-w-sm space-y-5">
            <div className="md:hidden flex items-center gap-2 font-semibold text-sm"><Zap className="h-4 w-4 text-primary" /> BEU VERIFY</div>
            <div>
              <h1 className="text-2xl font-bold">{mode === "signin" ? "Sign in" : "Create your account"}</h1>
              <p className="mt-1 text-sm text-muted-foreground">{mode === "signin" ? "Welcome back." : "Get 20 free verifications."}</p>
            </div>

            {mode === "signup" && (
              <>
                <Field label="Your name"><input className="input" value={name} onChange={(e) => setName(e.target.value)} required maxLength={80} /></Field>
                <Field label="Business name"><input className="input" value={businessName} onChange={(e) => setBusinessName(e.target.value)} placeholder="e.g. Fab Cafe" required maxLength={80} /></Field>
              </>
            )}
            <Field label="Email"><input type="email" className="input" value={email} onChange={(e) => setEmail(e.target.value)} required /></Field>
            <Field label="Password"><input type="password" className="input" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} /></Field>

            <button disabled={loading} className="w-full rounded-md bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-60">
              {loading ? "…" : mode === "signin" ? "Sign in" : "Create account"}
            </button>

            <div className="text-center text-sm text-muted-foreground">
              {mode === "signin" ? (
                <>New here? <button type="button" className="text-primary hover:underline" onClick={() => setMode("signup")}>Create an account</button></>
              ) : (
                <>Have an account? <button type="button" className="text-primary hover:underline" onClick={() => setMode("signin")}>Sign in</button></>
              )}
            </div>
          </form>
        </div>
      </div>
      <style>{`.input { width:100%; background:var(--input); border:1px solid var(--border); color:var(--foreground); border-radius:var(--radius-md); padding:0.6rem 0.75rem; font-size:0.9rem; outline:none; } .input:focus { border-color: var(--ring); box-shadow: 0 0 0 2px oklch(0.88 0.19 95 / 0.25); }`}</style>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block space-y-1.5 text-sm"><span className="text-muted-foreground">{label}</span>{children}</label>;
}
