import assert from "node:assert/strict";
import { prisma } from "../lib/db";
import { registerUser } from "../lib/register-user";

const base = "http://localhost:3000";

function remember(jar: Map<string, string>, response: Response) {
  for (const cookie of response.headers.getSetCookie()) {
    const pair = cookie.split(";")[0];
    const eq = pair.indexOf("=");
    jar.set(pair.slice(0, eq), pair.slice(eq + 1));
  }
}

function cookieHeader(jar: Map<string, string>) {
  return [...jar.entries()].map(([key, value]) => `${key}=${value}`).join("; ");
}

async function main() {
  const anon = await fetch(`${base}/plans`, { redirect: "manual" });
  assert.equal(anon.status, 307);

  const guestCheckout = await fetch(`${base}/api/billing/checkout`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ plan: "PRO" }),
  });
  assert.equal(guestCheckout.status, 401);

  const email = `plan-${Date.now()}@example.com`;
  const password = "password123";
  await registerUser(email, password);

  const jar = new Map<string, string>();
  const csrfResponse = await fetch(`${base}/api/auth/csrf`);
  remember(jar, csrfResponse);
  const { csrfToken } = (await csrfResponse.json()) as { csrfToken: string };
  const login = await fetch(`${base}/api/auth/callback/credentials`, {
    method: "POST",
    redirect: "manual",
    headers: {
      "content-type": "application/x-www-form-urlencoded",
      cookie: cookieHeader(jar),
    },
    body: new URLSearchParams({ csrfToken, email, password, callbackUrl: `${base}/plans` }),
  });
  remember(jar, login);

  const page = await fetch(`${base}/plans`, { headers: { cookie: cookieHeader(jar) } });
  const html = (await page.text()).replaceAll("<!-- -->", "");
  assert.equal(page.status, 200);
  assert.match(html, /Подписка/);
  assert.match(html, /Basic/);
  assert.match(html, /\$4\.99/);
  assert.match(html, /10 круток в сутки/);
  assert.match(html, /\$19\.99/);
  assert.match(html, /30 круток в сутки/);

  const checkout = await fetch(`${base}/api/billing/checkout`, {
    method: "POST",
    headers: {
      cookie: cookieHeader(jar),
      "content-type": "application/json",
    },
    body: JSON.stringify({ plan: "BASIC" }),
  });
  const checkoutBody = (await checkout.json()) as { error?: string; url?: string };
  if (checkout.status === 503) {
    assert.equal(checkoutBody.error, "PAYMENTS_UNAVAILABLE");
  } else {
    assert.equal(checkout.status, 200);
    assert.match(checkoutBody.url ?? "", /^https:\/\/checkout\.stripe\.com/);
  }

  const webhook = await fetch(`${base}/api/webhooks/stripe`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: "{}",
  });
  assert.ok(webhook.status === 400 || webhook.status === 503);

  console.log("plans checks passed");
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
