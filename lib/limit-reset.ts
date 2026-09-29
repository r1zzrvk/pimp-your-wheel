import type Stripe from "stripe";
import { prisma } from "@/lib/db";
import { countAllowance } from "@/lib/allowance";
import { utcDayStart } from "@/lib/day";
import { LIMIT_RESET_CENTS, spinsPerDay, type PlanId } from "@/lib/economy";
import { ApiError } from "@/lib/api-error";
import { lockUser } from "@/lib/lock";
import { getStripe } from "@/lib/stripe";

export async function grantLimitReset(input: {
  userId: string;
  stripeSessionId: string;
  day: Date;
  paid: boolean;
}) {
  if (!input.paid) return { spinsGranted: 0 };

  return prisma.$transaction(async (tx) => {
    await lockUser(tx, input.userId);
    const existing = await tx.limitReset.findUnique({
      where: { stripeSessionId: input.stripeSessionId },
    });
    if (existing) return { spinsGranted: existing.spinsGranted };

    const user = await tx.user.findUniqueOrThrow({ where: { id: input.userId } });
    const today = utcDayStart();
    const spinsGranted =
      input.day.getTime() === today.getTime() ? spinsPerDay(user.plan as PlanId) : 0;
    await tx.limitReset.create({
      data: {
        userId: input.userId,
        day: input.day,
        spinsGranted,
        stripeSessionId: input.stripeSessionId,
      },
    });
    return { spinsGranted };
  });
}

export async function fulfillLimitReset(session: Stripe.Checkout.Session) {
  if (session.metadata?.purpose !== "limit_reset") return { spinsGranted: 0 };
  const userId = session.metadata.userId;
  const dayRaw = session.metadata.day;
  if (!userId || !dayRaw) return { spinsGranted: 0 };
  const day = new Date(dayRaw);
  if (Number.isNaN(day.getTime())) return { spinsGranted: 0 };
  return grantLimitReset({
    userId,
    stripeSessionId: session.id,
    day,
    paid: session.payment_status === "paid",
  });
}

export async function claimLimitResetSession(userId: string, sessionId: string) {
  if (!process.env.STRIPE_SECRET_KEY || !sessionId.startsWith("cs_")) {
    return { spinsGranted: 0 };
  }
  const session = await getStripe().checkout.sessions.retrieve(sessionId);
  if (session.metadata?.userId !== userId) return { spinsGranted: 0 };
  return fulfillLimitReset(session);
}

async function ensureCustomer(userId: string) {
  const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });
  if (user.stripeCustomerId) return user;

  const customer = await getStripe().customers.create({
    email: user.email,
    metadata: { userId },
  });
  const saved = await prisma.user.updateMany({
    where: { id: userId, stripeCustomerId: null },
    data: { stripeCustomerId: customer.id },
  });
  if (saved.count === 1) return { ...user, stripeCustomerId: customer.id };
  return prisma.user.findUniqueOrThrow({ where: { id: userId } });
}

export async function startLimitReset(userId: string, origin: string) {
  const user = await prisma.$transaction(async (tx) => {
    await lockUser(tx, userId);
    const row = await tx.user.findUniqueOrThrow({ where: { id: userId } });
    const allowance = await countAllowance(tx, userId, row.plan as PlanId);
    if (allowance.spinsLeft > 0) throw new ApiError(409, "SPINS_REMAINING");
    return row;
  });
  if (!process.env.STRIPE_SECRET_KEY) throw new ApiError(503, "PAYMENTS_UNAVAILABLE");

  const customer = await ensureCustomer(user.id);
  const session = await getStripe().checkout.sessions.create({
    mode: "payment",
    customer: customer.stripeCustomerId ?? undefined,
    client_reference_id: userId,
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: "usd",
          unit_amount: LIMIT_RESET_CENTS,
          product_data: {
            name: "Сброс дневного лимита",
            description: "Ещё одна дневная норма круток",
          },
        },
      },
    ],
    success_url: `${origin}/?reset=success&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${origin}/?reset=cancel`,
    metadata: {
      userId,
      purpose: "limit_reset",
      day: utcDayStart().toISOString(),
    },
    managed_payments: { enabled: false },
  });

  if (!session.url) throw new ApiError(502, "CHECKOUT_FAILED");
  return { url: session.url };
}
