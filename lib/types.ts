import type { GlowName, PlanId } from "@/lib/economy";
import type { WheelSegmentView } from "@/lib/wheels";

export type CosmeticView = {
  slug: string;
  name: string;
  priceCoins: number;
  primary: string;
  secondary: string;
  accent: string;
  owned: boolean;
  equipped: boolean;
  minLevel: number;
  kind: "wheel" | "pointer" | "background" | "animation";
};

export type AchievementUnlock = {
  id: string;
  name: string;
  emoji: string;
};

export type AchievementView = AchievementUnlock & {
  description: string;
  metric: "LEVEL" | "SPINS" | "STREAK" | "BALANCE" | "SPIN_WIN" | "ITEMS";
  threshold: number;
  unlocked: boolean;
  unlockedAt: string | null;
};

export type Progress = {
  streak: number;
  xp: number;
  level: number;
  xpIntoLevel: number;
  xpForNext: number;
  guaranteedJackpot: boolean;
};

export type MeResponse = Progress & {
  guest: boolean;
  email: string;
  displayName: string;
  avatar: string;
  plan: PlanId;
  balance: number;
  spinsUsed: number;
  spinsLimit: number;
  spinsLeft: number;
  nextResetAt: string;
  resetPriceLabel: string;
  resetAvailable: boolean;
  wheel: {
    id: string;
    name: string;
    skinName: string | null;
    slug: string | null;
    segments: WheelSegmentView[];
    shine: boolean;
    glow: GlowName;
    animation: string | null;
    legendary: boolean;
    pointer: string;
    hub: string;
    hubRim: string;
    hubFill: string;
    plate: string;
    peg: string;
  };
  background: {
    slug: string;
    name: string;
    primary: string;
    secondary: string;
    accent: string;
  } | null;
  wheels: Array<{
    id: string;
    name: string;
    minLevel: number;
    unlocked: boolean;
    active: boolean;
  }>;
  unlocks: Array<{
    id: string;
    title: string;
    level: number;
    unlocked: boolean;
  }>;
  cosmetics: CosmeticView[];
  achievements: AchievementView[];
};

export type SpinResponse = {
  coins: number;
  extraSpins: number;
  segmentIndex: number;
  spinsLeft: number;
  spinsLimit: number;
  nextResetAt: string;
  balance: number;
  achievements: AchievementUnlock[];
} & Progress;
