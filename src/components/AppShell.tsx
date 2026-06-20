import { Link, useRouter, useRouterState } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { ReactNode, useEffect, useState } from "react";
import { getMyContext } from "@/lib/beu.functions";
import { supabase } from "@/integrations/supabase/client";
import {
  LayoutDashboard, ScanLine, Receipt, Users, CreditCard, Settings, Shield,
  LogOut, ChevronDown, Building2, Activity, AlertTriangle, Radio,
} from "lucide-react";
import { Logo } from "@/components/Logo";


const BUSINESS_KEY = "beu.activeBusinessId";

export function useActiveBusiness() {
  const fetchCtx = useServerFn(getMyContext);
  const query = useQuery({ queryKey: ["beu-context"], queryFn: () => fetchCtx() });
  const memberships = query.data?.memberships ?? [];
  const [activeId, setActiveId] = useState<string | null>(() =>
    typeof window === "undefined" ? null : localStorage.getItem(BUSINESS_KEY)
  );
  useEffect(() => {
    if (memberships.length && (!activeId || !memberships.find((m) => m.business.id === activeId))) {
      const id = memberships[0].business.id;
      setActiveId(id);
      localStorage.setItem(BUSINESS_KEY, id);
    }
  }, [memberships, activeId]);
  const active = memberships.find((m) => m.business.id === activeId) ?? memberships[0];
  return {
    ctx: query.data,
    loading: query.isLoading,
    refetch: query.refetch,
    active,
    memberships,
    setActiveId: (id: string) => { setActiveId(id); localStorage.setItem(BUSINESS_KEY, id); },
  };
}

const nav = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/scanner", label: "QR Scanner", icon: ScanLine },
  { to: "/transactions", label: "Transactions", icon: Receipt },
  { to: "/staff", label: "Staff", icon: Users },
  { to: "/subscription", label: "Subscription", icon: CreditCard },
  { to: "/settings", label: "Settings", icon: Settings },
] as const;

const adminNav = [
  { to: "/admin", label: "Control Panel", icon: Shield },
  { to: "/admin/mother-api", label: "Mother API", icon: Radio },
  { to: "/admin/users", label: "Users", icon: Users },
  { to: "/admin/businesses", label: "Businesses", icon: Building2 },
  { to: "/admin/api-usage", label: "API Usage", icon: Activity },
  { to: "/admin/fraud", label: "Fraud Logs", icon: AlertTriangle },
] as const;


export function AppShell({ children }: { children: ReactNode }) {
  const router = useRouter();
  const path = useRouterState({ select: (s) => s.location.pathname });
  const { ctx, active, memberships, setActiveId } = useActiveBusiness();
  const isAdmin = ctx?.isAdmin;
  const [open, setOpen] = useState(false);

  async function signOut() {
    await supabase.auth.signOut();
    router.navigate({ to: "/auth", replace: true });
  }

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-40 w-64 transform border-r border-border bg-sidebar transition-transform md:static md:translate-x-0 ${open ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="flex h-16 items-center gap-2.5 border-b border-border px-5">
          <Logo className="h-8 w-8 rounded-md" />
          <Link to="/dashboard" className="font-semibold tracking-tight">BEU <span className="text-primary">VERIFY</span></Link>
        </div>

        <nav className="flex flex-col gap-0.5 p-3 text-sm">
          {nav.map((n) => {
            const active = path === n.to;
            return (
              <Link key={n.to} to={n.to} preload="intent" onClick={() => setOpen(false)}
                className={`flex items-center gap-2.5 rounded-md px-3 py-2 transition-colors ${active ? "bg-primary text-primary-foreground font-semibold" : "text-muted-foreground hover:bg-accent hover:text-foreground"}`}>
                <n.icon className="h-4 w-4" /> {n.label}
              </Link>
            );
          })}
          {isAdmin && (
            <>
              <div className="px-3 pb-1 pt-5 text-[10px] uppercase tracking-widest text-muted-foreground">Beu Admin</div>
              {adminNav.map((n) => {
                const active = path === n.to || (n.to !== "/admin" && path.startsWith(n.to));
                return (
                  <Link key={n.to} to={n.to} preload="intent" onClick={() => setOpen(false)}
                    className={`flex items-center gap-2.5 rounded-md px-3 py-2 transition-colors ${active ? "bg-primary text-primary-foreground font-semibold" : "text-muted-foreground hover:bg-accent hover:text-foreground"}`}>
                    <n.icon className="h-4 w-4" /> {n.label}
                  </Link>
                );
              })}
            </>
          )}
        </nav>
        <div className="absolute inset-x-0 bottom-0 border-t border-border p-3">
          <button onClick={signOut} className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-accent hover:text-foreground">
            <LogOut className="h-4 w-4" /> Sign out
          </button>
        </div>
      </aside>

      {open && <div onClick={() => setOpen(false)} className="fixed inset-0 z-30 bg-background/60 backdrop-blur md:hidden" />}

      {/* Main */}
      <div className="flex flex-1 flex-col">
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between gap-3 border-b border-border bg-background/85 px-4 backdrop-blur md:px-6">
          <div className="flex items-center gap-3">
            <button onClick={() => setOpen((v) => !v)} className="md:hidden rounded-md border border-border p-1.5">
              <span className="block h-0.5 w-4 bg-foreground" />
              <span className="block mt-1 h-0.5 w-4 bg-foreground" />
              <span className="block mt-1 h-0.5 w-4 bg-foreground" />
            </button>
            <BusinessSwitcher current={active} memberships={memberships} onChange={setActiveId} />
          </div>
          <div className="flex items-center gap-3 text-sm">
            {active && (
              <div className="hidden items-center gap-2 rounded-full border border-border bg-card px-3 py-1 sm:flex">
                <span className={`h-1.5 w-1.5 rounded-full ${active.business.status === "active" ? "bg-success" : active.business.status === "suspended" ? "bg-destructive" : "bg-warning"}`} />
                <span className="text-muted-foreground capitalize">{active.business.status}</span>
                <span className="text-muted-foreground">·</span>
                <span><span className="text-primary font-semibold">{active.business.credits}</span> credits</span>
              </div>
            )}
          </div>
        </header>
        <main key={path} className="flex-1 animate-fade-in">{children}</main>
      </div>
    </div>
  );
}

function BusinessSwitcher({
  current, memberships, onChange,
}: {
  current?: { role: string; business: { id: string; name: string } };
  memberships: { role: string; business: { id: string; name: string } }[];
  onChange: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  if (!current) return null;
  return (
    <div className="relative">
      <button onClick={() => setOpen((v) => !v)} className="flex items-center gap-2 rounded-md border border-border bg-card px-3 py-1.5 text-sm">
        <Building2 className="h-4 w-4 text-primary" />
        <span className="font-semibold">{current.business.name}</span>
        <span className="text-xs text-muted-foreground capitalize">· {current.role}</span>
        <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
      </button>
      {open && (
        <div className="absolute left-0 top-full z-40 mt-2 w-64 overflow-hidden rounded-md border border-border bg-popover shadow-xl">
          {memberships.map((m) => (
            <button key={m.business.id} onClick={() => { onChange(m.business.id); setOpen(false); }}
              className="flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-accent">
              <span>{m.business.name}</span>
              <span className="text-xs text-muted-foreground capitalize">{m.role}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export function PageHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3 border-b border-border bg-card/30 px-4 py-5 md:px-6">
      <div>
        <div className="text-xs uppercase tracking-widest text-primary">⚡ Beu Verify</div>
        <h1 className="mt-1 text-2xl font-bold tracking-tight">{title}</h1>
        {subtitle && <p className="mt-0.5 text-sm text-muted-foreground">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}
