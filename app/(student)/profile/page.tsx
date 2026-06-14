import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import XPBar from "@/components/student/XPBar";
import AchievementBadge from "@/components/student/AchievementBadge";
import { ACHIEVEMENT_META, type AchievementType, checkAndGrantAchievements } from "@/lib/gamification/achievements";
import { logout } from "@/app/actions/auth";
import { LogOut } from "lucide-react";

const ALL_ACHIEVEMENTS = Object.keys(ACHIEVEMENT_META) as AchievementType[];

export default async function ProfilePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("name, level, xp")
    .eq("id", user.id)
    .single() as { data: { name: string; level: number; xp: number } | null };

  const { data: achievements } = await supabase
    .from("achievements")
    .select("achievement_type")
    .eq("student_id", user.id) as { data: Array<{ achievement_type: string }> | null };

  const { count: sessionCount } = await supabase
    .from("practice_sessions")
    .select("*", { count: "exact", head: true })
    .eq("student_id", user.id)
    .not("completed_at", "is", null);

  // Backfill any achievements the student earned but never received
  await checkAndGrantAchievements(user.id, profile?.level ?? 1, false);

  // Re-fetch achievements after potential backfill
  const { data: achievementsAfter } = await supabase
    .from("achievements")
    .select("achievement_type")
    .eq("student_id", user.id) as { data: Array<{ achievement_type: string }> | null };

  const earnedTypes = new Set(achievementsAfter?.map((a) => a.achievement_type) ?? []);

  // Fetch assessments for domain medals
  const { data: assessmentRows } = await supabase
    .from("assessments")
    .select("type, score")
    .eq("student_id", user.id) as { data: Array<{ type: string; score: number }> | null };

  const domainAvg = (type: string) => {
    const scores = (assessmentRows ?? []).filter(a => a.type === type).map(a => a.score);
    return scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : null;
  };

  const domainMedals = [
    { key: "notes", label: "זיהוי תווים", emoji: "🎵" },
    { key: "rhythm", label: "חוש קצב", emoji: "🥁" },
    { key: "pitch", label: "גובה צליל", emoji: "🎤" },
  ].map(d => ({
    ...d,
    avg: domainAvg(d.key),
  }));

  function medal(avg: number | null) {
    if (avg === null) return null;
    if (avg >= 80) return { icon: "🥇", label: "זהב", color: "bg-yellow-50 border-yellow-300 text-yellow-700" };
    if (avg >= 50) return { icon: "🥈", label: "כסף", color: "bg-gray-50 border-gray-300 text-gray-600" };
    return { icon: "🥉", label: "ארד", color: "bg-orange-50 border-orange-300 text-orange-700" };
  }

  return (
    <main className="max-w-sm mx-auto pb-24 bg-brand-bg min-h-screen">
      {/* Header */}
      <div className="bg-gradient-to-br from-brand-purple to-brand-pink px-5 pt-10 pb-6">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center text-3xl font-bold text-white">
            {(profile?.name ?? "?")[0]}
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">{profile?.name ?? "תלמיד"}</h1>
            <p className="text-sm text-white/70">רמה {profile?.level ?? 1}</p>
          </div>
        </div>
        <XPBar xp={profile?.xp ?? 0} level={profile?.level ?? 1} />
      </div>

      {/* Stats */}
      <div className="mx-4 mt-4 grid grid-cols-2 gap-3">
        <div className="bg-brand-card rounded-2xl p-4 text-center border border-brand-border">
          <p className="text-2xl font-bold text-brand-pink">{sessionCount ?? 0}</p>
          <p className="text-sm text-brand-muted">תרגולים</p>
        </div>
        <div className="bg-brand-card rounded-2xl p-4 text-center border border-brand-border">
          <p className="text-2xl font-bold text-brand-pink">{earnedTypes.size}</p>
          <p className="text-sm text-brand-muted">הישגים</p>
        </div>
      </div>

      {/* Domain medals */}
      <div className="mx-4 mt-4 bg-brand-card rounded-2xl p-4 border border-brand-border">
        <h2 className="font-bold text-brand-text mb-3">ציוני מבחנים</h2>
        <div className="grid grid-cols-3 gap-3">
          {domainMedals.map(d => {
            const m = medal(d.avg);
            return (
              <div key={d.key} className={`rounded-xl border p-3 text-center ${m ? m.color : "bg-brand-bg border-brand-border"}`}>
                <p className="text-2xl">{m ? m.icon : "❓"}</p>
                <p className="text-lg font-extrabold mt-1">{d.avg !== null ? `${d.avg}%` : "—"}</p>
                <p className="text-xs font-medium mt-0.5">{d.label}</p>
                <p className="text-xs opacity-70">{m ? m.label : "טרם נבחנת"}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Achievements */}
      <div className="mx-4 mt-4 bg-brand-card rounded-2xl p-4 border border-brand-border">
        <h2 className="font-bold text-brand-text mb-3">ארון גביעים</h2>
        <div className="grid grid-cols-3 gap-2">
          {ALL_ACHIEVEMENTS.map((type) => (
            <AchievementBadge key={type} type={type} locked={!earnedTypes.has(type)} />
          ))}
        </div>
      </div>

      {/* Logout */}
      <div className="mx-4 mt-4">
        <form>
          <button
            formAction={logout}
            className="w-full flex items-center justify-center gap-2 border border-brand-border bg-brand-card rounded-2xl py-3 text-brand-muted text-sm font-medium hover:border-brand-pink/30 transition-all"
          >
            <LogOut size={16} strokeWidth={1.5} />
            יציאה
          </button>
        </form>
      </div>
    </main>
  );
}
