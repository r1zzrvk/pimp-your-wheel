import type { Prisma } from "@prisma/client";

export async function lockUser(tx: Prisma.TransactionClient, userId: string) {
  const rows = await tx.$queryRaw<{ id: string }[]>`
    SELECT id FROM "User" WHERE id = ${userId} FOR UPDATE
  `;
  if (rows.length === 0) {
    throw new Error("User not found");
  }
}
