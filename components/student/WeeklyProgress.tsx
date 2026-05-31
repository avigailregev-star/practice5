const DAYS = ["א", "ב", "ג", "ד", "ה", "ו", "ש"];

export default function WeeklyProgress({ practicedDays }: { practicedDays: number[] }) {
  const today = new Date().getDay();
  return (
    <div className="flex justify-between items-center px-2">
      {DAYS.map((day, i) => {
        const practiced = practicedDays.includes(i);
        const isToday = i === today;
        return (
          <div key={i} className="flex flex-col items-center gap-1">
            <div
              className={`w-9 h-9 rounded-full flex items-center justify-center transition-all ${
                practiced
                  ? "bg-brand-red text-white shadow-sm"
                  : isToday
                  ? "border-2 border-brand-red text-brand-red"
                  : "bg-gray-100 text-gray-400"
              }`}
            >
              {practiced ? "✓" : <span className="text-xs">{day}</span>}
            </div>
            <span className="text-xs text-gray-400">{day}</span>
          </div>
        );
      })}
    </div>
  );
}
