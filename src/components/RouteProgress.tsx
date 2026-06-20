import { useRouterState } from "@tanstack/react-router";
import { useEffect, useState } from "react";

/**
 * Slim top progress bar that animates during route transitions.
 * Gives the app a "smart loading" feel when switching pages or scanning QRs.
 */
export function RouteProgress() {
  const status = useRouterState({ select: (s) => s.status });
  const isLoading = status === "pending";
  const [progress, setProgress] = useState(0);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    let raf: number;
    let timeout: ReturnType<typeof setTimeout>;
    if (isLoading) {
      setVisible(true);
      setProgress(8);
      const tick = () => {
        setProgress((p) => (p < 90 ? p + (90 - p) * 0.08 : p));
        raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
    } else if (visible) {
      setProgress(100);
      timeout = setTimeout(() => {
        setVisible(false);
        setProgress(0);
      }, 280);
    }
    return () => {
      if (raf) cancelAnimationFrame(raf);
      if (timeout) clearTimeout(timeout);
    };
  }, [isLoading, visible]);

  if (!visible) return null;

  return (
    <div className="fixed inset-x-0 top-0 z-[100] h-0.5 bg-transparent pointer-events-none">
      <div
        className="h-full bg-gradient-to-r from-primary via-primary/80 to-primary shadow-[0_0_10px_var(--primary)] transition-[width,opacity] duration-200 ease-out"
        style={{ width: `${progress}%`, opacity: progress === 100 ? 0 : 1 }}
      />
    </div>
  );
}

/**
 * Centered branded splash for first paint / suspense fallbacks.
 */
export function PageLoader({ label = "Loading" }: { label?: string }) {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 animate-fade-in">
      <div className="relative h-12 w-12">
        <div className="absolute inset-0 rounded-full border-2 border-primary/20" />
        <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-primary animate-spin" />
        <div className="absolute inset-2 rounded-full bg-primary/10 animate-pulse" />
      </div>
      <div className="text-xs uppercase tracking-widest text-muted-foreground">
        ⚡ {label}
      </div>
    </div>
  );
}
