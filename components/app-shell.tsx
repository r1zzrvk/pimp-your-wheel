"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useState } from "react";
import { MeContext } from "@/components/me-context";
import { backgroundGradient } from "@/lib/economy";
import type { MeResponse } from "@/lib/types";

const PLAN_LABEL = {
  FREE: "Free",
  BASIC: "Basic",
  PRO: "Pro",
} as const;

export function AppShell({
  initialMe,
  children,
}: {
  initialMe: MeResponse;
  children: React.ReactNode;
}) {
  const [me, setMe] = useState<MeResponse | null>(initialMe);
  const [error, setError] = useState<string | null>(null);
  const pathname = usePathname();
  const router = useRouter();

  const refresh = useCallback(async () => {
    const response = await fetch("/api/me", { cache: "no-store" });
    if (response.status === 401) {
      router.push("/login");
      return;
    }
    if (!response.ok) {
      setError("Не удалось загрузить профиль");
      return;
    }
    setError(null);
    setMe((await response.json()) as MeResponse);
  }, [router]);

  const patch = useCallback((partial: Partial<MeResponse>) => {
    setMe((current) => (current ? { ...current, ...partial } : current));
  }, []);

  return (
    <MeContext.Provider value={{ me, refresh, patch }}>
      <div className="relative mx-auto flex min-h-full w-full max-w-5xl flex-col px-4 py-6">
        {me?.background ? (
          <div
            aria-hidden
            className="pointer-events-none fixed inset-0 -z-10"
            style={{ background: backgroundGradient(me.background) }}
          />
        ) : null}
        <header className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3 border-b border-line pb-4">
          <div className="flex items-center gap-3">
            <Link href="/" data-sound="menu" className="font-display text-lg">
              Pimp your wheel
            </Link>
            <span className="rounded-full border border-line px-3 py-1 text-sm text-muted">
              {me ? PLAN_LABEL[me.plan] : "…"}
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex flex-wrap items-center gap-2 text-sm">
              <span className="rounded-full border border-line px-3 py-1">
                {me ? `${me.balance} монет` : "…"}
              </span>
              <Link
                href="/levels"
                data-sound="menu"
                className={`rounded-full border border-line px-3 py-1 ${
                  pathname === "/levels" ? "border-accent text-accent" : "text-muted"
                }`}
              >
                {me ? `Ур. ${me.level}` : "…"}
              </Link>
              <span className="rounded-full border border-line px-3 py-1 text-muted">
                {me ? `Серия ${me.streak}` : "…"}
              </span>
            </div>
            <nav className="flex flex-wrap items-center gap-1 text-base">
              <Link
                href="/"
                data-sound="menu"
                className={`rounded-full px-4 py-1.5 ${pathname === "/" ? "bg-white/10" : "text-muted"}`}
              >
                Рулетка
              </Link>
              <Link
                href="/levels"
                data-sound="menu"
                className={`rounded-full px-4 py-1.5 ${pathname === "/levels" ? "bg-white/10" : "text-muted"}`}
              >
                Уровни
              </Link>
              <Link
                href="/shop"
                data-sound="menu"
                className={`rounded-full px-4 py-1.5 ${pathname === "/shop" ? "bg-white/10" : "text-muted"}`}
              >
                Магазин
              </Link>
              <Link
                href="/plans"
                data-sound="menu"
                className={`rounded-full px-4 py-1.5 ${pathname === "/plans" ? "bg-white/10" : "text-muted"}`}
              >
                Подписка
              </Link>
              <Link
                href="/settings"
                data-sound="menu"
                className={`rounded-full px-4 py-1.5 ${pathname === "/settings" ? "bg-white/10" : "text-muted"}`}
              >
                Настройки
              </Link>
            </nav>
          </div>
        </header>
        {error ? <p className="mt-10 text-red-300">{error}</p> : null}
        {!error && !me ? <p className="mt-10 text-muted">Загрузка…</p> : null}
        {!error && me ? <main className="flex-1 py-8">{children}</main> : null}
      </div>
    </MeContext.Provider>
  );
}
