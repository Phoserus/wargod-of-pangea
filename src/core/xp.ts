export function xpForLevel(level: number): number {
  if (level <= 1) return 0;
  let total = 0;
  for (let n = 1; n < level; n++) {
    total += Math.floor(n + 300 * Math.pow(2, n / 7));
  }
  return Math.floor(total / 4);
}

export function levelFromXp(xp: number): number {
  let lvl = 1;
  while (lvl < 100 && xp >= xpForLevel(lvl + 1)) lvl++;
  return lvl;
}
