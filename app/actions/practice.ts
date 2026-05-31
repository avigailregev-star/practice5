"use server";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { generateExercise, type SkillType } from "@/lib/ai/generate-exercise";
import { XP_PER_SESSION, calculateLevelUp } from "@/lib/gamification/xp";
import { checkAndGrantAchievements } from "@/lib/gamification/achievements";

export async function startPracticeSession(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const durationMinutes = Number(formData.get("duration")) as 5 | 10 | 15 | 20;
  const skillType = formData.get("skill") as SkillType;

  const { data: profile } = await supabase
    .from("profiles")
    .select("level, xp")
    .eq("id", user.id)
    .single() as { data: { level: number; xp: number } | null };

  const difficultyLevel = profile?.level ?? 1;

  const exercise = await generateExercise(skillType, durationMinutes, difficultyLevel);

  const { data: session, error } = await supabase
    .from("practice_sessions")
    .insert({
      student_id: user.id,
      duration_minutes: durationMinutes,
      skill_type: skillType,
      difficulty_level: difficultyLevel,
      exercise_content: exercise as unknown as Record<string, unknown>,
    })
    .select("id")
    .single();

  if (error || !session) redirect("/practice?error=session_failed");

  redirect(`/practice/exercise?session=${session.id}`);
}

export async function completePracticeSession(sessionId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: session } = await supabase
    .from("practice_sessions")
    .select("duration_minutes, skill_type, difficulty_level, student_id")
    .eq("id", sessionId)
    .single();

  if (!session || session.student_id !== user.id) redirect("/practice");

  const xpEarned = XP_PER_SESSION[session.duration_minutes] ?? 10;

  const { data: profile } = await supabase
    .from("profiles")
    .select("xp, level")
    .eq("id", user.id)
    .single() as { data: { xp: number; level: number } | null };

  const { newXp, newLevel, leveledUp } = calculateLevelUp(
    profile?.xp ?? 0,
    profile?.level ?? 1,
    xpEarned
  );

  await Promise.all([
    supabase
      .from("practice_sessions")
      .update({ completed_at: new Date().toISOString(), xp_earned: xpEarned })
      .eq("id", sessionId),
    supabase
      .from("profiles")
      .update({ xp: newXp, level: newLevel })
      .eq("id", user.id),
  ]);

  await checkAndGrantAchievements(user.id, newLevel, leveledUp);

  redirect(`/practice/complete?xp=${xpEarned}&leveled=${leveledUp ? newLevel : 0}`);
}
