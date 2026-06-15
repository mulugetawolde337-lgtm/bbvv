import { createFileRoute, Link } from "@tanstack/react-router";
import { Check, Zap } from "lucide-react";

export const Route = createFileRoute("/pricing")({
  head: () => ({
    meta: [
      { title: "Pricing — Beu Verify" },
      { name: "description", content: "Simple credits-based pricing. 20 free verifications, then Basic (1,500 ETB) or Pro (5,000 ETB) plans." },
    ],
  }),
  component: PricingPage,
});

const plans = [
  { name: "Free", price: "0 ETB", credits: "20 verifications", features: ["1 business", "1 cashier", "Email support", "Basic fraud checks"], cta: "Start free", highlight: false },
  { name: "Basic", price: "1,500 ETB", suffix: "/mo", credits: "1,500 verifications", features: ["Up to 5 staff", "All fraud rules", "Transaction history", "Priority support"], cta: "Choose Basic", highlight: true },
  { name: "Pro", price: "5,000 ETB", suffix: "/mo", credits: "5,000 verifications", features: ["Unlimited staff", "Multi-business", "API rate-limit boost", "Dedicated channel"], cta: "Choose Pro", highlight: false },
];

function PricingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border/60">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5">
          <Link to="/" className="flex items-center gap-2 font-semibold"><Zap className="h-5 w-5 text-primary" />BEU <span className="text-primary">VERIFY</span></Link>
          <Link to="/auth" className="rounded-md bg-primary px-3 py-1.5 text-sm font-semibold text-primary-foreground">Sign in</Link>
        </div>
      </header>
      <section className="mx-auto max-w-6xl px-5 py-20 text-center">
        <div className="text-xs uppercase tracking-widest text-primary">Pricing</div>
        <h1 className="mt-2 text-4xl font-bold md:text-5xl">One credit. One verification.</h1>
        <p className="mx-auto mt-3 max-w-xl text-muted-foreground">No setup fees. No long contracts. Cancel or downgrade anytime.</p>

        <div className="mt-12 grid gap-5 md:grid-cols-3">
          {plans.map((p) => (
            <div key={p.name} className={`rounded-2xl border p-7 text-left ${p.highlight ? "border-primary bg-primary/5 beu-glow" : "border-border bg-card"}`}>
              {p.highlight && <div className="mb-3 inline-block rounded-full bg-primary px-2.5 py-0.5 text-xs font-semibold text-primary-foreground">Most popular</div>}
              <div className="text-sm text-muted-foreground">{p.name}</div>
              <div className="mt-2 flex items-baseline gap-1">
                <span className="text-4xl font-bold">{p.price}</span>
                {p.suffix && <span className="text-sm text-muted-foreground">{p.suffix}</span>}
              </div>
              <div className="mt-1 text-sm text-primary">{p.credits}</div>
              <ul className="mt-6 space-y-2 text-sm">
                {p.features.map((f) => (
                  <li key={f} className="flex items-start gap-2"><Check className="mt-0.5 h-4 w-4 text-primary" /> {f}</li>
                ))}
              </ul>
              <Link to="/auth" search={{ mode: "signup" }} className={`mt-7 block rounded-md px-4 py-2.5 text-center text-sm font-semibold ${p.highlight ? "bg-primary text-primary-foreground" : "border border-border hover:bg-accent"}`}>{p.cta}</Link>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
