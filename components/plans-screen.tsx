"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMe } from "@/components/me-context";
import type { BillingView } from "@/lib/billing";
import type { PaidPlanId } from "@/lib/economy";
import { closePaymentWindow, goToPayment, openPaymentWindow } from "@/lib/payment-window";

const ERROR_TEXT: Record<string, string> = {
  PAYMENTS_UNAVAILABLE: "Оплата ещё не настроена",
  UNKNOWN_PLAN: "Такого плана нет",
  NO_CUSTOMER: "Подписки ещё не было",
  CHECKOUT_FAILED: "Не удалось открыть оплату",
};

export function PlansScreen({
  initial,
  checkout,
}: {
  initial: BillingView;
  checkout?: string;
}) {
  const { refresh } = useMe();
  const router = useRouter();
  const [billing, setBilling] = useState(initial);
  const [pending, setPending] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(
    checkout === "success"
      ? "Если оплата прошла, план обновится в течение минуты."
      : checkout === "cancel"
        ? "Оплата отменена. План не изменился."
        : null,
  );

  async function choose(plan: PaidPlanId) {
    const paymentWindow = openPaymentWindow();
    setPending(plan);
    setError(null);
    const response = await fetch("/api/billing/checkout", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ plan }),
    });
    const data = (await response.json()) as {
      url?: string;
      updated?: boolean;
      plan?: BillingView["plan"];
      error?: string;
    };
    if (!response.ok) {
      closePaymentWindow(paymentWindow);
      setError(ERROR_TEXT[data.error ?? ""] ?? "Не удалось сменить план");
      setPending(null);
      return;
    }
    if (data.url) {
      goToPayment(paymentWindow, data.url);
      setPending(null);
      return;
    }
    closePaymentWindow(paymentWindow);
    if (data.plan) {
      setBilling((current) => ({
        ...current,
        plan: data.plan ?? current.plan,
        offers: current.offers.map((offer) => ({
          ...offer,
          current: offer.id === data.plan,
        })),
      }));
    }
    setNotice("План обновлён");
    await refresh();
    router.refresh();
    setPending(null);
  }

  async function manage() {
    const paymentWindow = openPaymentWindow();
    setPending("portal");
    setError(null);
    const response = await fetch("/api/billing/portal", { method: "POST" });
    const data = (await response.json()) as { url?: string; error?: string };
    if (!response.ok || !data.url) {
      closePaymentWindow(paymentWindow);
      setError(ERROR_TEXT[data.error ?? ""] ?? "Портал оплаты недоступен");
      setPending(null);
      return;
    }
    goToPayment(paymentWindow, data.url);
    setPending(null);
  }

  async function sync() {
    setPending("sync");
    setError(null);
    const response = await fetch("/api/billing/sync", { method: "POST" });
    if (!response.ok) {
      const data = (await response.json()) as { error?: string };
      setError(ERROR_TEXT[data.error ?? ""] ?? "Не удалось обновить статус");
      setPending(null);
      return;
    }
    setBilling((await response.json()) as BillingView);
    await refresh();
    setNotice(null);
    setPending(null);
  }

  return (
    <section>
      <h1 className="font-display text-4xl">Подписка</h1>
      <p className="mt-3 max-w-xl text-muted">
        План задаёт, сколько раз в сутки можно крутить. Монеты остаются в игре, скин покупается за них.
      </p>
      {notice ? <p className="mt-4 text-sm text-accent">{notice}</p> : null}
      {error ? <p className="mt-4 text-sm text-red-300">{error}</p> : null}
      {!billing.configured ? (
        <p className="mt-4 max-w-xl text-sm text-muted">
          Stripe ещё не подключён: кнопки оплаты заработают после ключей в окружении. Лимиты планов уже считаются на сервере.
        </p>
      ) : null}
      <ul className="mt-8 grid gap-4 md:grid-cols-3">
        {billing.offers.map((offer) => (
          <li
            key={offer.id}
            className={`rounded-3xl border p-5 ${offer.current ? "border-accent bg-accent/10" : "border-line bg-white/5"}`}
          >
            <p className="text-sm text-muted">{offer.detail}</p>
            <h2 className="mt-2 font-display text-2xl">{offer.title}</h2>
            <p className="mt-3 font-display text-3xl">{offer.priceLabel}</p>
            <p className="mt-2 text-muted">{offer.spins} круток в сутки</p>
            {offer.current ? (
              <p className="mt-6 text-sm">Текущий план</p>
            ) : offer.id === "FREE" ? (
              <p className="mt-6 text-sm text-muted">Отмена подписки возвращает сюда</p>
            ) : (
              <button
                type="button"
                disabled={!billing.configured || pending !== null}
                onClick={() => void choose(offer.id as PaidPlanId)}
                className="mt-6 rounded-full bg-accent px-4 py-2 text-sm text-[#1a1408] disabled:cursor-not-allowed disabled:bg-white/10 disabled:text-muted"
              >
                {pending === offer.id ? "Открываем…" : `Перейти на ${offer.title}`}
              </button>
            )}
          </li>
        ))}
      </ul>
      {billing.configured ? (
        <div className="mt-6 flex flex-wrap gap-3">
          {billing.canManage ? (
            <button
              type="button"
              disabled={pending !== null}
              onClick={() => void manage()}
              className="rounded-full border border-line px-4 py-2 text-sm disabled:opacity-50"
            >
              Управление оплатой
            </button>
          ) : null}
          <button
            type="button"
            disabled={pending !== null}
            onClick={() => void sync()}
            className="rounded-full border border-line px-4 py-2 text-sm disabled:opacity-50"
          >
            Обновить статус
          </button>
        </div>
      ) : null}
    </section>
  );
}
