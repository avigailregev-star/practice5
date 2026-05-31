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
    <main className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-6 text-center">
      <div className="bg-white rounded-3xl p-8 shadow-lg max-w-sm w-full">
        {didLevelUp ? (
          <>
            <div className="text-6xl mb-4">🏆</div>
            <h1 className="text-2xl font-bold text-gray-900 mb-1">עלית לרמה {leveledUpTo}!</h1>
            <p className="text-gray-500 mb-2">כל הכבוד — אתה מתקדם!</p>
          </>
        ) : (
          <>
            <div className="text-6xl mb-4">⭐</div>
            <h1 className="text-2xl font-bold text-gray-900 mb-1">תרגול הושלם!</h1>
            <p className="text-gray-500 mb-2">עשית עבודה מצוינת</p>
          </>
        )}

        <div className="bg-yellow-50 rounded-2xl py-4 px-6 my-6">
          <p className="text-3xl font-bold text-brand-gold">+{xpEarned} XP</p>
          <p className="text-sm text-yellow-700">ניקוד שהרווחת</p>
        </div>

        <Link
          href="/practice"
          className="block w-full bg-brand-red text-white rounded-2xl py-3 font-bold text-lg"
        >
          לתרגול הבא ▶
        </Link>
      </div>
    </main>
  );
}
