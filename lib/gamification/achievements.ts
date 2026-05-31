import { createClient } from "@/lib/supabase/server";

export type AchievementType =
  | "first_session"
  | "level_2"
  | "level_5"
  | "five_sessions"
  | "ten_sessions"
  | "notes_master"
  | "rhythm_master"
  | "scales_master";

export const ACHIEVEMENT_META: Record<
  AchievementType,
  { label: string; emoji: string; description: string }
> = {
  first_session: { label: "פתיחת דרך", emoji: "🌟", description: "תרגול ראשון!" },
  level_2: { label: "עולה רמה", emoji: "⬆️", description: "הגעת לרמה 2" },
  level_5: { label: "מוזיקאי", emoji: "🎵", description: "הגעת לרמה 5" },
  five_sessions: { label: "מתמיד", emoji: "🔥", description: "5 תרגולים" },
  ten_sessions: { label: "אלוף", emoji: "🏆", description: "10 תרגולים" },
  notes_master: { label: "קורא תווים", emoji: "🎼", description: "5 תרגולי תווים" },
  rhythm_master: { label: "מלך הקצב", emoji: "🥁", description: "5 תרגולי מקצבים" },
  scales_master: { label: "מלך הסולמות", emoji: "🎹", description: "5 תרגולי סולמות" },
};

export async function checkAndGrantAchievements(
  studentId: string,
  newLevel: number,
  leveledUp: boolean
): Promise<AchievementType[]> {
  const supabase = await createClient();
  const granted: AchievementType[] = [];

  const { data: existing } = await supabase
    .from("achievements")
    .select("achievement_type")
    .eq("student_id", studentId);

  const existingTypes = new Set(existing?.map((a) => a.achievement_type) ?? []);

  const { count: sessionCount } = await supabase
    .from("practice_sessions")
    .select("*", { count: "exact", head: true })
    .eq("student_id", studentId)
    .not("completed_at", "is", null);

  const skillCounts: Record<string, number> = {};
  for (const skill of ["notes", "rhythm", "scales"]) {
    const { count } = await supabase
      .from("practice_sessions")
      .select("*", { count: "exact", head: true })
      .eq("student_id", studentId)
      .eq("skill_type", skill)
      .not("completed_at", "is", null);
    skillCounts[skill] = count ?? 0;
  }

  const toGrant: AchievementType[] = [];

  if (sessionCount === 1 && !existingTypes.has("first_session"))
    toGrant.push("first_session");
  if (leveledUp && newLevel >= 2 && !existingTypes.has("level_2"))
    toGrant.push("level_2");
  if (leveledUp && newLevel >= 5 && !existingTypes.has("level_5"))
    toGrant.push("level_5");
  if ((sessionCount ?? 0) >= 5 && !existingTypes.has("five_sessions"))
    toGrant.push("five_sessions");
  if ((sessionCount ?? 0) >= 10 && !existingTypes.has("ten_sessions"))
    toGrant.push("ten_sessions");
  if (skillCounts.notes >= 5 && !existingTypes.has("notes_master"))
    toGrant.push("notes_master");
  if (skillCounts.rhythm >= 5 && !existingTypes.has("rhythm_master"))
    toGrant.push("rhythm_master");
  if (skillCounts.scales >= 5 && !existingTypes.has("scales_master"))
    toGrant.push("scales_master");

  if (toGrant.length > 0) {
    await supabase.from("achievements").insert(
      toGrant.map((type) => ({ student_id: studentId, achievement_type: type }))
    );
    granted.push(...toGrant);
  }

  return granted;
}
