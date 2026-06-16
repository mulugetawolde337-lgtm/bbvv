import { createFileRoute, Link } from "@tanstack/react-router";
import { Zap, ScanLine, ShieldCheck, Activity, Lock, Gauge } from "lucide-react";
import { Logo } from "@/components/Logo";
import heroScan from "@/assets/hero-scan.jpg";
import imgRestaurant from "@/assets/usecase-restaurant.jpg";
import imgBurger from "@/assets/usecase-burger.jpg";
import imgCafe from "@/assets/usecase-cafe.jpg";
import imgBoutique from "@/assets/usecase-boutique.jpg";
import imgCosmetics from "@/assets/usecase-cosmetics.jpg";
import imgCoffee from "@/assets/usecase-coffee.jpg";
import imgSupermarket from "@/assets/usecase-supermarket.jpg";
import imgPharmacy from "@/assets/usecase-pharmacy.jpg";
import imgMerchant from "@/assets/usecase-merchant.jpg";


export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Beu Verify — Verify Ethiopian Payments by QR" },
      { name: "description", content: "Scan existing bank & Telebirr QR codes. Validate transactions in under 2 seconds. Built for restaurants, cafes, pharmacies, supermarkets, boutiques and small merchants." },
      { property: "og:image", content: heroScan },
    ],
    links: [
      { rel: "preload", as: "image", href: heroScan, fetchpriority: "high" },
    ],
  }),
  component: Landing,
});

function Landing() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Nav />
      <Hero />
      <UseCases />
      <Features />
      <Flow />
      <CTA />
      <Footer />
    </div>
  );
}

function Nav() {
  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5">
        <Link to="/" className="flex items-center gap-2.5 font-semibold tracking-tight">
          <Logo className="h-8 w-8 rounded-md" />
          <span>BEU <span className="text-primary">VERIFY</span></span>
        </Link>

        <nav className="hidden gap-8 text-sm text-muted-foreground md:flex">
          <Link to="/pricing" preload="intent" className="hover:text-foreground">Pricing</Link>
          <a href="#usecases" className="hover:text-foreground">Who it's for</a>
          <a href="#features" className="hover:text-foreground">Features</a>
          <a href="#flow" className="hover:text-foreground">How it works</a>
        </nav>
        <div className="flex items-center gap-2">
          <Link to="/auth" preload="intent" className="rounded-md px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground">Sign in</Link>
          <Link to="/auth" preload="intent" search={{ mode: "signup" }} className="rounded-md bg-primary px-3 py-1.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90">Get started</Link>
        </div>
      </div>
    </header>
  );
}

function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div className="absolute inset-0 beu-grid opacity-50" />
      <div className="absolute left-1/2 top-0 -z-0 h-[400px] w-[800px] -translate-x-1/2 rounded-full bg-primary/20 blur-[140px]" />
      <div className="relative mx-auto grid max-w-6xl gap-12 px-5 pb-24 pt-20 md:grid-cols-2 md:pt-28 md:items-center">
        <div>
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/5 px-3 py-1 text-xs font-medium text-primary">
            <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" /> Live in Ethiopia · Sub-2s verification
          </div>
          <h1 className="text-5xl font-bold tracking-tight md:text-6xl">
            The verification <span className="text-primary text-glow">brain</span> for Ethiopian payments.
          </h1>
          <p className="mt-6 text-lg text-muted-foreground">
            Scan <span className="text-foreground">existing</span> bank & Telebirr QR codes and validate every transaction through one controlled API — with fraud protection and central kill-switch.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link to="/auth" preload="intent" search={{ mode: "signup" }} className="rounded-md bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90 beu-glow">
              Start verifying — free
            </Link>
            <Link to="/pricing" preload="intent" className="rounded-md border border-border px-5 py-3 text-sm font-semibold hover:bg-accent">See pricing</Link>
          </div>
          <p className="mt-4 text-xs text-muted-foreground">20 free verifications · No card required</p>
        </div>
        <div className="relative">
          <div className="absolute -inset-4 rounded-3xl bg-primary/20 blur-3xl" />
          <img
            src={heroScan}
            alt="Cashier scanning a bank QR code on phone"
            width={1024}
            height={1024}
            fetchPriority="high"
            className="relative aspect-square w-full rounded-2xl border border-border object-cover beu-glow"
          />
        </div>
      </div>
    </section>
  );
}

function UseCases() {
  const cases = [
    { img: imgRestaurant, t: "Restaurants", d: "Verify every dine-in & takeaway payment at the counter." },
    { img: imgBurger, t: "Burger houses", d: "Keep the line moving — verify in under 2 seconds." },
    { img: imgCafe, t: "Cafés", d: "No more screenshot fraud at the till." },
    { img: imgCoffee, t: "Coffee shops", d: "Confirm payment before the cup leaves the bar." },
    { img: imgBoutique, t: "Boutiques", d: "Protect high-ticket fashion sales from fake receipts." },
    { img: imgCosmetics, t: "Cosmetics", d: "Verify mobile-money transfers for every product." },
    { img: imgSupermarket, t: "Supermarkets", d: "Fast checkout verification at every till." },
    { img: imgPharmacy, t: "Pharmacies", d: "Audit-friendly proof for every prescription paid." },
    { img: imgMerchant, t: "Small merchants (ሱቅ)", d: "From kiosks to neighborhood shops — proof in seconds." },
  ];
  return (
    <section id="usecases" className="border-t border-border/60 bg-card/30 py-24">
      <div className="mx-auto max-w-6xl px-5">
        <div className="mb-12 max-w-2xl">
          <div className="text-xs uppercase tracking-widest text-primary">Built for</div>
          <h2 className="mt-2 text-3xl font-bold md:text-4xl">Every Ethiopian business that takes payments.</h2>
          <p className="mt-3 text-muted-foreground">If you accept bank transfers or Telebirr, Beu Verify works for you — out of the box.</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {cases.map((c) => (
            <div key={c.t} className="group overflow-hidden rounded-2xl border border-border bg-background transition-colors hover:border-primary/40">
              <div className="relative aspect-[4/3] overflow-hidden">
                <img
                  src={c.img}
                  alt={c.t}
                  width={1024}
                  height={768}
                  loading="lazy"
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent" />
              </div>
              <div className="p-5">
                <h3 className="font-semibold">{c.t}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{c.d}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Features() {
  const items = [
    { icon: ScanLine, title: "Scan existing QR", desc: "We don't issue QRs. Point your camera at any bank or Telebirr QR — Beu reads recipient details instantly." },
    { icon: ShieldCheck, title: "Real verification", desc: "Every transaction reference is validated by the Mother API against the actual payment record." },
    { icon: Activity, title: "Fraud detection", desc: "Duplicate references, mismatched recipients, and abuse patterns flagged in real time." },
    { icon: Lock, title: "Central control", desc: "ON/OFF, suspend, or limit any business from one admin panel. Instant kill-switch." },
    { icon: Gauge, title: "Sub-2s response", desc: "Optimized verification path: scan → verify → result in under two seconds." },
    { icon: Zap, title: "Credits & plans", desc: "20 free, then Basic (1,500 ETB) or Pro (5,000). One credit per verification." },
  ];
  return (
    <section id="features" className="mx-auto max-w-6xl px-5 py-24">
      <div className="mb-12 max-w-2xl">
        <div className="text-xs uppercase tracking-widest text-primary">Why Beu</div>
        <h2 className="mt-2 text-3xl font-bold md:text-4xl">Verification, not generation.</h2>
        <p className="mt-3 text-muted-foreground">Most QR systems print codes. Beu sits one layer above — it reads what's already there and proves the money actually moved.</p>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        {items.map((f) => (
          <div key={f.title} className="group rounded-2xl border border-border bg-card p-6 transition-colors hover:border-primary/40">
            <f.icon className="h-6 w-6 text-primary" />
            <h3 className="mt-4 font-semibold">{f.title}</h3>
            <p className="mt-1.5 text-sm text-muted-foreground">{f.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function Flow() {
  const steps = [
    { n: "01", t: "Scan QR", d: "Cashier scans the recipient's existing bank QR." },
    { n: "02", t: "Customer pays", d: "Customer completes payment in their bank app." },
    { n: "03", t: "Enter reference", d: "Cashier types or scans the transaction ID." },
    { n: "04", t: "Mother API", d: "Beu routes through its controlled API layer." },
    { n: "05", t: "Verified", d: "Result returned in under 2 seconds. Receipt logged." },
  ];
  return (
    <section id="flow" className="border-t border-border/60 bg-card/30 py-24">
      <div className="mx-auto max-w-6xl px-5">
        <div className="mb-12 max-w-2xl">
          <div className="text-xs uppercase tracking-widest text-primary">How it works</div>
          <h2 className="mt-2 text-3xl font-bold md:text-4xl">From QR to verified — in seconds.</h2>
        </div>
        <ol className="grid gap-4 md:grid-cols-5">
          {steps.map((s) => (
            <li key={s.n} className="rounded-xl border border-border bg-background p-5">
              <div className="font-mono text-xs text-primary">{s.n}</div>
              <div className="mt-2 font-semibold">{s.t}</div>
              <div className="mt-1 text-xs text-muted-foreground">{s.d}</div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

function CTA() {
  return (
    <section className="mx-auto max-w-6xl px-5 py-24 text-center">
      <h2 className="text-4xl font-bold md:text-5xl">Stop chasing screenshots.</h2>
      <p className="mx-auto mt-4 max-w-xl text-muted-foreground">Verify the payment, not the photo. Get 20 free verifications and try the flow in two minutes.</p>
      <div className="mt-8 flex justify-center gap-3">
        <Link to="/auth" preload="intent" search={{ mode: "signup" }} className="rounded-md bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90 beu-glow">Get started free</Link>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-t border-border/60 py-8">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-5 text-xs text-muted-foreground md:flex-row">
        <div className="flex items-center gap-2"><Zap className="h-4 w-4 text-primary" /> BEU VERIFY · Addis Ababa</div>
        <div>© {new Date().getFullYear()} Beu Verify. All rights reserved.</div>
      </div>
    </footer>
  );
}
