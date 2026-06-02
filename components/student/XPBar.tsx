import { xpProgressPercent, xpForLevel } from "@/lib/gamification/xp";

export default function XPBar({ xp, level }: { xp: number; level: number }) {
  const percent = xpProgressPercent(xp, level);
  return (
    <div className="px-1">
      <div className="flex justify-between text-xs mb-1">
        <span className="text-brand-gold font-semibold tracking-wide">רמה {level}</span>
        <span className="text-brand-muted">{xp} / {xpForLevel(level)} XP</span>
      </div>
      <div className="h-1.5 bg-brand-surface rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{
            width: `${percent}%`,
            background: "linear-gradient(90deg, #c9a84c, #e8c96d)",
          }}
        />
      </div>
    </div>
  );
}
