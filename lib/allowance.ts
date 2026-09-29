import type { Prisma, PrismaClient } from "@prisma/client";
import { utcDayStart } from "@/lib/day";
import { spinsPerDay, type PlanId } from "@/lib/economy";

type Counter = Prisma.TransactionClient | PrismaClient;

export async function countAllowance(db: Counter, userId: string, plan: PlanId) {
  const start = utcDayStart();
  const where = { userId, createdAt: { gte: start } };
  const [used, bonus, resets] = await Promise.all([
    db.spin.count({ where }),
    db.spin.aggregate({ where, _sum: { bonusSpins: true } }),
    db.limitReset.aggregate({
      where: { userId, day: start },
      _sum: { spinsGranted: true },
    }),
  ]);
  const spinsLimit =
    spinsPerDay(plan) + (bonus._sum.bonusSpins ?? 0) + (resets._sum.spinsGranted ?? 0);
  return { used, spinsLimit, spinsLeft: spinsLimit - used };
}
