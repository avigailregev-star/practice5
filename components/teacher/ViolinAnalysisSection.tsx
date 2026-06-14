"use client";

interface StudentPracticeStatus {
  name: string;
  practiced: boolean;
}

interface DomainDifficulty {
  domain: string;
  label: string;
  belowFifty: number;
  total: number;
}

interface ViolinAnalysisData {
  studentPracticeStatuses: StudentPracticeStatus[];
  domainDifficulties: DomainDifficulty[];
  totalSessions: number;
}

interface Props {
  data: ViolinAnalysisData;
}

export default function ViolinAnalysisSection({ data }: Props) {
  if (data.totalSessions === 0 && data.studentPracticeStatuses.length === 0) return null;

  const notPracticed = data.studentPracticeStatuses.filter((s) => !s.practiced);
  const practiced = data.studentPracticeStatuses.filter((s) => s.practiced);

  return (
    <div className="px-4 mb-6 flex flex-col gap-4">

      {/* מי לא תרגל השבוע */}
      <div className="bg-brand-card rounded-2xl border border-brand-border p-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-bold text-brand-text">📅 תרגול השבוע</h2>
          <span className="text-xs text-brand-muted">
            {practiced.length}/{data.studentPracticeStatuses.length} תרגלו
          </span>
        </div>

        {notPracticed.length === 0 ? (
          <p className="text-sm text-green-600 font-semibold text-center py-2">✅ כל התלמידים תרגלו השבוע!</p>
        ) : (
          <>
            {notPracticed.length > 0 && (
              <div className="mb-3">
                <p className="text-xs font-semibold text-red-500 mb-2">לא תרגלו ({notPracticed.length})</p>
                <div className="flex flex-wrap gap-2">
                  {notPracticed.map((s) => (
                    <span key={s.name} className="text-xs bg-red-50 border border-red-200 text-red-600 rounded-full px-3 py-1 font-medium">
                      ❌ {s.name}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {practiced.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-green-600 mb-2">תרגלו ({practiced.length})</p>
                <div className="flex flex-wrap gap-2">
                  {practiced.map((s) => (
                    <span key={s.name} className="text-xs bg-green-50 border border-green-200 text-green-700 rounded-full px-3 py-1 font-medium">
                      ✅ {s.name}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* איפה הכי קשה */}
      <div className="bg-brand-card rounded-2xl border border-brand-border p-4">
        <h2 className="font-bold text-brand-text mb-3">⚠️ איפה התלמידים מתקשים</h2>
        <p className="text-xs text-brand-muted mb-3">תלמידים עם ציון מבחן מתחת ל-50%</p>
        <div className="flex flex-col gap-3">
          {data.domainDifficulties.map((d) => {
            const pct = d.total > 0 ? Math.round((d.belowFifty / d.total) * 100) : 0;
            const color = pct >= 60 ? "bg-red-400" : pct >= 30 ? "bg-amber-400" : "bg-green-400";
            const textColor = pct >= 60 ? "text-red-600" : pct >= 30 ? "text-amber-600" : "text-green-600";
            return (
              <div key={d.domain}>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm font-medium text-brand-text">{d.label}</span>
                  {d.total === 0 ? (
                    <span className="text-xs text-brand-muted">טרם נבדק</span>
                  ) : (
                    <span className={`text-xs font-bold ${textColor}`}>
                      {d.belowFifty}/{d.total} תלמידים
                    </span>
                  )}
                </div>
                <div className="w-full h-2 bg-brand-border rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${d.total === 0 ? "bg-brand-border" : color}`}
                    style={{ width: d.total === 0 ? "0%" : `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
