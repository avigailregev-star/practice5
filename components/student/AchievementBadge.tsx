import { ACHIEVEMENT_META, type AchievementType } from "@/lib/gamification/achievements";

export default function AchievementBadge({ type, locked = false }: { type: AchievementType; locked?: boolean }) {
  const meta = ACHIEVEMENT_META[type];
  return (
    <div className={`flex flex-col items-center gap-1 p-3 rounded-2xl border ${locked ? "border-gray-100 bg-gray-50 opacity-40" : "border-yellow-200 bg-yellow-50"}`}>
      <span className="text-2xl">{locked ? "🔒" : meta.emoji}</span>
      <span className="text-xs font-semibold text-center text-gray-700">{meta.label}</span>
    </div>
  );
}
