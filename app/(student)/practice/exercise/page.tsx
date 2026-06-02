import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import ExerciseCard from "@/components/student/ExerciseCard";
import { completePracticeSession } from "@/app/actions/practice";
import type { Exercise } from "@/lib/ai/generate-exercise";
import Link from "next/link";
import { ChevronRight } from "lucide-react";

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
    <main className="max-w-sm mx-auto bg-brand-bg min-h-screen pb-24">
      {/* Header */}
      <div className="bg-white border-b border-brand-border px-4 pt-6 pb-4">
        <div className="flex items-center gap-3">
          <Link href="/practice" className="text-brand-text hover:opacity-70 transition-opacity">
            <ChevronRight size={22} strokeWidth={1.5} />
          </Link>
          <div className="flex-1">
            <h1 className="font-bold text-brand-text">התרגול שלך</h1>
          </div>
          <span className="bg-brand-pink/10 text-brand-pink text-xs font-semibold px-3 py-1 rounded-full">
            {session.duration_minutes} דקות
          </span>
        </div>
      </div>

      {/* Body */}
      <div className="px-4 pt-5">
        <ExerciseCard exercise={exercise} />

        <form className="mt-6">
          <button
            formAction={handleComplete}
            className="w-full bg-brand-pink text-white rounded-xl py-4 font-bold text-lg shadow-sm transition-all active:scale-95"
          >
            סיימתי
          </button>
          <p className="text-center text-xs text-brand-muted mt-3">
            לחץ רק כשסיימת את התרגול
          </p>
        </form>
      </div>
    </main>
  );
}
