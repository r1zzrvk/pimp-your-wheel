import type Stripe from "stripe";
import { applySubscription, userIdForSubscription } from "@/lib/billing";
import { fulfillLimitReset } from "@/lib/limit-reset";
import { getStripe } from "@/lib/stripe";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  const signature = request.headers.get("stripe-signature");
  if (!secret || !signature || !process.env.STRIPE_SECRET_KEY) {
    return Response.json({ error: "PAYMENTS_UNAVAILABLE" }, { status: 503 });
  }

  const payload = await request.text();
  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(payload, signature, secret);
  } catch {
    return Response.json({ error: "INVALID_SIGNATURE" }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    if (session.metadata?.purpose === "limit_reset") {
      await fulfillLimitReset(session);
    } else {
      const userId = session.metadata?.userId ?? session.client_reference_id;
      const subscriptionId = session.subscription;
      if (userId && typeof subscriptionId === "string") {
        const subscription = await getStripe().subscriptions.retrieve(subscriptionId);
        await applySubscription(userId, subscription);
      }
    }
  }

  if (
    event.type === "customer.subscription.updated" ||
    event.type === "customer.subscription.deleted"
  ) {
    const subscription = event.data.object;
    const userId = await userIdForSubscription(subscription);
    if (userId) await applySubscription(userId, subscription);
  }

  return Response.json({ received: true });
}
