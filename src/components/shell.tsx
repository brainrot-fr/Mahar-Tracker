import { Link, useRouterState } from "@tanstack/react-router";
import { Download, History, House, Plus, Settings } from "lucide-react";
import { useEffect } from "react";
import { UserButton } from "@/lib/auth/gates";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { APP_NAME } from "@/lib/gold/constants";
import { createEntryFn } from "@/lib/gold/fns";
import { listPendingEntries, removePendingEntry } from "@/lib/gold/offline";
import { cn } from "@/lib/utils";
import { Skeleton } from "./ui/skeleton";

const NAV = [
  { to: "/", label: "Home", icon: House, className: "" },
  { to: "/history", label: "History", icon: History, className: "" },
  { to: "/entries/new", label: "Add", icon: Plus, className: "" },
  { to: "/settings", label: "Settings", icon: Settings, className: "" },
  { to: "/download", label: "Android", icon: Download, className: "hidden md:flex" },
] as const;

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { user, isPending } = useCurrentUserState();

  useEffect(() => {
    if (!user || typeof window === "undefined") return;

    let cancelled = false;
    const sync = async () => {
      if (!navigator.onLine) return;
      for (const pending of listPendingEntries(user.id)) {
        if (cancelled) return;
        try {
          await createEntryFn({
            data: {
              amount: pending.amount,
              currency: pending.currency,
              depositDate: pending.depositDate,
              note: pending.note,
              idempotencyKey: pending.idempotencyKey,
            },
          });
          removePendingEntry(user.id, pending.idempotencyKey);
        } catch {
          // Keep the entry queued for the next online attempt.
        }
      }
    };

    void sync();
    window.addEventListener("online", sync);
    return () => {
      cancelled = true;
      window.removeEventListener("online", sync);
    };
  }, [user]);

  return (
    <div className="mx-auto flex min-h-dvh max-w-6xl flex-col bg-bg">
      <header className="sticky top-0 z-20 flex items-center justify-between border-b border-border bg-bg/90 px-4 py-3 backdrop-blur">
        <Link to="/" className="font-display text-lg tracking-tight text-fg">
          {APP_NAME}
        </Link>
        <nav className="hidden items-center gap-1 md:flex">
          {NAV.map((item) => {
            const active =
              item.to === "/"
                ? pathname === "/"
                : pathname === item.to || pathname.startsWith(`${item.to}/`);
            const Icon = item.icon;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  "flex items-center gap-2 rounded-md px-3 py-2 text-sm",
                  active ? "bg-elevated text-fg" : "text-muted hover:text-fg",
                )}
              >
                <Icon className="size-4" strokeWidth={active ? 2.2 : 1.7} />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="max-w-[60%]">
          {isPending ? (
            <Skeleton className="h-8 w-28" />
          ) : user ? (
            <div className="[&_img]:size-8 [&_span]:truncate [&_span]:text-xs [&_span]:text-muted">
              <UserButton />
            </div>
          ) : null}
        </div>
      </header>
      <main className="mx-auto w-full flex-1 px-4 pb-28 pt-4 md:max-w-5xl md:px-8 md:pb-10 md:pt-8">
        {children}
      </main>
      <nav className="fixed inset-x-0 bottom-0 z-20 mx-auto max-w-6xl border-t border-border bg-surface/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden">
        <ul className="grid grid-cols-4">
          {NAV.map((item) => {
            const active =
              item.to === "/"
                ? pathname === "/"
                : pathname === item.to || pathname.startsWith(`${item.to}/`);
            const Icon = item.icon;
            return (
              <li key={item.to}>
                <Link
                  to={item.to}
                  className={cn(
                    "flex min-h-14 flex-col items-center justify-center gap-1 text-xs",
                    item.className,
                    active ? "text-fg" : "text-subtle",
                  )}
                >
                  <Icon className="size-5" strokeWidth={active ? 2.2 : 1.7} />
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}
