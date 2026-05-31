import { xpProgressPercent, xpForLevel } from "@/lib/gamification/xp";

export default function XPBar({ xp, level }: { xp: number; level: number }) {
  const percent = xpProgressPercent(xp, level);
  return (
    <div className="px-1">
      <div className="flex justify-between text-xs text-gray-500 mb-1">
        <span>רמה {level}</span>
        <span>{xp} / {xpForLevel(level)} XP</span>
      </div>
      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
        <div
          className="h-full bg-brand-gold rounded-full transition-all duration-500"
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}
