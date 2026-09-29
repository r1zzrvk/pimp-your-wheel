import { ApiError } from "@/lib/api-error";

export const AVATARS = [
  "🎲",
  "🎯",
  "💎",
  "👑",
  "🔥",
  "⚡",
  "💀",
  "🤡",
  "👽",
  "🐯",
  "🦊",
  "🐸",
  "🌙",
  "⭐",
  "🐉",
  "🦄",
  "🍀",
  "🎸",
  "🕶️",
  "🚀",
  "💫",
  "🪄",
  "💍",
  "💜",
] as const;

const AVATAR_SET = new Set<string>(AVATARS);

export function cleanDisplayName(value: unknown) {
  const name = String(value ?? "")
    .trim()
    .replace(/\s+/g, " ");
  if (name.length > 24) throw new ApiError(400, "NAME_TOO_LONG");
  return name;
}

export function cleanAvatar(value: unknown) {
  const avatar = String(value ?? "");
  if (!AVATAR_SET.has(avatar)) throw new ApiError(400, "BAD_AVATAR");
  return avatar;
}

export function profileLabel(displayName: string, email: string) {
  return displayName || email.split("@")[0] || email;
}
