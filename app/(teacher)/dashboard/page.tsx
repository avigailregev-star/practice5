import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import StudentCard from "@/components/teacher/StudentCard";
import TeacherStats from "@/components/teacher/TeacherStats";
import { logout } from "@/app/actions/auth";
import { LogOut } from "lucide-react";
import ViolinAnalysisSection from "@/components/teacher/ViolinAnalysisSection";

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
    .select("id, name, level, xp, weekly_summary, summary_updated_at")
    .eq("role", "student")
    .order("name") as {
      data: {
        id: string;
        name: string;
        level: number;
        xp: number;
        weekly_summary: string | null;
        summary_updated_at: string | null;
      }[] | null;
    };

  const studentList = students ?? [];

  // Fetch assessments scoped to current students only
  const studentIds = studentList.map((s) => s.id);

  const { data: allAssessments, error: assessmentsError } = await supabase
    .from("assessments")
    .select("student_id, type, score")
    .in("student_id", studentIds.length > 0 ? studentIds : ["no-match"]) as {
      data: { student_id: string; type: string; score: number }[] | null;
      error: unknown;
    };

  if (assessmentsError) {
    console.error("Failed to fetch assessments:", assessmentsError);
  }

  // Build domainScoresMap: studentId → { notes, rhythm, pitch } avg %
  const domainAccum = new Map<string, Record<string, number[]>>();
  for (const a of allAssessments ?? []) {
    if (!domainAccum.has(a.student_id)) {
      domainAccum.set(a.student_id, { notes: [], rhythm: [], pitch: [] });
    }
    const entry = domainAccum.get(a.student_id)!;
    if (entry[a.type]) entry[a.type].push(a.score);
  }

  const domainScoresMap = new Map<string, { notes: number | null; rhythm: number | null; pitch: number | null }>();
  const calcAvg = (arr: number[]) =>
    arr.length > 0 ? Math.round(arr.reduce((a, b) => a + b, 0) / arr.length) : null;

  for (const [studentId, accum] of domainAccum) {
    domainScoresMap.set(studentId, {
      notes: calcAvg(accum.notes),
      rhythm: calcAvg(accum.rhythm),
      pitch: calcAvg(accum.pitch),
    });
  }

  // Fetch recommended_level from ML predictions
  const { data: profilesWithML } = await supabase
    .from("profiles")
    .select("id, recommended_level")
    .eq("role", "student") as {
      data: { id: string; recommended_level: number | null }[] | null;
    };

  const recommendedLevelMap = new Map<string, number | null>(
    (profilesWithML ?? []).map(p => [p.id, p.recommended_level])
  );

  // Fetch last ML run for info banner
  const { data: lastMLRun } = await supabase
    .from("ml_runs")
    .select("model_name, accuracy, predicted_at, students_updated")
    .order("predicted_at", { ascending: false })
    .limit(1)
    .maybeSingle() as {
      data: {
        model_name: string;
        accuracy: number;
        predicted_at: string;
        students_updated: number;
      } | null;
    };

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

  const { data: allSessionsHistory } = await supabase
    .from("practice_sessions")
    .select("student_id, completed_at, duration_minutes, skill_type, self_rating")
    .not("completed_at", "is", null)
    .order("completed_at", { ascending: false })
    .limit(200) as {
      data: {
        student_id: string;
        completed_at: string;
        duration_minutes: number;
        skill_type: string;
        self_rating: number | null;
      }[] | null;
    };

  // Group sessions by student_id (max 10 per student)
  const sessionHistoryMap = new Map<string, {
    completed_at: string;
    duration_minutes: number;
    skill_type: string;
    self_rating: number | null;
  }[]>();
  for (const s of allSessionsHistory ?? []) {
    const arr = sessionHistoryMap.get(s.student_id) ?? [];
    if (arr.length < 10) {
      arr.push(s);
      sessionHistoryMap.set(s.student_id, arr);
    }
  }

  const sessionCountMap = new Map<string, number>();
  for (const s of allSessions ?? []) {
    sessionCountMap.set(s.student_id, (sessionCountMap.get(s.student_id) ?? 0) + 1);
  }

  // Fetch all self_rating values
  const { data: ratingRows } = await supabase
    .from("practice_sessions")
    .select("student_id, self_rating")
    .not("self_rating", "is", null) as {
      data: { student_id: string; self_rating: number }[] | null;
    };

  // Compute avg rating per student
  const ratingMap = new Map<string, number>();
  const ratingAccum = new Map<string, number[]>();
  for (const r of ratingRows ?? []) {
    const arr = ratingAccum.get(r.student_id) ?? [];
    arr.push(r.self_rating);
    ratingAccum.set(r.student_id, arr);
  }
  for (const [id, values] of ratingAccum) {
    ratingMap.set(id, values.reduce((a, b) => a + b, 0) / values.length);
  }

  const practicedTodayIds = new Set(
    sessions
      .filter((s) => new Date(s.completed_at) >= today)
      .map((s) => s.student_id)
  );

  const practicedThisWeekIds = new Set(sessions.map((s) => s.student_id));

  // Student practice status this week
  const studentPracticeStatuses = studentList.map((s) => ({
    name: s.name,
    practiced: practicedThisWeekIds.has(s.id),
  }));

  // Domain difficulties: how many students scored < 50% per domain
  const DOMAIN_LABELS: Record<string, string> = {
    notes: "זיהוי תווים 🎵",
    rhythm: "חוש קצב 🥁",
    pitch: "גובה צליל 🎤",
  };

  const domainDifficulties = (["notes", "rhythm", "pitch"] as const).map((domain) => {
    let belowFifty = 0;
    let total = 0;
    for (const scores of domainScoresMap.values()) {
      const score = scores[domain];
      if (score !== null) {
        total++;
        if (score < 50) belowFifty++;
      }
    }
    return { domain, label: DOMAIN_LABELS[domain], belowFifty, total };
  });

  const totalSessions = (allSessions ?? []).length;

  const violinData = {
    studentPracticeStatuses,
    domainDifficulties,
    totalSessions,
  };

  return (
    <main className="max-w-lg mx-auto bg-brand-bg min-h-screen">
      {/* Header */}
      <div className="bg-gradient-to-br from-brand-teal to-brand-purple px-5 pt-10 pb-5">
        <p className="text-white/70 text-xs tracking-widest font-semibold mb-1">PRACTICE5</p>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-white/70">שלום,</p>
            <h1 className="text-xl font-extrabold text-white">{profile?.name ?? "מורה"}</h1>
          </div>
          <form>
            <button
              formAction={logout}
              className="flex items-center gap-1.5 text-xs bg-white/20 text-white rounded-lg px-3 py-1.5 hover:bg-white/30 transition-all"
            >
              <LogOut size={13} strokeWidth={1.5} />
              יציאה
            </button>
          </form>
        </div>
      </div>

      {/* ML Info Banner */}
      {lastMLRun && (
        <div className="mx-4 mt-3 bg-purple-50 border border-purple-200 rounded-xl px-4 py-2.5 flex flex-wrap gap-x-4 gap-y-1 text-xs text-purple-800">
          <span className="font-semibold">🤖 מודל ML</span>
          <span>{lastMLRun.model_name}</span>
          <span>דיוק: {Math.round(lastMLRun.accuracy * 100)}%</span>
          <span>עודכן: {new Date(lastMLRun.predicted_at).toLocaleDateString("he-IL")}</span>
          <span>{lastMLRun.students_updated} תלמידים</span>
        </div>
      )}

      {/* Stats */}
      <div className="mt-4">
        <TeacherStats
          totalStudents={studentList.length}
          practicedToday={practicedTodayIds.size}
          practicedThisWeek={practicedThisWeekIds.size}
        />
      </div>

      {/* Violin Analysis */}
      <ViolinAnalysisSection data={violinData} />

      {/* Student list */}
      <div className="px-4">
        <h2 className="font-bold text-brand-text mb-3">כל התלמידים</h2>

        {studentList.length === 0 ? (
          <div className="bg-brand-card rounded-2xl p-8 text-center border border-brand-border">
            <p className="text-brand-muted">אין תלמידים רשומים עדיין</p>
          </div>
        ) : (
          <div className="space-y-3 pb-4">
            {studentList.map((student) => (
              <StudentCard
                key={student.id}
                studentId={student.id}
                name={student.name}
                level={student.level}
                xp={student.xp}
                sessionCount={sessionCountMap.get(student.id) ?? 0}
                lastSession={lastSessionMap.get(student.id) ?? null}
                avgRating={ratingMap.get(student.id)}
                sessions={sessionHistoryMap.get(student.id) ?? []}
                recommendedLevel={recommendedLevelMap.get(student.id) ?? null}
                domainScores={domainScoresMap.get(student.id) ?? null}
                weeklySummary={student.weekly_summary}
                summaryUpdatedAt={student.summary_updated_at}
              />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
