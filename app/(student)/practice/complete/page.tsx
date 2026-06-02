import Link from "next/link";

export default async function CompletePage({
  searchParams,
}: {
  searchParams: Promise<{ xp?: string; leveled?: string }>;
}) {
  const { xp, leveled } = await searchParams;
  const xpEarned = Number(xp ?? 0);
  const leveledUpTo = Number(leveled ?? 0);
  const didLevelUp = leveledUpTo > 0;

  return (
    <main className="min-h-screen bg-brand-bg flex flex-col items-center justify-center px-6 text-center">
      <div className="bg-brand-card rounded-3xl border border-brand-border p-8 shadow-sm max-w-sm w-full">
        {/* Trophy */}
        <div className="w-16 h-16 rounded-full border-2 border-brand-pink bg-brand-card flex items-center justify-center mx-auto mb-4">
          <span className="text-brand-pink text-3xl font-bold">★</span>
        </div>

        {didLevelUp ? (
          <>
            <h1 className="text-2xl font-extrabold text-brand-text mb-1">עלית לרמה {leveledUpTo}!</h1>
            <p className="text-brand-muted mb-2">כל הכבוד — אתה מתקדם</p>
          </>
        ) : (
          <>
            <h1 className="text-2xl font-extrabold text-brand-text mb-1">תרגול הושלם</h1>
            <p className="text-brand-muted mb-2">עשית עבודה מצוינת</p>
          </>
        )}

        {/* XP Badge */}
        <div className="bg-brand-pink/10 rounded-xl py-4 px-6 my-6 border border-brand-pink/20">
          <p className="text-3xl font-bold text-brand-pink">+{xpEarned} XP</p>
          <p className="text-sm text-brand-muted mt-1">ניקוד שהרווחת</p>
        </div>

        <Link
          href="/practice"
          className="block w-full bg-brand-pink text-white rounded-xl py-3 font-bold text-lg"
        >
          לתרגול הבא
        </Link>
      </div>
    </main>
  );
}
