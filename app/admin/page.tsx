import { getBalance } from "@/lib/balance";
import { adminConfigured, isAdmin } from "@/lib/admin-gate";
import { prisma } from "@/lib/db";
import { levelProgress } from "@/lib/progress";
import { deleteUser, loginAdmin, saveUser } from "./actions";
import { AdminFrame, Pager } from "./nav";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 15;
const input =
  "rounded-lg border border-line bg-black/30 px-2 py-1 text-sm text-foreground";

function usersHref(q: string, page: number) {
  const params = new URLSearchParams();
  if (q) params.set("q", q);
  if (page > 1) params.set("page", String(page));
  const query = params.toString();
  return query ? `/admin?${query}` : "/admin";
}

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; error?: string; page?: string }>;
}) {
  const params = await searchParams;
  const q = params.q ?? "";
  const page = Math.max(1, Number(params.page) || 1);

  if (!adminConfigured()) {
    return (
      <main className="mx-auto max-w-lg px-4 py-16">
        <h1 className="font-display text-3xl">Админка</h1>
        <p className="mt-4 text-muted">
          Добавь <code>ADMIN_PASSWORD</code> в переменные окружения и перезапусти сервер.
        </p>
      </main>
    );
  }

  if (!(await isAdmin())) {
    return (
      <main className="mx-auto max-w-sm px-4 py-16">
        <h1 className="font-display text-3xl">Админка</h1>
        <form action={loginAdmin} className="mt-6 flex flex-col gap-3">
          <input
            name="password"
            type="password"
            required
            placeholder="Пароль"
            className={input}
            data-sound="none"
          />
          <button type="submit" className="rounded-full bg-accent px-4 py-2 text-sm text-[#1a1408]">
            Войти
          </button>
          {params.error ? <p className="text-sm text-red-300">{params.error}</p> : null}
        </form>
      </main>
    );
  }

  const where = q ? { email: { contains: q, mode: "insensitive" as const } } : undefined;
  const total = await prisma.user.count({ where });
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const current = Math.min(page, pages);
  const users = await prisma.user.findMany({
    where,
    orderBy: { createdAt: "desc" },
    skip: (current - 1) * PAGE_SIZE,
    take: PAGE_SIZE,
  });
  const balances = await Promise.all(users.map((user) => getBalance(prisma, user.id)));
  const returnTo = usersHref(q, current);

  return (
    <AdminFrame current="users" error={params.error}>
      <form action="/admin" className="mt-6 flex gap-2">
        <input
          name="q"
          defaultValue={q}
          placeholder="Поиск по email"
          className={`${input} w-full max-w-sm`}
        />
        <button type="submit" className="rounded-full border border-line px-4 py-1 text-sm">
          Найти
        </button>
      </form>
      <p className="mt-3 text-sm text-muted">{total} игроков</p>

      <div className="mt-3 overflow-x-auto">
        <table className="w-full min-w-[920px] border-collapse text-left text-sm">
          <thead className="text-muted">
            <tr>
              <th className="p-2">Email</th>
              <th className="p-2">План</th>
              <th className="p-2">XP</th>
              <th className="p-2">Серия</th>
              <th className="p-2">Колесо</th>
              <th className="p-2">Флаги</th>
              <th className="p-2">Выдать</th>
              <th className="p-2" />
            </tr>
          </thead>
          <tbody>
            {users.map((user, index) => {
              const progress = levelProgress(user.xp);
              return (
                <tr key={user.id} className="border-t border-line align-top">
                  <td className="p-2">
                    <form id={user.id} action={saveUser} />
                    <input type="hidden" name="return" value={returnTo} form={user.id} />
                    <input type="hidden" name="id" value={user.id} form={user.id} />
                      <div>{user.displayName || user.email}</div>
                      {user.displayName ? <div className="text-xs text-muted">{user.email}</div> : null}
                    <div className="text-xs text-muted">
                      ур. {progress.level} · {balances[index]} монет
                    </div>
                  </td>
                  <td className="p-2">
                    <select name="plan" defaultValue={user.plan} form={user.id} className={input}>
                      <option>FREE</option>
                      <option>BASIC</option>
                      <option>PRO</option>
                    </select>
                  </td>
                  <td className="p-2">
                    <input name="xp" type="number" defaultValue={user.xp} form={user.id} className={`${input} w-24`} />
                  </td>
                  <td className="p-2">
                    <input
                      name="streak"
                      type="number"
                      defaultValue={user.streak}
                      form={user.id}
                      className={`${input} w-16`}
                    />
                  </td>
                  <td className="p-2">
                    <select name="activeWheel" defaultValue={user.activeWheel} form={user.id} className={input}>
                      <option value="classic">Классика</option>
                      <option value="luck">Удача</option>
                      <option value="risk">Риск</option>
                      <option value="fortune">Фортуна</option>
                    </select>
                    <input
                      name="animation"
                      defaultValue={user.animation ?? ""}
                      placeholder="анимация"
                      form={user.id}
                      className={`${input} mt-1 w-28`}
                    />
                  </td>
                  <td className="p-2 text-xs">
                    <label className="block">
                      <input type="checkbox" name="legendary" defaultChecked={user.legendaryTheme} form={user.id} /> Легенда
                    </label>
                    <label className="mt-1 block">
                      <input type="checkbox" name="shine" defaultChecked={user.shineTheme} form={user.id} /> Сияние
                    </label>
                  </td>
                  <td className="p-2">
                    <input
                      name="coins"
                      type="number"
                      defaultValue={0}
                      form={user.id}
                      className={`${input} w-24`}
                      title="Сколько монет добавить. Минус снимает."
                    />
                    <input
                      name="spins"
                      type="number"
                      defaultValue={0}
                      form={user.id}
                      className={`${input} mt-1 w-24`}
                      title="Дополнительные спины на сегодня"
                    />
                  </td>
                  <td className="p-2">
                    <button type="submit" form={user.id} className="rounded-full bg-accent px-3 py-1 text-xs text-[#1a1408]">
                      Сохранить
                    </button>
                    <button
                      type="submit"
                      formAction={deleteUser}
                      form={user.id}
                      className="mt-2 block text-xs text-red-300"
                    >
                      Удалить
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <Pager page={current} pages={pages} hrefFor={(next) => usersHref(q, next)} />
    </AdminFrame>
  );
}
