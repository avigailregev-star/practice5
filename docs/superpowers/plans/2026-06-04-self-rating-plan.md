# Self-Rating After Exercise — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** After each exercise, students rate how it felt (😊/😐/😓). Teachers see average rating per student in the dashboard.

**Architecture:** Student taps emoji on complete page → server action saves `self_rating` (1/2/3) to Supabase → dashboard page fetches avg rating per student → StudentCard shows emoji badge.

**Tech Stack:** Next.js 14 App Router, Supabase, Tailwind v4, TypeScript

---

## Context

- **App router:** `app/(student)/practice/complete/page.tsx` — server component, receives `?xp=&leveled=` searchParams
- **Complete flow:** `completePracticeSession()` in `app/actions/practice.ts` redirects to `/practice/complete?xp=X&leveled=Y` — we add `&session_id=UUID`
- **Dashboard:** `app/(teacher)/dashboard/page.tsx` — server component, already fetches students + sessions from Supabase
- **StudentCard:** `components/teacher/StudentCard.tsx` — receives props, renders one student row
- **Supabase table:** `practice_sessions` — needs new `self_rating SMALLINT` column

---

## File Map

| File | Action |
|------|--------|
| Supabase SQL editor | Add `self_rating` column |
| `app/actions/rating.ts` | New — `updateSelfRating` server action |
| `components/student/SelfRatingWidget.tsx` | New — client component with 3 emoji buttons |
| `app/actions/practice.ts` | Modify redirect to include `session_id` |
| `app/(student)/practice/complete/page.tsx` | Add `session_id` searchParam, render `<SelfRatingWidget>` |
| `components/teacher/StudentCard.tsx` | Add `avgRating?: number` prop + emoji badge |
| `app/(teacher)/dashboard/page.tsx` | Fetch avg ratings, compute per student, pass to StudentCard |

---

### Task 1: Add `self_rating` column to Supabase

**Files:**
- Supabase SQL editor (manual step)

- [ ] **Step 1: Run SQL in Supabase**

Go to your Supabase project → SQL Editor → New query → paste and run:

```sql
ALTER TABLE practice_sessions
ADD COLUMN IF NOT EXISTS self_rating SMALLINT CHECK (self_rating IN (1, 2, 3));
```

Expected: "Success. No rows returned."

- [ ] **Step 2: Verify column exists**

In Supabase Table Editor → `practice_sessions` → check that `self_rating` column appears with type `int2`, nullable.

- [ ] **Step 3: Commit note**

```bash
git commit --allow-empty -m "feat: add self_rating column to practice_sessions (Supabase migration)"
```

---

### Task 2: Server action — `updateSelfRating`

**Files:**
- Create: `app/actions/rating.ts`

- [ ] **Step 1: Create the file**

```typescript
// app/actions/rating.ts
"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export async function updateSelfRating(sessionId: string, rating: 1 | 2 | 3): Promise<void> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  await supabase
    .from("practice_sessions")
    .update({ self_rating: rating } as never)
    .eq("id", sessionId)
    .eq("student_id", user.id); // safety: only update own session
}
```

- [ ] **Step 2: Commit**

```bash
git add app/actions/rating.ts
git commit -m "feat: updateSelfRating server action"
```

---

### Task 3: `SelfRatingWidget` client component

**Files:**
- Create: `components/student/SelfRatingWidget.tsx`

- [ ] **Step 1: Create the component**

```typescript
// components/student/SelfRatingWidget.tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import { updateSelfRating } from "@/app/actions/rating";

interface Props {
  sessionId: string;
}

const OPTIONS: { value: 1 | 2 | 3; emoji: string; label: string }[] = [
  { value: 1, emoji: "😊", label: "קל" },
  { value: 2, emoji: "😐", label: "בסדר" },
  { value: 3, emoji: "😓", label: "קשה" },
];

export default function SelfRatingWidget({ sessionId }: Props) {
  const [selected, setSelected] = useState<1 | 2 | 3 | null>(null);
  const [saved, setSaved] = useState(false);

  async function handleSelect(value: 1 | 2 | 3) {
    setSelected(value);
    await updateSelfRating(sessionId, value);
    setSaved(true);
  }

  return (
    <div className="my-6 text-center">
      <p className="text-sm font-semibold text-brand-text mb-3">איך הרגשת?</p>

      <div className="flex justify-center gap-3 mb-5">
        {OPTIONS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => handleSelect(opt.value)}
            disabled={saved}
            className={`flex flex-col items-center gap-1 px-4 py-3 rounded-2xl border-2 transition-all ${
              selected === opt.value
                ? "border-brand-pink bg-brand-pink/10 scale-105"
                : "border-brand-border bg-brand-card hover:border-brand-pink/40"
            }`}
          >
            <span className="text-3xl">{opt.emoji}</span>
            <span className="text-xs font-medium text-brand-text">{opt.label}</span>
          </button>
        ))}
      </div>

      {saved ? (
        <Link
          href="/practice"
          className="block w-full bg-brand-pink text-white rounded-xl py-3 font-bold text-lg"
        >
          לתרגול הבא
        </Link>
      ) : (
        <Link
          href="/practice"
          className="block text-center text-sm text-brand-muted mt-2"
        >
          דלג
        </Link>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Verify it compiles**

```bash
cd C:\Users\HP\Downloads\practice5
npx tsc --noEmit
```

Expected: no errors

- [ ] **Step 3: Commit**

```bash
git add components/student/SelfRatingWidget.tsx
git commit -m "feat: SelfRatingWidget emoji rating component"
```

---

### Task 4: Pass `session_id` in redirect after completing exercise

**Files:**
- Modify: `app/actions/practice.ts` — line 96

- [ ] **Step 1: Update the redirect line**

Find this line in `app/actions/practice.ts`:
```typescript
redirect(`/practice/complete?xp=${xpEarned}&leveled=${leveledUp ? newLevel : 0}`);
```

Replace with:
```typescript
redirect(`/practice/complete?xp=${xpEarned}&leveled=${leveledUp ? newLevel : 0}&session_id=${sessionId}`);
```

- [ ] **Step 2: Verify types compile**

```bash
npx tsc --noEmit
```

Expected: no errors

- [ ] **Step 3: Commit**

```bash
git add app/actions/practice.ts
git commit -m "feat: pass session_id to complete page redirect"
```

---

### Task 5: Update complete page to render `SelfRatingWidget`

**Files:**
- Modify: `app/(student)/practice/complete/page.tsx`

- [ ] **Step 1: Rewrite the file**

```typescript
// app/(student)/practice/complete/page.tsx
import Link from "next/link";
import SelfRatingWidget from "@/components/student/SelfRatingWidget";

export default async function CompletePage({
  searchParams,
}: {
  searchParams: Promise<{ xp?: string; leveled?: string; session_id?: string }>;
}) {
  const { xp, leveled, session_id } = await searchParams;
  const xpEarned = Number(xp ?? 0);
  const leveledUpTo = Number(leveled ?? 0);
  const didLevelUp = leveledUpTo > 0;

  return (
    <main className="min-h-screen bg-brand-bg flex flex-col items-center justify-center px-6 text-center">
      <div className="bg-brand-card rounded-3xl border border-brand-border p-8 shadow-sm max-w-sm w-full">
        {/* Trophy */}
        <div className="w-16 h-16 rounded-full border-2 border-brand-pink bg-brand-card flex items-center justify-center mx-auto mb-4">
          <span className="text-brand-pink text-3xl font-bold">★</span>
        </div>

        {didLevelUp ? (
          <>
            <h1 className="text-2xl font-extrabold text-brand-text mb-1">עלית לרמה {leveledUpTo}!</h1>
            <p className="text-brand-muted mb-2">כל הכבוד — אתה מתקדם</p>
          </>
        ) : (
          <>
            <h1 className="text-2xl font-extrabold text-brand-text mb-1">תרגול הושלם</h1>
            <p className="text-brand-muted mb-2">עשית עבודה מצוינת</p>
          </>
        )}

        {/* XP Badge */}
        <div className="bg-brand-pink/10 rounded-xl py-4 px-6 my-6 border border-brand-pink/20">
          <p className="text-3xl font-bold text-brand-pink">+{xpEarned} XP</p>
          <p className="text-sm text-brand-muted mt-1">ניקוד שהרווחת</p>
        </div>

        {/* Self Rating */}
        {session_id ? (
          <SelfRatingWidget sessionId={session_id} />
        ) : (
          <Link
            href="/practice"
            className="block w-full bg-brand-pink text-white rounded-xl py-3 font-bold text-lg"
          >
            לתרגול הבא
          </Link>
        )}
      </div>
    </main>
  );
}
```

- [ ] **Step 2: Verify it compiles**

```bash
npx tsc --noEmit
```

Expected: no errors

- [ ] **Step 3: Test manually**

```bash
npm run dev
```

- Login as a student → start a practice → complete it
- Expected: complete page shows 😊 😐 😓 buttons
- Tap one → button gets pink border → "לתרגול הבא" button appears
- Check Supabase table `practice_sessions` — the row should have `self_rating = 1/2/3`

- [ ] **Step 4: Commit**

```bash
git add app/(student)/practice/complete/page.tsx
git commit -m "feat: emoji self-rating on complete page"
```

---

### Task 6: Update `StudentCard` to show avg rating badge

**Files:**
- Modify: `components/teacher/StudentCard.tsx`

- [ ] **Step 1: Add `avgRating` prop and badge**

```typescript
// components/teacher/StudentCard.tsx
const SKILL_LABEL: Record<string, string> = {
  notes: "קריאת תווים",
  rhythm: "מקצבים",
  scales: "סולמות",
};

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

function ratingBadge(avg: number): { emoji: string; label: string } {
  if (avg < 1.7) return { emoji: "😊", label: "קל בממוצע" };
  if (avg <= 2.3) return { emoji: "😐", label: "בסדר בממוצע" };
  return { emoji: "😓", label: "קשה בממוצע" };
}

interface LastSession {
  completed_at: string;
  duration_minutes: number;
  skill_type: string;
}

interface StudentCardProps {
  name: string;
  level: number;
  xp: number;
  sessionCount: number;
  lastSession: LastSession | null;
  avgRating?: number;
}

export default function StudentCard({
  name,
  level,
  xp,
  sessionCount,
  lastSession,
  avgRating,
}: StudentCardProps) {
  const initial = name[0] ?? "?";
  const practicedToday = lastSession
    ? new Date(lastSession.completed_at).toDateString() === new Date().toDateString()
    : false;

  const badge = avgRating != null ? ratingBadge(avgRating) : null;

  return (
    <div className="bg-brand-card rounded-2xl p-4 border border-brand-border">
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
    </div>
  );
}
```

- [ ] **Step 2: Verify it compiles**

```bash
npx tsc --noEmit
```

Expected: no errors (avgRating is optional so dashboard page still compiles before Task 7)

- [ ] **Step 3: Commit**

```bash
git add components/teacher/StudentCard.tsx
git commit -m "feat: avg rating badge in StudentCard"
```

---

### Task 7: Fetch avg ratings in dashboard and pass to StudentCard

**Files:**
- Modify: `app/(teacher)/dashboard/page.tsx`

- [ ] **Step 1: Add ratings fetch and avg computation**

After the existing `sessionCountMap` block (around line 70), add:

```typescript
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
```

- [ ] **Step 2: Pass `avgRating` to each StudentCard**

Find the `<StudentCard ... />` JSX block and add the prop:

```typescript
<StudentCard
  key={student.id}
  name={student.name}
  level={student.level}
  xp={student.xp}
  sessionCount={sessionCountMap.get(student.id) ?? 0}
  lastSession={lastSessionMap.get(student.id) ?? null}
  avgRating={ratingMap.get(student.id)}
/>
```

- [ ] **Step 3: Verify it compiles**

```bash
npx tsc --noEmit
```

Expected: no errors

- [ ] **Step 4: Test manually**

```bash
npm run dev
```

- Login as teacher → dashboard
- Students who have rated sessions should show emoji badge (e.g., "😊 קל בממוצע")
- Students with no ratings: no badge shown

- [ ] **Step 5: Commit and push**

```bash
git add app/\(teacher\)/dashboard/page.tsx
git commit -m "feat: avg self-rating per student in teacher dashboard"
git push origin main
```

---

## Done ✅

After all tasks:
- Students see emoji rating on complete page
- Ratings saved to Supabase `self_rating` column
- Teacher dashboard shows avg rating badge per student
