import type { WheelReward } from "@/lib/wheels";

export const GUEST_SPIN_LIMIT = 50;
const STORAGE_KEY = "guest-spins-left";

export function readGuestSpinsLeft() {
  if (typeof window === "undefined") return GUEST_SPIN_LIMIT;
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (raw === null) return GUEST_SPIN_LIMIT;
  const value = Number(raw);
  if (!Number.isInteger(value) || value < 0 || value > GUEST_SPIN_LIMIT) return GUEST_SPIN_LIMIT;
  return value;
}

export function writeGuestSpinsLeft(left: number) {
  window.localStorage.setItem(STORAGE_KEY, String(left));
}

export function pickGuestReward(rewards: readonly WheelReward[]) {
  const total = rewards.reduce((sum, reward) => sum + reward.weight, 0);
  let roll = Math.floor(Math.random() * total);
  let index = rewards.length - 1;
  for (let cursor = 0; cursor < rewards.length; cursor += 1) {
    roll -= rewards[cursor].weight;
    if (roll < 0) {
      index = cursor;
      break;
    }
  }
  const reward = rewards[index];
  const spinRoll = reward.spinRoll;
  const extraSpins = spinRoll
    ? spinRoll.min + Math.floor(Math.random() * (spinRoll.max - spinRoll.min + 1))
    : reward.extraSpins;
  return { coins: reward.coins, extraSpins, segmentIndex: index };
}
