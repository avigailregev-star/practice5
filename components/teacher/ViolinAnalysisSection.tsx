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
  avgScore: number | null;
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
        <h2 className="font-bold text-brand-text mb-1">📊 ציוני מבחנים לפי תחום</h2>
        <p className="text-xs text-brand-muted mb-4">ממוצע ציוני כל התלמידים שנבחנו</p>
        <div className="grid grid-cols-3 gap-3">
          {data.domainDifficulties.map((d) => {
            const avgScore = d.avgScore;
            const bgColor = avgScore === null ? "bg-gray-50 border-gray-200"
              : avgScore >= 80 ? "bg-green-50 border-green-200"
              : avgScore >= 50 ? "bg-amber-50 border-amber-200"
              : "bg-red-50 border-red-200";
            const numColor = avgScore === null ? "text-brand-muted"
              : avgScore >= 80 ? "text-green-600"
              : avgScore >= 50 ? "text-amber-500"
              : "text-red-500";
            return (
              <div key={d.domain} className={`rounded-xl border p-3 text-center ${bgColor}`}>
                <p className={`text-2xl font-extrabold ${numColor}`}>
                  {avgScore !== null ? `${avgScore}%` : "—"}
                </p>
                <p className="text-xs font-medium text-brand-text mt-1">{d.label}</p>
                <p className="text-xs text-brand-muted mt-0.5">
                  {d.total > 0 ? `${d.total} נבחנו` : "טרם נבחנו"}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
