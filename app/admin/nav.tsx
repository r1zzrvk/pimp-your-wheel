import { logoutAdmin } from "./actions";

export function AdminFrame({
  current,
  error,
  children,
}: {
  current: "users" | "items";
  error?: string;
  children: React.ReactNode;
}) {
  const link = (id: "users" | "items", href: string, label: string) => (
    <a
      href={href}
      data-sound="menu"
      className={`rounded-full border px-4 py-1 text-sm ${
        current === id ? "border-accent text-accent" : "border-line text-muted"
      }`}
    >
      {label}
    </a>
  );

  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-3xl">Админка</h1>
        <form action={logoutAdmin}>
          <button type="submit" className="text-sm text-muted" data-sound="none">
            Выйти
          </button>
        </form>
      </div>
      <nav className="mt-4 flex gap-2">
        {link("users", "/admin", "Игроки")}
        {link("items", "/admin/items", "Товары")}
      </nav>
      {error ? <p className="mt-4 text-sm text-red-300">{error}</p> : null}
      {children}
    </main>
  );
}

export function Pager({
  page,
  pages,
  hrefFor,
}: {
  page: number;
  pages: number;
  hrefFor: (page: number) => string;
}) {
  if (pages <= 1) return null;
  return (
    <div className="mt-4 flex flex-wrap items-center gap-2 text-sm">
      {page > 1 ? (
        <a href={hrefFor(page - 1)} data-sound="menu" className="rounded-full border border-line px-3 py-1">
          Назад
        </a>
      ) : null}
      <span className="text-muted">
        {page} / {pages}
      </span>
      {page < pages ? (
        <a href={hrefFor(page + 1)} data-sound="menu" className="rounded-full border border-line px-3 py-1">
          Дальше
        </a>
      ) : null}
    </div>
  );
}
