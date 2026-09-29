import { cosmeticKind } from "@/lib/economy";
import { adminConfigured, isAdmin } from "@/lib/admin-gate";
import { prisma } from "@/lib/db";
import { giveCosmetic, loginAdmin, saveCosmetic } from "../actions";
import { AdminFrame, Pager } from "../nav";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 12;
const KINDS = [
  { id: "", label: "Все" },
  { id: "wheel", label: "Колесо" },
  { id: "background", label: "Фон" },
  { id: "pointer", label: "Указатель" },
  { id: "animation", label: "Анимация" },
] as const;

const input =
  "rounded-lg border border-line bg-black/30 px-2 py-1 text-sm text-foreground";

function itemsHref(kind: string, item: string, page: number) {
  const params = new URLSearchParams();
  if (kind) params.set("kind", kind);
  if (item) params.set("item", item);
  if (page > 1) params.set("page", String(page));
  const query = params.toString();
  return query ? `/admin/items?${query}` : "/admin/items";
}

export default async function AdminItemsPage({
  searchParams,
}: {
  searchParams: Promise<{ kind?: string; item?: string; page?: string; error?: string }>;
}) {
  if (!adminConfigured()) {
    return (
      <main className="mx-auto max-w-lg px-4 py-16">
        <h1 className="font-display text-3xl">Админка</h1>
        <p className="mt-4 text-muted">Добавь ADMIN_PASSWORD и перезапусти сервер.</p>
      </main>
    );
  }

  if (!(await isAdmin())) {
    return (
      <main className="mx-auto max-w-sm px-4 py-16">
        <h1 className="font-display text-3xl">Админка</h1>
        <form action={loginAdmin} className="mt-6 flex flex-col gap-3">
          <input name="password" type="password" required placeholder="Пароль" className={input} />
          <button type="submit" className="rounded-full bg-accent px-4 py-2 text-sm text-[#1a1408]">
            Войти
          </button>
        </form>
      </main>
    );
  }

  const params = await searchParams;
  const kind = KINDS.some((entry) => entry.id === params.kind) ? (params.kind ?? "") : "";
  const itemQuery = params.item ?? "";
  const page = Math.max(1, Number(params.page) || 1);
  const needle = itemQuery.trim().toLowerCase();
  const all = await prisma.cosmetic.findMany({ orderBy: [{ priceCoins: "asc" }, { slug: "asc" }] });
  const filtered = all.filter((entry) => {
    if (kind && cosmeticKind(entry.slug) !== kind) return false;
    if (!needle) return true;
    return entry.name.toLowerCase().includes(needle) || entry.slug.toLowerCase().includes(needle);
  });
  const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const current = Math.min(page, pages);
  const cosmetics = filtered.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE);
  const returnTo = itemsHref(kind, itemQuery, current);

  return (
    <AdminFrame current="items" error={params.error}>
      <form action="/admin/items" className="mt-6 flex flex-wrap gap-2">
        {kind ? <input type="hidden" name="kind" value={kind} /> : null}
        <input
          name="item"
          defaultValue={itemQuery}
          placeholder="Название или slug"
          className={`${input} w-full max-w-sm`}
        />
        <button type="submit" className="rounded-full border border-line px-4 py-1 text-sm">
          Найти
        </button>
      </form>
      <div className="mt-3 flex flex-wrap gap-2">
        {KINDS.map((entry) => (
          <a
            key={entry.id || "all"}
            href={itemsHref(entry.id, itemQuery, 1)}
            data-sound="menu"
            className={`rounded-full border px-3 py-1 text-sm ${
              kind === entry.id ? "border-accent text-accent" : "border-line text-muted"
            }`}
          >
            {entry.label}
          </a>
        ))}
      </div>
      <p className="mt-3 text-sm text-muted">
        {filtered.length} из {all.length}. Имя, цена и цвета фона. Эмодзи и уровни открытия заданы в коде.
      </p>

      <form action={giveCosmetic} className="mt-4 flex flex-wrap gap-2">
        <input type="hidden" name="return" value={returnTo} />
        <input name="email" required placeholder="email" className={`${input} w-64`} />
        <input name="slug" required placeholder="slug, например blue-wheel" className={`${input} w-64`} />
        <button type="submit" className="rounded-full bg-accent px-4 py-1 text-sm text-[#1a1408]">
          Выдать
        </button>
      </form>

      <div className="mt-4 grid gap-3">
        {cosmetics.map((entry) => (
          <form
            key={entry.id}
            action={saveCosmetic}
            className="flex flex-wrap items-center gap-2 rounded-2xl border border-line p-3"
          >
            <input type="hidden" name="return" value={returnTo} />
            <input type="hidden" name="id" value={entry.id} />
            <span className="w-28 text-xs text-muted">
              {cosmeticKind(entry.slug)}
              <br />
              {entry.slug}
            </span>
            <input name="name" defaultValue={entry.name} className={`${input} w-40`} />
            <input name="priceCoins" type="number" defaultValue={entry.priceCoins} className={`${input} w-24`} />
            <input name="primary" type="color" defaultValue={entry.primary} className="h-8 w-10 bg-transparent" />
            <input name="secondary" type="color" defaultValue={entry.secondary} className="h-8 w-10 bg-transparent" />
            <input name="accent" type="color" defaultValue={entry.accent} className="h-8 w-10 bg-transparent" />
            <button type="submit" className="rounded-full border border-line px-3 py-1 text-xs">
              Сохранить
            </button>
          </form>
        ))}
      </div>
      <Pager page={current} pages={pages} hrefFor={(next) => itemsHref(kind, itemQuery, next)} />
    </AdminFrame>
  );
}
