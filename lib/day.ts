export function utcDayStart(now = new Date()) {
  return new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
  );
}

export function nextUtcMidnight(now = new Date()) {
  return new Date(utcDayStart(now).getTime() + 24 * 60 * 60 * 1000);
}
