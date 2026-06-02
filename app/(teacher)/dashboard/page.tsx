import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import StudentCard from "@/components/teacher/StudentCard";
import TeacherStats from "@/components/teacher/TeacherStats";
import { logout } from "@/app/actions/auth";
import WaveBackground from "@/components/shared/WaveBackground";
import { LogOut } from "lucide-react";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("name, role")
    .eq("id", user.id)
    .single() as { data: { name: string; role: string } | null };

  if (profile?.role !== "teacher") redirect("/practice");

  const { data: students } = await supabase
    .from("profiles")
    .select("id, name, level, xp")
    .eq("role", "student")
    .order("name") as { data: { id: string; name: string; level: number; xp: number }[] | null };

  const studentList = students ?? [];

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 6);
  weekAgo.setHours(0, 0, 0, 0);

  const { data: recentSessions } = await supabase
    .from("practice_sessions")
    .select("student_id, completed_at, duration_minutes, skill_type")
    .not("completed_at", "is", null)
    .gte("completed_at", weekAgo.toISOString())
    .order("completed_at", { ascending: false }) as {
    data: {
      student_id: string;
      completed_at: string;
      duration_minutes: number;
      skill_type: string;
    }[] | null;
  };

  const sessions = recentSessions ?? [];

  const lastSessionMap = new Map<string, {
    completed_at: string;
    duration_minutes: number;
    skill_type: string;
  }>();

  for (const s of sessions) {
    if (!lastSessionMap.has(s.student_id)) {
      lastSessionMap.set(s.student_id, s);
    }
  }

  const { data: allSessions } = await supabase
    .from("practice_sessions")
    .select("student_id")
    .not("completed_at", "is", null) as { data: { student_id: string }[] | null };

  const sessionCountMap = new Map<string, number>();
  for (const s of allSessions ?? []) {
    sessionCountMap.set(s.student_id, (sessionCountMap.get(s.student_id) ?? 0) + 1);
  }

  const practicedTodayIds = new Set(
    sessions
      .filter((s) => new Date(s.completed_at) >= today)
      .map((s) => s.student_id)
  );

  const practicedThisWeekIds = new Set(sessions.map((s) => s.student_id));

  return (
    <main className="max-w-lg mx-auto relative">
      <WaveBackground />

      {/* Header */}
      <div className="relative z-10 px-5 pt-10 pb-5 border-b border-brand-border">
        <p className="text-xs text-brand-muted tracking-widest mb-1">PRACTICE5</p>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-brand-muted">שלום,</p>
            <h1 className="text-2xl font-bold text-white">{profile?.name ?? "מורה"}</h1>
          </div>
          <form>
            <button
              formAction={logout}
              className="flex items-center gap-1.5 text-xs text-brand-muted border border-brand-border rounded-lg px-3 py-1.5 hover:border-brand-gold hover:text-white transition-all"
            >
              <LogOut size={13} strokeWidth={1.5} />
              יציאה
            </button>
          </form>
        </div>
      </div>

      {/* Stats */}
      <div className="relative z-10 mt-4">
        <TeacherStats
          totalStudents={studentList.length}
          practicedToday={practicedTodayIds.size}
          practicedThisWeek={practicedThisWeekIds.size}
        />
      </div>

      {/* Student list */}
      <div className="relative z-10 px-4">
        <h2 className="font-bold text-brand-muted mb-3 text-xs tracking-widest">כל התלמידים</h2>

        {studentList.length === 0 ? (
          <div className="bg-brand-surface rounded-2xl p-8 text-center border border-brand-border">
            <p className="text-brand-muted">אין תלמידים רשומים עדיין</p>
          </div>
        ) : (
          <div className="space-y-3 pb-4">
            {studentList.map((student) => (
              <StudentCard
                key={student.id}
                name={student.name}
                level={student.level}
                xp={student.xp}
                sessionCount={sessionCountMap.get(student.id) ?? 0}
                lastSession={lastSessionMap.get(student.id) ?? null}
              />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
