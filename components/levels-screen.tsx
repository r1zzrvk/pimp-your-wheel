"use client";

import { useEffect, useRef } from "react";
import { useMe } from "@/components/me-context";
import { LEVEL_LIST_CAP, levelSteps, XP_PER_SPIN } from "@/lib/progress";

export function LevelsScreen() {
  const { me } = useMe();
  const currentRef = useRef<HTMLLIElement>(null);

  useEffect(() => {
    currentRef.current?.scrollIntoView({ block: "center" });
  }, [me?.level]);

  if (!me) return null;
  const rewards = new Map(me.unlocks.map((item) => [item.level, item.title]));
  const rows = levelSteps(Math.max(LEVEL_LIST_CAP, me.level));

  return (
    <section className="mx-auto max-w-xl">
      <h1 className="font-display text-4xl">Уровни</h1>
      <p className="mt-3 text-muted">Каждая крутка даёт {XP_PER_SPIN} XP. Сейчас уровень {me.level}.</p>
      <ol className="mt-8 space-y-2">
        {rows.map((row) => {
          const current = row.level === me.level;
          const reached = row.level <= me.level;
          const reward = rewards.get(row.level);
          return (
            <li
              key={row.level}
              ref={current ? currentRef : undefined}
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
            </li>
          );
        })}
      </ol>
    </section>
  );
}
