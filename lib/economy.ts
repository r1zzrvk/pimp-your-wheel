export const PLAN_SPINS = {
  FREE: 100,
  BASIC: 10,
  PRO: 30,
} as const;

export type PlanId = keyof typeof PLAN_SPINS;

export { REWARDS } from "@/lib/wheels";

export const FINGER_POINTER_SLUG = "finger-pointer";

export const BACKGROUNDS = [
  {
    slug: "night-sky",
    name: "Ночное небо",
    priceCoins: 300,
    minLevel: 1,
    primary: "#070b18",
    secondary: "#1e3a8a",
    accent: "#93c5fd",
  },
  {
    slug: "neon-alley",
    name: "Неоновый переулок",
    priceCoins: 900,
    minLevel: 1,
    primary: "#120014",
    secondary: "#86198f",
    accent: "#22d3ee",
  },
  {
    slug: "gold-dust",
    name: "Золотая пыль",
    priceCoins: 1800,
    minLevel: 1,
    primary: "#1a1206",
    secondary: "#a16207",
    accent: "#fde68a",
  },
  {
    slug: "dawn",
    name: "Рассвет",
    priceCoins: 0,
    minLevel: 20,
    primary: "#2a120c",
    secondary: "#c2410c",
    accent: "#fdba74",
  },
  {
    slug: "aurora",
    name: "Северное сияние",
    priceCoins: 0,
    minLevel: 40,
    primary: "#041410",
    secondary: "#0f766e",
    accent: "#6ee7b7",
  },
  {
    slug: "throne",
    name: "Трон",
    priceCoins: 0,
    minLevel: 80,
    primary: "#1a0a12",
    secondary: "#9f1239",
    accent: "#f0a202",
  },
] as const;

export function backgroundBySlug(slug: string) {
  return BACKGROUNDS.find((item) => item.slug === slug);
}

export const POINTERS = [
  {
    slug: FINGER_POINTER_SLUG,
    name: "Палец",
    priceCoins: 500,
    minLevel: 1,
    emoji: "👇",
    turn: 0,
    primary: "#f0a202",
    secondary: "#f6f1e7",
    accent: "#f0a202",
  },
  {
    slug: "banana-pointer",
    name: "Язык",
    priceCoins: 200,
    minLevel: 1,
    emoji: "👅",
    turn: 0,
    primary: "#fb7185",
    secondary: "#9f1239",
    accent: "#ffe4e6",
  },
  {
    slug: "paw-pointer",
    name: "Булавка",
    priceCoins: 350,
    minLevel: 1,
    emoji: "📍",
    turn: 0,
    primary: "#ef4444",
    secondary: "#7f1d1d",
    accent: "#fecaca",
  },
  {
    slug: "clown-pointer",
    name: "Клоун",
    priceCoins: 450,
    minLevel: 1,
    emoji: "🤡",
    turn: 0,
    primary: "#f97316",
    secondary: "#7c2d12",
    accent: "#ffedd5",
  },
  {
    slug: "dagger-pointer",
    name: "Клинок",
    priceCoins: 1200,
    minLevel: 1,
    emoji: "🗡️",
    turn: -45,
    primary: "#cbd5e1",
    secondary: "#1e293b",
    accent: "#f8fafc",
  },
  {
    slug: "bolt-pointer",
    name: "Молния",
    priceCoins: 1500,
    minLevel: 1,
    emoji: "⚡",
    turn: 0,
    primary: "#fde047",
    secondary: "#1e3a8a",
    accent: "#fef9c3",
  },
  {
    slug: "trident-pointer",
    name: "Трезубец",
    priceCoins: 0,
    minLevel: 30,
    emoji: "🔱",
    turn: 0,
    primary: "#38bdf8",
    secondary: "#0c4a6e",
    accent: "#e0f2fe",
  },
  {
    slug: "skull-pointer",
    name: "Череп",
    priceCoins: 0,
    minLevel: 60,
    emoji: "💀",
    turn: 0,
    primary: "#e7e5e4",
    secondary: "#292524",
    accent: "#fafaf9",
  },
] as const;

export const GLOWS = ["white", "gold", "fire", "blaze", "spark", "inferno"] as const;
export type GlowName = (typeof GLOWS)[number];

export const ANIMATIONS = [
  {
    slug: "shine",
    name: "Сияние",
    priceCoins: 0,
    minLevel: 25,
    glow: "gold",
    primary: "#fde68a",
    secondary: "#f59e0b",
    accent: "#fff7ed",
  },
  {
    slug: "fire",
    name: "Огонь",
    priceCoins: 700,
    minLevel: 1,
    glow: "fire",
    primary: "#ea580c",
    secondary: "#7c2d12",
    accent: "#fdba74",
  },
  {
    slug: "blaze",
    name: "Пожар",
    priceCoins: 1600,
    minLevel: 1,
    glow: "blaze",
    primary: "#dc2626",
    secondary: "#450a0a",
    accent: "#fca5a5",
  },
  {
    slug: "spark",
    name: "Искра",
    priceCoins: 0,
    minLevel: 35,
    glow: "spark",
    primary: "#22d3ee",
    secondary: "#082f49",
    accent: "#ecfeff",
  },
  {
    slug: "inferno",
    name: "Инферно",
    priceCoins: 0,
    minLevel: 55,
    glow: "inferno",
    primary: "#b91c1c",
    secondary: "#1c0a0a",
    accent: "#f97316",
  },
] as const;

export function pointerBySlug(slug: string) {
  return POINTERS.find((item) => item.slug === slug);
}

export function pointerTurn(emoji: string) {
  return POINTERS.find((item) => item.emoji === emoji)?.turn ?? 0;
}

export function animationBySlug(slug: string) {
  return ANIMATIONS.find((item) => item.slug === slug);
}

export function cosmeticRule(slug: string) {
  return backgroundBySlug(slug) ?? pointerBySlug(slug) ?? animationBySlug(slug);
}

export function cosmeticKind(slug: string): "wheel" | "pointer" | "background" | "animation" {
  if (pointerBySlug(slug)) return "pointer";
  if (backgroundBySlug(slug)) return "background";
  if (animationBySlug(slug)) return "animation";
  return "wheel";
}

export function backgroundGradient(item: { primary: string; secondary: string; accent: string }) {
  return `radial-gradient(520px 280px at 18% 0%, ${item.accent}66, transparent 58%), radial-gradient(480px 320px at 100% 100%, ${item.secondary}88, transparent 55%), ${item.primary}`;
}

export const COSMETICS = [
  {
    slug: "blue-wheel",
    name: "Сапфир",
    priceCoins: 100,
    primary: "#1e3a8a",
    secondary: "#2563eb",
    accent: "#e0f2fe",
  },
  {
    slug: "emerald-wheel",
    name: "Изумруд",
    priceCoins: 700,
    primary: "#064e3b",
    secondary: "#34d399",
    accent: "#d1fae5",
  },
  {
    slug: "gold-wheel",
    name: "Золото",
    priceCoins: 1500,
    primary: "#78350f",
    secondary: "#fbbf24",
    accent: "#fef3c7",
  },
  {
    slug: "ruby-wheel",
    name: "Рубин",
    priceCoins: 2200,
    primary: "#881337",
    secondary: "#e11d48",
    accent: "#ffe4e6",
  },
  {
    slug: "cyberpunk-wheel",
    name: "Неон",
    priceCoins: 500,
    primary: "#2e1065",
    secondary: "#e879f9",
    accent: "#22d3ee",
  },
  {
    slug: "acid-wheel",
    name: "Кислота",
    priceCoins: 900,
    primary: "#14532d",
    secondary: "#a3e635",
    accent: "#f472b6",
  },
  {
    slug: "laser-wheel",
    name: "Лазер",
    priceCoins: 1300,
    primary: "#0c4a6e",
    secondary: "#06b6d4",
    accent: "#818cf8",
  },
] as const;

export type CosmeticSeed = (typeof COSMETICS)[number];

export function spinsPerDay(plan: PlanId) {
  return PLAN_SPINS[plan];
}

export const LIMIT_RESET_CENTS = 199;
export const LIMIT_RESET_LABEL = "$1.99";

export const PLAN_OFFERS = [
  {
    id: "FREE" as const,
    title: "Free",
    priceLabel: "$0",
    detail: "Базовая рулетка",
  },
  {
    id: "BASIC" as const,
    title: "Basic",
    priceLabel: "$4.99",
    detail: "В месяц",
  },
  {
    id: "PRO" as const,
    title: "Pro",
    priceLabel: "$19.99",
    detail: "В месяц",
  },
];

export type PaidPlanId = "BASIC" | "PRO";

