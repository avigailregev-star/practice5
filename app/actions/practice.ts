"use server";
import { redirect } from "next/navigation";
import { isRedirectError } from "next/dist/client/components/redirect-error";
import { createClient } from "@/lib/supabase/server";
import { generateExercise, type SkillType } from "@/lib/ai/generate-exercise";
import { XP_PER_SESSION, calculateLevelUp } from "@/lib/gamification/xp";
import { checkAndGrantAchievements } from "@/lib/gamification/achievements";

type Profile = { level: number; xp: number };
type Session = { id: string; student_id: string; duration_minutes: 5 | 10 | 15 | 20; skill_type: string; difficulty_level: number };

export async function startPracticeSession(formData: FormData) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) redirect("/login");

    const durationMinutes = Number(formData.get("duration")) as 5 | 10 | 15 | 20;
    const skillType = formData.get("skill") as SkillType;

    const profileResult = await supabase
      .from("profiles")
      .select("level, xp")
      .eq("id", user.id)
      .single() as unknown as { data: Profile | null; error: unknown };

    const profile = profileResult.data;
    const difficultyLevel = profile?.level ?? 1;

    const exercise = await generateExercise(skillType, durationMinutes, difficultyLevel);

    const sessionResult = await supabase
      .from("practice_sessions")
      .insert({
        student_id: user.id,
        duration_minutes: durationMinutes,
        skill_type: skillType,
        difficulty_level: difficultyLevel,
        exercise_content: JSON.parse(JSON.stringify(exercise)),
      } as never)
      .select("id")
      .single() as unknown as { data: { id: string } | null; error: unknown };

    if (sessionResult.error || !sessionResult.data) redirect("/practice?error=session_failed");

    redirect(`/practice/exercise?session=${sessionResult.data!.id}`);
  } catch (err) {
    if (isRedirectError(err)) throw err;
    console.error("startPracticeSession error:", err);
    redirect("/practice?error=unknown");
  }
}

export async function completePracticeSession(sessionId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const sessionResult = await supabase
    .from("practice_sessions")
    .select("duration_minutes, skill_type, difficulty_level, student_id")
    .eq("id", sessionId)
    .single() as unknown as { data: Session | null; error: unknown };

  const session = sessionResult.data;
  if (!session || session.student_id !== user.id) redirect("/practice");

  const xpEarned = XP_PER_SESSION[session.duration_minutes as 5 | 10 | 15 | 20] ?? 10;

  const profileResult = await supabase
    .from("profiles")
    .select("xp, level")
    .eq("id", user.id)
    .single() as unknown as { data: { xp: number; level: number } | null; error: unknown };

  const profile = profileResult.data;
  const { newXp, newLevel, leveledUp } = calculateLevelUp(
    profile?.xp ?? 0,
    profile?.level ?? 1,
    xpEarned
  );

  await Promise.all([
    supabase
      .from("practice_sessions")
      .update({ completed_at: new Date().toISOString(), xp_earned: xpEarned } as never)
      .eq("id", sessionId),
    supabase
      .from("profiles")
      .update({ xp: newXp, level: newLevel } as never)
      .eq("id", user.id),
  ]);

  await checkAndGrantAchievements(user.id, newLevel, leveledUp);

  redirect(`/practice/complete?xp=${xpEarned}&leveled=${leveledUp ? newLevel : 0}&session_id=${sessionId}`);
}
