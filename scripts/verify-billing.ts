import assert from "node:assert/strict";
import { planForSubscription } from "../lib/entitlement";

process.env.STRIPE_PRICE_BASIC = "price_basic";
process.env.STRIPE_PRICE_PRO = "price_pro";

assert.equal(planForSubscription({ status: "active", priceId: "price_basic" }), "BASIC");
assert.equal(planForSubscription({ status: "trialing", priceId: "price_pro" }), "PRO");
assert.equal(planForSubscription({ status: "past_due", priceId: "price_pro" }), "PRO");
assert.equal(planForSubscription({ status: "canceled", priceId: "price_pro" }), "FREE");
assert.equal(planForSubscription({ status: "active", priceId: "price_unknown" }), "FREE");
assert.equal(planForSubscription({ status: "incomplete", priceId: "price_basic" }), "FREE");

console.log("billing checks passed");
