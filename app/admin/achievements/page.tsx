import { meta } from "@/components/meta";
import { ACHIEVEMENT_METRICS, METRIC_LABEL, achievementGoal } from "@/lib/achievements";
import { adminConfigured, isAdmin } from "@/lib/admin-gate";
import { prisma } from "@/lib/db";
import { createAchievement, deleteAchievement, loginAdmin, saveAchievement } from "../actions";
import { AdminFrame } from "../nav";

export const metadata = meta({
  title: "Достижения",
  description: "Условия и награды профиля.",
});

export const dynamic = "force-dynamic";

const input = "rounded-lg border border-line bg-black/30 px-2 py-1 text-sm text-foreground";

export default async function AdminAchievementsPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
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
  const achievements = await prisma.achievement.findMany({
    orderBy: [{ threshold: "asc" }, { name: "asc" }],
    include: { _count: { select: { unlocks: true } } },
  });

  return (
    <AdminFrame current="achievements" error={params.error}>
      <form action={createAchievement} className="mt-6 flex flex-wrap items-end gap-2">
        <input type="hidden" name="return" value="/admin/achievements" />
        <label className="text-xs text-muted">
          Значок
          <input name="emoji" required defaultValue="🏅" className={`${input} mt-1 w-16 text-center`} />
        </label>
        <label className="text-xs text-muted">
          Название
          <input name="name" required placeholder="Первая крутка" className={`${input} mt-1 w-48`} />
        </label>
        <label className="text-xs text-muted">
          Условие
          <select name="metric" defaultValue="LEVEL" className={`${input} mt-1`}>
            {ACHIEVEMENT_METRICS.map((metric) => (
              <option key={metric} value={metric}>
                {METRIC_LABEL[metric]}
              </option>
            ))}
          </select>
        </label>
        <label className="text-xs text-muted">
          Порог
          <input name="threshold" type="number" min={1} required defaultValue={1} className={`${input} mt-1 w-24`} />
        </label>
        <label className="text-xs text-muted">
          Описание
          <input name="description" placeholder="Коротко, зачем это" className={`${input} mt-1 w-64`} />
        </label>
        <button type="submit" className="rounded-full bg-accent px-4 py-2 text-sm text-[#1a1408]">
          Создать
        </button>
      </form>
      <p className="mt-3 text-sm text-muted">
        Уровень, крутки, серия, баланс и покупки проверяются по текущему прогрессу. Выигрыш за крутку — только в момент этой крутки.
      </p>
      <div className="mt-4 grid gap-3">
        {achievements.map((entry) => (
          <form
            key={entry.id}
            action={saveAchievement}
            className="flex flex-wrap items-center gap-2 rounded-2xl border border-line p-3"
          >
            <input type="hidden" name="return" value="/admin/achievements" />
            <input type="hidden" name="id" value={entry.id} />
            <input name="emoji" defaultValue={entry.emoji} className={`${input} w-16 text-center`} />
            <input name="name" defaultValue={entry.name} className={`${input} w-44`} />
            <select name="metric" defaultValue={entry.metric} className={input}>
              {ACHIEVEMENT_METRICS.map((metric) => (
                <option key={metric} value={metric}>
                  {METRIC_LABEL[metric]}
                </option>
              ))}
            </select>
            <input name="threshold" type="number" min={1} defaultValue={entry.threshold} className={`${input} w-24`} />
            <input name="description" defaultValue={entry.description} className={`${input} min-w-48 flex-1`} />
            <span className="text-xs text-muted">{entry._count.unlocks} получ.</span>
            <button type="submit" className="rounded-full border border-line px-3 py-1 text-xs">
              Сохранить
            </button>
            <button
              type="submit"
              formAction={deleteAchievement}
              className="rounded-full border border-red-900 px-3 py-1 text-xs text-red-300"
            >
              Удалить
            </button>
            <span className="basis-full text-xs text-muted">{achievementGoal(entry.metric, entry.threshold)}</span>
          </form>
        ))}
      </div>
    </AdminFrame>
  );
}
