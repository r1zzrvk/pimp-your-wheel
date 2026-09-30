import { grantAchievements, listAchievements } from "@/lib/achievements";
import { prisma } from "@/lib/db";
import { countAllowance } from "@/lib/allowance";
import {
  animationBySlug,
  cosmeticKind,
  cosmeticRule,
  LIMIT_RESET_LABEL,
  pointerBySlug,
  type GlowName,
  type PlanId,
} from "@/lib/economy";
import { getBalance } from "@/lib/balance";
import { nextUtcMidnight } from "@/lib/day";
import { progressSnapshot } from "@/lib/progress";
import type { MeResponse } from "@/lib/types";
import { LEGEND_HUB, paintSegments, UNLOCKS, wheelForLevel, wheelLook, WHEELS } from "@/lib/wheels";

export async function getMe(userId: string): Promise<MeResponse> {
  const user = await prisma.user.findUniqueOrThrow({
    where: { id: userId },
    include: {
      equipped: { include: { wheelSkin: true, pointerSkin: true, backgroundSkin: true } },
      inventory: true,
    },
  });
  const cosmetics = await prisma.cosmetic.findMany({
    orderBy: { priceCoins: "asc" },
  });
  const owned = new Set(user.inventory.map((item) => item.cosmeticId));
  const skin = user.equipped?.wheelSkin ?? null;
  const pointer = pointerBySlug(user.equipped?.pointerSkin?.slug ?? "")?.emoji ?? "triangle";
  const equippedAnimation = animationBySlug(user.animation ?? "");
  const background = user.equipped?.backgroundSkin ?? null;
  const plan = user.plan as PlanId;
  const allowance = await countAllowance(prisma, userId, plan);
  const spinsUsed = allowance.used;
  const spinsLimit = allowance.spinsLimit;
  await grantAchievements(prisma, userId);
  const achievements = await listAchievements(prisma, userId);
  const progress = progressSnapshot(user.xp, user.streak, user.lastStreakOn);
  const wheel = wheelForLevel(user.activeWheel, progress.level);
  const legendary = user.legendaryTheme && progress.level >= 50;
  const look = legendary ? LEGEND_HUB : wheelLook(skin?.slug ?? null);
  const glow: GlowName =
    equippedAnimation && progress.level >= equippedAnimation.minLevel
      ? equippedAnimation.glow
      : "white";

  return {
    guest: false,
    email: user.email,
    displayName: user.displayName,
    avatar: user.avatar,
    plan,
    balance: await getBalance(prisma, userId),
    spinsUsed,
    spinsLimit,
    spinsLeft: Math.max(0, spinsLimit - spinsUsed),
    nextResetAt: nextUtcMidnight().toISOString(),
    resetPriceLabel: LIMIT_RESET_LABEL,
    resetAvailable: Boolean(process.env.STRIPE_SECRET_KEY),
    ...progress,
    wheel: {
      id: wheel.id,
      name: wheel.name,
      skinName: legendary ? null : (skin?.name ?? null),
      slug: skin?.slug ?? null,
      segments: paintSegments(wheel.segments, skin, legendary),
      shine: glow === "gold",
      glow,
      animation: glow === "white" ? null : (user.animation ?? null),
      legendary,
      pointer,
      hub: look.emoji,
      hubRim: look.rim,
      hubFill: look.fill,
      plate: look.plate,
      peg: look.peg,
    },
    background: background
      ? {
          slug: background.slug,
          name: background.name,
          primary: background.primary,
          secondary: background.secondary,
          accent: background.accent,
        }
      : null,
    wheels: WHEELS.map((item) => ({
      id: item.id,
      name: item.name,
      minLevel: item.minLevel,
      unlocked: progress.level >= item.minLevel,
      active: item.id === wheel.id,
    })),
    unlocks: UNLOCKS.map((item) => ({
      id: item.id,
      title: item.title,
      level: item.level,
      unlocked: progress.level >= item.level,
    })),
    cosmetics: cosmetics.map((item) => {
      const kind = cosmeticKind(item.slug);
      const minLevel = cosmeticRule(item.slug)?.minLevel ?? 1;
      const levelOwned = minLevel > 1 && progress.level >= minLevel;
      return {
        slug: item.slug,
        name: item.name,
        priceCoins: item.priceCoins,
        primary: item.primary,
        secondary: item.secondary,
        accent: item.accent,
        minLevel,
        owned: levelOwned || owned.has(item.id),
        equipped:
          kind === "pointer"
            ? user.equipped?.pointerSkinId === item.id
            : kind === "background"
              ? user.equipped?.backgroundSkinId === item.id
              : kind === "animation"
                ? user.animation === item.slug
                : skin?.id === item.id,
        kind,
      };
    }),
    achievements,
  };
}
