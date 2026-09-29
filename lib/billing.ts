import type Stripe from "stripe";
import { prisma } from "@/lib/db";
import { PLAN_OFFERS, spinsPerDay, type PaidPlanId, type PlanId } from "@/lib/economy";
import {
  paymentsConfigured,
  planForSubscription,
  priceIdForPlan,
  type SubscriptionSnapshot,
} from "@/lib/entitlement";
import { ApiError } from "@/lib/api-error";
import { getStripe } from "@/lib/stripe";

export type BillingView = {
  plan: PlanId;
  configured: boolean;
  canManage: boolean;
  offers: Array<{
    id: PlanId;
    title: string;
    priceLabel: string;
    detail: string;
    spins: number;
    current: boolean;
  }>;
};

function snapshotFromSubscription(subscription: Stripe.Subscription): SubscriptionSnapshot {
  return {
    status: subscription.status,
    priceId: subscription.items.data[0]?.price.id ?? null,
  };
}

function customerIdOf(customer: Stripe.Subscription["customer"] | Stripe.Checkout.Session["customer"]) {
  if (!customer) return null;
  return typeof customer === "string" ? customer : customer.id;
}

export async function getBilling(userId: string): Promise<BillingView> {
  const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });
  const plan = user.plan as PlanId;
  return {
    plan,
    configured: paymentsConfigured(),
    canManage: Boolean(user.stripeCustomerId),
    offers: PLAN_OFFERS.map((offer) => ({
      ...offer,
      spins: spinsPerDay(offer.id),
      current: offer.id === plan,
    })),
  };
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
  if (saved.count === 1) {
    return { ...user, stripeCustomerId: customer.id };
  }
  return prisma.user.findUniqueOrThrow({ where: { id: userId } });
}

export async function applySubscription(userId: string, subscription: Stripe.Subscription) {
  const plan = planForSubscription(snapshotFromSubscription(subscription));
  const customerId = customerIdOf(subscription.customer);
  await prisma.user.update({
    where: { id: userId },
    data: {
      plan,
      stripeSubscriptionId: subscription.id,
      ...(customerId ? { stripeCustomerId: customerId } : {}),
    },
  });
  return plan;
}

export async function startCheckout(userId: string, plan: PaidPlanId, origin: string) {
  if (!paymentsConfigured()) throw new ApiError(503, "PAYMENTS_UNAVAILABLE");
  const priceId = priceIdForPlan(plan);
  if (!priceId) throw new ApiError(503, "PAYMENTS_UNAVAILABLE");

  const user = await ensureCustomer(userId);
  const stripe = getStripe();

  if (user.stripeSubscriptionId) {
    const current = await stripe.subscriptions.retrieve(user.stripeSubscriptionId);
    const entitled = planForSubscription(snapshotFromSubscription(current)) !== "FREE";
    const item = current.items.data[0];
    if (entitled && item) {
      const updated = await stripe.subscriptions.update(current.id, {
        items: [{ id: item.id, price: priceId }],
        proration_behavior: "create_prorations",
        metadata: { userId },
      });
      const nextPlan = await applySubscription(userId, updated);
      return { updated: true as const, plan: nextPlan };
    }
  }

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer: user.stripeCustomerId ?? undefined,
    client_reference_id: userId,
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${origin}/plans?checkout=success`,
    cancel_url: `${origin}/plans?checkout=cancel`,
    metadata: { userId },
    subscription_data: { metadata: { userId } },
    managed_payments: { enabled: false },
  });

  if (!session.url) throw new ApiError(502, "CHECKOUT_FAILED");
  return { url: session.url };
}

export async function startPortal(userId: string, origin: string) {
  if (!paymentsConfigured()) throw new ApiError(503, "PAYMENTS_UNAVAILABLE");
  const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });
  if (!user.stripeCustomerId) throw new ApiError(400, "NO_CUSTOMER");
  const session = await getStripe().billingPortal.sessions.create({
    customer: user.stripeCustomerId,
    return_url: `${origin}/plans`,
  });
  return { url: session.url };
}

export async function syncBilling(userId: string) {
  if (!paymentsConfigured()) return getBilling(userId);
  const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });
  if (!user.stripeCustomerId) return getBilling(userId);

  const stripe = getStripe();
  const listed = await stripe.subscriptions.list({
    customer: user.stripeCustomerId,
    status: "all",
    limit: 10,
  });
  const subscription =
    listed.data.find((item) => planForSubscription(snapshotFromSubscription(item)) !== "FREE") ??
    listed.data[0];

  if (!subscription) {
    await prisma.user.update({
      where: { id: userId },
      data: { plan: "FREE", stripeSubscriptionId: null },
    });
  } else {
    await applySubscription(userId, subscription);
  }
  return getBilling(userId);
}

export async function userIdForSubscription(subscription: Stripe.Subscription) {
  if (subscription.metadata.userId) return subscription.metadata.userId;
  const customerId = customerIdOf(subscription.customer);
  if (!customerId) return null;
  const user = await prisma.user.findUnique({ where: { stripeCustomerId: customerId } });
  return user?.id ?? null;
}
