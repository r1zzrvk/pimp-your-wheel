import { Prisma, type PrismaClient } from "@prisma/client";
import {
  type AchievementMetric,
  type AchievementUnlock,
  type AchievementView,
} from "@/lib/achievement-rules";
import { getBalance } from "@/lib/balance";
import { levelProgress } from "@/lib/progress";

export {
  ACHIEVEMENT_METRICS,
  METRIC_LABEL,
  STARTER_ACHIEVEMENTS,
  achievementGoal,
  type AchievementMetric,
  type AchievementUnlock,
  type AchievementView,
} from "@/lib/achievement-rules";

type Db = PrismaClient | Prisma.TransactionClient;

function isUnique(error: unknown) {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002";
}

export async function grantAchievements(
  db: Db,
  userId: string,
  event: { spinCoins?: number } = {},
): Promise<AchievementUnlock[]> {
  const user = await db.user.findUniqueOrThrow({ where: { id: userId } });
  const level = levelProgress(user.xp).level;
  const balance = await getBalance(db, userId);
  const spins = await db.spin.count({ where: { userId } });
  const items = await db.inventory.count({ where: { userId } });
  const catalog = await db.achievement.findMany();
  const ownedRows = await db.userAchievement.findMany({
    where: { userId },
    select: { achievementId: true },
  });
  const owned = new Set(ownedRows.map((row) => row.achievementId));
  const stats: Record<AchievementMetric, number | null> = {
    LEVEL: level,
    SPINS: spins,
    STREAK: user.streak,
    BALANCE: balance,
    SPIN_WIN: event.spinCoins ?? null,
    ITEMS: items,
  };
  const fresh: AchievementUnlock[] = [];
  for (const achievement of catalog) {
    if (owned.has(achievement.id)) continue;
    const value = stats[achievement.metric];
    if (value === null || value < achievement.threshold) continue;
    try {
      await db.userAchievement.create({
        data: { userId, achievementId: achievement.id },
      });
      fresh.push({ id: achievement.id, name: achievement.name, emoji: achievement.emoji });
    } catch (error) {
      if (!isUnique(error)) throw error;
    }
  }
  return fresh;
}

export async function listAchievements(db: Db, userId: string): Promise<AchievementView[]> {
  const rows = await db.achievement.findMany({
    orderBy: [{ threshold: "asc" }, { name: "asc" }],
    include: { unlocks: { where: { userId }, select: { unlockedAt: true } } },
  });
  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    emoji: row.emoji,
    description: row.description,
    metric: row.metric,
    threshold: row.threshold,
    unlocked: row.unlocks.length > 0,
    unlockedAt: row.unlocks[0]?.unlockedAt.toISOString() ?? null,
  }));
}
