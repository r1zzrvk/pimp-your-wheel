import { prisma } from "@/lib/db";
import { countAllowance } from "@/lib/allowance";
import { cosmeticRule, pointerBySlug, type PlanId } from "@/lib/economy";
import { getBalance } from "@/lib/balance";
import { nextUtcMidnight, utcDayStart } from "@/lib/day";
import { ApiError } from "@/lib/api-error";
import { lockUser } from "@/lib/lock";
import { pickReward } from "@/lib/pick-reward";
import { advanceStreak, levelProgress, progressSnapshot, XP_PER_SPIN } from "@/lib/progress";
import { jackpotSegmentIndex, wheelForLevel, WHEELS } from "@/lib/wheels";
import type { SpinResponse } from "@/lib/types";

export async function performSpin(userId: string): Promise<SpinResponse> {
  return prisma.$transaction(async (tx) => {
    await lockUser(tx, userId);
    const user = await tx.user.findUniqueOrThrow({ where: { id: userId } });
    const allowance = await countAllowance(tx, userId, user.plan as PlanId);
    if (allowance.spinsLeft <= 0) {
      throw new ApiError(403, "LIMIT_REACHED");
    }

    const streakUpdate = advanceStreak(user.streak, user.lastStreakOn);
    const wheel = wheelForLevel(user.activeWheel, levelProgress(user.xp).level);
    const jackpotIndex = jackpotSegmentIndex(wheel.segments);
    const jackpot = wheel.segments[jackpotIndex];
    const reward =
      streakUpdate.advanced && streakUpdate.streak === 7
        ? { coins: jackpot.coins, extraSpins: 0, segmentIndex: jackpotIndex }
        : pickReward(wheel.segments);
    const xp = user.xp + XP_PER_SPIN;
    await tx.user.update({
      where: { id: userId },
      data: {
        streak: streakUpdate.streak,
        xp,
        ...(streakUpdate.advanced ? { lastStreakOn: utcDayStart() } : {}),
      },
    });
    let coins = reward.coins;
    if (coins < 0) {
      const balance = await getBalance(tx, userId);
      coins = -Math.min(-coins, Math.max(0, balance));
    }
    const spin = await tx.spin.create({
      data: {
        userId,
        coins,
        segmentIndex: reward.segmentIndex,
        bonusSpins: reward.extraSpins,
      },
    });
    if (coins !== 0) {
      await tx.walletTransaction.create({
        data: {
          userId,
          amount: coins,
          source: "SPIN_REWARD",
          spinId: spin.id,
        },
      });
    }

    const spinsLimit = allowance.spinsLimit + reward.extraSpins;
    return {
      coins,
      extraSpins: reward.extraSpins,
      segmentIndex: reward.segmentIndex,
      spinsLeft: spinsLimit - (allowance.used + 1),
      spinsLimit,
      nextResetAt: nextUtcMidnight().toISOString(),
      balance: await getBalance(tx, userId),
      streak: streakUpdate.streak,
      xp,
      ...levelProgress(xp),
      guaranteedJackpot: progressSnapshot(
        xp,
        streakUpdate.streak,
        streakUpdate.advanced ? utcDayStart() : user.lastStreakOn,
      ).guaranteedJackpot,
    };
  });
}

export async function performSelectWheel(userId: string, wheelId: string) {
  const wheel = WHEELS.find((item) => item.id === wheelId);
  if (!wheel) throw new ApiError(404, "UNKNOWN_WHEEL");
  await prisma.$transaction(async (tx) => {
    await lockUser(tx, userId);
    const user = await tx.user.findUniqueOrThrow({ where: { id: userId } });
    if (levelProgress(user.xp).level < wheel.minLevel) {
      throw new ApiError(403, "WHEEL_LOCKED");
    }
    await tx.user.update({
      where: { id: userId },
      data: { activeWheel: wheel.id },
    });
  });
}

export async function performSetShine(userId: string, enabled: boolean) {
  await prisma.$transaction(async (tx) => {
    await lockUser(tx, userId);
    const user = await tx.user.findUniqueOrThrow({ where: { id: userId } });
    if (enabled && levelProgress(user.xp).level < 25) {
      throw new ApiError(403, "SHINE_LOCKED");
    }
    await tx.user.update({
      where: { id: userId },
      data: { shineTheme: enabled },
    });
  });
}

export async function performSetLegend(userId: string, enabled: boolean) {
  await prisma.$transaction(async (tx) => {
    await lockUser(tx, userId);
    const user = await tx.user.findUniqueOrThrow({ where: { id: userId } });
    if (enabled && levelProgress(user.xp).level < 50) {
      throw new ApiError(403, "THEME_LOCKED");
    }
    await tx.user.update({
      where: { id: userId },
      data: { legendaryTheme: enabled },
    });
  });
}

export async function performPurchase(userId: string, slug: string) {
  await prisma.$transaction(async (tx) => {
    await lockUser(tx, userId);
    const cosmetic = await tx.cosmetic.findUnique({ where: { slug } });
    if (!cosmetic) throw new ApiError(404, "NOT_FOUND");
    const reward = cosmeticRule(slug);
    if (reward && reward.minLevel > 1) throw new ApiError(400, "NOT_FOR_SALE");

    const owned = await tx.inventory.findUnique({
      where: { userId_cosmeticId: { userId, cosmeticId: cosmetic.id } },
    });
    if (owned) throw new ApiError(409, "ALREADY_OWNED");

    const balance = await getBalance(tx, userId);
    if (balance < cosmetic.priceCoins) {
      throw new ApiError(400, "INSUFFICIENT_FUNDS");
    }

    await tx.walletTransaction.create({
      data: {
        userId,
        amount: -cosmetic.priceCoins,
        source: "PURCHASE",
        cosmeticId: cosmetic.id,
      },
    });
    await tx.inventory.create({
      data: { userId, cosmeticId: cosmetic.id },
    });
  });
}

function equipSlot(kind: "wheel" | "pointer" | "background" | "animation", cosmeticId: string | null) {
  if (kind === "pointer") return { pointerSkinId: cosmeticId };
  if (kind === "background") return { backgroundSkinId: cosmeticId };
  return { wheelSkinId: cosmeticId };
}

export async function performEquip(
  userId: string,
  slug: string | null,
  kind: "wheel" | "pointer" | "background" | "animation" = "wheel",
) {
  await prisma.$transaction(async (tx) => {
    await lockUser(tx, userId);

    if (slug === null) {
      if (kind === "animation") {
        await tx.user.update({
          where: { id: userId },
          data: { animation: null, shineTheme: false },
        });
        return;
      }
      await tx.equipped.upsert({
        where: { userId },
        update: equipSlot(kind, null),
        create: { userId },
      });
      return;
    }

    const cosmetic = await tx.cosmetic.findUnique({ where: { slug } });
    if (!cosmetic) throw new ApiError(404, "NOT_FOUND");

    const reward = cosmeticRule(slug);
    if (reward && reward.minLevel > 1) {
      const user = await tx.user.findUniqueOrThrow({ where: { id: userId } });
      if (levelProgress(user.xp).level < reward.minLevel) {
        throw new ApiError(403, "BACKGROUND_LOCKED");
      }
    } else {
      const owned = await tx.inventory.findUnique({
        where: { userId_cosmeticId: { userId, cosmeticId: cosmetic.id } },
      });
      if (!owned) throw new ApiError(403, "NOT_OWNED");
    }

    if (kind === "animation") {
      await tx.user.update({
        where: { id: userId },
        data: { animation: slug, shineTheme: slug === "shine" },
      });
      return;
    }

    if (kind === "wheel" && !pointerBySlug(slug)) {
      await tx.user.update({
        where: { id: userId },
        data: { legendaryTheme: false },
      });
    }
    await tx.equipped.upsert({
      where: { userId },
      update: equipSlot(kind, cosmetic.id),
      create: { userId, ...equipSlot(kind, cosmetic.id) },
    });
  });
}
