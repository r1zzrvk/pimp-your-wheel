"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useState } from "react";
import { MeContext } from "@/components/me-context";
import { backgroundGradient } from "@/lib/economy";
import { profileLabel } from "@/lib/profile";
import type { MeResponse } from "@/lib/types";

const PLAN_LABEL = {
  FREE: "Free",
  BASIC: "Basic",
  PRO: "Pro",
} as const;

function CoinIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className="h-5 w-5 shrink-0">
      <circle cx="12" cy="12" r="9" fill="#f0a202" />
      <circle cx="12" cy="12" r="6.2" fill="none" stroke="#6b4e16" strokeWidth="1.4" />
      <path d="M12 7.5v9M9.6 9.4c.5-.7 1.4-1.1 2.4-1.1 1.6 0 2.7.9 2.7 2.1 0 1.2-.8 1.8-2.4 2.2l-1.1.3c-1.6.4-2.4 1-2.4 2.2 0 1.2 1.1 2.1 2.7 2.1 1 0 1.9-.4 2.4-1.1" fill="none" stroke="#1a1408" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

function LevelIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className="h-5 w-5 shrink-0">
      <path d="M12 3.5 14.4 8.7 20 9.4 15.8 13.2 16.9 18.8 12 16.1 7.1 18.8 8.2 13.2 4 9.4 9.6 8.7 12 3.5Z" fill="#e7d3a1" />
    </svg>
  );
}

function StreakIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className="h-5 w-5 shrink-0">
      <path d="M12.2 3s.4 3.2-1.6 5.2C8.8 10 8 11.4 8 13.2 8 16.2 10.2 18.5 13 18.5c2.6 0 4.5-2 4.5-4.8 0-3.2-2.2-5.2-2.2-5.2s.2 1.8-1.1 3.1c-.3-2.4-2-5.2-2-8.6Z" fill="#f97316" />
    </svg>
  );
}

const NAV = [
  { href: "/", label: "Рулетка" },
  { href: "/levels", label: "Уровни" },
  { href: "/shop", label: "Магазин" },
  // { href: "/plans", label: "Подписка" },
  { href: "/settings", label: "Настройки" },
] as const;

function TabIcon({ href }: { href: (typeof NAV)[number]["href"] }) {
  const pen = {
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.7,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };
  return (
    <svg viewBox="0 0 24 24" aria-hidden className="h-[26px] w-[26px]">
      {href === "/" ? (
        <>
          <circle cx="12" cy="12" r="7.25" {...pen} />
          <circle cx="12" cy="12" r="1.5" fill="currentColor" />
          <path d="M12 4.75v3M12 16.25v3M4.75 12h3M16.25 12h3" {...pen} />
        </>
      ) : null}
      {href === "/levels" ? (
        <path d="m12 3.5 2.2 4.7 5.1.6-3.8 3.5 1 5.1L12 15.2 7.5 17.4l1-5.1L4.7 8.8l5.1-.6L12 3.5Z" {...pen} />
      ) : null}
      {href === "/shop" ? (
        <>
          <path d="M6.5 8.5h11l-.8 11h-9.4l-.8-11Z" {...pen} />
          <path d="M9 8.5V7.2a3 3 0 0 1 6 0v1.3" {...pen} />
        </>
      ) : null}
      {href === "/settings" ? (
        <>
          <path d="M4 7h16M4 12h16M4 17h16" {...pen} />
          <circle cx="8" cy="7" r="1.7" fill="currentColor" />
          <circle cx="15" cy="12" r="1.7" fill="currentColor" />
          <circle cx="10" cy="17" r="1.7" fill="currentColor" />
        </>
      ) : null}
    </svg>
  );
}

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
      <div className="relative mx-auto flex min-h-full w-full max-w-5xl flex-col px-4 pt-6 pb-24 md:pb-6">
        {me?.background ? (
          <div
            aria-hidden
            className="pointer-events-none fixed inset-0 -z-10"
            style={{ background: backgroundGradient(me.background) }}
          />
        ) : null}
        <header className="flex flex-col gap-3 border-b border-line pb-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between md:gap-4">
            <div className="flex items-center gap-2">
              <Link href="/" data-sound="menu" className="font-display text-xl font-bold">
                PIMP YOUR WHEEL
              </Link>
              <span className="rounded-full border bg-white/20 border-line px-3 py-1 text-sm">
                {me ? PLAN_LABEL[me.plan] : "…"}
              </span>
            </div>
            <Link
              href="/profile"
              data-sound="menu"
              className={`flex w-full min-w-0 items-center gap-3 rounded-3xl border bg-white/5 px-4 py-3 md:w-auto ${
                pathname === "/profile" ? "border-accent" : "border-line"
              }`}
            >
              <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-white/10 text-2xl">
                {me?.avatar ?? "🎲"}
              </span>
              <span className="min-w-0 text-left">
                <span className="block truncate font-display text-base leading-tight">
                  {me ? profileLabel(me.displayName, me.email) : "…"}
                </span>
                <span className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted">
                  <span className="inline-flex items-center gap-1 text-sm">
                    <CoinIcon />
                    {me ? `${me.balance} монет` : "…"}
                  </span>
                  <span className="inline-flex items-center gap-1 text-sm">
                    <LevelIcon />
                    {me ? `Ур. ${me.level}` : "…"}
                  </span>
                  <span className="inline-flex items-center gap-1 text-sm">
                    <StreakIcon />
                    {me ? me.streak : "…"}
                  </span>
                </span>
              </span>
            </Link>
          </div>
          <nav className="hidden flex-wrap items-center justify-start gap-1 text-base md:flex">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                data-sound="menu"
                className={`rounded-full px-4 py-1.5 ${pathname === item.href ? "bg-white/10" : "text-muted"}`}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </header>
        {error ? <p className="mt-10 text-red-300">{error}</p> : null}
        {!error && !me ? <p className="mt-10 text-muted">Загрузка…</p> : null}
        {!error && me ? <main className="flex-1 py-8">{children}</main> : null}
      </div>
      <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-background/55 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden rounded-t-3xl pt-2">
        <div className="grid grid-cols-4 mb-2 space-between">
          {NAV.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                data-sound="menu"
                aria-current={active ? "page" : undefined}
                className={`flex flex-col items-center gap-1 px-1 py-2 text-[12px] leading-none ${
                  active ? "text-accent" : "text-muted"
                }`}
              >
                <TabIcon href={item.href} />
                {item.label}
              </Link>
            );
          })}
        </div>
      </nav>
    </MeContext.Provider>
  );
}
