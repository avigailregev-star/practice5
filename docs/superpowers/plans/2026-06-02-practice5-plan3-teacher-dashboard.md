# Practice5 — Plan 3: Teacher Dashboard

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a teacher dashboard that shows all registered students with their recent practice activity — who practiced, when, what skill, and for how long.

**Architecture:** Server component fetches all students (role='student') and their latest practice sessions in one page. No teacher-student linking — all students are visible to all teachers. Read-only view with logout.

**Tech Stack:** Next.js 14 App Router, Supabase JS v2, TypeScript, Tailwind v4

**Supabase project:** `https://aplvkqojrdnwdgsuxkrc.supabase.co`

---

## Existing codebase context

```
app/(teacher)/dashboard/page.tsx   ← PLACEHOLDER — replace entirely
app/(teacher)/layout.tsx           ← exists, add BottomNav
lib/supabase/server.ts             ← createClient()
app/actions/auth.ts                ← logout()
```

Brand colors: `brand-red`, `brand-gold`, `brand-dark`

Skill types: `"notes"` | `"rhythm"` | `"scales"`

---

## File Map

| File | Purpose |
|------|---------|
| `app/(teacher)/dashboard/page.tsx` | Main dashboard — fetches all students + sessions |
| `app/(teacher)/layout.tsx` | Add teacher BottomNav |
| `components/teacher/StudentCard.tsx` | Single student row with last session info |
| `components/teacher/TeacherStats.tsx` | Top stats: total students, practiced today |
| `components/teacher/BottomNav.tsx` | Teacher nav (דשבורד only for now) |

---

## Task 1: Teacher BottomNav + Layout

**Files:**
- Create: `components/teacher/BottomNav.tsx`
- Modify: `app/(teacher)/layout.tsx`

- [ ] **Step 1: Create teacher BottomNav**

```tsx
// components/teacher/BottomNav.tsx
"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/dashboard", label: "תלמידים", emoji: "👥" },
];

export default function TeacherBottomNav() {
  const pathname = usePathname();
  return (
    <nav className="fixed bottom-0 right-0 left-0 bg-white border-t border-gray-100">
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

- [ ] **Step 2: Update teacher layout**

```tsx
// app/(teacher)/layout.tsx
import TeacherBottomNav from "@/components/teacher/BottomNav";

export default function TeacherLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="pb-20">{children}</div>
      <TeacherBottomNav />
    </div>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add components/teacher/ app/(teacher)/layout.tsx
git commit -m "feat: add teacher layout with bottom nav"
```

---

## Task 2: StudentCard Component

**Files:**
- Create: `components/teacher/StudentCard.tsx`

- [ ] **Step 1: Create StudentCard**

```tsx
// components/teacher/StudentCard.tsx

const SKILL_LABEL: Record<string, string> = {
  notes: "קריאת תווים 🎼",
  rhythm: "מקצבים 🥁",
  scales: "סולמות 🎹",
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
}

export default function StudentCard({
  name,
  level,
  xp,
  sessionCount,
  lastSession,
}: StudentCardProps) {
  const initial = name[0] ?? "?";
  const practicedToday = lastSession
    ? new Date(lastSession.completed_at).toDateString() === new Date().toDateString()
    : false;

  return (
    <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
      <div className="flex items-center gap-3">
        {/* Avatar */}
        <div className={`w-11 h-11 rounded-full flex items-center justify-center text-lg font-bold flex-shrink-0 ${
          practicedToday ? "bg-brand-red text-white" : "bg-gray-100 text-gray-500"
        }`}>
          {initial}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-gray-900">{name}</span>
            <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full">
              רמה {level}
            </span>
            {practicedToday && (
              <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                תרגל היום ✓
              </span>
            )}
          </div>

          {lastSession ? (
            <div className="text-sm text-gray-500 mt-0.5 flex items-center gap-2 flex-wrap">
              <span>{SKILL_LABEL[lastSession.skill_type] ?? lastSession.skill_type}</span>
              <span>·</span>
              <span>{lastSession.duration_minutes} דקות</span>
              <span>·</span>
              <span>{timeAgo(lastSession.completed_at)}</span>
            </div>
          ) : (
            <p className="text-sm text-gray-400 mt-0.5">טרם תרגל</p>
          )}
        </div>

        {/* Session count */}
        <div className="text-center flex-shrink-0">
          <p className="text-lg font-bold text-brand-red">{sessionCount}</p>
          <p className="text-xs text-gray-400">תרגולים</p>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add components/teacher/StudentCard.tsx
git commit -m "feat: add StudentCard component for teacher dashboard"
```

---

## Task 3: TeacherStats Component

**Files:**
- Create: `components/teacher/TeacherStats.tsx`

- [ ] **Step 1: Create TeacherStats**

```tsx
// components/teacher/TeacherStats.tsx

interface TeacherStatsProps {
  totalStudents: number;
  practicedToday: number;
  practicedThisWeek: number;
}

export default function TeacherStats({
  totalStudents,
  practicedToday,
  practicedThisWeek,
}: TeacherStatsProps) {
  return (
    <div className="grid grid-cols-3 gap-3 px-4 mb-4">
      <div className="bg-white rounded-2xl p-3 text-center shadow-sm">
        <p className="text-2xl font-bold text-gray-900">{totalStudents}</p>
        <p className="text-xs text-gray-500">תלמידים</p>
      </div>
      <div className="bg-white rounded-2xl p-3 text-center shadow-sm">
        <p className="text-2xl font-bold text-brand-red">{practicedToday}</p>
        <p className="text-xs text-gray-500">תרגלו היום</p>
      </div>
      <div className="bg-white rounded-2xl p-3 text-center shadow-sm">
        <p className="text-2xl font-bold text-brand-gold">{practicedThisWeek}</p>
        <p className="text-xs text-gray-500">השבוע</p>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add components/teacher/TeacherStats.tsx
git commit -m "feat: add TeacherStats summary component"
```

---

## Task 4: Teacher Dashboard Page

**Files:**
- Modify: `app/(teacher)/dashboard/page.tsx`

- [ ] **Step 1: Replace dashboard page**

```tsx
// app/(teacher)/dashboard/page.tsx
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import StudentCard from "@/components/teacher/StudentCard";
import TeacherStats from "@/components/teacher/TeacherStats";
import { logout } from "@/app/actions/auth";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Verify teacher role
  const { data: profile } = await supabase
    .from("profiles")
    .select("name, role")
    .eq("id", user.id)
    .single() as { data: { name: string; role: string } | null };

  if (profile?.role !== "teacher") redirect("/practice");

  // Fetch all students
  const { data: students } = await supabase
    .from("profiles")
    .select("id, name, level, xp")
    .eq("role", "student")
    .order("name") as { data: { id: string; name: string; level: number; xp: number }[] | null };

  const studentList = students ?? [];

  // Fetch last completed session for each student
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 6);
  weekAgo.setHours(0, 0, 0, 0);

  // Fetch all recent sessions for stats
  const { data: recentSessions } = await supabase
    .from("practice_sessions")
    .select("student_id, completed_at, duration_minutes, skill_type")
    .not("completed_at", "is", null)
    .gte("completed_at", weekAgo.toISOString())
    .order("completed_at", { ascending: false }) as {
    data: {
      student_id: string;
      completed_at: string;
      duration_minutes: number;
      skill_type: string;
    }[] | null;
  };

  const sessions = recentSessions ?? [];

  // Build per-student last session map
  const lastSessionMap = new Map<string, {
    completed_at: string;
    duration_minutes: number;
    skill_type: string;
  }>();

  for (const s of sessions) {
    if (!lastSessionMap.has(s.student_id)) {
      lastSessionMap.set(s.student_id, s);
    }
  }

  // Fetch session counts per student
  const { data: allSessions } = await supabase
    .from("practice_sessions")
    .select("student_id")
    .not("completed_at", "is", null) as { data: { student_id: string }[] | null };

  const sessionCountMap = new Map<string, number>();
  for (const s of allSessions ?? []) {
    sessionCountMap.set(s.student_id, (sessionCountMap.get(s.student_id) ?? 0) + 1);
  }

  // Stats
  const practicedTodayIds = new Set(
    sessions
      .filter((s) => new Date(s.completed_at) >= today)
      .map((s) => s.student_id)
  );

  const practicedThisWeekIds = new Set(sessions.map((s) => s.student_id));

  return (
    <main className="max-w-lg mx-auto">
      {/* Header */}
      <div className="bg-brand-dark text-white px-5 pt-10 pb-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-300">שלום,</p>
            <h1 className="text-2xl font-bold">{profile?.name ?? "מורה"} 🎓</h1>
          </div>
          <form>
            <button
              formAction={logout}
              className="text-xs text-gray-400 border border-gray-600 rounded-lg px-3 py-1.5"
            >
              יציאה
            </button>
          </form>
        </div>
      </div>

      {/* Stats */}
      <div className="mt-4">
        <TeacherStats
          totalStudents={studentList.length}
          practicedToday={practicedTodayIds.size}
          practicedThisWeek={practicedThisWeekIds.size}
        />
      </div>

      {/* Student list */}
      <div className="px-4">
        <h2 className="font-bold text-gray-700 mb-3">כל התלמידים</h2>

        {studentList.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 text-center text-gray-400 shadow-sm">
            <p className="text-3xl mb-2">👥</p>
            <p>אין תלמידים רשומים עדיין</p>
          </div>
        ) : (
          <div className="space-y-3 pb-4">
            {studentList.map((student) => (
              <StudentCard
                key={student.id}
                name={student.name}
                level={student.level}
                xp={student.xp}
                sessionCount={sessionCountMap.get(student.id) ?? 0}
                lastSession={lastSessionMap.get(student.id) ?? null}
              />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
```

- [ ] **Step 2: Fix Supabase RLS — teachers need to read all student profiles**

The `profiles` table currently only allows users to view their own profile. Teachers need to see all students.

Run this SQL in the Supabase SQL Editor at:
`https://supabase.com/dashboard/project/aplvkqojrdnwdgsuxkrc/sql/new`

```sql
-- Allow teachers to view all student profiles
CREATE POLICY "Teachers can view all student profiles" ON profiles
  FOR SELECT USING (
    role = 'student'
    OR auth.uid() = id
  );

-- Allow teachers to view all practice sessions
CREATE POLICY "Teachers can view all sessions" ON practice_sessions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'teacher'
    )
  );
```

- [ ] **Step 3: Commit**

```bash
git add app/(teacher)/dashboard/page.tsx components/teacher/
git commit -m "feat: build teacher dashboard with student list and practice stats"
```

---

## Task 5: Build + Deploy

- [ ] **Step 1: Run build**

```bash
cd C:\Users\HP\Downloads\practice5
npm run build
```

Fix any TypeScript errors.

- [ ] **Step 2: Push and deploy**

```bash
git push
npx vercel --prod
```

- [ ] **Step 3: Smoke test**

1. Register a teacher account at `/register` → choose "מורה"
2. Login → should see `/dashboard`
3. Verify student list appears with practice data

---

## Self-Review

**Spec coverage:**
- ✅ כל התלמידים הרשומים נראים למורה
- ✅ מי תרגל ומתי
- ✅ כמה זמן תרגל
- ✅ מה תרגל (קריאת תווים / מקצבים / סולמות)
- ✅ רמה של כל תלמיד
- ✅ סטטיסטיקות: תרגלו היום / השבוע
- ✅ RLS מתוקן לגישת מורה

**Placeholder scan:** None found.

**Type consistency:** `StudentCardProps.lastSession` matches the shape fetched from Supabase throughout.
