import type { Prisma, PrismaClient } from "@prisma/client";

type Db = PrismaClient | Prisma.TransactionClient;

export async function getBalance(db: Db, userId: string) {
  const sum = await db.walletTransaction.aggregate({
    where: { userId },
    _sum: { amount: true },
  });
  return sum._sum.amount ?? 0;
}
