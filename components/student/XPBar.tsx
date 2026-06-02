import { xpProgressPercent, xpForLevel } from "@/lib/gamification/xp";

export default function XPBar({ xp, level }: { xp: number; level: number }) {
  const percent = xpProgressPercent(xp, level);
  return (
    <div className="px-1">
      <div className="flex justify-between text-xs mb-1">
        <span className="text-brand-pink font-bold">רמה {level}</span>
        <span className="text-brand-muted">{xp} / {xpForLevel(level)} XP</span>
      </div>
      <div className="bg-brand-border h-2 rounded-full overflow-hidden">
        <div
          className="bg-gradient-to-r from-brand-pink to-brand-orange h-2 rounded-full transition-all duration-500"
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}
