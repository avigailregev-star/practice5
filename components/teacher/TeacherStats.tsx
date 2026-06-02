interface TeacherStatsProps {
  totalStudents: number;
  practicedToday: number;
  practicedThisWeek: number;
}

export default function TeacherStats({
  totalStudents,
  practicedToday,
  practicedThisWeek,
}: TeacherStatsProps) {
  return (
    <div className="grid grid-cols-3 gap-3 px-4 mb-4">
      <div className="bg-brand-surface rounded-2xl p-3 text-center border border-brand-border">
        <p className="text-2xl font-bold text-white">{totalStudents}</p>
        <p className="text-xs text-brand-muted">תלמידים</p>
      </div>
      <div className="bg-brand-surface rounded-2xl p-3 text-center border border-brand-border">
        <p className="text-2xl font-bold text-brand-gold">{practicedToday}</p>
        <p className="text-xs text-brand-muted">תרגלו היום</p>
      </div>
      <div className="bg-brand-surface rounded-2xl p-3 text-center border border-brand-border">
        <p className="text-2xl font-bold text-brand-gold">{practicedThisWeek}</p>
        <p className="text-xs text-brand-muted">השבוע</p>
      </div>
    </div>
  );
}
