export function levelToPercent(level: number, maxLevel: number): number {
  if (maxLevel === 0) return 0;
  return Math.round((level / maxLevel) * 100);
}

export function percentToLevel(percent: number, maxLevel: number): number {
  const deviceLevel = Math.round((percent / 100) * maxLevel);
  return Math.max(0, Math.min(maxLevel, deviceLevel));
}
