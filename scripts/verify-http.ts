import assert from "node:assert/strict";
import { prisma } from "../lib/db";
import { PLAN_SPINS } from "../lib/economy";
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
  const anon = await fetch(`${base}/`, { redirect: "manual" });
  assert.equal(anon.status, 307);
  assert.match(anon.headers.get("location") ?? "", /\/login/);

  const loginPage = await fetch(`${base}/login`);
  assert.equal(loginPage.status, 200);
  assert.match(await loginPage.text(), /С возвращением/);

  const registerPage = await fetch(`${base}/register`);
  const registerHtml = await registerPage.text();
  assert.match(registerHtml, /Создать аккаунт/);
  assert.match(registerHtml, /100 бесплатных круток/);

  const email = `http-${Date.now()}@example.com`;
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
    body: new URLSearchParams({
      csrfToken,
      email,
      password,
      callbackUrl: `${base}/`,
    }),
  });
  remember(jar, login);
  assert.ok(login.status === 302 || login.status === 303);

  const home = await fetch(`${base}/`, {
    headers: { cookie: cookieHeader(jar) },
  });
  const homeHtml = (await home.text()).replaceAll("<!-- -->", "");
  assert.equal(home.status, 200);
  assert.match(homeHtml, /href="\/profile"/);
  assert.match(homeHtml, />Настройки</);
  assert.match(homeHtml, /e7d3a1/);
  assert.match(homeHtml, /Пропустить анимацию/);
  assert.match(homeHtml, /Фортуна/);
  assert.match(homeHtml, /Классика/);
  assert.match(homeHtml, /Удача/);
  assert.match(homeHtml, /Риск/);
  assert.match(homeHtml, new RegExp(`Осталось ${PLAN_SPINS.FREE} из ${PLAN_SPINS.FREE}`));
  assert.match(homeHtml, /0 монет/);

  const profile = await fetch(`${base}/profile`, {
    headers: { cookie: cookieHeader(jar) },
  });
  const profileHtml = (await profile.text()).replaceAll("<!-- -->", "");
  assert.equal(profile.status, 200);
  assert.match(profileHtml, /Выключить звуки/);
  assert.match(profileHtml, /aria-checked="true"/);
  assert.match(profileHtml, /Выйти/);
  assert.doesNotMatch(profileHtml, /<h1[^>]*>Профиль/);
  const settings = await fetch(`${base}/settings`, {
    redirect: "manual",
    headers: { cookie: cookieHeader(jar) },
  });
  assert.equal(settings.status, 307);
  assert.match(settings.headers.get("location") ?? "", /\/profile/);
  assert.match(homeHtml, /href="\/levels"/);

  const levels = await fetch(`${base}/levels`, {
    headers: { cookie: cookieHeader(jar) },
  });
  const levelsHtml = (await levels.text()).replaceAll("<!-- -->", "");
  assert.equal(levels.status, 200);
  assert.match(levelsHtml, /Уровень 1/);
  assert.match(levelsHtml, /Уровень 100/);
  assert.match(levelsHtml, /Тема «Легенда»/);
  assert.match(levelsHtml, /Фон «Рассвет»/);
  assert.match(levelsHtml, /Фон «Трон»/);
  assert.match(levelsHtml, /Указатель «Трезубец»/);
  assert.match(levelsHtml, /Анимация «Инферно»/);
  assert.match(levelsHtml, /Указатель «Череп»/);

  const spins = [];
  for (let i = 0; i < 3; i++) {
    const response = await fetch(`${base}/api/spins`, {
      method: "POST",
      headers: { cookie: cookieHeader(jar) },
    });
    assert.equal(response.status, 200);
    spins.push(
      (await response.json()) as {
        coins: number;
        segmentIndex: number;
        spinsLeft: number;
        extraSpins: number;
      },
    );
  }
  const spinsLeft = PLAN_SPINS.FREE - spins.length + spins.reduce((sum, spin) => sum + spin.extraSpins, 0);
  assert.equal(spins[2].spinsLeft, spinsLeft);

  const shop = await fetch(`${base}/shop`, {
    headers: { cookie: cookieHeader(jar) },
  });
  const shopHtml = (await shop.text()).replaceAll("<!-- -->", "");
  assert.match(shopHtml, /Сокровища/);
  assert.match(shopHtml, /Сапфир/);
  assert.match(shopHtml, /Изумруд/);
  assert.match(shopHtml, /Золото/);
  assert.match(shopHtml, /Рубин/);
  assert.match(shopHtml, /Кислота/);
  assert.match(shopHtml, /Лазер/);
  assert.match(shopHtml, /🔷/);
  assert.match(shopHtml, /👽/);
  assert.match(shopHtml, /🔮/);
  assert.match(shopHtml, /Палец/);
  assert.match(shopHtml, /500/);
  assert.match(shopHtml, /👇/);
  assert.match(shopHtml, /Колесо/);
  assert.match(shopHtml, /Фон/);
  assert.match(shopHtml, /Указатель/);
  assert.match(shopHtml, /Анимация/);
  assert.match(shopHtml, /Ночное небо/);
  assert.match(shopHtml, /Неоновый переулок/);
  assert.match(shopHtml, /Золотая пыль/);
  assert.match(shopHtml, /Рассвет/);
  assert.match(shopHtml, /Северное сияние/);
  assert.match(shopHtml, /Трон/);
  assert.match(shopHtml, /Откроется на 20 уровне/);
  assert.match(shopHtml, /Язык/);
  assert.match(shopHtml, /Булавка/);
  assert.match(shopHtml, /Клоун/);
  assert.match(shopHtml, /Клинок/);
  assert.match(shopHtml, /Молния/);
  assert.match(shopHtml, /Трезубец/);
  assert.match(shopHtml, /Череп/);
  assert.match(shopHtml, /Сияние/);
  assert.match(shopHtml, /Огонь/);
  assert.match(shopHtml, /Пожар/);
  assert.match(shopHtml, /Искра/);
  assert.match(shopHtml, /Инферно/);
  assert.match(shopHtml, /Откроется на 30 уровне/);
  assert.match(shopHtml, /Откроется на 55 уровне/);
  assert.match(shopHtml, /Легенда/);
  assert.match(shopHtml, /Откроется на 25 уровне/);
  assert.match(shopHtml, /Откроется на 50 уровне/);
  assert.match(shopHtml, /🔒/);

  const me = await fetch(`${base}/api/me`, {
    headers: { cookie: cookieHeader(jar) },
  });
  const profile = (await me.json()) as {
    email: string;
    spinsLeft: number;
    balance: number;
  };
  assert.equal(profile.spinsLeft, spinsLeft);
  assert.equal(profile.balance, spins.reduce((sum, spin) => sum + spin.coins, 0));

  await prisma.user.update({
    where: { email: profile.email },
    data: { plan: "PRO" },
  });
  let balance = profile.balance;
  while (balance < 100) {
    const response = await fetch(`${base}/api/spins`, {
      method: "POST",
      headers: { cookie: cookieHeader(jar) },
    });
    assert.equal(response.status, 200);
    balance = ((await response.json()) as { balance: number }).balance;
  }

  const bought = await fetch(`${base}/api/shop/purchase`, {
    method: "POST",
    headers: {
      cookie: cookieHeader(jar),
      "content-type": "application/json",
    },
    body: JSON.stringify({ cosmeticId: "blue-wheel" }),
  });
  assert.equal(bought.status, 200);

  const equipped = await fetch(`${base}/api/inventory/equip`, {
    method: "POST",
    headers: {
      cookie: cookieHeader(jar),
      "content-type": "application/json",
    },
    body: JSON.stringify({ cosmeticId: "blue-wheel" }),
  });
  assert.equal(equipped.status, 200);

  const skinned = await fetch(`${base}/`, {
    headers: { cookie: cookieHeader(jar) },
  });
  const skinnedHtml = await skinned.text();
  assert.match(skinnedHtml, /Сапфир/);
  assert.match(skinnedHtml, /#1e3a8a/);

  const removed = await fetch(`${base}/api/inventory/equip`, {
    method: "POST",
    headers: {
      cookie: cookieHeader(jar),
      "content-type": "application/json",
    },
    body: JSON.stringify({ cosmeticId: null }),
  });
  assert.equal(removed.status, 200);

  const guest = await fetch(`${base}/api/me`);
  assert.equal(guest.status, 401);

  console.log("http checks passed");
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
