"use client";

import { useEffect, useState } from "react";
import { logoutAction } from "@/app/logout-action";
import { playButton, setSoundsEnabled, soundsEnabled } from "@/lib/sounds";

export function SettingsScreen() {
  const [on, setOn] = useState(true);

  useEffect(() => {
    setOn(soundsEnabled());
  }, []);

  function toggle() {
    const next = !on;
    setSoundsEnabled(next);
    setOn(next);
    if (next) playButton();
  }

  return (
    <section className="mx-auto max-w-xl">
      <h1 className="font-display text-4xl">Настройки</h1>
      <p className="mt-3 text-muted">Звуки рулетки, кнопок и меню.</p>
      <button
        type="button"
        data-sound="none"
        onClick={toggle}
        className="mt-8 flex w-full items-center justify-between rounded-2xl border border-line px-5 py-4 text-left"
      >
        <span>Звуки</span>
        <span className={on ? "text-accent" : "text-muted"}>{on ? "Включены" : "Выключены"}</span>
      </button>
      <form action={logoutAction} className="mt-8">
        <button
          type="submit"
          className="rounded-full border border-red-300/40 px-5 py-2 text-sm text-red-300"
        >
          Выйти
        </button>
      </form>
    </section>
  );
}
