import assert from "node:assert/strict";
import { prisma } from "../lib/db";
import { PLAN_SPINS, REWARDS } from "../lib/economy";
import { ApiError } from "../lib/api-error";
import { utcDayStart } from "../lib/day";
import { performEquip, performPurchase, performSelectWheel, performSetLegend, performSpin } from "../lib/game";
import { grantLimitReset, startLimitReset } from "../lib/limit-reset";
import { getMe } from "../lib/me";
import { pickReward } from "../lib/pick-reward";
import { xpToReachLevel } from "../lib/progress";
import { wheelById } from "../lib/wheels";
import { registerUser } from "../lib/register-user";
import { nextSpinRotation, pegPassedPointer } from "../lib/wheel";

function assertRotation(segmentIndex: number, segmentCount: number) {
  let rotation = 0;
  for (let step = 0; step < 3; step++) {
    rotation = nextSpinRotation(rotation, segmentIndex, segmentCount);
    const segmentAngle = 360 / segmentCount;
    const target = (360 - segmentIndex * segmentAngle) % 360;
    const landed = ((rotation % 360) + 360) % 360;
    assert.equal(Math.round(landed), Math.round(target));
  }
}

async function expectCode(run: () => Promise<unknown>, code: string) {
  try {
    await run();
  } catch (error) {
    assert.ok(error instanceof ApiError);
    assert.equal(error.code, code);
    return;
  }
  throw new Error(`Expected ${code}`);
}

async function main() {
  for (let index = 0; index < REWARDS.length; index++) {
    assertRotation(index, REWARDS.length);
    const rotation = nextSpinRotation(0, index, REWARDS.length, 0);
    const segmentAngle = 360 / REWARDS.length;
    const target = (360 - index * segmentAngle) % 360;
    assert.equal(Math.round(rotation % 360), Math.round(target));
    assert.ok(rotation <= 360);
  }
  assert.equal(pegPassedPointer(0, 10, 355), true);
  assert.equal(pegPassedPointer(0, 10, 20), false);

  const email = `spin-${Date.now()}@example.com`;
  const user = await registerUser(email, "password123");
  assert.equal(user.plan, "FREE");

  const first = await performSpin(user.id);
  assert.equal(first.spinsLeft, PLAN_SPINS.FREE - 1 + first.extraSpins);
  assert.equal(first.streak, 1);
  assert.equal(first.xp, 10);

  const climber = await registerUser(`level-${Date.now()}@example.com`, "password123");
  const badge = await prisma.achievement.create({
    data: { name: "Тестовый рубеж", emoji: "🏅", metric: "LEVEL", threshold: 2, description: "" },
  });
  await prisma.user.update({ where: { id: climber.id }, data: { xp: 40 } });
  const leveled = await performSpin(climber.id);
  assert.equal(leveled.level, 2);
  assert.equal(leveled.xp, 100);
  assert.equal(leveled.balance, Math.max(0, leveled.coins) + 50);
  assert.ok(leveled.achievements.some((item) => item.id === badge.id));
  const again = await performSpin(climber.id);
  assert.equal(again.achievements.some((item) => item.id === badge.id), false);
  await prisma.achievement.delete({ where: { id: badge.id } });

  const streakUser = await registerUser(`streak-${Date.now()}@example.com`, "password123");
  await prisma.user.update({
    where: { id: streakUser.id },
    data: { streak: 6, lastStreakOn: new Date(Date.now() - 24 * 60 * 60 * 1000) },
  });
  const jackpot = await performSpin(streakUser.id);
  assert.equal(jackpot.streak, 7);
  assert.equal(jackpot.coins, 100);
  assert.equal(jackpot.extraSpins, 0);
  const sameDay = await performSpin(streakUser.id);
  assert.equal(sameDay.streak, 7);
  assert.equal(sameDay.guaranteedJackpot, false);
  const streakProfile = await getMe(streakUser.id);
  assert.equal(streakProfile.xp, 20);
  assert.equal(streakProfile.level, 1);
  assert.equal(streakProfile.xpIntoLevel, 20);

  const raced = await registerUser(`race-${Date.now()}@example.com`, "password123");
  const slotsLeft = 2;
  await prisma.spin.createMany({
    data: Array.from({ length: PLAN_SPINS.FREE - slotsLeft }, () => ({
      userId: raced.id,
      coins: 5,
      segmentIndex: 0,
    })),
  });
  const settled = await Promise.allSettled(
    Array.from({ length: 8 }, () => performSpin(raced.id)),
  );
  const ok = settled.filter((item) => item.status === "fulfilled");
  const limited = settled.filter(
    (item) =>
      item.status === "rejected" &&
      item.reason instanceof ApiError &&
      item.reason.code === "LIMIT_REACHED",
  );
  const racedBonus = ok.reduce((sum, item) => {
    if (item.status !== "fulfilled") return sum;
    return sum + item.value.extraSpins;
  }, 0);
  assert.equal(ok.length + limited.length, 8);
  assert.ok(ok.length <= slotsLeft + racedBonus);
  if (limited.length > 0) assert.equal(ok.length, slotsLeft + racedBonus);

  await prisma.user.update({
    where: { id: user.id },
    data: { plan: "PRO" },
  });
  let balance = 0;
  let extraSpins = 0;
  for (let i = 0; i < PLAN_SPINS.PRO && balance < 100; i++) {
    const spin = await performSpin(user.id);
    balance = spin.balance;
    extraSpins += spin.extraSpins;
    assert.ok(spin.segmentIndex >= 0 && spin.segmentIndex < REWARDS.length);
    assert.equal(spin.coins, REWARDS[spin.segmentIndex].coins);
  }
  assert.ok(balance >= 100);

  await expectCode(() => performPurchase(user.id, "missing"), "NOT_FOUND");
  await performPurchase(user.id, "blue-wheel");
  await expectCode(() => performPurchase(user.id, "blue-wheel"), "ALREADY_OWNED");
  await expectCode(() => performEquip(user.id, "gold-wheel"), "NOT_OWNED");
  await performEquip(user.id, "blue-wheel");

  const me = await getMe(user.id);
  assert.equal(me.plan, "PRO");
  assert.equal(me.wheel.slug, "blue-wheel");
  assert.equal(me.spinsLimit, PLAN_SPINS.PRO + extraSpins);
  assert.ok(me.cosmetics.find((item) => item.slug === "blue-wheel")?.equipped);

  await performEquip(user.id, null);
  const classic = await getMe(user.id);
  assert.equal(classic.wheel.slug, null);
  assert.equal(classic.wheel.name, "Классика");

  const resetUser = await registerUser(`reset-${Date.now()}@example.com`, "password123");
  await prisma.user.update({ where: { id: resetUser.id }, data: { plan: "BASIC" } });
  await prisma.spin.createMany({
    data: Array.from({ length: PLAN_SPINS.BASIC }, () => ({
      userId: resetUser.id,
      coins: 5,
      segmentIndex: 0,
    })),
  });
  assert.equal((await getMe(resetUser.id)).spinsLeft, 0);
  const sessionId = `cs_test_reset_${Date.now()}`;
  const granted = await grantLimitReset({
    userId: resetUser.id,
    stripeSessionId: sessionId,
    day: utcDayStart(),
    paid: true,
  });
  assert.equal(granted.spinsGranted, PLAN_SPINS.BASIC);
  assert.equal((await getMe(resetUser.id)).spinsLeft, PLAN_SPINS.BASIC);
  const repeat = await grantLimitReset({
    userId: resetUser.id,
    stripeSessionId: sessionId,
    day: utcDayStart(),
    paid: true,
  });
  assert.equal(repeat.spinsGranted, PLAN_SPINS.BASIC);
  assert.equal((await getMe(resetUser.id)).spinsLeft, PLAN_SPINS.BASIC);
  await expectCode(
    () => startLimitReset(resetUser.id, "http://localhost:3000"),
    "SPINS_REMAINING",
  );

  const wheelUser = await registerUser(`wheel-${Date.now()}@example.com`, "password123");
  await expectCode(() => performSelectWheel(wheelUser.id, "fortune"), "WHEEL_LOCKED");
  await expectCode(() => performSelectWheel(wheelUser.id, "missing"), "UNKNOWN_WHEEL");
  await expectCode(() => performSetLegend(wheelUser.id, true), "THEME_LOCKED");
  const luck = wheelById("luck");
  const risk = wheelById("risk");
  const fortune = wheelById("fortune");
  assert.equal(luck.segments.find((segment) => segment.tone === "100")?.coins, 105);
  assert.equal(risk.segments.filter((segment) => segment.coins === -30).length, 2);
  assert.equal(fortune.minLevel, 15);
  assert.equal(fortune.segments.filter((segment) => segment.layout === "radial").length, 2);
  assert.equal(fortune.segments.filter((segment) => segment.coins === -50).length, 2);
  assert.equal(fortune.segments.filter((segment) => segment.coins === -30).length, 1);
  assert.equal(fortune.segments.find((segment) => segment.tone === "200")?.coins, 260);
  const freeSpin = fortune.segments.find((segment) => segment.spinRoll);
  assert.ok(freeSpin);
  for (let step = 0; step < 20; step++) {
    const rolled = pickReward([freeSpin]);
    assert.ok(rolled.extraSpins >= 1 && rolled.extraSpins <= 3);
  }
  await prisma.user.update({
    where: { id: wheelUser.id },
    data: { xp: xpToReachLevel(10) },
  });
  await expectCode(() => performSelectWheel(wheelUser.id, "fortune"), "WHEEL_LOCKED");
  await prisma.user.update({
    where: { id: wheelUser.id },
    data: { xp: xpToReachLevel(15) },
  });
  await prisma.walletTransaction.create({
    data: { userId: wheelUser.id, amount: 500, source: "SPIN_REWARD" },
  });
  await performSelectWheel(wheelUser.id, "fortune");
  const fortuneSpin = await performSpin(wheelUser.id);
  const landed = fortune.segments[fortuneSpin.segmentIndex];
  assert.equal(fortuneSpin.coins, landed.coins);
  const fortuneProfile = await getMe(wheelUser.id);
  assert.equal(fortuneProfile.wheel.id, "fortune");
  assert.equal(fortuneProfile.wheel.segments.length, fortune.segments.length);
  assert.equal(fortuneProfile.wheel.segments[0].label, "13");
  assert.equal(fortuneProfile.unlocks.find((item) => item.id === "shine")?.unlocked, false);
  await prisma.user.update({
    where: { id: wheelUser.id },
    data: { xp: xpToReachLevel(50) },
  });
  await performSetLegend(wheelUser.id, true);
  const legend = await getMe(wheelUser.id);
  assert.equal(legend.wheel.legendary, true);
  assert.equal(legend.wheel.shine, false);
  assert.equal(legend.wheel.segments[0].color, "#4c1d95");

  const dresser = await registerUser(`dresser-${Date.now()}@example.com`, "password123");
  await prisma.walletTransaction.create({
    data: { userId: dresser.id, amount: 5000, source: "SPIN_REWARD" },
  });
  await performPurchase(dresser.id, "banana-pointer");
  await performEquip(dresser.id, "banana-pointer", "pointer");
  const banana = await getMe(dresser.id);
  assert.equal(banana.wheel.pointer, "👅");
  await performPurchase(dresser.id, "fire");
  await performEquip(dresser.id, "fire", "animation");
  const burning = await getMe(dresser.id);
  assert.equal(burning.wheel.glow, "fire");
  await performEquip(dresser.id, null, "animation");
  assert.equal((await getMe(dresser.id)).wheel.glow, "white");
  await expectCode(() => performPurchase(dresser.id, "trident-pointer"), "NOT_FOR_SALE");
  await expectCode(() => performEquip(dresser.id, "skull-pointer", "pointer"), "BACKGROUND_LOCKED");
  await prisma.user.update({ where: { id: dresser.id }, data: { xp: xpToReachLevel(60) } });
  await performEquip(dresser.id, "inferno", "animation");
  await performEquip(dresser.id, "skull-pointer", "pointer");
  const dressed = await getMe(dresser.id);
  assert.equal(dressed.wheel.glow, "inferno");
  assert.equal(dressed.wheel.pointer, "💀");

  const poor = await registerUser(`poor-${Date.now()}@example.com`, "password123");
  await expectCode(() => performPurchase(poor.id, "blue-wheel"), "INSUFFICIENT_FUNDS");

  console.log("game checks passed");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
