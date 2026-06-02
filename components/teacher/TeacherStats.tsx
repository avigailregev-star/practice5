// components/teacher/TeacherStats.tsx

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
      <div className="bg-white rounded-2xl p-3 text-center shadow-sm">
        <p className="text-2xl font-bold text-gray-900">{totalStudents}</p>
        <p className="text-xs text-gray-500">תלמידים</p>
      </div>
      <div className="bg-white rounded-2xl p-3 text-center shadow-sm">
        <p className="text-2xl font-bold text-brand-red">{practicedToday}</p>
        <p className="text-xs text-gray-500">תרגלו היום</p>
      </div>
      <div className="bg-white rounded-2xl p-3 text-center shadow-sm">
        <p className="text-2xl font-bold text-brand-gold">{practicedThisWeek}</p>
        <p className="text-xs text-gray-500">השבוע</p>
      </div>
    </div>
  );
}
