export type SegmentLayout = "face" | "radial";

export type WheelReward = {
  tone: string;
  label: string;
  coins: number;
  extraSpins: number;
  spinRoll?: { min: number; max: number };
  weight: number;
  layout: SegmentLayout;
};

export type WheelSegmentView = {
  label: string;
  color: string;
  layout: SegmentLayout;
};

export type WheelId = "classic" | "luck" | "risk" | "fortune";

function coin(base: number, percent: number) {
  return Math.round((base * (100 + percent)) / 100);
}

function face(tone: string, base: number, percent: number): WheelReward {
  const coins = coin(base, percent);
  return { tone, label: String(coins), coins, extraSpins: 0, weight: 1, layout: "face" };
}

function freeSpins(roll?: { min: number; max: number }): WheelReward {
  return {
    tone: "spins",
    label: "Free spins",
    coins: 0,
    extraSpins: roll ? 0 : 2,
    spinRoll: roll,
    weight: 1,
    layout: "radial",
  };
}

function penalty(coins: number): WheelReward {
  return {
    tone: coins === -50 ? "loss50" : "loss",
    label: String(coins),
    coins,
    extraSpins: 0,
    weight: 1,
    layout: "face",
  };
}

const CLASSIC_SEGMENTS: WheelReward[] = [
  { tone: "5", label: "5", coins: 5, extraSpins: 0, weight: 1, layout: "face" },
  { tone: "25", label: "25", coins: 25, extraSpins: 0, weight: 1, layout: "face" },
  { tone: "5", label: "5", coins: 5, extraSpins: 0, weight: 1, layout: "face" },
  { tone: "50", label: "50", coins: 50, extraSpins: 0, weight: 1, layout: "face" },
  { tone: "5", label: "5", coins: 5, extraSpins: 0, weight: 1, layout: "face" },
  { tone: "25", label: "25", coins: 25, extraSpins: 0, weight: 1, layout: "face" },
  { tone: "spins", label: "Free spins", coins: 0, extraSpins: 2, weight: 1, layout: "radial" },
  { tone: "5", label: "5", coins: 5, extraSpins: 0, weight: 1, layout: "face" },
  { tone: "50", label: "50", coins: 50, extraSpins: 0, weight: 1, layout: "face" },
  { tone: "25", label: "25", coins: 25, extraSpins: 0, weight: 1, layout: "face" },
  { tone: "100", label: "100", coins: 100, extraSpins: 0, weight: 1, layout: "face" },
];

const LUCK_SEGMENTS: WheelReward[] = [
  face("5", 5, 5),
  face("25", 25, 5),
  face("5", 5, 5),
  face("50", 50, 5),
  face("5", 5, 5),
  face("25", 25, 5),
  freeSpins(),
  face("5", 5, 5),
  face("50", 50, 5),
  face("25", 25, 5),
  face("100", 100, 5),
];

const RISK_SEGMENTS: WheelReward[] = [
  face("5", 5, 10),
  face("25", 25, 10),
  penalty(-30),
  face("5", 5, 10),
  face("50", 50, 10),
  face("5", 5, 10),
  face("25", 25, 10),
  freeSpins(),
  penalty(-30),
  face("5", 5, 10),
  face("50", 50, 10),
  face("25", 25, 10),
  face("100", 100, 10),
];

const FORTUNE_SEGMENTS: WheelReward[] = [
  face("10", 10, 30),
  face("50", 50, 30),
  freeSpins({ min: 1, max: 3 }),
  penalty(-30),
  face("10", 10, 30),
  face("200", 200, 30),
  face("25", 25, 30),
  penalty(-50),
  face("100", 100, 30),
  freeSpins({ min: 1, max: 3 }),
  penalty(-50),
  face("10", 10, 30),
  face("50", 50, 30),
  face("25", 25, 30),
];

export const WHEELS = [
  { id: "classic" as const, name: "Классика", minLevel: 1, segments: CLASSIC_SEGMENTS },
  { id: "luck" as const, name: "Удача", minLevel: 5, segments: LUCK_SEGMENTS },
  { id: "risk" as const, name: "Риск", minLevel: 10, segments: RISK_SEGMENTS },
  { id: "fortune" as const, name: "Фортуна", minLevel: 15, segments: FORTUNE_SEGMENTS },
];

export const UNLOCKS = [
  { id: "luck", level: 5, title: "Рулетка «Удача» · +5% монет" },
  { id: "risk", level: 10, title: "Рулетка «Риск» · +10% и две клетки −30" },
  { id: "fortune", level: 15, title: "Рулетка «Фортуна» · +30%, фриспины 1–3, клетки −30 и −50" },
  { id: "dawn", level: 20, title: "Фон «Рассвет»" },
  { id: "shine", level: 25, title: "Анимация «Сияние»" },
  { id: "trident", level: 30, title: "Указатель «Трезубец»" },
  { id: "spark", level: 35, title: "Анимация «Искра»" },
  { id: "aurora", level: 40, title: "Фон «Северное сияние»" },
  { id: "legend", level: 50, title: "Тема «Легенда»" },
  { id: "inferno", level: 55, title: "Анимация «Инферно»" },
  { id: "skull", level: 60, title: "Указатель «Череп»" },
  { id: "throne", level: 80, title: "Фон «Трон»" },
] as const;

const COLOR_BY_TONE: Record<string, string> = {
  "5": "#3f3a34",
  "10": "#5c4a38",
  "25": "#8a6232",
  "50": "#c4843a",
  "100": "#f2c14e",
  "200": "#fff1c2",
  loss: "#8f2d2d",
  loss50: "#ef4444",
  spins: "#6f8f72",
};

export type WheelLook = {
  set: string;
  emoji: string;
  rim: string;
  fill: string;
  plate: string;
  peg: string;
  palette: Record<string, string>;
};

export const DEFAULT_HUB = {
  emoji: "💎",
  rim: "#e7d3a1",
  fill: "#1a1610",
  plate: "#1c1914",
  peg: "#e7d3a1",
};

export const LEGEND_HUB = {
  emoji: "🔮",
  rim: "#e9d5ff",
  fill: "#2e1065",
  plate: "#1a0b2e",
  peg: "#c4b5fd",
};

export const WHEEL_SETS = ["Сокровища", "Неон"] as const;

export const WHEEL_LOOKS: Record<string, WheelLook> = {
  "blue-wheel": {
    set: "Сокровища",
    emoji: "🔷",
    rim: "#7dd3fc",
    fill: "#0b1736",
    plate: "#07101f",
    peg: "#bae6fd",
    palette: {
      "5": "#1e3a8a",
      "10": "#1e40af",
      "25": "#2563eb",
      "50": "#7dd3fc",
      "100": "#e0f2fe",
      "200": "#f8fafc",
      loss: "#4c0519",
      loss50: "#fb7185",
      spins: "#2dd4bf",
    },
  },
  "emerald-wheel": {
    set: "Сокровища",
    emoji: "💚",
    rim: "#6ee7b7",
    fill: "#022c22",
    plate: "#041510",
    peg: "#a7f3d0",
    palette: {
      "5": "#064e3b",
      "10": "#065f46",
      "25": "#059669",
      "50": "#34d399",
      "100": "#d1fae5",
      "200": "#ecfdf5",
      loss: "#4c0519",
      loss50: "#fb7185",
      spins: "#fbbf24",
    },
  },
  "gold-wheel": {
    set: "Сокровища",
    emoji: "👑",
    rim: "#fcd34d",
    fill: "#2a1c08",
    plate: "#1a1206",
    peg: "#fde68a",
    palette: {
      "5": "#78350f",
      "10": "#92400e",
      "25": "#d97706",
      "50": "#fbbf24",
      "100": "#fef3c7",
      "200": "#fffbeb",
      loss: "#7f1d1d",
      loss50: "#fca5a5",
      spins: "#fb7185",
    },
  },
  "ruby-wheel": {
    set: "Сокровища",
    emoji: "💍",
    rim: "#fda4af",
    fill: "#2a0610",
    plate: "#1a0a0e",
    peg: "#fecdd3",
    palette: {
      "5": "#881337",
      "10": "#9f1239",
      "25": "#e11d48",
      "50": "#fb7185",
      "100": "#ffe4e6",
      "200": "#fff1f2",
      loss: "#1c1917",
      loss50: "#a8a29e",
      spins: "#fbbf24",
    },
  },
  "cyberpunk-wheel": {
    set: "Неон",
    emoji: "💜",
    rim: "#f0abfc",
    fill: "#140018",
    plate: "#0c0014",
    peg: "#e9d5ff",
    palette: {
      "5": "#2e1065",
      "10": "#4c1d95",
      "25": "#e879f9",
      "50": "#22d3ee",
      "100": "#d9f99d",
      "200": "#fefce8",
      loss: "#4a044e",
      loss50: "#fb7185",
      spins: "#67e8f9",
    },
  },
  "acid-wheel": {
    set: "Неон",
    emoji: "👽",
    rim: "#d9f99d",
    fill: "#052e16",
    plate: "#03150c",
    peg: "#bef264",
    palette: {
      "5": "#14532d",
      "10": "#166534",
      "25": "#a3e635",
      "50": "#f472b6",
      "100": "#ecfccb",
      "200": "#f7fee7",
      loss: "#4a044e",
      loss50: "#fb7185",
      spins: "#22d3ee",
    },
  },
  "laser-wheel": {
    set: "Неон",
    emoji: "💠",
    rim: "#67e8f9",
    fill: "#020617",
    plate: "#01040f",
    peg: "#a5f3fc",
    palette: {
      "5": "#0c4a6e",
      "10": "#075985",
      "25": "#06b6d4",
      "50": "#818cf8",
      "100": "#e0f2fe",
      "200": "#f8fafc",
      loss: "#4c0519",
      loss50: "#fb7185",
      spins: "#f0abfc",
    },
  },
};

export function wheelLook(slug: string | null | undefined): WheelLook {
  if (!slug || !WHEEL_LOOKS[slug]) {
    return { set: "", ...DEFAULT_HUB, palette: COLOR_BY_TONE };
  }
  return WHEEL_LOOKS[slug];
}

const LEGEND_PALETTE: Record<string, string> = {
  "5": "#3b0764",
  "10": "#4c1d95",
  "25": "#7e22ce",
  "50": "#e9d5ff",
  "100": "#fde68a",
  "200": "#fff7ed",
  loss: "#6b21a8",
  loss50: "#fecaca",
  spins: "#67e8f9",
};

export const REWARDS = CLASSIC_SEGMENTS;

export function wheelById(id: string) {
  return WHEELS.find((wheel) => wheel.id === id) ?? WHEELS[0];
}

export function wheelForLevel(id: string, level: number) {
  const wheel = wheelById(id);
  if (level < wheel.minLevel) return WHEELS[0];
  return wheel;
}

export function jackpotSegmentIndex(segments: readonly WheelReward[]) {
  let best = 0;
  for (let index = 1; index < segments.length; index++) {
    if (segments[index].coins > segments[best].coins) best = index;
  }
  return best;
}

export function paintSegments(
  segments: readonly WheelReward[],
  skin: { slug: string } | null,
  legendary: boolean,
): WheelSegmentView[] {
  const palette = legendary
    ? LEGEND_PALETTE
    : (skin && WHEEL_LOOKS[skin.slug]?.palette) || COLOR_BY_TONE;
  return segments.map((segment) => ({
    label: segment.label,
    color: palette[segment.tone] ?? "#3f3a34",
    layout: segment.layout,
  }));
}
