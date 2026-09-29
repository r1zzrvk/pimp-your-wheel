"use client";

import { useState } from "react";
import { useMe } from "@/components/me-context";
import { Wheel } from "@/components/wheel";
import { animationBySlug, backgroundGradient, pointerBySlug } from "@/lib/economy";
import { LEGEND_HUB, paintSegments, UNLOCKS, WHEEL_SETS, wheelById, wheelLook } from "@/lib/wheels";

const ERROR_TEXT: Record<string, string> = {
  INSUFFICIENT_FUNDS: "Не хватает монет",
  ALREADY_OWNED: "Этот скин уже куплен",
  NOT_OWNED: "Сначала купите скин",
  NOT_FOUND: "Такого скина нет",
  NOT_FOR_SALE: "Этот фон открывается уровнем",
  BACKGROUND_LOCKED: "Этот фон ещё закрыт",
  THEME_LOCKED: "Тема откроется на 50 уровне",
  SHINE_LOCKED: "Анимация откроется на 25 уровне",
};

const LEGEND = UNLOCKS.find((item) => item.id === "legend");

const TABS = [
  { id: "wheel", label: "Колесо" },
  { id: "background", label: "Фон" },
  { id: "pointer", label: "Указатель" },
  { id: "animation", label: "Анимация" },
] as const;

type ShopTab = (typeof TABS)[number]["id"];

export function ShopScreen() {
  const { me, refresh } = useMe();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState<string | null>(null);
  const [tab, setTab] = useState<ShopTab>("wheel");

  if (!me) return null;

  async function buy(slug: string) {
    setPending(slug);
    setError(null);
    const response = await fetch("/api/shop/purchase", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cosmeticId: slug }),
    });
    const data = (await response.json()) as { error?: string };
    if (!response.ok) {
      setError(ERROR_TEXT[data.error ?? ""] ?? "Покупка не удалась");
    }
    await refresh();
    setPending(null);
  }

  async function equip(
    slug: string | null,
    kind: "wheel" | "pointer" | "background" | "animation" = "wheel",
  ) {
    setPending(slug ?? `unequip-${kind}`);
    setError(null);
    const response = await fetch("/api/inventory/equip", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cosmeticId: slug, kind }),
    });
    const data = (await response.json()) as { error?: string };
    if (!response.ok) {
      setError(ERROR_TEXT[data.error ?? ""] ?? "Не удалось надеть скин");
    }
    await refresh();
    setPending(null);
  }

  async function toggleLegend() {
    const current = me;
    if (!current || !LEGEND || current.level < LEGEND.level) return;
    setPending("legend");
    setError(null);
    const response = await fetch("/api/theme", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ enabled: !current.wheel.legendary }),
    });
    const data = (await response.json()) as { error?: string };
    if (!response.ok) {
      setError(ERROR_TEXT[data.error ?? ""] ?? "Не удалось сменить тему");
    }
    await refresh();
    setPending(null);
  }

  const previewSegments = wheelById(me.wheel.id).segments;
  const legendOpen = Boolean(LEGEND && me.level >= LEGEND.level);

  return (
    <section>
      <h1 className="font-display text-4xl">Магазин</h1>
      <p className="mt-3 max-w-xl text-muted">
        Колёса собраны в сеты: у каждого свой цвет и центр. «Легенда» и «Сияние» открываются с уровнем.
      </p>
      {error ? <p className="mt-4 text-sm text-red-300">{error}</p> : null}
      <div className="mt-6 flex flex-wrap gap-2">
        {TABS.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setTab(item.id)}
            className={`rounded-full border px-4 py-2 text-sm ${
              tab === item.id ? "border-accent text-accent" : "border-line text-muted"
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>
      <div className={tab === "wheel" ? "mt-8 space-y-8" : "hidden"}>
        {WHEEL_SETS.map((setName) => {
          const items = me.cosmetics
            .filter((item) => item.kind === "wheel" && wheelLook(item.slug).set === setName)
            .sort((a, b) => a.priceCoins - b.priceCoins);
          return (
            <section key={setName}>
              <h2 className="font-display text-lg text-muted">{setName}</h2>
              <ul className="mt-4 grid gap-4 md:grid-cols-3">
                {items.map((item) => {
          const look = wheelLook(item.slug);
          const worn = item.equipped && !me.wheel.legendary;
          const segments = paintSegments(wheelById(me.wheel.id).segments, item, false);
          const busy = pending === item.slug || pending === "unequip-wheel";
          return (
            <li key={item.slug} className="rounded-3xl border border-line bg-white/5 p-4">
              <div className="flex justify-center">
                <Wheel
                  segments={segments}
                  rotation={0}
                  spinning={false}
                  size={180}
                  pointer="triangle"
                  hub={look.emoji}
                  hubRim={look.rim}
                  hubFill={look.fill}
                  plate={look.plate}
                  peg={look.peg}
                />
              </div>
              <h2 className="mt-2 font-display text-xl">{item.name}</h2>
              <p className="mt-1 text-sm text-muted">{item.priceCoins} монет</p>
              <div className="mt-4 flex flex-wrap gap-2">
                {worn ? (
                  <>
                    <span className="rounded-full bg-white/10 px-4 py-2 text-sm">Надето</span>
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => void equip(null, "wheel")}
                      className="rounded-full border border-line px-4 py-2 text-sm disabled:opacity-50"
                    >
                      Снять
                    </button>
                  </>
                ) : null}
                {item.owned && !worn ? (
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => void equip(item.slug)}
                    className="rounded-full bg-accent px-4 py-2 text-sm text-[#1a1408] disabled:opacity-50"
                  >
                    Надеть
                  </button>
                ) : null}
                {!item.owned ? (
                  <button
                    type="button"
                    disabled={busy || me.balance < item.priceCoins}
                    onClick={() => void buy(item.slug)}
                    className="rounded-full bg-accent px-4 py-2 text-sm text-[#1a1408] disabled:cursor-not-allowed disabled:bg-white/10 disabled:text-muted"
                  >
                    Купить за {item.priceCoins}
                  </button>
                ) : null}
              </div>
            </li>
                );
                })}
              </ul>
            </section>
          );
        })}
        {LEGEND ? (
          <section>
            <h2 className="font-display text-lg text-muted">Легенда</h2>
            <ul className="mt-4 grid gap-4 md:grid-cols-3">
          <li className="rounded-3xl border border-line bg-white/5 p-4">
            <div className="flex justify-center">
              <Wheel
                segments={paintSegments(previewSegments, null, true)}
                rotation={0}
                spinning={false}
                size={180}
                hub={LEGEND_HUB.emoji}
                hubRim={LEGEND_HUB.rim}
                hubFill={LEGEND_HUB.fill}
                plate={LEGEND_HUB.plate}
                peg={LEGEND_HUB.peg}
              />
            </div>
            <h2 className="mt-2 font-display text-xl">Легенда</h2>
            {legendOpen ? (
              <div className="mt-4 flex flex-wrap gap-2">
                {me.wheel.legendary ? (
                  <>
                    <span className="rounded-full bg-white/10 px-4 py-2 text-sm">Надето</span>
                    <button
                      type="button"
                      disabled={pending === "legend"}
                      onClick={() => void toggleLegend()}
                      className="rounded-full border border-line px-4 py-2 text-sm disabled:opacity-50"
                    >
                      Снять
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    disabled={pending === "legend"}
                    onClick={() => void toggleLegend()}
                    className="rounded-full bg-accent px-4 py-2 text-sm text-[#1a1408] disabled:opacity-50"
                  >
                    Надеть
                  </button>
                )}
              </div>
            ) : (
              <p className="mt-4 flex items-center gap-2 text-sm text-muted">
                <span aria-hidden>🔒</span>
                Откроется на {LEGEND.level} уровне
              </p>
            )}
          </li>
            </ul>
          </section>
        ) : null}
      </div>
      <ul className={tab === "background" ? "mt-8 grid gap-4 md:grid-cols-3" : "hidden"}>
        {me.cosmetics
          .filter((item) => item.kind === "background")
          .sort((a, b) => a.minLevel - b.minLevel || a.priceCoins - b.priceCoins)
          .map((item) => {
            const locked = item.minLevel > 1 && me.level < item.minLevel;
            const busy = pending === item.slug || pending === "unequip-background";
            return (
              <li key={item.slug} className="rounded-3xl border border-line bg-white/5 p-4">
                <div
                  className="h-28 rounded-2xl border border-white/10"
                  style={{ background: backgroundGradient(item) }}
                />
                <h2 className="mt-2 font-display text-xl">{item.name}</h2>
                <p className="mt-1 text-sm text-muted">
                  {item.minLevel > 1 ? `Уровень ${item.minLevel}` : `${item.priceCoins} монет`}
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {locked ? (
                    <p className="flex items-center gap-2 text-sm text-muted">
                      <span aria-hidden>🔒</span>
                      Откроется на {item.minLevel} уровне
                    </p>
                  ) : null}
                  {!locked && item.equipped ? (
                    <>
                      <span className="rounded-full bg-white/10 px-4 py-2 text-sm">Надето</span>
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => void equip(null, "background")}
                        className="rounded-full border border-line px-4 py-2 text-sm disabled:opacity-50"
                      >
                        Снять
                      </button>
                    </>
                  ) : null}
                  {!locked && item.owned && !item.equipped ? (
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => void equip(item.slug, "background")}
                      className="rounded-full bg-accent px-4 py-2 text-sm text-[#1a1408] disabled:opacity-50"
                    >
                      Надеть
                    </button>
                  ) : null}
                  {!locked && !item.owned ? (
                    <button
                      type="button"
                      disabled={busy || me.balance < item.priceCoins}
                      onClick={() => void buy(item.slug)}
                      className="rounded-full bg-accent px-4 py-2 text-sm text-[#1a1408] disabled:cursor-not-allowed disabled:bg-white/10 disabled:text-muted"
                    >
                      Купить за {item.priceCoins}
                    </button>
                  ) : null}
                </div>
              </li>
            );
          })}
      </ul>
      <ul className={tab === "pointer" ? "mt-8 grid gap-4 md:grid-cols-3" : "hidden"}>
        {me.cosmetics
          .filter((item) => item.kind === "pointer")
          .sort((a, b) => a.minLevel - b.minLevel || a.priceCoins - b.priceCoins)
          .map((item) => {
            const locked = item.minLevel > 1 && me.level < item.minLevel;
            const busy = pending === item.slug || pending === "unequip-pointer";
            return (
              <li key={item.slug} className="rounded-3xl border border-line bg-white/5 p-4">
                <div className="flex justify-center">
                  <Wheel
                    segments={paintSegments(previewSegments, null, false)}
                    rotation={0}
                    spinning={false}
                    size={180}
                    pointer={pointerBySlug(item.slug)?.emoji ?? "triangle"}
                  />
                </div>
                <h2 className="mt-2 font-display text-xl">{item.name}</h2>
                <p className="mt-1 text-sm text-muted">
                  {item.minLevel > 1 ? `Уровень ${item.minLevel}` : `${item.priceCoins} монет`}
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {locked ? (
                    <p className="flex items-center gap-2 text-sm text-muted">
                      <span aria-hidden>🔒</span>
                      Откроется на {item.minLevel} уровне
                    </p>
                  ) : null}
                  {!locked && item.equipped ? (
                    <>
                      <span className="rounded-full bg-white/10 px-4 py-2 text-sm">Надето</span>
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => void equip(null, "pointer")}
                        className="rounded-full border border-line px-4 py-2 text-sm disabled:opacity-50"
                      >
                        Снять
                      </button>
                    </>
                  ) : null}
                  {!locked && item.owned && !item.equipped ? (
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => void equip(item.slug, "pointer")}
                      className="rounded-full bg-accent px-4 py-2 text-sm text-[#1a1408] disabled:opacity-50"
                    >
                      Надеть
                    </button>
                  ) : null}
                  {!locked && !item.owned ? (
                    <button
                      type="button"
                      disabled={busy || me.balance < item.priceCoins}
                      onClick={() => void buy(item.slug)}
                      className="rounded-full bg-accent px-4 py-2 text-sm text-[#1a1408] disabled:cursor-not-allowed disabled:bg-white/10 disabled:text-muted"
                    >
                      Купить за {item.priceCoins}
                    </button>
                  ) : null}
                </div>
              </li>
            );
          })}
      </ul>
      <div className={tab === "animation" ? "mt-8" : "hidden"}>
        <p className="mb-4 text-sm text-muted">Если ничего не надето, на крутке белое свечение.</p>
      <ul className="grid gap-4 md:grid-cols-3">
        {me.cosmetics
          .filter((item) => item.kind === "animation")
          .sort((a, b) => a.minLevel - b.minLevel || a.priceCoins - b.priceCoins)
          .map((item) => {
            const locked = item.minLevel > 1 && me.level < item.minLevel;
            const busy = pending === item.slug || pending === "unequip-animation";
            return (
              <li key={item.slug} className="rounded-3xl border border-line bg-white/5 p-4">
                <div className="flex justify-center">
                  <Wheel
                    segments={paintSegments(previewSegments, null, false)}
                    rotation={0}
                    spinning={false}
                    size={180}
                    glow={animationBySlug(item.slug)?.glow}
                  />
                </div>
                <h2 className="mt-2 font-display text-xl">{item.name}</h2>
                <p className="mt-1 text-sm text-muted">
                  {item.minLevel > 1 ? `Уровень ${item.minLevel}` : `${item.priceCoins} монет`}
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {locked ? (
                    <p className="flex items-center gap-2 text-sm text-muted">
                      <span aria-hidden>🔒</span>
                      Откроется на {item.minLevel} уровне
                    </p>
                  ) : null}
                  {!locked && item.equipped ? (
                    <>
                      <span className="rounded-full bg-white/10 px-4 py-2 text-sm">Надето</span>
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => void equip(null, "animation")}
                        className="rounded-full border border-line px-4 py-2 text-sm disabled:opacity-50"
                      >
                        Снять
                      </button>
                    </>
                  ) : null}
                  {!locked && item.owned && !item.equipped ? (
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => void equip(item.slug, "animation")}
                      className="rounded-full bg-accent px-4 py-2 text-sm text-[#1a1408] disabled:opacity-50"
                    >
                      Надеть
                    </button>
                  ) : null}
                  {!locked && !item.owned ? (
                    <button
                      type="button"
                      disabled={busy || me.balance < item.priceCoins}
                      onClick={() => void buy(item.slug)}
                      className="rounded-full bg-accent px-4 py-2 text-sm text-[#1a1408] disabled:cursor-not-allowed disabled:bg-white/10 disabled:text-muted"
                    >
                      Купить за {item.priceCoins}
                    </button>
                  ) : null}
                </div>
              </li>
            );
          })}
      </ul>
      </div>
    </section>
  );
}
