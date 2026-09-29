import type { PaidPlanId, PlanId } from "@/lib/economy";

const ENTITLED_STATUSES = new Set(["active", "trialing", "past_due"]);

export type SubscriptionSnapshot = {
  status: string;
  priceId: string | null;
};

export function priceIdForPlan(plan: PaidPlanId) {
  if (plan === "BASIC") return process.env.STRIPE_PRICE_BASIC ?? null;
  return process.env.STRIPE_PRICE_PRO ?? null;
}

export function paymentsConfigured() {
  return Boolean(
    process.env.STRIPE_SECRET_KEY &&
      process.env.STRIPE_PRICE_BASIC &&
      process.env.STRIPE_PRICE_PRO,
  );
}

export function planForSubscription(snapshot: SubscriptionSnapshot): PlanId {
  if (!ENTITLED_STATUSES.has(snapshot.status) || !snapshot.priceId) {
    return "FREE";
  }
  if (snapshot.priceId === process.env.STRIPE_PRICE_PRO) return "PRO";
  if (snapshot.priceId === process.env.STRIPE_PRICE_BASIC) return "BASIC";
  return "FREE";
}
