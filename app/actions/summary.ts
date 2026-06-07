"use server";

import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@/lib/supabase/server";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function refreshWeeklySummary(studentId: string): Promise<string> {
  const supabase = await createClient();

  // Auth check — caller must be a teacher
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const { data: callerProfile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single() as { data: { role: string } | null };

  if (callerProfile?.role !== "teacher") throw new Error("Unauthorized");

  // Fetch student name
  const { data: studentProfile } = await supabase
    .from("profiles")
    .select("name")
    .eq("id", studentId)
    .single() as { data: { name: string } | null };

  const studentName = studentProfile?.name ?? "התלמיד";

  // Fetch all assessments for this student
  const { data: assessments } = await supabase
    .from("assessments")
    .select("type, score")
    .eq("student_id", studentId) as {
      data: { type: string; score: number }[] | null;
    };

  // Compute per-domain averages
  const domainAccum: Record<string, number[]> = { notes: [], rhythm: [], pitch: [] };
  for (const a of assessments ?? []) {
    if (domainAccum[a.type]) domainAccum[a.type].push(a.score);
  }
  const avg = (arr: number[]) =>
    arr.length > 0 ? Math.round(arr.reduce((a, b) => a + b, 0) / arr.length) : null;

  const notesAvg = avg(domainAccum.notes);
  const rhythmAvg = avg(domainAccum.rhythm);
  const pitchAvg = avg(domainAccum.pitch);

  // Fetch last 10 practice sessions
  const { data: sessions } = await supabase
    .from("practice_sessions")
    .select("skill_type, duration_minutes, completed_at, self_rating")
    .eq("student_id", studentId)
    .not("completed_at", "is", null)
    .order("completed_at", { ascending: false })
    .limit(10) as {
      data: {
        skill_type: string;
        duration_minutes: number;
        completed_at: string;
        self_rating: number | null;
      }[] | null;
    };

  const recentSessions = sessions ?? [];
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const thisWeekSessions = recentSessions.filter(
    (s) => new Date(s.completed_at) >= weekAgo
  );
  const totalMinutesThisWeek = thisWeekSessions.reduce(
    (sum, s) => sum + (s.duration_minutes ?? 0),
    0
  );
  const skillTypesThisWeek = [...new Set(thisWeekSessions.map((s) => {
    const labels: Record<string, string> = { notes: "קריאת תווים", rhythm: "מקצבים", scales: "סולמות" };
    return labels[s.skill_type] ?? s.skill_type;
  }))].join(", ") || "אין";

  const formatDomain = (avg: number | null, count: number, label: string) =>
    avg !== null
      ? `${label}: ${avg}% (מתוך ${count} מבחנים)`
      : `${label}: לא נבדק`;

  const prompt = `אתה עוזר למורה לכינור. כתוב סיכום שבועי קצר (2–3 משפטים בלבד) על תלמיד/ה, בעברית.
התמקד בנקודות חוזק ובתחום אחד לשיפור. אל תכלול מספרים ישירות — הסק מהם מסקנות.

נתוני התלמיד/ה:
- שם: ${studentName}
- ${formatDomain(notesAvg, domainAccum.notes.length, "ציון ממוצע תווים")}
- ${formatDomain(rhythmAvg, domainAccum.rhythm.length, "ציון ממוצע מקצב")}
- ${formatDomain(pitchAvg, domainAccum.pitch.length, "ציון ממוצע גובה צליל")}
- אימונים בשבוע האחרון: ${thisWeekSessions.length} (${totalMinutesThisWeek} דקות)
- תחומים שתורגלו: ${skillTypesThisWeek}

כתוב רק את הסיכום, ללא כותרת וללא פתיחה כמו "סיכום:".`;

  const message = await anthropic.messages.create({
    model: "claude-3-5-haiku-20241022",
    max_tokens: 256,
    messages: [{ role: "user", content: prompt }],
  });

  const summary =
    message.content[0].type === "text" ? message.content[0].text.trim() : "";

  // Save to profiles
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (supabase as any)
    .from("profiles")
    .update({
      weekly_summary: summary,
      summary_updated_at: new Date().toISOString(),
    })
    .eq("id", studentId);

  return summary;
}
