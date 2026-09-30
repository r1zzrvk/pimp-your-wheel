"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";

type AuthFormProps = {
  title: string;
  subtitle: string;
  submitLabel: string;
  alternateHref: string;
  alternateLabel: string;
  nameField?: boolean;
  action: (formData: FormData) => Promise<{ error: string } | undefined>;
};

export function AuthForm({
  title,
  subtitle,
  submitLabel,
  alternateHref,
  alternateLabel,
  nameField = false,
  action,
}: AuthFormProps) {
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setPending(true);
    const result = await action(new FormData(event.currentTarget));
    if (result?.error) {
      setError(result.error);
      setPending(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-full w-full max-w-md flex-col justify-center px-4 py-16">
      <p className="font-display text-sm tracking-wide text-accent">Pimp your wheel</p>
      <h1 className="mt-3 font-display text-4xl leading-tight">{title}</h1>
      <p className="mt-3 text-muted">{subtitle}</p>
      <form onSubmit={onSubmit} className="mt-8 flex flex-col gap-4">
        {nameField ? (
          <label className="flex flex-col gap-2 text-sm">
            Имя
            <input
              name="displayName"
              type="text"
              autoComplete="nickname"
              required
              maxLength={24}
              className="rounded-2xl border border-line bg-white/5 px-4 py-3 text-base outline-none focus:border-accent"
            />
          </label>
        ) : null}
        <label className="flex flex-col gap-2 text-sm">
          Email
          <input
            name="email"
            type="email"
            autoComplete="email"
            required
            className="rounded-2xl border border-line bg-white/5 px-4 py-3 text-base outline-none focus:border-accent"
          />
        </label>
        <label className="flex flex-col gap-2 text-sm">
          Пароль
          <input
            name="password"
            type="password"
            autoComplete={submitLabel === "Создать аккаунт" ? "new-password" : "current-password"}
            minLength={8}
            required
            className="rounded-2xl border border-line bg-white/5 px-4 py-3 text-base outline-none focus:border-accent"
          />
        </label>
        {error ? <p className="text-sm text-red-300">{error}</p> : null}
        <button
          type="submit"
          disabled={pending}
          className="mt-2 rounded-full bg-accent px-5 py-3 font-display text-sm text-[#1a1408] disabled:opacity-60"
        >
          {pending ? "Секунду…" : submitLabel}
        </button>
      </form>
      <Link href={alternateHref} className="mt-6 text-sm text-muted underline-offset-4 hover:underline">
        {alternateLabel}
      </Link>
    </main>
  );
}
