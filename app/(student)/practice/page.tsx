import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import TimeSkillSelector from "@/components/student/TimeSkillSelector";
import XPBar from "@/components/student/XPBar";
import WeeklyProgress from "@/components/student/WeeklyProgress";
import WaveBackground from "@/components/shared/WaveBackground";

export default async function PracticePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("name, level, xp")
    .eq("id", user.id)
    .single() as { data: { name: string; level: number; xp: number } | null };

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
    <main className="max-w-sm mx-auto relative">
      <WaveBackground />

      {/* Header */}
      <div className="relative z-10 px-5 pt-10 pb-5 border-b border-brand-border">
        <p className="text-xs text-brand-muted tracking-widest mb-1">PRACTICE5</p>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-brand-muted">שלום,</p>
            <h1 className="text-2xl font-bold text-white">{profile?.name ?? "תלמיד"}</h1>
          </div>
          <div className="w-10 h-10 rounded-full bg-brand-gold flex items-center justify-center text-black font-bold text-lg">
            {(profile?.name ?? "?")[0]}
          </div>
        </div>
        <div className="mt-3">
          <XPBar xp={profile?.xp ?? 0} level={profile?.level ?? 1} />
        </div>
      </div>

      {/* Weekly */}
      <div className="relative z-10 bg-brand-surface mx-4 mt-4 rounded-2xl p-4 border border-brand-border">
        <p className="text-xs font-semibold text-brand-muted tracking-widest mb-3">השבוע</p>
        <WeeklyProgress practicedDays={practicedDays} />
      </div>

      {/* Selector */}
      <div className="relative z-10 bg-brand-surface mx-4 mt-4 rounded-2xl border border-brand-border">
        <div className="px-5 pt-4 pb-1">
          <h2 className="font-bold text-white">התרגול היומי שלך</h2>
          <p className="text-sm text-brand-muted">בחר זמן ותחום</p>
        </div>
        <TimeSkillSelector />
      </div>
    </main>
  );
}
