import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import TimeSkillSelector from "@/components/student/TimeSkillSelector";
import XPBar from "@/components/student/XPBar";
import WeeklyProgress from "@/components/student/WeeklyProgress";

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
    <main className="max-w-sm mx-auto">
      <div className="bg-white px-5 pt-8 pb-4 shadow-sm">
        <p className="text-sm text-gray-500">שלום,</p>
        <h1 className="text-2xl font-bold text-gray-900">{profile?.name ?? "תלמיד"} 👋</h1>
        <div className="mt-3">
          <XPBar xp={profile?.xp ?? 0} level={profile?.level ?? 1} />
        </div>
      </div>

      <div className="bg-white mx-4 mt-4 rounded-3xl p-4 shadow-sm">
        <p className="text-sm font-semibold text-gray-500 mb-3">שבוע זה</p>
        <WeeklyProgress practicedDays={practicedDays} />
      </div>

      <div className="bg-white mx-4 mt-4 rounded-3xl shadow-sm">
        <div className="px-5 pt-4">
          <h2 className="font-bold text-gray-900">התרגול היומי שלך</h2>
          <p className="text-sm text-gray-500">בחר זמן ותחום</p>
        </div>
        <TimeSkillSelector />
      </div>
    </main>
  );
}
