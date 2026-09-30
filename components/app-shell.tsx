"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { Icon, type IconName } from "@/components/icon";
import { MeContext } from "@/components/me-context";
import { OnboardingTour } from "@/components/onboarding-tour";
import { backgroundGradient } from "@/lib/economy";
import { profileLabel } from "@/lib/profile";
import { playAchievement } from "@/lib/sounds";
import type { AchievementUnlock, MeResponse } from "@/lib/types";

const PLAN_LABEL = {
  FREE: "Free",
  BASIC: "Basic",
  PRO: "Pro",
} as const;

const NAV: ReadonlyArray<{ href: "/" | "/levels" | "/shop"; label: string; icon: IconName }> = [
  { href: "/", label: "Главная", icon: "dharmachakra" },
  { href: "/levels", label: "Уровни", icon: "ranking-star" },
  { href: "/shop", label: "Магазин", icon: "shop" },
];

export function AppShell({
  initialMe,
  children,
}: {
  initialMe: MeResponse;
  children: React.ReactNode;
}) {
  const [me, setMe] = useState<MeResponse | null>(initialMe);
  const [error, setError] = useState<string | null>(null);
  const [toasts, setToasts] = useState<AchievementUnlock[]>([]);
  const pathname = usePathname();
  const router = useRouter();

  const guest = initialMe.guest;

  const refresh = useCallback(async () => {
    if (guest) return;
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
  }, [guest, router]);

  const patch = useCallback((partial: Partial<MeResponse>) => {
    setMe((current) => (current ? { ...current, ...partial } : current));
  }, []);

  const announce = useCallback((items: AchievementUnlock[]) => {
    if (items.length === 0) return;
    const unlockedAt = new Date().toISOString();
    setToasts((current) => [...current, ...items]);
    setMe((current) => {
      if (!current) return current;
      const ids = new Set(items.map((item) => item.id));
      const achievements = current.achievements.map((item) =>
        ids.has(item.id) ? { ...item, unlocked: true, unlockedAt } : item,
      );
      for (const item of items) {
        if (achievements.some((row) => row.id === item.id)) continue;
        achievements.push({
          ...item,
          description: "",
          metric: "SPINS",
          threshold: 0,
          unlocked: true,
          unlockedAt,
        });
      }
      return { ...current, achievements };
    });
  }, []);

  const toast = toasts[0] ?? null;
  useEffect(() => {
    if (!toast) return;
    playAchievement();
    const timer = window.setTimeout(() => {
      setToasts((current) => current.slice(1));
    }, 3400);
    return () => window.clearTimeout(timer);
  }, [toast]);

  return (
    <MeContext.Provider value={{ me, refresh, patch, announce }}>
      <OnboardingTour email={guest ? null : initialMe.email}>
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
              {me && !me.guest ? (
                <span className="rounded-full border bg-white/20 border-line px-3 py-1 text-sm">
                  {PLAN_LABEL[me.plan]}
                </span>
              ) : null}
            </div>
            {me?.guest ? (
              <Link
                href="/login"
                data-sound="menu"
                className="inline-flex items-center justify-center rounded-full bg-accent px-6 py-3 font-display text-base text-[#1a1408]"
              >
                Войти
              </Link>
            ) : (
            <Link
              href="/profile"
              data-tour="profile"
              data-sound="menu"
              className={`flex w-full min-w-0items-center gap-3 rounded-3xl border bg-white/5 px-4 py-3 md:w-auto ${
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
                <span className="mt-2 flex flex-wrap items-center gap-x-5 gap-y-1 text-xs text-muted">
                  <span className="inline-flex items-center gap-1 text-sm">
                    <Icon name="currency" weight="solid" size={16} className="text-accent" />
                    {me ? `${me.balance}` : "…"}
                  </span>
                  <span className="inline-flex items-center gap-1 text-sm">
                    <Icon name="up" weight="solid" size={16} className="text-[#e7d3a1]" />
                    {me ? `${me.level} lvl` : "…"}
                  </span>
                  <span className="inline-flex items-center gap-1 text-sm">
                    <Icon name="flame" weight="solid" size={16} className="text-orange-500" />
                    {me ? me.streak : "…"}
                  </span>
                </span>
              </span>
            </Link>
            )}
          </div>
          <nav data-tour="nav" className="hidden flex-wrap items-center justify-start gap-1 rounded-3xl text-base md:flex">
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
      <nav data-tour="nav" className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-background/55 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden rounded-t-3xl pt-2">
        <div className="mb-2 grid grid-cols-3">
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
                <Icon name={item.icon} weight={active ? "solid" : "regular"} size={20} />
                {item.label}
              </Link>
            );
          })}
        </div>
      </nav>
      </OnboardingTour>
    </MeContext.Provider>
  );
}
