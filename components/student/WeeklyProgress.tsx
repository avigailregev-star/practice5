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
              className={`w-9 h-9 rounded-full flex items-center justify-center transition-all text-xs font-semibold ${
                practiced
                  ? "bg-brand-gold text-black shadow-sm"
                  : isToday
                  ? "border border-brand-gold text-brand-gold"
                  : "bg-brand-surface text-brand-muted border border-brand-border"
              }`}
            >
              {practiced ? "✓" : day}
            </div>
          </div>
        );
      })}
    </div>
  );
}
