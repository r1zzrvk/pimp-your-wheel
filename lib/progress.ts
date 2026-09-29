import { utcDayStart } from "@/lib/day";

export const XP_PER_SPIN = 10;
export const LEVEL_LIST_CAP = 100;

export function levelSteps(count: number) {
  const rows: { level: number; xp: number; step: number }[] = [];
  let xp = 0;
  let step = 50;
  for (let level = 1; level <= count; level += 1) {
    rows.push({ level, xp, step });
    xp += step;
    step = 50 + level * 25;
  }
  return rows;
}
const DAY_MS = 24 * 60 * 60 * 1000;

export function advanceStreak(
  streak: number,
  lastStreakOn: Date | null,
  now = new Date(),
) {
  const today = utcDayStart(now).getTime();
  if (!lastStreakOn) return { streak: 1, advanced: true };
  const last = utcDayStart(lastStreakOn).getTime();
  if (last === today) return { streak, advanced: false };
  if (last + DAY_MS === today) return { streak: streak + 1, advanced: true };
  return { streak: 1, advanced: true };
}

export function xpToReachLevel(target: number) {
  let xp = 0;
  let level = 1;
  let xpForNext = 50;
  while (level < target) {
    xp += xpForNext;
    level += 1;
    xpForNext = 50 + (level - 1) * 25;
  }
  return xp;
}

export function levelProgress(xp: number) {
  let level = 1;
  let remaining = Math.max(0, xp);
  let xpForNext = 50;
  while (remaining >= xpForNext) {
    remaining -= xpForNext;
    level += 1;
    xpForNext = 50 + (level - 1) * 25;
  }
  return { level, xpIntoLevel: remaining, xpForNext };
}

export function progressSnapshot(
  xp: number,
  streak: number,
  lastStreakOn: Date | null,
  now = new Date(),
) {
  const next = advanceStreak(streak, lastStreakOn, now);
  return {
    streak,
    xp,
    ...levelProgress(xp),
    guaranteedJackpot: next.advanced && next.streak === 7,
  };
}
