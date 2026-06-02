# Practice5 — Plan 2: Practice Flow + AI + Gamification

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the full student practice flow — time selection, AI-generated exercise, completion + XP, level system, achievements, and profile screen.

**Architecture:** Server actions call Anthropic Claude to generate exercises stored in Supabase. A lightweight XP engine runs server-side after each session completion. React Server Components fetch data; client components handle interactivity.

**Tech Stack:** Next.js 14 App Router, Anthropic SDK (claude-3-5-haiku), Supabase JS v2, TypeScript, Tailwind v4

**Supabase project:** `https://aplvkqojrdnwdgsuxkrc.supabase.co`

---

## Existing codebase context

```
app/
  (auth)/login/page.tsx       ← login
  (auth)/register/page.tsx    ← register
  (student)/practice/page.tsx ← PLACEHOLDER — replace in Task 1
  (student)/layout.tsx
  (teacher)/dashboard/page.tsx
  actions/auth.ts
lib/
  supabase/client.ts
  supabase/server.ts
  supabase/middleware.ts
  supabase/types.ts           ← has all DB types
```

Brand colors: `brand-red` (#C0392B), `brand-gold` (#F1C40F), `brand-dark` (#1A1A2E)

---

## File Map

| File | Purpose |
|------|---------|
| `app/(student)/practice/page.tsx` | Time + skill selection screen |
| `app/(student)/practice/exercise/page.tsx` | Exercise display + completion |
| `app/(student)/profile/page.tsx` | Profile: avatar, XP, weekly progress |
| `app/actions/practice.ts` | Server actions: generate, complete session |
| `lib/ai/generate-exercise.ts` | Anthropic API call → exercise JSON |
| `lib/gamification/xp.ts` | XP calc, level-up logic |
| `lib/gamification/achievements.ts` | Achievement checking after session |
| `components/student/TimeSkillSelector.tsx` | 4 time buttons + 3 skill buttons |
| `components/student/ExerciseCard.tsx` | Exercise content display |
| `components/student/CompletionScreen.tsx` | XP earned + level up celebration |
| `components/student/XPBar.tsx` | Animated XP progress bar |
| `components/student/WeeklyProgress.tsx` | 7-day practice dots |
| `components/student/AchievementBadge.tsx` | Single achievement chip |
| `components/student/BottomNav.tsx` | Practice / Profile nav tabs |

---

## Task 1: AI Exercise Generator

**Files:**
- Create: `lib/ai/generate-exercise.ts`

- [ ] **Step 1: Create the exercise generator**

```ts
// lib/ai/generate-exercise.ts
import Anthropic from "@anthropic-ai/sdk";

export type SkillType = "notes" | "rhythm" | "scales";

export interface Exercise {
  title: string;
  description: string;
  steps: string[];
  tip: string;
  skill_type: SkillType;
  difficulty: number;
}

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const SKILL_CONTEXT: Record<SkillType, string> = {
  notes: "קריאת תווים — זיהוי תווים על פסי התווים, מיקום על הכלי",
  rhythm: "מקצבים — ניקוד מקצבי, דפוסי קצב, ספירה",
  scales: "סולמות — נגינת סולמות, טרמולו, תרגולי אצבעות",
};

export async function generateExercise(
  skillType: SkillType,
  durationMinutes: number,
  difficultyLevel: number
): Promise<Exercise> {
  const prompt = `אתה מורה למוזיקה מנוסה. צור תרגול מוזיקה קצר בעברית.

פרטים:
- תחום: ${SKILL_CONTEXT[skillType]}
- זמן: ${durationMinutes} דקות
- רמה: ${difficultyLevel} מתוך 5 (${difficultyLevel <= 2 ? "מתחיל" : difficultyLevel <= 4 ? "בינוני" : "מתקדם"})

החזר JSON בדיוק בפורמט הזה (ללא טקסט נוסף):
{
  "title": "שם התרגול הקצר",
  "description": "תיאור קצר של מה מתרגלים (משפט אחד)",
  "steps": [
    "שלב 1: הנחיה קצרה",
    "שלב 2: הנחיה קצרה",
    "שלב 3: הנחיה קצרה"
  ],
  "tip": "טיפ קצר ופרקטי"
}

חשוב: התרגול חייב להתאים בדיוק ל-${durationMinutes} דקות. רמה ${difficultyLevel} = ${difficultyLevel <= 2 ? "פשוט מאוד, תנועות בסיסיות" : difficultyLevel <= 4 ? "דורש ריכוז, מספר צעדים" : "מאתגר, דורש מיומנות"}.`;

  const message = await client.messages.create({
    model: "claude-haiku-4-5",
    max_tokens: 512,
    messages: [{ role: "user", content: prompt }],
  });

  const text = message.content[0].type === "text" ? message.content[0].text : "";
  
  try {
    const parsed = JSON.parse(text.trim());
    return {
      ...parsed,
      skill_type: skillType,
      difficulty: difficultyLevel,
    };
  } catch {
    // Fallback if JSON parse fails
    return {
      title: `תרגול ${SKILL_CONTEXT[skillType].split(" — ")[0]}`,
      description: `תרגול ${durationMinutes} דקות ברמה ${difficultyLevel}`,
      steps: ["נגן בקצב איטי", "חזור 3 פעמים", "האיץ בהדרגה"],
      tip: "התרכז בדיוק, לא במהירות",
      skill_type: skillType,
      difficulty: difficultyLevel,
    };
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add lib/ai/
git commit -m "feat: add AI exercise generator with Claude Haiku"
```

---

## Task 2: XP & Gamification Logic

**Files:**
- Create: `lib/gamification/xp.ts`
- Create: `lib/gamification/achievements.ts`

- [ ] **Step 1: Create XP module**

```ts
// lib/gamification/xp.ts

export const XP_PER_SESSION: Record<number, number> = {
  5: 10,
  10: 25,
  15: 40,
  20: 60,
};

export function xpForLevel(level: number): number {
  return level * 100;
}

export function calculateLevelUp(
  currentXp: number,
  currentLevel: number,
  xpEarned: number
): { newXp: number; newLevel: number; leveledUp: boolean } {
  let newXp = currentXp + xpEarned;
  let newLevel = currentLevel;
  let leveledUp = false;

  while (newXp >= xpForLevel(newLevel)) {
    newXp -= xpForLevel(newLevel);
    newLevel++;
    leveledUp = true;
  }

  return { newXp, newLevel, leveledUp };
}

export function xpProgressPercent(xp: number, level: number): number {
  return Math.min(100, Math.round((xp / xpForLevel(level)) * 100));
}
```

- [ ] **Step 2: Create achievements module**

```ts
// lib/gamification/achievements.ts
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

  // Fetch existing achievements
  const { data: existing } = await supabase
    .from("achievements")
    .select("achievement_type")
    .eq("student_id", studentId);

  const existingTypes = new Set(existing?.map((a) => a.achievement_type) ?? []);

  // Fetch session count
  const { count: sessionCount } = await supabase
    .from("practice_sessions")
    .select("*", { count: "exact", head: true })
    .eq("student_id", studentId)
    .not("completed_at", "is", null);

  // Fetch skill session counts
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
```

- [ ] **Step 3: Commit**

```bash
git add lib/gamification/
git commit -m "feat: add XP calculation and achievement system"
```

---

## Task 3: Practice Server Actions

**Files:**
- Create: `app/actions/practice.ts`

- [ ] **Step 1: Create practice actions**

```ts
// app/actions/practice.ts
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

  // Get student's current level
  const { data: profile } = await supabase
    .from("profiles")
    .select("level, xp")
    .eq("id", user.id)
    .single() as { data: { level: number; xp: number } | null };

  const difficultyLevel = profile?.level ?? 1;

  // Generate exercise with AI
  const exercise = await generateExercise(skillType, durationMinutes, difficultyLevel);

  // Create session
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

  // Get session
  const { data: session } = await supabase
    .from("practice_sessions")
    .select("duration_minutes, skill_type, difficulty_level, student_id")
    .eq("id", sessionId)
    .single();

  if (!session || session.student_id !== user.id) redirect("/practice");

  const xpEarned = XP_PER_SESSION[session.duration_minutes] ?? 10;

  // Get current profile
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

  // Mark session complete + update XP
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

  // Check achievements
  await checkAndGrantAchievements(user.id, newLevel, leveledUp);

  redirect(`/practice/complete?xp=${xpEarned}&leveled=${leveledUp ? newLevel : 0}`);
}
```

- [ ] **Step 2: Commit**

```bash
git add app/actions/practice.ts
git commit -m "feat: add practice server actions with AI and XP"
```

---

## Task 4: UI Components

**Files:**
- Create: `components/student/TimeSkillSelector.tsx`
- Create: `components/student/ExerciseCard.tsx`
- Create: `components/student/XPBar.tsx`
- Create: `components/student/WeeklyProgress.tsx`
- Create: `components/student/AchievementBadge.tsx`
- Create: `components/student/BottomNav.tsx`

- [ ] **Step 1: Create TimeSkillSelector**

```tsx
// components/student/TimeSkillSelector.tsx
"use client";
import { useState } from "react";
import { startPracticeSession } from "@/app/actions/practice";

const DURATIONS = [5, 10, 15, 20] as const;
const SKILLS = [
  { value: "notes", label: "קריאת תווים", emoji: "🎼" },
  { value: "rhythm", label: "מקצבים", emoji: "🥁" },
  { value: "scales", label: "סולמות", emoji: "🎹" },
] as const;

export default function TimeSkillSelector() {
  const [duration, setDuration] = useState<number>(10);
  const [skill, setSkill] = useState<string>("notes");
  const [loading, setLoading] = useState(false);

  async function handleSubmit() {
    setLoading(true);
    const form = new FormData();
    form.set("duration", String(duration));
    form.set("skill", skill);
    await startPracticeSession(form);
  }

  return (
    <div className="flex flex-col gap-6 p-5">
      <div>
        <p className="text-sm font-semibold text-gray-500 mb-3">כמה זמן יש לך?</p>
        <div className="grid grid-cols-2 gap-3">
          {DURATIONS.map((d) => (
            <button
              key={d}
              onClick={() => setDuration(d)}
              className={`py-4 rounded-2xl text-lg font-bold border-2 transition-all ${
                duration === d
                  ? "bg-brand-red text-white border-brand-red shadow-lg scale-105"
                  : "bg-white text-gray-700 border-gray-200"
              }`}
            >
              {d}
              <span className="text-sm font-normal mr-1">דקות</span>
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className="text-sm font-semibold text-gray-500 mb-3">מה לתרגל?</p>
        <div className="flex flex-col gap-2">
          {SKILLS.map((s) => (
            <button
              key={s.value}
              onClick={() => setSkill(s.value)}
              className={`flex items-center gap-3 px-4 py-3 rounded-2xl border-2 transition-all text-right ${
                skill === s.value
                  ? "bg-red-50 border-brand-red text-brand-red"
                  : "bg-white border-gray-200 text-gray-700"
              }`}
            >
              <span className="text-2xl">{s.emoji}</span>
              <span className="font-semibold">{s.label}</span>
              {skill === s.value && <span className="mr-auto">✓</span>}
            </button>
          ))}
        </div>
      </div>

      <button
        onClick={handleSubmit}
        disabled={loading}
        className="w-full bg-brand-red text-white rounded-2xl py-4 font-bold text-lg shadow-lg disabled:opacity-60 transition-all active:scale-95"
      >
        {loading ? "מייצר תרגול... ⏳" : "בוא נתחיל! ▶"}
      </button>
    </div>
  );
}
```

- [ ] **Step 2: Create ExerciseCard**

```tsx
// components/student/ExerciseCard.tsx
import type { Exercise } from "@/lib/ai/generate-exercise";

const SKILL_EMOJI: Record<string, string> = {
  notes: "🎼",
  rhythm: "🥁",
  scales: "🎹",
};

export default function ExerciseCard({ exercise }: { exercise: Exercise }) {
  return (
    <div className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-3xl">{SKILL_EMOJI[exercise.skill_type]}</span>
        <div>
          <h2 className="font-bold text-lg text-gray-900">{exercise.title}</h2>
          <p className="text-sm text-gray-500">{exercise.description}</p>
        </div>
      </div>

      <div className="bg-gray-50 rounded-2xl p-4 mb-4">
        <p className="text-xs font-semibold text-gray-400 mb-2">שלבים</p>
        <ol className="space-y-2">
          {exercise.steps.map((step, i) => (
            <li key={i} className="flex gap-2 text-sm text-gray-700">
              <span className="flex-shrink-0 w-5 h-5 bg-brand-red text-white rounded-full flex items-center justify-center text-xs font-bold">
                {i + 1}
              </span>
              <span>{step.replace(/^שלב \d+:\s*/, "")}</span>
            </li>
          ))}
        </ol>
      </div>

      <div className="bg-yellow-50 rounded-2xl px-4 py-3 flex gap-2">
        <span>💡</span>
        <p className="text-sm text-yellow-800">{exercise.tip}</p>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Create XPBar**

```tsx
// components/student/XPBar.tsx
import { xpProgressPercent, xpForLevel } from "@/lib/gamification/xp";

export default function XPBar({
  xp,
  level,
}: {
  xp: number;
  level: number;
}) {
  const percent = xpProgressPercent(xp, level);
  return (
    <div className="px-1">
      <div className="flex justify-between text-xs text-gray-500 mb-1">
        <span>רמה {level}</span>
        <span>{xp} / {xpForLevel(level)} XP</span>
      </div>
      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
        <div
          className="h-full bg-brand-gold rounded-full transition-all duration-500"
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Create WeeklyProgress**

```tsx
// components/student/WeeklyProgress.tsx
const DAYS = ["א", "ב", "ג", "ד", "ה", "ו", "ש"];

export default function WeeklyProgress({
  practicedDays,
}: {
  practicedDays: number[]; // 0=Sun..6=Sat
}) {
  const today = new Date().getDay();
  return (
    <div className="flex justify-between items-center px-2">
      {DAYS.map((day, i) => {
        const practiced = practicedDays.includes(i);
        const isToday = i === today;
        return (
          <div key={i} className="flex flex-col items-center gap-1">
            <div
              className={`w-9 h-9 rounded-full flex items-center justify-center transition-all ${
                practiced
                  ? "bg-brand-red text-white shadow-sm"
                  : isToday
                  ? "border-2 border-brand-red text-brand-red"
                  : "bg-gray-100 text-gray-400"
              }`}
            >
              {practiced ? "✓" : <span className="text-xs">{day}</span>}
            </div>
            <span className="text-xs text-gray-400">{day}</span>
          </div>
        );
      })}
    </div>
  );
}
```

- [ ] **Step 5: Create AchievementBadge**

```tsx
// components/student/AchievementBadge.tsx
import { ACHIEVEMENT_META, type AchievementType } from "@/lib/gamification/achievements";

export default function AchievementBadge({
  type,
  locked = false,
}: {
  type: AchievementType;
  locked?: boolean;
}) {
  const meta = ACHIEVEMENT_META[type];
  return (
    <div
      className={`flex flex-col items-center gap-1 p-3 rounded-2xl border ${
        locked ? "border-gray-100 bg-gray-50 opacity-40" : "border-yellow-200 bg-yellow-50"
      }`}
    >
      <span className="text-2xl">{locked ? "🔒" : meta.emoji}</span>
      <span className="text-xs font-semibold text-center text-gray-700">{meta.label}</span>
    </div>
  );
}
```

- [ ] **Step 6: Create BottomNav**

```tsx
// components/student/BottomNav.tsx
"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/practice", label: "תרגול", emoji: "🎵" },
  { href: "/profile", label: "פרופיל", emoji: "👤" },
];

export default function BottomNav() {
  const pathname = usePathname();
  return (
    <nav className="fixed bottom-0 right-0 left-0 bg-white border-t border-gray-100 safe-area-pb">
      <div className="flex">
        {TABS.map((tab) => {
          const active = pathname === tab.href;
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`flex-1 flex flex-col items-center py-3 gap-1 transition-colors ${
                active ? "text-brand-red" : "text-gray-400"
              }`}
            >
              <span className="text-xl">{tab.emoji}</span>
              <span className="text-xs font-medium">{tab.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
```

- [ ] **Step 7: Commit**

```bash
git add components/
git commit -m "feat: add student UI components (time selector, exercise card, XP bar, nav)"
```

---

## Task 5: Practice Selection Page

**Files:**
- Modify: `app/(student)/practice/page.tsx`
- Modify: `app/(student)/layout.tsx`

- [ ] **Step 1: Update student layout to include BottomNav**

```tsx
// app/(student)/layout.tsx
import BottomNav from "@/components/student/BottomNav";

export default function StudentLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="pb-20">{children}</div>
      <BottomNav />
    </div>
  );
}
```

- [ ] **Step 2: Replace practice page**

```tsx
// app/(student)/practice/page.tsx
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import TimeSkillSelector from "@/components/student/TimeSkillSelector";
import XPBar from "@/components/student/XPBar";
import WeeklyProgress from "@/components/student/WeeklyProgress";

export default async function PracticePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("name, level, xp")
    .eq("id", user.id)
    .single() as { data: { name: string; level: number; xp: number } | null };

  // Get this week's practiced days
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 6);
  const { data: sessions } = await supabase
    .from("practice_sessions")
    .select("completed_at")
    .eq("student_id", user.id)
    .not("completed_at", "is", null)
    .gte("completed_at", weekAgo.toISOString());

  const practicedDays = [
    ...new Set(
      sessions?.map((s) => new Date(s.completed_at!).getDay()) ?? []
    ),
  ];

  return (
    <main className="max-w-sm mx-auto">
      {/* Header */}
      <div className="bg-white px-5 pt-8 pb-4 shadow-sm">
        <p className="text-sm text-gray-500">שלום,</p>
        <h1 className="text-2xl font-bold text-gray-900">{profile?.name ?? "תלמיד"} 👋</h1>
        <div className="mt-3">
          <XPBar xp={profile?.xp ?? 0} level={profile?.level ?? 1} />
        </div>
      </div>

      {/* Weekly Progress */}
      <div className="bg-white mx-4 mt-4 rounded-3xl p-4 shadow-sm">
        <p className="text-sm font-semibold text-gray-500 mb-3">שבוע זה</p>
        <WeeklyProgress practicedDays={practicedDays} />
      </div>

      {/* Time + Skill Selector */}
      <div className="bg-white mx-4 mt-4 rounded-3xl shadow-sm">
        <div className="px-5 pt-4">
          <h2 className="font-bold text-gray-900">התרגול היומי שלך</h2>
          <p className="text-sm text-gray-500">בחר זמן ותחום</p>
        </div>
        <TimeSkillSelector />
      </div>
    </main>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add app/(student)/
git commit -m "feat: build practice selection page with weekly progress"
```

---

## Task 6: Exercise Display Page

**Files:**
- Create: `app/(student)/practice/exercise/page.tsx`

- [ ] **Step 1: Create exercise page**

```tsx
// app/(student)/practice/exercise/page.tsx
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import ExerciseCard from "@/components/student/ExerciseCard";
import { completePracticeSession } from "@/app/actions/practice";
import type { Exercise } from "@/lib/ai/generate-exercise";

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
    .single();

  if (!session) redirect("/practice");
  if (session.completed_at) redirect("/practice");

  const exercise = session.exercise_content as unknown as Exercise;

  async function handleComplete() {
    "use server";
    await completePracticeSession(sessionId!);
  }

  return (
    <main className="max-w-sm mx-auto px-4 pt-6 pb-24">
      {/* Header */}
      <div className="flex items-center gap-2 mb-5">
        <a href="/practice" className="text-gray-400 text-lg">→</a>
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
```

- [ ] **Step 2: Commit**

```bash
git add app/(student)/practice/exercise/
git commit -m "feat: add exercise display page with complete button"
```

---

## Task 7: Completion Screen

**Files:**
- Create: `app/(student)/practice/complete/page.tsx`

- [ ] **Step 1: Create completion page**

```tsx
// app/(student)/practice/complete/page.tsx
import Link from "next/link";

export default async function CompletePage({
  searchParams,
}: {
  searchParams: Promise<{ xp?: string; leveled?: string }>;
}) {
  const { xp, leveled } = await searchParams;
  const xpEarned = Number(xp ?? 0);
  const leveledUpTo = Number(leveled ?? 0);
  const didLevelUp = leveledUpTo > 0;

  return (
    <main className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-6 text-center">
      <div className="bg-white rounded-3xl p-8 shadow-lg max-w-sm w-full">
        {didLevelUp ? (
          <>
            <div className="text-6xl mb-4">🏆</div>
            <h1 className="text-2xl font-bold text-gray-900 mb-1">
              עלית לרמה {leveledUpTo}!
            </h1>
            <p className="text-gray-500 mb-2">כל הכבוד — אתה מתקדם!</p>
          </>
        ) : (
          <>
            <div className="text-6xl mb-4">⭐</div>
            <h1 className="text-2xl font-bold text-gray-900 mb-1">
              תרגול הושלם!
            </h1>
            <p className="text-gray-500 mb-2">עשית עבודה מצוינת</p>
          </>
        )}

        <div className="bg-yellow-50 rounded-2xl py-4 px-6 my-6">
          <p className="text-3xl font-bold text-brand-gold">+{xpEarned} XP</p>
          <p className="text-sm text-yellow-700">ניקוד שהרווחת</p>
        </div>

        <Link
          href="/practice"
          className="block w-full bg-brand-red text-white rounded-2xl py-3 font-bold text-lg"
        >
          לתרגול הבא ▶
        </Link>
      </div>
    </main>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add app/(student)/practice/complete/
git commit -m "feat: add completion screen with XP and level-up celebration"
```

---

## Task 8: Profile Page

**Files:**
- Create: `app/(student)/profile/page.tsx`

- [ ] **Step 1: Create profile page**

```tsx
// app/(student)/profile/page.tsx
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import XPBar from "@/components/student/XPBar";
import AchievementBadge from "@/components/student/AchievementBadge";
import { ACHIEVEMENT_META, type AchievementType } from "@/lib/gamification/achievements";
import { logout } from "@/app/actions/auth";

const ALL_ACHIEVEMENTS = Object.keys(ACHIEVEMENT_META) as AchievementType[];

export default async function ProfilePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("name, level, xp")
    .eq("id", user.id)
    .single() as { data: { name: string; level: number; xp: number } | null };

  const { data: achievements } = await supabase
    .from("achievements")
    .select("achievement_type")
    .eq("student_id", user.id);

  const { count: sessionCount } = await supabase
    .from("practice_sessions")
    .select("*", { count: "exact", head: true })
    .eq("student_id", user.id)
    .not("completed_at", "is", null);

  const earnedTypes = new Set(achievements?.map((a) => a.achievement_type) ?? []);

  return (
    <main className="max-w-sm mx-auto pb-24">
      {/* Header */}
      <div className="bg-brand-dark text-white px-5 pt-10 pb-6">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-16 h-16 bg-brand-gold rounded-full flex items-center justify-center text-3xl font-bold text-brand-dark">
            {(profile?.name ?? "?")[0]}
          </div>
          <div>
            <h1 className="text-xl font-bold">{profile?.name ?? "תלמיד"}</h1>
            <p className="text-sm text-gray-300">רמה {profile?.level ?? 1} ⭐</p>
          </div>
        </div>
        <XPBar xp={profile?.xp ?? 0} level={profile?.level ?? 1} />
      </div>

      {/* Stats */}
      <div className="mx-4 mt-4 grid grid-cols-2 gap-3">
        <div className="bg-white rounded-2xl p-4 text-center shadow-sm">
          <p className="text-2xl font-bold text-brand-red">{sessionCount ?? 0}</p>
          <p className="text-sm text-gray-500">תרגולים</p>
        </div>
        <div className="bg-white rounded-2xl p-4 text-center shadow-sm">
          <p className="text-2xl font-bold text-brand-gold">{earnedTypes.size}</p>
          <p className="text-sm text-gray-500">הישגים</p>
        </div>
      </div>

      {/* Achievements */}
      <div className="mx-4 mt-4 bg-white rounded-3xl p-4 shadow-sm">
        <h2 className="font-bold text-gray-900 mb-3">ארון גביעים</h2>
        <div className="grid grid-cols-3 gap-2">
          {ALL_ACHIEVEMENTS.map((type) => (
            <AchievementBadge
              key={type}
              type={type}
              locked={!earnedTypes.has(type)}
            />
          ))}
        </div>
      </div>

      {/* Logout */}
      <div className="mx-4 mt-4">
        <form>
          <button
            formAction={logout}
            className="w-full border border-gray-200 rounded-2xl py-3 text-gray-500 text-sm font-medium"
          >
            יציאה
          </button>
        </form>
      </div>
    </main>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add app/(student)/profile/
git commit -m "feat: add profile page with achievements and stats"
```

---

## Task 9: Build + Deploy

- [ ] **Step 1: Run build locally**

```bash
cd C:\Users\HP\Downloads\practice5
npm run build
```

Fix any TypeScript errors before continuing.

- [ ] **Step 2: Push and deploy**

```bash
git push
npx vercel --prod
```

- [ ] **Step 3: Smoke test on Vercel URL**

Open `https://practice5-opal.vercel.app/practice`:
- ✅ Time buttons visible and selectable
- ✅ Skill buttons visible
- ✅ "בוא נתחיל!" button works
- ✅ Exercise screen loads with AI content in Hebrew
- ✅ "סיימתי!" redirects to completion screen with XP
- ✅ Profile page shows level, XP bar, achievements

---

## Self-Review

**Spec coverage:**
- ✅ בחירת זמן (5/10/15/20 דקות)
- ✅ בחירת מיומנות (קריאת תווים / מקצבים / סולמות)
- ✅ AI מייצר תרגול מותאם-רמה
- ✅ דיווח סיום
- ✅ XP + level system
- ✅ גמיפיקציה: רמות, הישגים, התקדמות שבועית
- ✅ פרופיל עם ארון גביעים
- ✅ רמה עולה אוטומטית לפי ביצועים
- ⏭️ ספריית שירים → Plan 3
- ⏭️ דשבורד מורה → Plan 3

**Placeholder scan:** None found.

**Type consistency:**
- `Exercise` type from `lib/ai/generate-exercise.ts` used consistently in ExerciseCard and practice actions
- `SkillType` = `"notes" | "rhythm" | "scales"` consistent throughout
- `AchievementType` from `lib/gamification/achievements.ts` used in AchievementBadge and profile
