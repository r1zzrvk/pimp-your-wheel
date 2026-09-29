export function pegPassedPointer(prev: number, next: number, pegAngle: number) {
  const norm = (deg: number) => ((deg % 360) + 360) % 360;
  const before = norm(pegAngle + prev);
  const delta = norm(next - prev);
  if (delta === 0 || delta > 180) return false;
  return before + delta >= 360;
}

export function polar(
  cx: number,
  cy: number,
  radius: number,
  angleDeg: number,
) {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return [cx + radius * Math.cos(rad), cy + radius * Math.sin(rad)] as const;
}

export function segmentPath(
  cx: number,
  cy: number,
  radius: number,
  index: number,
  count: number,
) {
  const angle = 360 / count;
  const start = index * angle - angle / 2;
  const end = start + angle;
  const [x1, y1] = polar(cx, cy, radius, start);
  const [x2, y2] = polar(cx, cy, radius, end);
  const largeArc = angle > 180 ? 1 : 0;
  return `M ${cx} ${cy} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2} Z`;
}

/** CSS clockwise rotation that centers the segment under the top pointer. */
export function nextSpinRotation(
  currentRotation: number,
  segmentIndex: number,
  segmentCount: number,
  extraTurns = 5,
) {
  const segmentAngle = 360 / segmentCount;
  const target = (360 - segmentIndex * segmentAngle) % 360;
  const currentMod = ((currentRotation % 360) + 360) % 360;
  let delta = target - currentMod;
  if (delta <= 0) delta += 360;
  return currentRotation + extraTurns * 360 + delta;
}
