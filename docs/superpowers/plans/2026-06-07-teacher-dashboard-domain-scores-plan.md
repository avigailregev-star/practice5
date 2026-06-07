# Teacher Dashboard — Domain Scores + AI Weekly Summary Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add per-domain assessment scores (notes/rhythm/pitch) and an on-demand AI weekly summary to each student card in the teacher dashboard.

**Architecture:** The dashboard page fetches average domain scores from the `assessments` table grouped by student+type, and fetches `weekly_summary`/`summary_updated_at` from `profiles`. Each `StudentCard` renders 3 colored score boxes and a summary block with a refresh button that calls a Server Action. The Server Action fetches student data, calls `claude-3-5-haiku-20241022`, and writes the result back to `profiles`.

**Tech Stack:** Next.js 16 App Router, TypeScript, Supabase (server client), Anthropic SDK (`@anthropic-ai/sdk`), Tailwind CSS

---

## File Summary

| File | Action |
|------|--------|
| Supabase dashboard | Run `ALTER TABLE` migration (manual step) |
| `app/(teacher)/dashboard/page.tsx` | Fetch avg domain scores + weekly_summary per student; pass new props to `StudentCard` |
| `components/teacher/StudentCard.tsx` | Add domain score boxes, AI summary section with refresh button |
| `app/actions/summary.ts` | New — Server Action that calls Claude API and saves result to `profiles` |

---

### Task 1: DB migration — add weekly_summary columns

**Files:**
- No code files — run SQL in Supabase dashboard

- [ ] **Step 1: Run migration in Supabase SQL editor**

Open Supabase dashboard → SQL Editor → run:

```sql
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS weekly_summary      TEXT         DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS summary_updated_at  TIMESTAMPTZ  DEFAULT NULL;
```

Expected: no error, both columns appear in `profiles` table schema.

- [ ] **Step 2: Verify columns exist**

Run in SQL Editor:
```sql
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'profiles'
  AND column_name IN ('weekly_summary', 'summary_updated_at');
```

Expected: 2 rows returned.

---

### Task 2: Server Action — `app/actions/summary.ts`

**Files:**
- Create: `app/actions/summary.ts`

This Server Action:
1. Verifies the caller is a teacher
2. Fetches student name, assessments, and recent sessions from Supabase
3. Builds a Hebrew prompt and calls Claude
4. Saves the result to `profiles.weekly_summary` + `profiles.summary_updated_at`
5. Returns the summary string

- [ ] **Step 1: Create the file**

Create `app/actions/summary.ts` with this full content:

```ts
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

  const SKILL_LABELS: Record<string, string> = { notes: "קריאת תווים", rhythm: "מקצבים", scales: "סולמות" };

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
```

- [ ] **Step 2: TypeScript check**

```bash
cd C:\Users\HP\Downloads\practice5
npx tsc --noEmit 2>&1 | head -20
```

Expected: no errors related to `summary.ts`.

- [ ] **Step 3: Commit**

```bash
git add app/actions/summary.ts
git commit -m "feat: add refreshWeeklySummary server action with Claude API"
```

---

### Task 3: Dashboard page — fetch domain scores and summary data

**Files:**
- Modify: `app/(teacher)/dashboard/page.tsx`

The page already fetches students from `profiles`. We need to:
1. Add `weekly_summary, summary_updated_at` to the student profiles query
2. Fetch avg domain scores from `assessments` grouped by student+type
3. Build a `domainScoresMap` and pass new props to `StudentCard`

- [ ] **Step 1: Update the profiles query to include summary fields**

In `app/(teacher)/dashboard/page.tsx`, find:

```ts
  const { data: students } = await supabase
    .from("profiles")
    .select("id, name, level, xp")
    .eq("role", "student")
    .order("name") as { data: { id: string; name: string; level: number; xp: number }[] | null };
```

Replace with:

```ts
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
```

- [ ] **Step 2: Fetch all assessments and build domain score map**

After `const studentList = students ?? [];`, add:

```ts
  // Fetch all assessments to compute per-domain averages per student
  const { data: allAssessments } = await supabase
    .from("assessments")
    .select("student_id, type, score") as {
      data: { student_id: string; type: string; score: number }[] | null;
    };

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
  for (const [studentId, accum] of domainAccum) {
    const avg = (arr: number[]) =>
      arr.length > 0 ? Math.round(arr.reduce((a, b) => a + b, 0) / arr.length) : null;
    domainScoresMap.set(studentId, {
      notes: avg(accum.notes),
      rhythm: avg(accum.rhythm),
      pitch: avg(accum.pitch),
    });
  }
```

- [ ] **Step 3: Pass new props to StudentCard**

Find the `StudentCard` usage in the JSX (inside the `studentList.map` block):

```tsx
              <StudentCard
                key={student.id}
                name={student.name}
                level={student.level}
                xp={student.xp}
                sessionCount={sessionCountMap.get(student.id) ?? 0}
                lastSession={lastSessionMap.get(student.id) ?? null}
                avgRating={ratingMap.get(student.id)}
                sessions={sessionHistoryMap.get(student.id) ?? []}
                recommendedLevel={recommendedLevelMap.get(student.id) ?? null}
              />
```

Replace with:

```tsx
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
```

- [ ] **Step 4: TypeScript check**

```bash
cd C:\Users\HP\Downloads\practice5
npx tsc --noEmit 2>&1 | head -20
```

Expected: errors only about `StudentCard` missing new props (will be fixed in Task 4).

- [ ] **Step 5: Commit**

```bash
git add "app/(teacher)/dashboard/page.tsx"
git commit -m "feat: fetch domain scores and weekly summary for student cards"
```

---

### Task 4: StudentCard — domain score boxes + AI summary UI

**Files:**
- Modify: `components/teacher/StudentCard.tsx`

Add:
- `studentId`, `domainScores`, `weeklySummary`, `summaryUpdatedAt` to props interface
- 3 colored domain score boxes below the name row
- AI summary section with refresh button that calls the Server Action
- Spinner while loading, error display on failure

- [ ] **Step 1: Replace the full file content**

Replace the entire `components/teacher/StudentCard.tsx` with:

```tsx
"use client";

import { useState } from "react";
import { refreshWeeklySummary } from "@/app/actions/summary";

const SKILL_LABEL: Record<string, string> = {
  notes: "קריאת תווים",
  rhythm: "מקצבים",
  scales: "סולמות",
};

const RATING_EMOJI: Record<number, string> = { 1: "😊", 2: "😐", 3: "😓" };

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  if (days > 0) return `לפני ${days} ימים`;
  if (hours > 0) return `לפני ${hours} שעות`;
  if (minutes > 0) return `לפני ${minutes} דקות`;
  return "עכשיו";
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("he-IL", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function ratingBadge(avg: number): { emoji: string; label: string } {
  if (avg < 1.7) return { emoji: "😊", label: "קל בממוצע" };
  if (avg <= 2.3) return { emoji: "😐", label: "בסדר בממוצע" };
  return { emoji: "😓", label: "קשה בממוצע" };
}

function scoreColor(score: number | null): string {
  if (score === null) return "text-brand-muted bg-brand-bg border-brand-border";
  if (score >= 80) return "text-green-700 bg-green-50 border-green-200";
  if (score >= 50) return "text-amber-600 bg-amber-50 border-amber-200";
  return "text-red-600 bg-red-50 border-red-200";
}

interface DomainScores {
  notes: number | null;
  rhythm: number | null;
  pitch: number | null;
}

interface Session {
  completed_at: string;
  duration_minutes: number;
  skill_type: string;
  self_rating: number | null;
}

interface LastSession {
  completed_at: string;
  duration_minutes: number;
  skill_type: string;
}

interface StudentCardProps {
  studentId: string;
  name: string;
  level: number;
  xp: number;
  sessionCount: number;
  lastSession: LastSession | null;
  avgRating?: number;
  sessions?: Session[];
  recommendedLevel?: number | null;
  domainScores: DomainScores | null;
  weeklySummary: string | null;
  summaryUpdatedAt: string | null;
}

export default function StudentCard({
  studentId,
  name,
  level,
  xp,
  sessionCount,
  lastSession,
  avgRating,
  sessions = [],
  recommendedLevel,
  domainScores,
  weeklySummary: initialSummary,
  summaryUpdatedAt: initialUpdatedAt,
}: StudentCardProps) {
  const [open, setOpen] = useState(false);
  const [summary, setSummary] = useState<string | null>(initialSummary);
  const [updatedAt, setUpdatedAt] = useState<string | null>(initialUpdatedAt);
  const [refreshing, setRefreshing] = useState(false);
  const [refreshError, setRefreshError] = useState<string | null>(null);

  const initial = name[0] ?? "?";
  const practicedToday = lastSession
    ? new Date(lastSession.completed_at).toDateString() === new Date().toDateString()
    : false;

  const badge = avgRating != null ? ratingBadge(avgRating) : null;

  async function handleRefresh() {
    setRefreshing(true);
    setRefreshError(null);
    try {
      const result = await refreshWeeklySummary(studentId);
      setSummary(result);
      setUpdatedAt(new Date().toISOString());
    } catch {
      setRefreshError("שגיאה בייצור הסיכום — נסי שוב");
    } finally {
      setRefreshing(false);
    }
  }

  return (
    <div className="bg-brand-card rounded-2xl border border-brand-border overflow-hidden">
      {/* Main row */}
      <div className="p-4">
        <div className="flex items-center gap-3">
          <div className={`w-11 h-11 rounded-full flex items-center justify-center text-lg font-bold flex-shrink-0 ${
            practicedToday ? "bg-brand-teal text-white" : "bg-brand-border text-brand-muted"
          }`}>
            {initial}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-bold text-brand-text">{name}</span>
              <span className="text-xs bg-brand-bg text-brand-muted border border-brand-border px-2 py-0.5 rounded-full">
                רמה {level}
              </span>
              {practicedToday && (
                <span className="text-xs bg-brand-teal/10 border border-brand-teal/20 text-brand-teal px-2 py-0.5 rounded-full">
                  תרגל היום
                </span>
              )}
              {badge && (
                <span className="text-xs bg-brand-bg border border-brand-border px-2 py-0.5 rounded-full">
                  {badge.emoji} {badge.label}
                </span>
              )}
              {recommendedLevel != null && (
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${
                  recommendedLevel > level
                    ? "bg-green-50 text-green-700 border-green-300"
                    : recommendedLevel < level
                    ? "bg-orange-50 text-orange-700 border-orange-300"
                    : "bg-gray-100 text-gray-500 border-gray-200"
                }`}>
                  {recommendedLevel > level ? "⬆️" : recommendedLevel < level ? "⬇️" : "🟰"} רמה מומלצת: {recommendedLevel}
                </span>
              )}
            </div>

            {lastSession ? (
              <div className="text-sm text-brand-muted mt-0.5 flex items-center gap-2 flex-wrap">
                <span>{SKILL_LABEL[lastSession.skill_type] ?? lastSession.skill_type}</span>
                <span>·</span>
                <span>{lastSession.duration_minutes} דק'</span>
                <span>·</span>
                <span>{timeAgo(lastSession.completed_at)}</span>
              </div>
            ) : (
              <p className="text-sm text-brand-muted mt-0.5">טרם תרגל</p>
            )}
          </div>

          <div className="text-center flex-shrink-0">
            <p className="text-lg font-bold text-brand-teal">{sessionCount}</p>
            <p className="text-xs text-brand-muted">תרגולים</p>
          </div>
        </div>

        {/* Domain score boxes */}
        <div className="grid grid-cols-3 gap-2 mt-3">
          {(
            [
              { key: "notes", label: "🎵 תווים" },
              { key: "rhythm", label: "🥁 מקצב" },
              { key: "pitch", label: "🎤 צליל" },
            ] as const
          ).map(({ key, label }) => {
            const score = domainScores?.[key] ?? null;
            return (
              <div
                key={key}
                className={`rounded-xl border px-2 py-2 text-center ${scoreColor(score)}`}
              >
                <p className="text-xs mb-0.5">{label}</p>
                <p className="text-sm font-bold">
                  {score !== null ? `${score}%` : "—"}
                </p>
              </div>
            );
          })}
        </div>

        {/* AI Weekly Summary */}
        <div className="mt-3 bg-purple-50 border border-purple-200 rounded-xl px-3 py-2">
          <div className="flex items-start justify-between gap-2">
            <p className="text-xs text-purple-800 flex-1 leading-relaxed">
              {summary ?? (
                <span className="text-purple-500 italic">
                  לחצי על רענן לייצור סיכום שבועי 🤖
                </span>
              )}
            </p>
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="flex-shrink-0 text-xs text-purple-700 border border-purple-300 bg-white rounded-lg px-2 py-1 hover:bg-purple-50 disabled:opacity-50 transition-colors"
            >
              {refreshing ? "⏳" : "רענן"}
            </button>
          </div>
          {refreshError && (
            <p className="text-xs text-red-500 mt-1">{refreshError}</p>
          )}
          {updatedAt && (
            <p className="text-xs text-purple-400 mt-1">
              עודכן: {formatDate(updatedAt)}
            </p>
          )}
        </div>

        {/* Toggle button */}
        {sessions.length > 0 && (
          <button
            onClick={() => setOpen((o) => !o)}
            className="mt-3 w-full text-xs text-brand-muted border border-brand-border rounded-xl py-1.5 hover:bg-brand-bg transition-colors"
          >
            {open ? "▲ הסתר היסטוריה" : `▼ הצג היסטוריה (${sessions.length} אימונים)`}
          </button>
        )}
      </div>

      {/* Session history */}
      {open && sessions.length > 0 && (
        <div className="border-t border-brand-border bg-brand-bg px-4 py-3 space-y-2">
          {sessions.map((s, i) => (
            <div key={i} className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2 text-brand-muted">
                <span>{SKILL_LABEL[s.skill_type] ?? s.skill_type}</span>
                <span>·</span>
                <span>{s.duration_minutes} דק'</span>
                <span>·</span>
                <span>{timeAgo(s.completed_at)}</span>
              </div>
              {s.self_rating != null && (
                <span className="text-base">{RATING_EMOJI[s.self_rating]}</span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: TypeScript check**

```bash
cd C:\Users\HP\Downloads\practice5
npx tsc --noEmit 2>&1 | head -20
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add components/teacher/StudentCard.tsx
git commit -m "feat: add domain score boxes and AI weekly summary to StudentCard"
```

---

### Task 5: Push and verify

- [ ] **Step 1: Push to GitHub**

```bash
git push origin main
```

- [ ] **Step 2: Manual test flow**

1. Open `/dashboard` as a teacher
2. Verify 3 domain score boxes appear on each student card (green/amber/red/gray based on score)
3. Students with no assessments show "—" in all 3 boxes
4. Students with no summary show "לחצי על רענן לייצור סיכום שבועי 🤖"
5. Click "רענן" on a student card — verify spinner appears, then Hebrew summary text appears
6. Reload the page — verify the summary persists (loaded from DB)
7. Check Supabase `profiles` table — `weekly_summary` and `summary_updated_at` have values for the tested student

---

## Notes

- `(supabase as any)` cast used for `weekly_summary`/`summary_updated_at` update since these new columns are not in generated TS types.
- The Server Action verifies the caller is a teacher before calling Claude — students cannot trigger it.
- Claude model: `claude-3-5-haiku-20241022` — same model already used in `lib/ai/generate-exercise.ts`.
- `ANTHROPIC_API_KEY` env var is already configured in the project (used by `generate-exercise.ts`).
