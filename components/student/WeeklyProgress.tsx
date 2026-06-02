const DAYS = ["א", "ב", "ג", "ד", "ה", "ו", "ש"];

export default function WeeklyProgress({ practicedDays }: { practicedDays: number[] }) {
  const today = new Date().getDay();
  return (
    <div>
      <p className="text-brand-text font-bold mb-3">התקדמות שבועית</p>
      <div className="flex justify-between items-center px-2">
        {DAYS.map((day, i) => {
          const practiced = practicedDays.includes(i);
          return (
            <div key={i} className="flex flex-col items-center gap-1">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                  practiced
                    ? "bg-brand-pink"
                    : "bg-brand-border border border-brand-border"
                }`}
              />
              <span className="text-brand-muted text-xs">{day}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
