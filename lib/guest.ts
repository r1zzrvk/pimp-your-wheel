import { prisma } from "@/lib/db";
import { cosmeticKind, cosmeticRule, LIMIT_RESET_LABEL } from "@/lib/economy";
import { nextUtcMidnight } from "@/lib/day";
import { GUEST_SPIN_LIMIT } from "@/lib/guest-spins";
import { progressSnapshot } from "@/lib/progress";
import type { MeResponse } from "@/lib/types";
import { paintSegments, UNLOCKS, wheelLook, WHEELS } from "@/lib/wheels";

export async function getGuestMe(): Promise<MeResponse> {
  const cosmetics = await prisma.cosmetic.findMany({
    orderBy: { priceCoins: "asc" },
  });
  const progress = progressSnapshot(0, 0, null);
  const wheel = WHEELS[0];
  const look = wheelLook(null);

  return {
    guest: true,
    email: "",
    displayName: "",
    avatar: "🎲",
    plan: "FREE",
    balance: 0,
    spinsUsed: 0,
    spinsLimit: GUEST_SPIN_LIMIT,
    spinsLeft: GUEST_SPIN_LIMIT,
    nextResetAt: nextUtcMidnight().toISOString(),
    resetPriceLabel: LIMIT_RESET_LABEL,
    resetAvailable: false,
    ...progress,
    guaranteedJackpot: false,
    wheel: {
      id: wheel.id,
      name: wheel.name,
      skinName: null,
      slug: null,
      segments: paintSegments(wheel.segments, null, false),
      shine: false,
      glow: "white",
      animation: null,
      legendary: false,
      pointer: "triangle",
      hub: look.emoji,
      hubRim: look.rim,
      hubFill: look.fill,
      plate: look.plate,
      peg: look.peg,
    },
    background: null,
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
    cosmetics: cosmetics.map((item) => ({
      slug: item.slug,
      name: item.name,
      priceCoins: item.priceCoins,
      primary: item.primary,
      secondary: item.secondary,
      accent: item.accent,
      minLevel: cosmeticRule(item.slug)?.minLevel ?? 1,
      owned: false,
      equipped: false,
      kind: cosmeticKind(item.slug),
    })),
    achievements: [],
  };
}
