export const ACHIEVEMENT_METRICS = ["LEVEL", "SPINS", "STREAK", "BALANCE", "SPIN_WIN", "ITEMS"] as const;

export type AchievementMetric = (typeof ACHIEVEMENT_METRICS)[number];

export const METRIC_LABEL: Record<AchievementMetric, string> = {
  LEVEL: "Уровень",
  SPINS: "Крутки",
  STREAK: "Серия",
  BALANCE: "Баланс",
  SPIN_WIN: "Выигрыш за крутку",
  ITEMS: "Покупки",
};

export type AchievementUnlock = {
  id: string;
  name: string;
  emoji: string;
};

export type AchievementView = AchievementUnlock & {
  description: string;
  metric: AchievementMetric;
  threshold: number;
  unlocked: boolean;
  unlockedAt: string | null;
};

export const STARTER_ACHIEVEMENTS: Array<{
  slug: string;
  name: string;
  emoji: string;
  description: string;
  metric: AchievementMetric;
  threshold: number;
}> = [
  {
    slug: "first-spin",
    name: "Первая крутка",
    emoji: "🎲",
    description: "Крутануть колесо хотя бы один раз.",
    metric: "SPINS",
    threshold: 1,
  },
  {
    slug: "level-5",
    name: "Пятёрка",
    emoji: "⭐",
    description: "Дойти до 5 уровня.",
    metric: "LEVEL",
    threshold: 5,
  },
  {
    slug: "level-10",
    name: "Десятка",
    emoji: "🔥",
    description: "Дойти до 10 уровня.",
    metric: "LEVEL",
    threshold: 10,
  },
  {
    slug: "streak-3",
    name: "Три дня подряд",
    emoji: "📅",
    description: "Заходить и крутить три дня подряд.",
    metric: "STREAK",
    threshold: 3,
  },
  {
    slug: "streak-7",
    name: "Неделя удачи",
    emoji: "🏅",
    description: "Держать серию семь дней.",
    metric: "STREAK",
    threshold: 7,
  },
  {
    slug: "balance-500",
    name: "Толстый кошелёк",
    emoji: "💰",
    description: "Накопить 500 монет.",
    metric: "BALANCE",
    threshold: 500,
  },
  {
    slug: "spin-100",
    name: "Джекпот",
    emoji: "💎",
    description: "Выиграть 100 монет одной круткой.",
    metric: "SPIN_WIN",
    threshold: 100,
  },
  {
    slug: "first-buy",
    name: "Первая покупка",
    emoji: "🛍️",
    description: "Купить что-нибудь в магазине.",
    metric: "ITEMS",
    threshold: 1,
  },
];

function plural(value: number, one: string, few: string, many: string) {
  const abs = Math.abs(value) % 100;
  const last = abs % 10;
  if (abs > 10 && abs < 20) return many;
  if (last === 1) return one;
  if (last > 1 && last < 5) return few;
  return many;
}

export function achievementGoal(metric: AchievementMetric, threshold: number) {
  switch (metric) {
    case "LEVEL":
      return `Достичь ${threshold} уровня`;
    case "SPINS":
      return `Сделать ${threshold} ${plural(threshold, "крутку", "крутки", "круток")}`;
    case "STREAK":
      return `Серия ${threshold} ${plural(threshold, "день", "дня", "дней")}`;
    case "BALANCE":
      return `Иметь ${threshold} монет`;
    case "SPIN_WIN":
      return `Выиграть ${threshold} монет за крутку`;
    case "ITEMS":
      return `Купить ${threshold} ${plural(threshold, "предмет", "предмета", "предметов")}`;
  }
}
