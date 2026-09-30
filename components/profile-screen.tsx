"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { logoutAction } from "@/app/logout-action";
import { Icon } from "@/components/icon";
import { useMe } from "@/components/me-context";
import { achievementGoal } from "@/lib/achievement-rules";
import { AVATARS } from "@/lib/profile";
import { playButton, setSoundsEnabled, soundsEnabled, subscribeSounds } from "@/lib/sounds";

const ERROR_TEXT: Record<string, string> = {
  NAME_TOO_LONG: "Имя не длиннее 24 символов",
  BAD_AVATAR: "Выбери аватар из набора",
};

export function ProfileScreen() {
  const { me, patch } = useMe();
  const [name, setName] = useState(me?.displayName ?? "");
  const [avatar, setAvatar] = useState(me?.avatar ?? "🎲");
  const [picker, setPicker] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(true);
  const sounds = useSyncExternalStore(subscribeSounds, soundsEnabled, () => true);
  const pickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!picker) return;
    function close(event: PointerEvent) {
      if (!pickerRef.current?.contains(event.target as Node)) setPicker(false);
    }
    document.addEventListener("pointerdown", close);
    return () => document.removeEventListener("pointerdown", close);
  }, [picker]);

  if (!me) return null;

  async function save() {
    setPending(true);
    setError(null);
    setSaved(false);
    const response = await fetch("/api/profile", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ displayName: name, avatar }),
    });
    const data = (await response.json()) as { error?: string; displayName?: string; avatar?: string };
    setPending(false);
    if (!response.ok) {
      setError(ERROR_TEXT[data.error ?? ""] ?? "Не удалось сохранить профиль");
      return;
    }
    patch({ displayName: data.displayName ?? "", avatar: data.avatar ?? avatar });
    setSaved(true);
    setPicker(false);
  }

  function toggleSounds() {
    const next = !sounds;
    setSoundsEnabled(next);
    if (next) playButton();
  }

  return (
    <section className="mx-auto flex w-full max-w-xl flex-col gap-4">
      <div ref={pickerRef} className="rounded-3xl border border-line bg-white/5 p-4 sm:p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <button
            type="button"
            aria-expanded={picker}
            aria-label="Сменить аватар"
            onClick={() => setPicker((open) => !open)}
            className="mx-auto grid size-20 shrink-0 place-items-center rounded-full border border-line bg-white/10 text-4xl sm:mx-0 sm:size-16 sm:text-3xl"
          >
            {avatar}
          </button>
          <div className="min-w-0 flex-1">
            {/* <p className="truncate text-center text-sm text-muted sm:text-left">{me.email}</p> */}
            <label className="block text-sm text-muted">
              Имя
              <input
                value={name}
                maxLength={24}
                onChange={(event) => {
                  setName(event.target.value);
                  setSaved(false);
                }}
                placeholder="Как тебя называть"
                className="mt-2 w-full rounded-2xl border border-line bg-black/30 px-4 py-3 text-base text-foreground"
              />
            </label>
          </div>
          {pending || saved ? null : (
          <button
            type="button"
            disabled={pending || saved}
            onClick={() => void save()}
            className="w-full shrink-0 rounded-full bg-accent px-5 py-3 text-sm text-[#1a1408] disabled:opacity-50 sm:w-auto sm:self-end"
          >
            {saved ? "Сохранено" : "Сохранить"}
          </button>
        )}
        </div>
        {error ? <p className="mt-3 text-sm text-red-300">{error}</p> : null}
        {picker ? (
          <div className="mt-4 border-t border-line pt-4">
            <p className="mb-2 text-sm text-muted">Аватар</p>
            <div className="grid grid-cols-6 gap-2 sm:grid-cols-8">
              {AVATARS.map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => {
                    setAvatar(item);
                    setSaved(false);
                  }}
                  className={`grid h-11 place-items-center rounded-2xl border text-xl ${
                    avatar === item ? "border-accent bg-white/10" : "border-line"
                  }`}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>
        ) : null}
      </div>
      <div className="rounded-3xl border border-line bg-white/5 p-4 sm:p-5">
        <h2 className="font-display text-xl">Достижения</h2>
        {me.achievements.length === 0 ? (
          <p className="mt-3 text-sm text-muted">Пока нет достижений.</p>
        ) : (
          <ul className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
            {me.achievements.map((item) => (
              <li
                key={item.id}
                className={`rounded-2xl border px-3 py-3 ${
                  item.unlocked ? "border-accent/70 bg-white/5" : "border-line text-muted"
                }`}
              >
                <span
                  className={`grid size-10 place-items-center rounded-full text-xl ${
                    item.unlocked ? "bg-white/10" : "bg-black/30 grayscale"
                  }`}
                >
                  {item.emoji}
                </span>
                <p className={`mt-2 text-sm ${item.unlocked ? "text-foreground" : ""}`}>{item.name}</p>
                <p className="mt-1 text-xs text-muted">
                  {item.unlocked ? "Открыто" : achievementGoal(item.metric, item.threshold)}
                </p>
              </li>
            ))}
          </ul>
        )}
      </div>
      <div className="flex flex-col gap-4 rounded-3xl border border-line bg-white/5 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center justify-between gap-4 sm:justify-start">
          <span className="text-sm text-muted">Звук</span>
          <button
            type="button"
            role="switch"
            aria-checked={sounds}
            aria-label={sounds ? "Выключить звуки" : "Включить звуки"}
            data-sound="none"
            onClick={toggleSounds}
            className="relative flex h-[46px] w-24 shrink-0 items-center justify-between rounded-full border border-line bg-black/30 px-1"
          >
            <span
              className={`absolute top-1 size-9 rounded-full bg-accent transition-[left] duration-200 ${
                sounds ? "left-[calc(100%-2.5rem)]" : "left-1"
              }`}
            />
            <span
              className={`relative z-10 grid size-9 place-items-center ${sounds ? "text-muted" : "text-[#1a1408]"}`}
            >
              <Icon name="volume-mute" size={16} />
            </span>
            <span
              className={`relative z-10 grid size-9 place-items-center ${sounds ? "text-[#1a1408]" : "text-muted"}`}
            >
              <Icon name="volume" size={16} />
            </span>
          </button>
        </div>
        <form action={logoutAction}>
          <button
            type="submit"
            className="w-full rounded-full bg-transparent border border-red-600 px-5 py-3 text-sm font-medium text-white transition-colors duration-200 hover:bg-red-600 sm:w-auto sm:px-8"
          >
            Выйти из аккаунта
          </button>
        </form>
      </div>
    </section>
  );
}
