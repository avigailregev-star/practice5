import { ACHIEVEMENT_META, type AchievementType } from "@/lib/gamification/achievements";

export default function AchievementBadge({ type, locked = false }: { type: AchievementType; locked?: boolean }) {
  const meta = ACHIEVEMENT_META[type];
  return (
    <div className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border transition-all ${
      locked
        ? "border-brand-border bg-brand-surface-2 opacity-40"
        : "border-brand-gold bg-brand-surface"
    }`}>
      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
        locked ? "bg-brand-surface text-brand-muted" : "bg-brand-gold text-black"
      }`}>
        {locked ? "?" : meta.label[0]}
      </div>
      <span className="text-xs font-semibold text-center text-white leading-tight">{meta.label}</span>
    </div>
  );
}
