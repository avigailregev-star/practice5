import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import NoteAssessment from "@/components/student/NoteAssessment";
import { DifficultyLevel } from "@/lib/notes";

export default async function AssessPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("level")
    .eq("id", user.id)
    .single() as { data: { level: number } | null };

  const initialLevel = (Math.max(1, Math.min(3, profile?.level ?? 1)) as DifficultyLevel);

  return (
    <main className="max-w-sm mx-auto bg-brand-bg min-h-screen">
      {/* Header */}
      <div className="bg-gradient-to-br from-brand-teal to-brand-purple px-5 pt-10 pb-5">
        <p className="text-white/70 text-xs tracking-widest font-semibold mb-1">PRACTICE5</p>
        <div className="flex items-center gap-3">
          <a href="/practice" className="text-white/80 text-sm">← חזרה</a>
          <h1 className="text-xl font-extrabold text-white">בדיקת רמה — תווים</h1>
        </div>
      </div>

      <NoteAssessment studentId={user.id} initialLevel={initialLevel} />
    </main>
  );
}
