import { randomInt } from "crypto";
import type { WheelReward } from "@/lib/wheels";

export function pickReward(rewards: readonly WheelReward[]) {
  const total = rewards.reduce((sum, reward) => sum + reward.weight, 0);
  let roll = randomInt(total);
  for (let index = 0; index < rewards.length; index++) {
    roll -= rewards[index].weight;
    if (roll < 0) return rewardAt(rewards, index);
  }
  return rewardAt(rewards, rewards.length - 1);
}

function rewardAt(rewards: readonly WheelReward[], index: number) {
  const reward = rewards[index];
  const roll = reward.spinRoll;
  return {
    coins: reward.coins,
    extraSpins: roll ? randomInt(roll.min, roll.max + 1) : reward.extraSpins,
    segmentIndex: index,
  };
}
