import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import TimeSkillSelector from "@/components/student/TimeSkillSelector";
import XPBar from "@/components/student/XPBar";
import WeeklyProgress from "@/components/student/WeeklyProgress";
import ViolinMascot from "@/components/shared/ViolinMascot";

export default async function PracticePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("name, level, xp, level_notes, level_rhythm, level_pitch")
    .eq("id", user.id)
    .single() as { data: { name: string; level: number; xp: number; level_notes: number | null; level_rhythm: number | null; level_pitch: number | null } | null };

  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 6);
  const { data: sessions } = await supabase
    .from("practice_sessions")
    .select("completed_at")
    .eq("student_id", user.id)
    .not("completed_at", "is", null)
    .gte("completed_at", weekAgo.toISOString());

  const practicedDays: number[] = [
    ...new Set(
      (sessions as Array<{ completed_at: string }> | null)?.map((s) =>
        new Date(s.completed_at).getDay()
      ) ?? []
    ),
  ];

  return (
    <main className="max-w-sm mx-auto">
      {/* Header */}
      <div className="bg-gradient-to-br from-brand-pink to-brand-orange px-5 pt-10 pb-5">
        <p className="text-white/70 text-xs tracking-widest font-semibold mb-1">PRACTICE5</p>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-white/70">שלום,</p>
            <h1 className="text-xl font-extrabold text-white">{profile?.name ?? "תלמיד"}</h1>
          </div>
          <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-white font-bold text-lg">
            {(profile?.name ?? "?")[0]}
          </div>
        </div>
        <div className="mt-3">
          <XPBar xp={profile?.xp ?? 0} level={profile?.level ?? 1} />
        </div>
      </div>

      {/* Body */}
      <div className="bg-brand-bg">
        {/* Weekly */}
        <div className="mx-4 mt-4 rounded-2xl p-4 bg-brand-card border border-brand-border">
          <p className="text-xs font-semibold text-brand-muted tracking-widest mb-3">השבוע</p>
          <WeeklyProgress practicedDays={practicedDays} />
        </div>

        {/* Assessment button — always visible */}
        <div className="mx-4 mt-3">
          <a
            href="/practice/assess"
            className="flex items-center justify-between w-full bg-white border border-brand-border rounded-2xl px-4 py-3 shadow-sm active:scale-95 transition-transform"
          >
            <span className="text-brand-muted text-sm">בדוק את הרמה שלך</span>
            <span className="text-xl">🎵</span>
          </a>
        </div>

        {/* Teal calibration card — shown until all 3 domain levels are set */}
        {(profile?.level_notes == null || profile?.level_rhythm == null || profile?.level_pitch == null) && (
          <div className="mx-4 mt-2 rounded-2xl overflow-hidden shadow-sm">
            <div className="bg-gradient-to-br from-teal-500 to-cyan-600 px-4 pt-3 pb-3">
              <p className="text-white text-xs font-bold text-center tracking-wide mb-2">
                🎯 להתאמת הרמה — לחצי עליי
              </p>
              <div className="flex flex-col gap-2">
                <a
                  href="/practice/rhythm"
                  className="flex items-center justify-between bg-white/20 hover:bg-white/30 active:scale-95 transition-all rounded-xl px-4 py-2.5"
                >
                  <span className="text-white text-sm">
                    {profile?.level_rhythm != null ? "✓ " : ""}חוש מקצב
                  </span>
                  <span className="text-lg">🥁</span>
                </a>
                <a
                  href="/practice/pitch"
                  className="flex items-center justify-between bg-white/20 hover:bg-white/30 active:scale-95 transition-all rounded-xl px-4 py-2.5"
                >
                  <span className="text-white text-sm">
                    {profile?.level_pitch != null ? "✓ " : ""}גובה צליל
                  </span>
                  <span className="text-lg">🎤</span>
                </a>
              </div>
            </div>
          </div>
        )}

        {/* Mascot */}
        <div className="flex justify-center mt-5 mb-1">
          <ViolinMascot
            mood={practicedDays.length >= 5 ? "excited" : practicedDays.length >= 3 ? "happy" : "encouraging"}
            size={110}
          />
        </div>

        {/* Selector */}
        <div className="mx-4 mt-4 rounded-2xl border border-brand-border bg-brand-card">
          <div className="px-5 pt-4 pb-1">
            <h2 className="font-bold text-brand-text">התרגול היומי שלך</h2>
            <p className="text-sm text-brand-muted">בחר זמן ותחום</p>
          </div>
          <TimeSkillSelector />
        </div>
      </div>
    </main>
  );
}
