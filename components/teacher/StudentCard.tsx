const SKILL_LABEL: Record<string, string> = {
  notes: "קריאת תווים",
  rhythm: "מקצבים",
  scales: "סולמות",
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
    <div className="bg-brand-surface rounded-2xl p-4 border border-brand-border">
      <div className="flex items-center gap-3">
        <div className={`w-11 h-11 rounded-full flex items-center justify-center text-lg font-bold flex-shrink-0 ${
          practicedToday ? "bg-brand-gold text-black" : "bg-brand-surface-2 text-brand-muted border border-brand-border"
        }`}>
          {initial}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-white">{name}</span>
            <span className="text-xs bg-brand-surface-2 text-brand-muted border border-brand-border px-2 py-0.5 rounded-full">
              רמה {level}
            </span>
            {practicedToday && (
              <span className="text-xs bg-brand-surface border border-brand-gold text-brand-gold px-2 py-0.5 rounded-full">
                תרגל היום
              </span>
            )}
          </div>

          {lastSession ? (
            <div className="text-sm text-brand-muted mt-0.5 flex items-center gap-2 flex-wrap">
              <span>{SKILL_LABEL[lastSession.skill_type] ?? lastSession.skill_type}</span>
              <span>·</span>
              <span>{lastSession.duration_minutes} דק'</span>
              <span>·</span>
              <span>{timeAgo(lastSession.completed_at)}</span>
            </div>
          ) : (
            <p className="text-sm text-brand-muted mt-0.5">טרם תרגל</p>
          )}
        </div>

        <div className="text-center flex-shrink-0">
          <p className="text-lg font-bold text-brand-gold">{sessionCount}</p>
          <p className="text-xs text-brand-muted">תרגולים</p>
        </div>
      </div>
    </div>
  );
}
