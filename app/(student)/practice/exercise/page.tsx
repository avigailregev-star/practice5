import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import ExerciseCard from "@/components/student/ExerciseCard";
import { completePracticeSession } from "@/app/actions/practice";
import type { Exercise } from "@/lib/ai/generate-exercise";
import Link from "next/link";

export default async function ExercisePage({
  searchParams,
}: {
  searchParams: Promise<{ session?: string }>;
}) {
  const { session: sessionId } = await searchParams;
  if (!sessionId) redirect("/practice");

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: session } = await supabase
    .from("practice_sessions")
    .select("duration_minutes, skill_type, exercise_content, completed_at")
    .eq("id", sessionId)
    .eq("student_id", user.id)
    .single() as {
      data: {
        duration_minutes: number;
        skill_type: string;
        exercise_content: unknown;
        completed_at: string | null;
      } | null;
    };

  if (!session) redirect("/practice");
  if (session.completed_at) redirect("/practice");

  const exercise = session.exercise_content as unknown as Exercise;

  async function handleComplete() {
    "use server";
    await completePracticeSession(sessionId!);
  }

  return (
    <main className="max-w-sm mx-auto px-4 pt-6 pb-24">
      <div className="flex items-center gap-2 mb-5">
        <Link href="/practice" className="text-gray-400 text-lg">←</Link>
        <div>
          <h1 className="font-bold text-gray-900">התרגול שלך</h1>
          <p className="text-sm text-gray-500">{session.duration_minutes} דקות</p>
        </div>
      </div>

      <ExerciseCard exercise={exercise} />

      <form className="mt-6">
        <button
          formAction={handleComplete}
          className="w-full bg-brand-red text-white rounded-2xl py-4 font-bold text-lg shadow-lg transition-all active:scale-95"
        >
          סיימתי! ✅
        </button>
        <p className="text-center text-xs text-gray-400 mt-3">
          לחץ רק כשסיימת את התרגול
        </p>
      </form>
    </main>
  );
}
