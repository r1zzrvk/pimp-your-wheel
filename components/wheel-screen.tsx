"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ResetCountdown } from "@/components/reset-countdown";
import { useMe } from "@/components/me-context";
import { Wheel } from "@/components/wheel";
import { LIMIT_RESET_LABEL } from "@/lib/economy";
import { closePaymentWindow, goToPayment, openPaymentWindow } from "@/lib/payment-window";
import type { SpinResponse } from "@/lib/types";
import { playBonus, playCoinWin, playLoss, playSpinWhoosh, primeSounds } from "@/lib/sounds";
import { nextSpinRotation } from "@/lib/wheel";

const ERROR_TEXT: Record<string, string> = {
  LIMIT_REACHED: "Крутки на сегодня закончились",
  WHEEL_LOCKED: "Эта рулетка ещё закрыта",
  UNKNOWN_WHEEL: "Такой рулетки нет",
  UNAUTHORIZED: "Нужно войти снова",
  PAYMENTS_UNAVAILABLE: "Оплата ещё не настроена",
  SPINS_REMAINING: "Крутки ещё остались",
  CHECKOUT_FAILED: "Не удалось открыть оплату",
};

function spinResultLabel(coins: number, extraSpins: number) {
  if (extraSpins === 1) return "+ 1 фриспин";
  if (extraSpins > 1) return `+ ${extraSpins} фриспина`;
  if (coins < 0) return `−${-coins} монет`;
  if (coins === 0) return "Монет не осталось";
  return `Выиграно ${coins} монет`;
}

export function WheelScreen({
  resetNotice,
}: {
  resetNotice?: "success" | "cancel" | null;
}) {
  const { me, refresh, patch } = useMe();
  const rotationRef = useRef(0);
  const pendingLabel = useRef<string | null>(null);
  const pendingCoins = useRef(0);
  const pendingSpins = useRef(0);
  const pendingTone = useRef<"success" | "error">("success");
  const popupId = useRef(0);
  const elapsedLock = useRef(false);
  const [rotation, setRotation] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [resultTone, setResultTone] = useState<"success" | "error">("success");
  const [error, setError] = useState<string | null>(null);
  const [wheelSize, setWheelSize] = useState(340);

  useEffect(() => {
    const query = window.matchMedia("(max-width: 767px)");
    const apply = () => setWheelSize(query.matches ? 280 : 340);
    apply();
    query.addEventListener("change", apply);
    return () => query.removeEventListener("change", apply);
  }, []);
  const [resetting, setResetting] = useState(false);
  const [skipAnimation, setSkipAnimation] = useState(false);
  const [xpVisible, setXpVisible] = useState(true);
  const [switching, setSwitching] = useState(false);
  const [notice] = useState<string | null>(
    resetNotice === "success"
      ? "Лимит сброшен. Можно крутить снова."
      : resetNotice === "cancel"
        ? "Оплата отменена."
        : null,
  );

  useEffect(() => {
    elapsedLock.current = false;
  }, [me?.nextResetAt]);

  useEffect(() => {
    if (resetNotice === "success") void refresh();
  }, [resetNotice, refresh]);

  useEffect(() => {
    if (spinning) return;
    const id = window.setTimeout(() => setXpVisible(false), 30_000);
    return () => window.clearTimeout(id);
  }, [spinning]);

  if (!me) return null;
  const profile = me;

  async function chooseWheel(wheelId: string) {
    if (switching || spinning || busy) return;
    setSwitching(true);
    setError(null);
    const response = await fetch("/api/wheels", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ wheelId }),
    });
    const data = (await response.json()) as { error?: string };
    if (!response.ok) {
      setError(ERROR_TEXT[data.error ?? ""] ?? "Не удалось сменить рулетку");
      setSwitching(false);
      return;
    }
    rotationRef.current = 0;
    setRotation(0);
    await refresh();
    setSwitching(false);
  }

  async function buyReset() {
    if (resetting || profile.spinsLeft > 0) return;
    const paymentWindow = openPaymentWindow();
    setResetting(true);
    setError(null);
    const response = await fetch("/api/billing/reset", { method: "POST" });
    const data = (await response.json()) as { url?: string; error?: string };
    if (!response.ok || !data.url) {
      closePaymentWindow(paymentWindow);
      setError(ERROR_TEXT[data.error ?? ""] ?? "Не удалось открыть оплату");
      setResetting(false);
      return;
    }
    goToPayment(paymentWindow, data.url);
    setResetting(false);
  }

  async function spin() {
    if (busy || spinning || profile.spinsLeft <= 0) return;
    primeSounds();
    setBusy(true);
    setError(null);
    setResult(null);
    const response = await fetch("/api/spins", { method: "POST" });
    const data = (await response.json()) as SpinResponse & { error?: string };
    if (!response.ok) {
      setError(ERROR_TEXT[data.error ?? ""] ?? "Крутка не удалась");
      setBusy(false);
      await refresh();
      return;
    }

    const cell = Number(profile.wheel.segments[data.segmentIndex]?.label);
    if (Number.isInteger(cell) && cell < 0) {
      pendingTone.current = "error";
      pendingLabel.current = `- ${-cell} монет`;
      pendingCoins.current = 0;
      pendingSpins.current = 0;
    } else {
      pendingTone.current = "success";
      pendingLabel.current = spinResultLabel(data.coins, data.extraSpins);
      pendingCoins.current = data.coins;
      pendingSpins.current = data.extraSpins;
    }
    patch({
      balance: data.balance,
      spinsLeft: data.spinsLeft,
      spinsUsed: data.spinsLimit - data.spinsLeft,
      nextResetAt: data.nextResetAt,
      streak: data.streak,
      xp: data.xp,
      level: data.level,
      xpIntoLevel: data.xpIntoLevel,
      xpForNext: data.xpForNext,
      guaranteedJackpot: data.guaranteedJackpot,
    });
    setXpVisible(true);
    setSpinning(true);
    playSpinWhoosh(skipAnimation);
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const next = nextSpinRotation(
          rotationRef.current,
          data.segmentIndex,
          profile.wheel.segments.length,
          skipAnimation ? 0 : 5,
        );
        rotationRef.current = next;
        setRotation(next);
      });
    });
  }

  return (
    <section className="mx-auto flex max-w-xl flex-col items-center text-center">
      <p className="text-xl uppercase tracking-[0.2em] text-muted">
        {profile.wheel.name}
        {profile.wheel.skinName ? ` · ${profile.wheel.skinName}` : ""}
      </p>
      <p className="mt-3 text-muted">
        Осталось {profile.spinsLeft} из {profile.spinsLimit}
      </p>
      
      <label className="relative mt-4 block w-full max-w-xs">
        <span className="sr-only">Рулетка</span>
        <select
          value={profile.wheel.id}
          disabled={switching || spinning}
          onChange={(event) => {
            const next = event.target.value;
            if (next !== profile.wheel.id) void chooseWheel(next);
          }}
          className="w-full appearance-none rounded-full border border-line bg-black/30 px-4 py-2.5 pr-10 text-base text-foreground scheme-dark disabled:opacity-50"
        >
          {profile.wheels.map((item) => (
            <option key={item.id} value={item.id} disabled={!item.unlocked}>
              {item.unlocked ? item.name : `${item.name} · ${item.minLevel} ур.`}
            </option>
          ))}
        </select>
        <span aria-hidden className="pointer-events-none absolute inset-y-0 right-4 grid place-items-center text-muted">
          ▾
        </span>
      </label>
      {profile.guaranteedJackpot ? (
        <p className="mt-3 text-sm text-accent">Первая крутка сегодня — 100 монет</p>
      ) : null}
      <div className="mt-8 flex w-full max-w-[340px] flex-col items-center">
        <div
          aria-hidden={!xpVisible}
          className={`grid transition-all duration-700 ease-out ${
            xpVisible ? "mb-3 grid-rows-[1fr] opacity-100" : "mb-0 grid-rows-[0fr] opacity-0"
          }`}
        >
          <div className={`overflow-hidden text-left ${xpVisible ? "" : "pointer-events-none"}`}>
            <div className="flex justify-between text-sm text-muted">
              <Link href="/levels" data-sound="menu" className="hover:text-accent">
                Уровень {profile.level}
              </Link>
              <span>Серия {profile.streak} дн.</span>
            </div>
            <Link
              href="/levels"
              data-sound="menu"
              aria-label="Все уровни"
              className="mt-2 block h-2 overflow-hidden rounded-full bg-white/10"
            >
              <div
                className="h-full bg-accent"
                style={{
                  width: `${Math.min(100, (profile.xpIntoLevel / profile.xpForNext) * 100)}%`,
                }}
              />
            </Link>
            <p className="mt-1 text-xs text-muted">
              {profile.xpIntoLevel}/{profile.xpForNext} XP
            </p>
          </div>
        </div>
        <Wheel
          size={wheelSize}
          segments={profile.wheel.segments}
          rotation={rotation}
          spinning={spinning}
          quick={skipAnimation}
          glow={spinning ? profile.wheel.glow : undefined}
          pointer={profile.wheel.pointer}
          hub={profile.wheel.hub}
          hubRim={profile.wheel.hubRim}
          hubFill={profile.wheel.hubFill}
          plate={profile.wheel.plate}
          peg={profile.wheel.peg}
          disabled={busy || spinning || profile.spinsLeft <= 0}
          onPress={() => void spin()}
          onSpinEnd={() => {
            if (!spinning) return;
            setSpinning(false);
            setBusy(false);
            const label = pendingLabel.current;
            if (!label) return;
            if (pendingTone.current === "error") playLoss();
            else if (pendingSpins.current > 0) playBonus();
            else if (pendingCoins.current > 0) playCoinWin();
            const id = ++popupId.current;
            setResultTone(pendingTone.current);
            setResult(label);
            window.setTimeout(() => {
              if (popupId.current === id) setResult(null);
            }, 1000);
          }}
        />
      </div>
      {result ? (
        <div className="pointer-events-none fixed inset-0 z-50 grid place-items-center">
          <p
            className={`rounded-2xl px-6 py-4 font-display text-xl text-white shadow-2xl ${
              resultTone === "error" ? "bg-red-500" : "bg-emerald-500"
            }`}
          >
            {result}
          </p>
        </div>
      ) : null}
      {profile.spinsLeft <= 0 ? (
        <div className="mt-6 flex flex-col items-center gap-3">
          <ResetCountdown
            nextResetAt={profile.nextResetAt}
            onElapsed={() => {
              if (elapsedLock.current) return;
              elapsedLock.current = true;
              void refresh();
            }}
          />
          <button
            type="button"
            onClick={() => void buyReset()}
            disabled={resetting || !profile.resetAvailable}
            className="rounded-full border border-accent px-6 py-3 text-sm text-accent disabled:cursor-not-allowed disabled:border-line disabled:text-muted"
          >
            {resetting ? "Открываем оплату…" : `Сбросить лимит за ${LIMIT_RESET_LABEL}`}
          </button>
        </div>
      ) : null}
      {notice ? (
        <p
          className={`mt-4 text-sm ${notice === "Оплата отменена." ? "text-muted" : "text-emerald-300"}`}
        >
          {notice}
        </p>
      ) : null}
      {error ? <p className="mt-4 text-sm text-red-300">{error}</p> : null}
      <label className="mt-6 flex items-center gap-2 text-sm text-muted w-full sm:w-auto">
        <span className="grid size-4 shrink-0 place-items-center">
          <input
            type="checkbox"
            checked={skipAnimation}
            onChange={(event) => setSkipAnimation(event.target.checked)}
            className="peer col-start-1 row-start-1 size-4 appearance-none rounded-[3px] border border-[#6f675c] bg-[#3a342c] checked:border-accent checked:bg-accent"
          />
          <svg
            viewBox="0 0 16 16"
            aria-hidden
            className="pointer-events-none col-start-1 row-start-1 hidden h-3 w-3 peer-checked:block"
          >
            <path
              d="M3.2 8.2 6.4 11.4 12.8 4.6"
              fill="none"
              stroke="#1a1408"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>
        Пропустить анимацию
      </label>
      <button
        type="button"
        onClick={() => void spin()}
        disabled={busy || spinning || profile.spinsLeft <= 0}
        className="w-full sm:w-auto mt-3 rounded-full bg-accent px-10 py-4 font-display text-lg text-[#1a1408] disabled:cursor-not-allowed disabled:bg-white/10 disabled:text-muted"
      >
        {spinning ? "Крутится…" : profile.spinsLeft <= 0 ? "Лимит на сегодня" : "Крутить"}
      </button>
    </section>
  );
}
