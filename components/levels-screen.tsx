"use client";

import { useState } from "react";
import { useMe } from "@/components/me-context";
import { LEVEL_LIST_CAP, levelPayout, levelSteps, XP_PER_SPIN } from "@/lib/progress";

const PAGE_SIZE = 5;

export function LevelsScreen() {
  const { me } = useMe();
  const [shown, setShown] = useState(PAGE_SIZE);

  if (!me) return null;
  const rewards = new Map(me.unlocks.map((item) => [item.level, item.title]));
  const rows = levelSteps(Math.max(LEVEL_LIST_CAP, me.level)).filter((row) => row.level >= me.level);
  const visible = rows.slice(0, shown);

  return (
    <section className="mx-auto max-w-xl">
      <h1 className="font-display text-4xl">Уровни и награды</h1>
      <p className="mt-3 text-muted">Продвигайся дальше, открывай новые уровни и забирай награды.</p>
      <ol className="mt-8 space-y-2">
        {visible.map((row) => {
          const current = row.level === me.level;
          const reached = row.level <= me.level;
          const reward = rewards.get(row.level);
          const payout = levelPayout(row.level);
          return (
            <li
              key={row.level}
              className={`rounded-2xl border px-4 py-3 ${
                current ? "border-accent" : "border-line"
              } ${reached ? "" : "text-muted"}`}
            >
              <div className="flex items-center justify-between gap-3">
                <span className={`font-display text-lg ${current ? "text-accent" : ""}`}>
                  Уровень {row.level}
                </span>
                <span className="text-sm text-muted">
                  {current ? "Сейчас" : reached ? "Открыт" : `ещё ${row.xp - me.xp} XP`}
                </span>
              </div>
              <p className="mt-1 text-sm text-muted">{row.xp.toLocaleString("ru-RU")} XP</p>
              {reward ? <p className="mt-1 text-sm">{reward}</p> : null}
              {payout ? (
                <p className="mt-1 text-sm">
                  {payout.coins} монет и {payout.xp} XP
                </p>
              ) : null}
            </li>
          );
        })}
      </ol>
      {shown < rows.length ? (
        <button
          type="button"
          onClick={() => setShown((count) => count + PAGE_SIZE)}
          className="mt-4 w-full rounded-full border border-line px-5 py-3 text-sm"
        >
          Показать еще
        </button>
      ) : null}
    </section>
  );
}
