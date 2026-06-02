// components/teacher/StudentCard.tsx

const SKILL_LABEL: Record<string, string> = {
  notes: "קריאת תווים 🎼",
  rhythm: "מקצבים 🥁",
  scales: "סולמות 🎹",
};

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  if (days > 0) return `לפני ${days} ימים`;
  if (hours > 0) return `לפני ${hours} שעות`;
  if (minutes > 0) return `לפני ${minutes} דקות`;
  return "עכשיו";
}

interface LastSession {
  completed_at: string;
  duration_minutes: number;
  skill_type: string;
}

interface StudentCardProps {
  name: string;
  level: number;
  xp: number;
  sessionCount: number;
  lastSession: LastSession | null;
}

export default function StudentCard({
  name,
  level,
  xp,
  sessionCount,
  lastSession,
}: StudentCardProps) {
  const initial = name[0] ?? "?";
  const practicedToday = lastSession
    ? new Date(lastSession.completed_at).toDateString() === new Date().toDateString()
    : false;

  return (
    <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
      <div className="flex items-center gap-3">
        {/* Avatar */}
        <div className={`w-11 h-11 rounded-full flex items-center justify-center text-lg font-bold flex-shrink-0 ${
          practicedToday ? "bg-brand-red text-white" : "bg-gray-100 text-gray-500"
        }`}>
          {initial}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-gray-900">{name}</span>
            <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full">
              רמה {level}
            </span>
            {practicedToday && (
              <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                תרגל היום ✓
              </span>
            )}
          </div>

          {lastSession ? (
            <div className="text-sm text-gray-500 mt-0.5 flex items-center gap-2 flex-wrap">
              <span>{SKILL_LABEL[lastSession.skill_type] ?? lastSession.skill_type}</span>
              <span>·</span>
              <span>{lastSession.duration_minutes} דקות</span>
              <span>·</span>
              <span>{timeAgo(lastSession.completed_at)}</span>
            </div>
          ) : (
            <p className="text-sm text-gray-400 mt-0.5">טרם תרגל</p>
          )}
        </div>

        {/* Session count */}
        <div className="text-center flex-shrink-0">
          <p className="text-lg font-bold text-brand-red">{sessionCount}</p>
          <p className="text-xs text-gray-400">תרגולים</p>
        </div>
      </div>
    </div>
  );
}
