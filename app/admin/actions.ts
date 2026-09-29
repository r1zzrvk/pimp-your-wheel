"use server";

import { randomUUID } from "node:crypto";
import { timingSafeEqual } from "node:crypto";
import { redirect } from "next/navigation";
import type { Plan } from "@prisma/client";
import { clearAdminCookie, isAdmin, setAdminCookie } from "@/lib/admin-gate";
import { utcDayStart } from "@/lib/day";
import { prisma } from "@/lib/db";

const PLANS = new Set<Plan>(["FREE", "BASIC", "PRO"]);
const WHEELS = new Set(["classic", "luck", "risk", "fortune"]);

function same(left: string, right: string) {
  const a = Buffer.from(left);
  const b = Buffer.from(right);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

function back(formData: FormData, error?: string): never {
  const raw = String(formData.get("return") ?? "/admin");
  const path = raw.startsWith("/admin") ? raw : "/admin";
  const url = new URL(path, "http://admin.local");
  if (!url.pathname.startsWith("/admin")) redirect("/admin");
  if (error) url.searchParams.set("error", error);
  else url.searchParams.delete("error");
  redirect(`${url.pathname}${url.search}`);
}

async function guard() {
  if (!(await isAdmin())) redirect("/admin");
}

export async function loginAdmin(formData: FormData) {
  const password = String(formData.get("password") ?? "");
  const expected = process.env.ADMIN_PASSWORD ?? "";
  if (!expected || !same(password, expected)) redirect("/admin?error=" + encodeURIComponent("Неверный пароль"));
  await setAdminCookie();
  redirect("/admin");
}

export async function logoutAdmin() {
  await clearAdminCookie();
  redirect("/admin");
}

export async function saveUser(formData: FormData) {
  await guard();
  const id = String(formData.get("id") ?? "");
  const plan = String(formData.get("plan") ?? "") as Plan;
  const wheel = String(formData.get("activeWheel") ?? "");
  const xp = Number(formData.get("xp"));
  const streak = Number(formData.get("streak"));
  const coins = Number(formData.get("coins") ?? 0);
  const spins = Number(formData.get("spins") ?? 0);
  if (!PLANS.has(plan) || !WHEELS.has(wheel) || !Number.isFinite(xp) || !Number.isFinite(streak)) {
    back(formData, "Некорректные поля игрока");
  }

  const animation = String(formData.get("animation") ?? "").trim();
  await prisma.user.update({
    where: { id },
    data: {
      plan,
      xp: Math.max(0, Math.floor(xp)),
      streak: Math.max(0, Math.floor(streak)),
      activeWheel: wheel,
      legendaryTheme: formData.get("legendary") === "on",
      shineTheme: formData.get("shine") === "on",
      animation: animation || null,
    },
  });

  if (Number.isFinite(coins) && coins !== 0) {
    await prisma.walletTransaction.create({
      data: { userId: id, amount: Math.trunc(coins), source: "SPIN_REWARD" },
    });
  }

  if (Number.isFinite(spins) && spins !== 0) {
    await prisma.limitReset.create({
      data: {
        userId: id,
        day: utcDayStart(),
        spinsGranted: Math.trunc(spins),
        stripeSessionId: `admin-${randomUUID()}`,
      },
    });
  }

  back(formData);
}

export async function deleteUser(formData: FormData) {
  await guard();
  const id = String(formData.get("id") ?? "");
  await prisma.user.delete({ where: { id } });
  back(formData);
}

export async function saveCosmetic(formData: FormData) {
  await guard();
  const id = String(formData.get("id") ?? "");
  const price = Number(formData.get("priceCoins"));
  const name = String(formData.get("name") ?? "").trim();
  if (!name || !Number.isFinite(price)) back(formData, "Некорректный товар");
  await prisma.cosmetic.update({
    where: { id },
    data: {
      name,
      priceCoins: Math.max(0, Math.floor(price)),
      primary: String(formData.get("primary") ?? ""),
      secondary: String(formData.get("secondary") ?? ""),
      accent: String(formData.get("accent") ?? ""),
    },
  });
  back(formData);
}

export async function giveCosmetic(formData: FormData) {
  await guard();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const slug = String(formData.get("slug") ?? "").trim();
  const user = await prisma.user.findUnique({ where: { email } });
  const cosmetic = await prisma.cosmetic.findUnique({ where: { slug } });
  if (!user || !cosmetic) back(formData, "Игрок или товар не найден");
  await prisma.inventory.upsert({
    where: { userId_cosmeticId: { userId: user.id, cosmeticId: cosmetic.id } },
    update: {},
    create: { userId: user.id, cosmeticId: cosmetic.id },
  });
  back(formData);
}
