export const XP_PER_SESSION: Record<number, number> = {
  5: 10,
  10: 25,
  15: 40,
  20: 60,
};

export function xpForLevel(level: number): number {
  return level * 100;
}

export function calculateLevelUp(
  currentXp: number,
  currentLevel: number,
  xpEarned: number
): { newXp: number; newLevel: number; leveledUp: boolean } {
  let newXp = currentXp + xpEarned;
  let newLevel = currentLevel;
  let leveledUp = false;

  while (newXp >= xpForLevel(newLevel)) {
    newXp -= xpForLevel(newLevel);
    newLevel++;
    leveledUp = true;
  }

  return { newXp, newLevel, leveledUp };
}

export function xpProgressPercent(xp: number, level: number): number {
  return Math.min(100, Math.round((xp / xpForLevel(level)) * 100));
}
