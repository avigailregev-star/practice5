# Practice5 — Plan 4: UI/UX Upgrade

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the current light/emoji UI with a sophisticated dark-gold design using Rubik font, Lucide SVG icons, and an animated music-wave background across the entire app.

**Architecture:** Global theme tokens in `globals.css`, Rubik font via `next/font/google`, Lucide icons from `lucide-react` npm package, and a shared `WaveBackground` CSS-animation component. All changes are purely visual — no logic, routing, or data changes.

**Tech Stack:** Next.js 14 App Router, Tailwind v4, Lucide React, TypeScript

**Supabase project:** `https://aplvkqojrdnwdgsuxkrc.supabase.co`

---

## Existing codebase context

```
app/globals.css                              ← theme tokens, font, body styles
app/layout.tsx                               ← Heebo font — replace with Rubik
app/(auth)/layout.tsx                        ← auth wrapper
app/(auth)/login/page.tsx                    ← login form
app/(auth)/register/page.tsx                 ← register form
app/(student)/layout.tsx                     ← student wrapper
app/(student)/practice/page.tsx              ← student home
app/(student)/practice/exercise/page.tsx     ← exercise page
app/(student)/practice/complete/page.tsx     ← completion screen
app/(student)/profile/page.tsx               ← profile + achievements
app/(teacher)/layout.tsx                     ← teacher wrapper
app/(teacher)/dashboard/page.tsx             ← teacher dashboard
components/student/BottomNav.tsx             ← emojis → Lucide icons
components/student/XPBar.tsx                 ← light → dark
components/student/WeeklyProgress.tsx        ← light → dark
components/student/TimeSkillSelector.tsx     ← light → dark + Lucide
components/student/ExerciseCard.tsx          ← light → dark + Lucide
components/student/MusicNotation.tsx         ← add CSS filter for dark mode
components/student/RhythmNotation.tsx        ← add CSS filter for dark mode
components/student/NoteAnswer.tsx            ← light → dark
components/student/AchievementBadge.tsx      ← emojis → dark style
components/teacher/BottomNav.tsx             ← emoji → Lucide icon
components/teacher/StudentCard.tsx           ← light → dark
components/teacher/TeacherStats.tsx          ← light → dark
```

**New color tokens (replacing old ones):**
- `brand-dark` = `#0f0f0f` (page background)
- `brand-gold` = `#c9a84c` (primary accent — CTAs, active states, XP)
- `brand-gold-light` = `#e8c96d` (wave bars gradient alt)
- `brand-surface` = `#1a1a1a` (cards, nav)
- `brand-surface-2` = `#111111` (secondary bg, inactive items)
- `brand-border` = `#222222` (borders)
- `brand-muted` = `#666666` (secondary text)

**Note:** `brand-red` is fully removed. All previous `brand-red` usages become `brand-gold`.

---

## File Map

| File | Action |
|------|--------|
| `app/globals.css` | Replace color tokens, dark body bg |
| `app/layout.tsx` | Replace Heebo with Rubik |
| `components/shared/WaveBackground.tsx` | Create — CSS wave animation |
| `app/(auth)/layout.tsx` | Dark bg, remove emoji |
| `app/(auth)/login/page.tsx` | Dark form card |
| `app/(auth)/register/page.tsx` | Dark form card |
| `app/(student)/layout.tsx` | Dark bg |
| `app/(student)/practice/page.tsx` | Dark header + WaveBackground |
| `app/(student)/practice/exercise/page.tsx` | Dark layout |
| `app/(student)/practice/complete/page.tsx` | Dark completion screen |
| `app/(student)/profile/page.tsx` | Dark profile |
| `app/(teacher)/layout.tsx` | Dark bg |
| `app/(teacher)/dashboard/page.tsx` | Dark header + WaveBackground |
| `components/student/BottomNav.tsx` | Lucide icons |
| `components/student/XPBar.tsx` | Dark |
| `components/student/WeeklyProgress.tsx` | Dark, gold dots |
| `components/student/TimeSkillSelector.tsx` | Dark + Lucide skill icons |
| `components/student/ExerciseCard.tsx` | Dark + Lucide |
| `components/student/MusicNotation.tsx` | CSS filter invert for dark bg |
| `components/student/RhythmNotation.tsx` | CSS filter invert for dark bg |
| `components/student/NoteAnswer.tsx` | Dark |
| `components/student/AchievementBadge.tsx` | Dark, no emojis |
| `components/teacher/BottomNav.tsx` | Lucide icon |
| `components/teacher/StudentCard.tsx` | Dark |
| `components/teacher/TeacherStats.tsx` | Dark |

---

## Task 1: Foundation — Theme Tokens + Font

**Files:**
- Modify: `app/globals.css`
- Modify: `app/layout.tsx`

- [ ] **Step 1: Install lucide-react**

```bash
cd C:\Users\HP\Downloads\practice5
npm install lucide-react
```

Expected: package added to node_modules, no errors.

- [ ] **Step 2: Replace `app/globals.css`**

```css
@import "tailwindcss";

@theme {
  --color-brand-dark: #0f0f0f;
  --color-brand-gold: #c9a84c;
  --color-brand-gold-light: #e8c96d;
  --color-brand-surface: #1a1a1a;
  --color-brand-surface-2: #111111;
  --color-brand-border: #222222;
  --color-brand-muted: #666666;
  --font-sans: var(--font-rubik), sans-serif;
}

* {
  unicode-bidi: plaintext;
}

input, textarea {
  text-align: right;
  direction: rtl;
}

body {
  background: #0f0f0f;
  color: #ffffff;
  direction: rtl;
  text-align: right;
}
```

- [ ] **Step 3: Replace `app/layout.tsx`**

```tsx
import type { Metadata } from "next";
import { Rubik } from "next/font/google";
import "./globals.css";

const rubik = Rubik({ subsets: ["hebrew", "latin"], variable: "--font-rubik" });

export const metadata: Metadata = {
  title: "Practice5 — חכם, מהיר, מוזיקלי",
  description: "אפליקציית תרגול מוזיקה חכמה",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="he" dir="rtl">
      <body className={`${rubik.variable} font-sans bg-brand-dark text-white`}>
        {children}
      </body>
    </html>
  );
}
```

- [ ] **Step 4: Commit**

```bash
git add app/globals.css app/layout.tsx package.json package-lock.json
git commit -m "feat: switch to dark theme tokens + Rubik font"
```

---

## Task 2: WaveBackground Component

**Files:**
- Create: `components/shared/WaveBackground.tsx`

- [ ] **Step 1: Create `components/shared/WaveBackground.tsx`**

```tsx
// components/shared/WaveBackground.tsx
export default function WaveBackground() {
  const bars = [
    { h: 28, dur: 0.8,  delay: 0 },
    { h: 52, dur: 1.1,  delay: 0.1 },
    { h: 22, dur: 0.7,  delay: 0.2 },
    { h: 68, dur: 1.3,  delay: 0.05 },
    { h: 38, dur: 0.9,  delay: 0.3 },
    { h: 58, dur: 1.0,  delay: 0.15 },
    { h: 18, dur: 0.6,  delay: 0.25 },
    { h: 75, dur: 1.4,  delay: 0.4 },
    { h: 32, dur: 0.85, delay: 0.1 },
    { h: 48, dur: 1.2,  delay: 0.35 },
    { h: 25, dur: 0.75, delay: 0.2 },
    { h: 62, dur: 1.1,  delay: 0.05 },
    { h: 35, dur: 0.95, delay: 0.3 },
    { h: 55, dur: 1.05, delay: 0.45 },
    { h: 20, dur: 0.65, delay: 0.15 },
    { h: 45, dur: 1.15, delay: 0 },
    { h: 30, dur: 0.88, delay: 0.25 },
    { h: 60, dur: 1.25, delay: 0.1 },
    { h: 40, dur: 0.92, delay: 0.35 },
    { h: 24, dur: 0.72, delay: 0.2 },
  ];

  return (
    <>
      <style>{`
        @keyframes wave-bar {
          from { height: 4px; }
          to   { height: var(--bar-h); }
        }
      `}</style>
      <div
        aria-hidden="true"
        style={{
          position: "fixed",
          bottom: 56,
          left: 0,
          right: 0,
          display: "flex",
          alignItems: "flex-end",
          justifyContent: "center",
          gap: "3px",
          padding: "0 16px",
          opacity: 0.55,
          pointerEvents: "none",
          zIndex: 0,
        }}
      >
        {bars.map((bar, i) => (
          <div
            key={i}
            style={{
              width: 4,
              borderRadius: "3px 3px 0 0",
              background: i % 2 === 0
                ? "linear-gradient(to top, #c9a84c, transparent)"
                : "linear-gradient(to top, #e8c96d, transparent)",
              animation: `wave-bar ${bar.dur}s ease-in-out ${bar.delay}s infinite alternate`,
              ["--bar-h" as string]: `${bar.h}px`,
            }}
          />
        ))}
      </div>
    </>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add components/shared/WaveBackground.tsx
git commit -m "feat: add WaveBackground CSS animation component"
```

---

## Task 3: Auth Screens

**Files:**
- Modify: `app/(auth)/layout.tsx`
- Modify: `app/(auth)/login/page.tsx`
- Modify: `app/(auth)/register/page.tsx`

- [ ] **Step 1: Replace `app/(auth)/layout.tsx`**

```tsx
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-brand-dark px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-full bg-brand-surface border border-brand-gold mx-auto flex items-center justify-center mb-3">
            <span className="text-brand-gold text-xl font-bold">♩</span>
          </div>
          <h1 className="text-2xl font-bold text-white">Practice5</h1>
          <p className="text-brand-muted text-sm mt-1">תרגול מוזיקה חכם</p>
        </div>
        {children}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Replace `app/(auth)/login/page.tsx`**

```tsx
import Link from "next/link";
import { login } from "@/app/actions/auth";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  return (
    <div className="bg-brand-surface rounded-2xl p-6 border border-brand-border">
      <h2 className="text-xl font-bold text-center text-white mb-6">כניסה</h2>
      {error && (
        <div className="bg-red-900/30 border border-red-700 text-red-400 text-sm rounded-lg px-3 py-2 mb-4">
          {error}
        </div>
      )}
      <form className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-brand-muted mb-1">
            אימייל
          </label>
          <input
            name="email"
            type="email"
            required
            dir="rtl"
            className="w-full bg-brand-surface-2 border border-brand-border rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-brand-gold placeholder:text-brand-muted"
            placeholder="you@example.com"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-brand-muted mb-1">
            סיסמה
          </label>
          <input
            name="password"
            type="password"
            required
            dir="rtl"
            className="w-full bg-brand-surface-2 border border-brand-border rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-brand-gold placeholder:text-brand-muted"
            placeholder="••••••••"
          />
        </div>
        <button
          formAction={login}
          className="w-full bg-brand-gold text-black rounded-lg py-2.5 font-bold text-sm transition-opacity hover:opacity-90"
        >
          כניסה
        </button>
      </form>
      <p className="text-center text-sm text-brand-muted mt-4">
        אין לך חשבון?{" "}
        <Link href="/register" className="text-brand-gold font-semibold">
          הרשמה
        </Link>
      </p>
    </div>
  );
}
```

- [ ] **Step 3: Replace `app/(auth)/register/page.tsx`**

```tsx
import Link from "next/link";
import { signup } from "@/app/actions/auth";

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  return (
    <div className="bg-brand-surface rounded-2xl p-6 border border-brand-border">
      <h2 className="text-xl font-bold text-center text-white mb-6">הרשמה</h2>
      {error && (
        <div className="bg-red-900/30 border border-red-700 text-red-400 text-sm rounded-lg px-3 py-2 mb-4">
          {error}
        </div>
      )}
      <form className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-brand-muted mb-1">שם מלא</label>
          <input
            name="name"
            type="text"
            required
            dir="rtl"
            className="w-full bg-brand-surface-2 border border-brand-border rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-brand-gold placeholder:text-brand-muted"
            placeholder="שם שלך"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-brand-muted mb-1">אימייל</label>
          <input
            name="email"
            type="email"
            required
            dir="rtl"
            className="w-full bg-brand-surface-2 border border-brand-border rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-brand-gold placeholder:text-brand-muted"
            placeholder="you@example.com"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-brand-muted mb-1">סיסמה</label>
          <input
            name="password"
            type="password"
            required
            minLength={6}
            dir="rtl"
            className="w-full bg-brand-surface-2 border border-brand-border rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-brand-gold placeholder:text-brand-muted"
            placeholder="••••••••"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-brand-muted mb-1">אני</label>
          <div className="grid grid-cols-2 gap-2">
            <label className="flex items-center gap-2 border border-brand-border bg-brand-surface-2 rounded-lg p-3 cursor-pointer has-[:checked]:border-brand-gold has-[:checked]:bg-brand-surface">
              <input type="radio" name="role" value="student" defaultChecked className="accent-brand-gold" />
              <span className="text-sm font-medium text-white">תלמיד</span>
            </label>
            <label className="flex items-center gap-2 border border-brand-border bg-brand-surface-2 rounded-lg p-3 cursor-pointer has-[:checked]:border-brand-gold has-[:checked]:bg-brand-surface">
              <input type="radio" name="role" value="teacher" className="accent-brand-gold" />
              <span className="text-sm font-medium text-white">מורה</span>
            </label>
          </div>
        </div>
        <button
          formAction={signup}
          className="w-full bg-brand-gold text-black rounded-lg py-2.5 font-bold text-sm transition-opacity hover:opacity-90"
        >
          הרשמה
        </button>
      </form>
      <p className="text-center text-sm text-brand-muted mt-4">
        כבר רשום?{" "}
        <Link href="/login" className="text-brand-gold font-semibold">
          כניסה
        </Link>
      </p>
    </div>
  );
}
```

- [ ] **Step 4: Commit**

```bash
git add app/(auth)/
git commit -m "feat: dark auth screens — login, register, layout"
```

---

## Task 4: Student BottomNav + Layout

**Files:**
- Modify: `components/student/BottomNav.tsx`
- Modify: `app/(student)/layout.tsx`

- [ ] **Step 1: Replace `components/student/BottomNav.tsx`**

```tsx
"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, User } from "lucide-react";

const TABS = [
  { href: "/practice", label: "תרגול", Icon: Home },
  { href: "/profile", label: "פרופיל", Icon: User },
];

export default function BottomNav() {
  const pathname = usePathname();
  return (
    <nav className="fixed bottom-0 right-0 left-0 bg-brand-surface border-t border-brand-border">
      <div className="flex">
        {TABS.map(({ href, label, Icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={`flex-1 flex flex-col items-center py-3 gap-1 transition-colors ${
                active ? "text-brand-gold" : "text-brand-muted"
              }`}
            >
              <Icon size={20} strokeWidth={1.5} />
              <span className="text-xs font-medium">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
```

- [ ] **Step 2: Replace `app/(student)/layout.tsx`**

```tsx
import BottomNav from "@/components/student/BottomNav";

export default function StudentLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-brand-dark">
      <div className="pb-20">{children}</div>
      <BottomNav />
    </div>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add components/student/BottomNav.tsx app/(student)/layout.tsx
git commit -m "feat: dark student nav + layout with Lucide icons"
```

---

## Task 5: Student Home Components

**Files:**
- Modify: `components/student/XPBar.tsx`
- Modify: `components/student/WeeklyProgress.tsx`
- Modify: `components/student/TimeSkillSelector.tsx`

- [ ] **Step 1: Replace `components/student/XPBar.tsx`**

```tsx
import { xpProgressPercent, xpForLevel } from "@/lib/gamification/xp";

export default function XPBar({ xp, level }: { xp: number; level: number }) {
  const percent = xpProgressPercent(xp, level);
  return (
    <div className="px-1">
      <div className="flex justify-between text-xs mb-1">
        <span className="text-brand-gold font-semibold tracking-wide">רמה {level}</span>
        <span className="text-brand-muted">{xp} / {xpForLevel(level)} XP</span>
      </div>
      <div className="h-1.5 bg-brand-surface rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{
            width: `${percent}%`,
            background: "linear-gradient(90deg, #c9a84c, #e8c96d)",
          }}
        />
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Replace `components/student/WeeklyProgress.tsx`**

```tsx
const DAYS = ["א", "ב", "ג", "ד", "ה", "ו", "ש"];

export default function WeeklyProgress({ practicedDays }: { practicedDays: number[] }) {
  const today = new Date().getDay();
  return (
    <div className="flex justify-between items-center px-2">
      {DAYS.map((day, i) => {
        const practiced = practicedDays.includes(i);
        const isToday = i === today;
        return (
          <div key={i} className="flex flex-col items-center gap-1">
            <div
              className={`w-9 h-9 rounded-full flex items-center justify-center transition-all text-xs font-semibold ${
                practiced
                  ? "bg-brand-gold text-black shadow-sm"
                  : isToday
                  ? "border border-brand-gold text-brand-gold"
                  : "bg-brand-surface text-brand-muted border border-brand-border"
              }`}
            >
              {practiced ? "✓" : day}
            </div>
          </div>
        );
      })}
    </div>
  );
}
```

- [ ] **Step 3: Replace `components/student/TimeSkillSelector.tsx`**

```tsx
"use client";
import { useState } from "react";
import { Music, Activity, Layers } from "lucide-react";
import { startPracticeSession } from "@/app/actions/practice";

const DURATIONS = [5, 10, 15, 20] as const;
const SKILLS = [
  { value: "notes",  label: "קריאת תווים", Icon: Music },
  { value: "rhythm", label: "מקצבים",      Icon: Activity },
  { value: "scales", label: "סולמות",       Icon: Layers },
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
        <p className="text-xs font-semibold text-brand-muted tracking-widest mb-3">כמה זמן יש לך?</p>
        <div className="grid grid-cols-2 gap-3">
          {DURATIONS.map((d) => (
            <button
              key={d}
              onClick={() => setDuration(d)}
              className={`py-4 rounded-xl text-lg font-bold border transition-all ${
                duration === d
                  ? "bg-brand-gold text-black border-brand-gold shadow-lg scale-105"
                  : "bg-brand-surface-2 text-brand-muted border-brand-border"
              }`}
            >
              {d}
              <span className="text-sm font-normal mr-1">דק'</span>
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className="text-xs font-semibold text-brand-muted tracking-widest mb-3">מה לתרגל?</p>
        <div className="flex flex-col gap-2">
          {SKILLS.map(({ value, label, Icon }) => (
            <button
              key={value}
              onClick={() => setSkill(value)}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl border transition-all ${
                skill === value
                  ? "bg-brand-surface border-brand-gold text-white"
                  : "bg-brand-surface-2 border-brand-border text-brand-muted"
              }`}
            >
              <Icon
                size={20}
                strokeWidth={1.5}
                className={skill === value ? "text-brand-gold" : "text-brand-muted"}
              />
              <span className="font-semibold">{label}</span>
              {skill === value && (
                <span className="mr-auto w-1.5 h-1.5 rounded-full bg-brand-gold" />
              )}
            </button>
          ))}
        </div>
      </div>

      <button
        onClick={handleSubmit}
        disabled={loading}
        className="w-full bg-brand-gold text-black rounded-xl py-4 font-bold text-lg shadow-lg disabled:opacity-60 transition-all active:scale-95"
      >
        {loading ? "מייצר תרגול..." : "התחל תרגול"}
      </button>
    </div>
  );
}
```

- [ ] **Step 4: Commit**

```bash
git add components/student/XPBar.tsx components/student/WeeklyProgress.tsx components/student/TimeSkillSelector.tsx
git commit -m "feat: dark student home components — XP bar, weekly progress, skill selector"
```

---

## Task 6: Student Home Page

**Files:**
- Modify: `app/(student)/practice/page.tsx`

- [ ] **Step 1: Replace `app/(student)/practice/page.tsx`**

```tsx
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import TimeSkillSelector from "@/components/student/TimeSkillSelector";
import XPBar from "@/components/student/XPBar";
import WeeklyProgress from "@/components/student/WeeklyProgress";
import WaveBackground from "@/components/shared/WaveBackground";

export default async function PracticePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("name, level, xp")
    .eq("id", user.id)
    .single() as { data: { name: string; level: number; xp: number } | null };

  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 6);
  const { data: sessions } = await supabase
    .from("practice_sessions")
    .select("completed_at")
    .eq("student_id", user.id)
    .not("completed_at", "is", null)
    .gte("completed_at", weekAgo.toISOString());

  const practicedDays: number[] = [
    ...new Set(
      (sessions as Array<{ completed_at: string }> | null)?.map((s) =>
        new Date(s.completed_at).getDay()
      ) ?? []
    ),
  ];

  return (
    <main className="max-w-sm mx-auto relative">
      <WaveBackground />

      {/* Header */}
      <div className="relative z-10 px-5 pt-10 pb-5 border-b border-brand-border">
        <p className="text-xs text-brand-muted tracking-widest mb-1">PRACTICE5</p>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-brand-muted">שלום,</p>
            <h1 className="text-2xl font-bold text-white">{profile?.name ?? "תלמיד"}</h1>
          </div>
          <div className="w-10 h-10 rounded-full bg-brand-gold flex items-center justify-center text-black font-bold text-lg">
            {(profile?.name ?? "?")[0]}
          </div>
        </div>
        <div className="mt-3">
          <XPBar xp={profile?.xp ?? 0} level={profile?.level ?? 1} />
        </div>
      </div>

      {/* Weekly */}
      <div className="relative z-10 bg-brand-surface mx-4 mt-4 rounded-2xl p-4 border border-brand-border">
        <p className="text-xs font-semibold text-brand-muted tracking-widest mb-3">השבוע</p>
        <WeeklyProgress practicedDays={practicedDays} />
      </div>

      {/* Selector */}
      <div className="relative z-10 bg-brand-surface mx-4 mt-4 rounded-2xl border border-brand-border">
        <div className="px-5 pt-4 pb-1">
          <h2 className="font-bold text-white">התרגול היומי שלך</h2>
          <p className="text-sm text-brand-muted">בחר זמן ותחום</p>
        </div>
        <TimeSkillSelector />
      </div>
    </main>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add app/(student)/practice/page.tsx components/shared/
git commit -m "feat: dark student home page with wave background"
```

---

## Task 7: Exercise Components

**Files:**
- Modify: `components/student/MusicNotation.tsx`
- Modify: `components/student/RhythmNotation.tsx`
- Modify: `components/student/NoteAnswer.tsx`
- Modify: `components/student/ExerciseCard.tsx`

- [ ] **Step 1: Replace `components/student/MusicNotation.tsx`**

```tsx
"use client";
import { useEffect, useRef } from "react";

interface MusicNotationProps {
  notes: string[];
  label?: string;
}

function toAbcNote(note: string): string {
  const nameMap: Record<string, string> = {
    C: "C", D: "D", E: "E", F: "F",
    G: "G", A: "A", B: "B",
  };
  const name = note.slice(0, -1);
  const octave = parseInt(note.slice(-1));
  let abc = nameMap[name] ?? "C";
  if (octave >= 5) abc = abc.toLowerCase();
  else if (octave <= 3) abc = abc + ",";
  return abc;
}

export default function MusicNotation({ notes, label = "קרא את התווים" }: MusicNotationProps) {
  const divRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!divRef.current || notes.length === 0) return;
    const abcNotes = notes.map(toAbcNote).join(" ");
    const abcString = `X:1\nT:\nM:4/4\nL:1/4\nK:C treble\n|${abcNotes}|`;
    // @ts-ignore
    import("abcjs").then((abcjs) => {
      abcjs.renderAbc(divRef.current!, abcString, {
        responsive: "resize",
        add_classes: true,
        staffwidth: 280,
        scale: 1.5,
        paddingtop: 10,
        paddingbottom: 10,
        paddingleft: 10,
        paddingright: 10,
      });
    });
  }, [notes]);

  return (
    <div className="bg-brand-surface rounded-2xl p-3 border border-brand-border">
      <p className="text-xs text-brand-muted mb-1 text-center">{label}</p>
      <div
        ref={divRef}
        className="w-full"
        style={{ filter: "invert(1) brightness(1.8)" }}
      />
    </div>
  );
}
```

- [ ] **Step 2: Read `components/student/RhythmNotation.tsx` then replace its content**

The file renders abcjs just like MusicNotation. Read it first, then replace — keeping all existing logic but adding the dark wrapper and filter:

```tsx
"use client";
import { useEffect, useRef } from "react";

interface RhythmNotationProps {
  pattern: string;
}

export default function RhythmNotation({ pattern }: RhythmNotationProps) {
  const divRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!divRef.current || !pattern) return;
    const abcString = `X:1\nT:\nM:4/4\nL:1/4\nK:C\n|${pattern}|`;
    // @ts-ignore
    import("abcjs").then((abcjs) => {
      abcjs.renderAbc(divRef.current!, abcString, {
        responsive: "resize",
        add_classes: true,
        staffwidth: 280,
        scale: 1.5,
        paddingtop: 10,
        paddingbottom: 10,
        paddingleft: 10,
        paddingright: 10,
      });
    });
  }, [pattern]);

  return (
    <div className="bg-brand-surface rounded-2xl p-3 border border-brand-border">
      <p className="text-xs text-brand-muted mb-1 text-center">נגן את המקצב</p>
      <div
        ref={divRef}
        className="w-full"
        style={{ filter: "invert(1) brightness(1.8)" }}
      />
    </div>
  );
}
```

- [ ] **Step 3: Replace `components/student/NoteAnswer.tsx`**

```tsx
"use client";
import { useState } from "react";
import { Eye, CheckCircle, XCircle } from "lucide-react";

const NOTE_NAMES_HE: Record<string, string> = {
  C: "דו", D: "רה", E: "מי", F: "פה",
  G: "סול", A: "לה", B: "סי",
};

function getNoteHebrew(note: string): string {
  const name = note.slice(0, -1);
  return NOTE_NAMES_HE[name] ?? name;
}

export default function NoteAnswer({ notes }: { notes: string[] }) {
  const [revealed, setRevealed] = useState(false);
  const [result, setResult] = useState<"correct" | "wrong" | null>(null);

  return (
    <div className="mt-3">
      {!revealed ? (
        <button
          onClick={() => setRevealed(true)}
          className="w-full flex items-center justify-center gap-2 border border-brand-border bg-brand-surface-2 text-brand-muted rounded-xl py-3 font-semibold text-sm transition-all hover:border-brand-gold hover:text-brand-gold active:scale-95"
        >
          <Eye size={16} strokeWidth={1.5} />
          גלה תשובה
        </button>
      ) : (
        <div className="space-y-3">
          <div className="bg-brand-surface rounded-xl p-4 border border-brand-border">
            <p className="text-xs text-brand-muted mb-2 text-center">התווים הם:</p>
            <div className="flex justify-center gap-4 flex-wrap">
              {notes.map((note, i) => (
                <div key={i} className="flex flex-col items-center">
                  <span className="text-xl font-bold text-brand-gold">
                    {getNoteHebrew(note)}
                  </span>
                  <span className="text-xs text-brand-muted">{note.slice(0, -1)}</span>
                </div>
              ))}
            </div>
          </div>

          {result === null ? (
            <div>
              <p className="text-xs text-center text-brand-muted mb-2">קראת נכון?</p>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setResult("correct")}
                  className="flex items-center justify-center gap-2 bg-brand-surface border border-green-800 text-green-400 rounded-xl py-3 font-semibold text-sm"
                >
                  <CheckCircle size={16} strokeWidth={1.5} />
                  צדקתי
                </button>
                <button
                  onClick={() => setResult("wrong")}
                  className="flex items-center justify-center gap-2 bg-brand-surface border border-red-900 text-red-400 rounded-xl py-3 font-semibold text-sm"
                >
                  <XCircle size={16} strokeWidth={1.5} />
                  טעיתי
                </button>
              </div>
            </div>
          ) : (
            <div className={`rounded-xl p-3 text-center border ${
              result === "correct"
                ? "bg-green-950 border-green-800 text-green-400"
                : "bg-orange-950 border-orange-800 text-orange-400"
            }`}>
              {result === "correct" ? (
                <p className="font-semibold">מצוין! כל הכבוד</p>
              ) : (
                <p className="font-semibold">לא נורא — תרגול עושה מושלם</p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 4: Replace `components/student/ExerciseCard.tsx`**

```tsx
"use client";
import type { Exercise } from "@/lib/ai/generate-exercise";
import dynamic from "next/dynamic";
import NoteAnswer from "./NoteAnswer";
import { Music, Activity, Layers, Lightbulb } from "lucide-react";
const MusicNotation = dynamic(() => import("./MusicNotation"), { ssr: false });
const RhythmNotation = dynamic(() => import("./RhythmNotation"), { ssr: false });

const SKILL_ICON: Record<string, React.ReactNode> = {
  notes:  <Music size={22} strokeWidth={1.5} className="text-brand-gold" />,
  rhythm: <Activity size={22} strokeWidth={1.5} className="text-brand-gold" />,
  scales: <Layers size={22} strokeWidth={1.5} className="text-brand-gold" />,
};

export default function ExerciseCard({ exercise }: { exercise: Exercise }) {
  return (
    <div className="bg-brand-surface rounded-2xl p-5 border border-brand-border">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-full bg-brand-surface-2 border border-brand-border flex items-center justify-center flex-shrink-0">
          {SKILL_ICON[exercise.skill_type]}
        </div>
        <div>
          <h2 className="font-bold text-lg text-white">{exercise.title}</h2>
          <p className="text-sm text-brand-muted">{exercise.description}</p>
        </div>
      </div>

      {exercise.skill_type === "notes" && exercise.notes_to_show && exercise.notes_to_show.length > 0 && (
        <div className="mb-4">
          <MusicNotation notes={exercise.notes_to_show} />
          <NoteAnswer notes={exercise.notes_to_show} />
        </div>
      )}

      {exercise.skill_type === "rhythm" && exercise.rhythm_pattern && (
        <div className="mb-4">
          <RhythmNotation pattern={exercise.rhythm_pattern} />
        </div>
      )}

      {exercise.skill_type === "scales" && exercise.scale_notes && exercise.scale_notes.length > 0 && (
        <div className="mb-4">
          <MusicNotation notes={exercise.scale_notes} label="נגן את הסולם" />
        </div>
      )}

      {/* Steps */}
      <div className="bg-brand-surface-2 rounded-xl p-4 mb-4 border border-brand-border">
        <p className="text-xs font-semibold text-brand-muted tracking-widest mb-3">שלבים</p>
        <ol className="space-y-2">
          {exercise.steps.map((step, i) => (
            <li key={i} className="flex gap-3 text-sm text-white">
              <span className="flex-shrink-0 w-5 h-5 bg-brand-gold text-black rounded-full flex items-center justify-center text-xs font-bold">
                {i + 1}
              </span>
              <span>{step.replace(/^שלב \d+:\s*/, "")}</span>
            </li>
          ))}
        </ol>
      </div>

      {/* Tip */}
      <div className="bg-brand-surface-2 rounded-xl px-4 py-3 flex gap-3 border border-brand-border">
        <Lightbulb size={16} strokeWidth={1.5} className="text-brand-gold flex-shrink-0 mt-0.5" />
        <p className="text-sm text-brand-muted">{exercise.tip}</p>
      </div>
    </div>
  );
}
```

- [ ] **Step 5: Commit**

```bash
git add components/student/MusicNotation.tsx components/student/RhythmNotation.tsx components/student/NoteAnswer.tsx components/student/ExerciseCard.tsx
git commit -m "feat: dark exercise components — notation filter, NoteAnswer, ExerciseCard"
```

---

## Task 8: Exercise Page + Complete Page

**Files:**
- Modify: `app/(student)/practice/exercise/page.tsx`
- Modify: `app/(student)/practice/complete/page.tsx`

- [ ] **Step 1: Replace `app/(student)/practice/exercise/page.tsx`**

```tsx
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
    <main className="max-w-sm mx-auto px-4 pt-6 pb-24">
      <div className="flex items-center gap-3 mb-5">
        <Link href="/practice" className="text-brand-muted hover:text-white transition-colors">
          <ChevronRight size={22} strokeWidth={1.5} />
        </Link>
        <div>
          <h1 className="font-bold text-white">התרגול שלך</h1>
          <p className="text-sm text-brand-muted">{session.duration_minutes} דקות</p>
        </div>
      </div>

      <ExerciseCard exercise={exercise} />

      <form className="mt-6">
        <button
          formAction={handleComplete}
          className="w-full bg-brand-gold text-black rounded-2xl py-4 font-bold text-lg shadow-lg transition-all active:scale-95"
        >
          סיימתי
        </button>
        <p className="text-center text-xs text-brand-muted mt-3">
          לחץ רק כשסיימת את התרגול
        </p>
      </form>
    </main>
  );
}
```

- [ ] **Step 2: Replace `app/(student)/practice/complete/page.tsx`**

```tsx
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
    <main className="min-h-screen bg-brand-dark flex flex-col items-center justify-center px-6 text-center">
      <div className="bg-brand-surface rounded-3xl p-8 border border-brand-border max-w-sm w-full">
        {/* Trophy */}
        <div className="w-16 h-16 rounded-full border border-brand-gold bg-brand-surface-2 flex items-center justify-center mx-auto mb-4">
          <span className="text-brand-gold text-2xl font-bold">★</span>
        </div>

        {didLevelUp ? (
          <>
            <h1 className="text-2xl font-bold text-white mb-1">עלית לרמה {leveledUpTo}!</h1>
            <p className="text-brand-muted mb-2">כל הכבוד — אתה מתקדם</p>
          </>
        ) : (
          <>
            <h1 className="text-2xl font-bold text-white mb-1">תרגול הושלם</h1>
            <p className="text-brand-muted mb-2">עשית עבודה מצוינת</p>
          </>
        )}

        {/* XP Badge */}
        <div className="bg-brand-surface-2 rounded-2xl py-4 px-6 my-6 border border-brand-gold">
          <p className="text-3xl font-bold text-brand-gold">+{xpEarned} XP</p>
          <p className="text-sm text-brand-muted mt-1">ניקוד שהרווחת</p>
        </div>

        <Link
          href="/practice"
          className="block w-full bg-brand-gold text-black rounded-2xl py-3 font-bold text-lg"
        >
          לתרגול הבא
        </Link>
      </div>
    </main>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add app/(student)/practice/exercise/page.tsx app/(student)/practice/complete/page.tsx
git commit -m "feat: dark exercise + complete pages"
```

---

## Task 9: Profile Page + AchievementBadge

**Files:**
- Modify: `components/student/AchievementBadge.tsx`
- Modify: `app/(student)/profile/page.tsx`

- [ ] **Step 1: Replace `components/student/AchievementBadge.tsx`**

The `ACHIEVEMENT_META` in `lib/gamification/achievements.ts` still has `emoji` fields — we keep the data unchanged and just don't render the emoji in the badge. Instead we render the first letter of the label.

```tsx
import { ACHIEVEMENT_META, type AchievementType } from "@/lib/gamification/achievements";

export default function AchievementBadge({ type, locked = false }: { type: AchievementType; locked?: boolean }) {
  const meta = ACHIEVEMENT_META[type];
  return (
    <div className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border transition-all ${
      locked
        ? "border-brand-border bg-brand-surface-2 opacity-40"
        : "border-brand-gold bg-brand-surface"
    }`}>
      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
        locked ? "bg-brand-surface text-brand-muted" : "bg-brand-gold text-black"
      }`}>
        {locked ? "?" : meta.label[0]}
      </div>
      <span className="text-xs font-semibold text-center text-white leading-tight">{meta.label}</span>
    </div>
  );
}
```

- [ ] **Step 2: Replace `app/(student)/profile/page.tsx`**

```tsx
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import XPBar from "@/components/student/XPBar";
import AchievementBadge from "@/components/student/AchievementBadge";
import { ACHIEVEMENT_META, type AchievementType } from "@/lib/gamification/achievements";
import { logout } from "@/app/actions/auth";
import { LogOut } from "lucide-react";

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
    .eq("student_id", user.id) as { data: Array<{ achievement_type: string }> | null };

  const { count: sessionCount } = await supabase
    .from("practice_sessions")
    .select("*", { count: "exact", head: true })
    .eq("student_id", user.id)
    .not("completed_at", "is", null);

  const earnedTypes = new Set(achievements?.map((a) => a.achievement_type) ?? []);

  return (
    <main className="max-w-sm mx-auto pb-24">
      {/* Header */}
      <div className="bg-brand-surface px-5 pt-10 pb-6 border-b border-brand-border">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-16 h-16 bg-brand-gold rounded-full flex items-center justify-center text-3xl font-bold text-black">
            {(profile?.name ?? "?")[0]}
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">{profile?.name ?? "תלמיד"}</h1>
            <p className="text-sm text-brand-muted">רמה {profile?.level ?? 1}</p>
          </div>
        </div>
        <XPBar xp={profile?.xp ?? 0} level={profile?.level ?? 1} />
      </div>

      {/* Stats */}
      <div className="mx-4 mt-4 grid grid-cols-2 gap-3">
        <div className="bg-brand-surface rounded-2xl p-4 text-center border border-brand-border">
          <p className="text-2xl font-bold text-brand-gold">{sessionCount ?? 0}</p>
          <p className="text-sm text-brand-muted">תרגולים</p>
        </div>
        <div className="bg-brand-surface rounded-2xl p-4 text-center border border-brand-border">
          <p className="text-2xl font-bold text-brand-gold">{earnedTypes.size}</p>
          <p className="text-sm text-brand-muted">הישגים</p>
        </div>
      </div>

      {/* Achievements */}
      <div className="mx-4 mt-4 bg-brand-surface rounded-2xl p-4 border border-brand-border">
        <h2 className="font-bold text-white mb-3">ארון גביעים</h2>
        <div className="grid grid-cols-3 gap-2">
          {ALL_ACHIEVEMENTS.map((type) => (
            <AchievementBadge key={type} type={type} locked={!earnedTypes.has(type)} />
          ))}
        </div>
      </div>

      {/* Logout */}
      <div className="mx-4 mt-4">
        <form>
          <button
            formAction={logout}
            className="w-full flex items-center justify-center gap-2 border border-brand-border bg-brand-surface rounded-2xl py-3 text-brand-muted text-sm font-medium hover:border-brand-gold hover:text-white transition-all"
          >
            <LogOut size={16} strokeWidth={1.5} />
            יציאה
          </button>
        </form>
      </div>
    </main>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add components/student/AchievementBadge.tsx app/(student)/profile/page.tsx
git commit -m "feat: dark profile page and achievement badges"
```

---

## Task 10: Teacher Components + Dashboard

**Files:**
- Modify: `components/teacher/BottomNav.tsx`
- Modify: `components/teacher/StudentCard.tsx`
- Modify: `components/teacher/TeacherStats.tsx`
- Modify: `app/(teacher)/layout.tsx`
- Modify: `app/(teacher)/dashboard/page.tsx`

- [ ] **Step 1: Replace `components/teacher/BottomNav.tsx`**

```tsx
"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Users } from "lucide-react";

const TABS = [
  { href: "/dashboard", label: "תלמידים", Icon: Users },
];

export default function TeacherBottomNav() {
  const pathname = usePathname();
  return (
    <nav className="fixed bottom-0 right-0 left-0 bg-brand-surface border-t border-brand-border">
      <div className="flex">
        {TABS.map(({ href, label, Icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={`flex-1 flex flex-col items-center py-3 gap-1 transition-colors ${
                active ? "text-brand-gold" : "text-brand-muted"
              }`}
            >
              <Icon size={20} strokeWidth={1.5} />
              <span className="text-xs font-medium">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
```

- [ ] **Step 2: Replace `components/teacher/TeacherStats.tsx`**

```tsx
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
      <div className="bg-brand-surface rounded-2xl p-3 text-center border border-brand-border">
        <p className="text-2xl font-bold text-white">{totalStudents}</p>
        <p className="text-xs text-brand-muted">תלמידים</p>
      </div>
      <div className="bg-brand-surface rounded-2xl p-3 text-center border border-brand-border">
        <p className="text-2xl font-bold text-brand-gold">{practicedToday}</p>
        <p className="text-xs text-brand-muted">תרגלו היום</p>
      </div>
      <div className="bg-brand-surface rounded-2xl p-3 text-center border border-brand-border">
        <p className="text-2xl font-bold text-brand-gold">{practicedThisWeek}</p>
        <p className="text-xs text-brand-muted">השבוע</p>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Replace `components/teacher/StudentCard.tsx`**

```tsx
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
    <div className="bg-brand-surface rounded-2xl p-4 border border-brand-border">
      <div className="flex items-center gap-3">
        {/* Avatar */}
        <div className={`w-11 h-11 rounded-full flex items-center justify-center text-lg font-bold flex-shrink-0 ${
          practicedToday ? "bg-brand-gold text-black" : "bg-brand-surface-2 text-brand-muted border border-brand-border"
        }`}>
          {initial}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-white">{name}</span>
            <span className="text-xs bg-brand-surface-2 text-brand-muted border border-brand-border px-2 py-0.5 rounded-full">
              רמה {level}
            </span>
            {practicedToday && (
              <span className="text-xs bg-brand-surface border border-brand-gold text-brand-gold px-2 py-0.5 rounded-full">
                תרגל היום
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

        {/* Session count */}
        <div className="text-center flex-shrink-0">
          <p className="text-lg font-bold text-brand-gold">{sessionCount}</p>
          <p className="text-xs text-brand-muted">תרגולים</p>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Replace `app/(teacher)/layout.tsx`**

```tsx
import TeacherBottomNav from "@/components/teacher/BottomNav";

export default function TeacherLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-brand-dark">
      <div className="pb-20">{children}</div>
      <TeacherBottomNav />
    </div>
  );
}
```

- [ ] **Step 5: Replace `app/(teacher)/dashboard/page.tsx`**

```tsx
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import StudentCard from "@/components/teacher/StudentCard";
import TeacherStats from "@/components/teacher/TeacherStats";
import { logout } from "@/app/actions/auth";
import WaveBackground from "@/components/shared/WaveBackground";
import { LogOut } from "lucide-react";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("name, role")
    .eq("id", user.id)
    .single() as { data: { name: string; role: string } | null };

  if (profile?.role !== "teacher") redirect("/practice");

  const { data: students } = await supabase
    .from("profiles")
    .select("id, name, level, xp")
    .eq("role", "student")
    .order("name") as { data: { id: string; name: string; level: number; xp: number }[] | null };

  const studentList = students ?? [];

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 6);
  weekAgo.setHours(0, 0, 0, 0);

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

  const { data: allSessions } = await supabase
    .from("practice_sessions")
    .select("student_id")
    .not("completed_at", "is", null) as { data: { student_id: string }[] | null };

  const sessionCountMap = new Map<string, number>();
  for (const s of allSessions ?? []) {
    sessionCountMap.set(s.student_id, (sessionCountMap.get(s.student_id) ?? 0) + 1);
  }

  const practicedTodayIds = new Set(
    sessions
      .filter((s) => new Date(s.completed_at) >= today)
      .map((s) => s.student_id)
  );

  const practicedThisWeekIds = new Set(sessions.map((s) => s.student_id));

  return (
    <main className="max-w-lg mx-auto relative">
      <WaveBackground />

      {/* Header */}
      <div className="relative z-10 px-5 pt-10 pb-5 border-b border-brand-border">
        <p className="text-xs text-brand-muted tracking-widest mb-1">PRACTICE5</p>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-brand-muted">שלום,</p>
            <h1 className="text-2xl font-bold text-white">{profile?.name ?? "מורה"}</h1>
          </div>
          <form>
            <button
              formAction={logout}
              className="flex items-center gap-1.5 text-xs text-brand-muted border border-brand-border rounded-lg px-3 py-1.5 hover:border-brand-gold hover:text-white transition-all"
            >
              <LogOut size={13} strokeWidth={1.5} />
              יציאה
            </button>
          </form>
        </div>
      </div>

      {/* Stats */}
      <div className="relative z-10 mt-4">
        <TeacherStats
          totalStudents={studentList.length}
          practicedToday={practicedTodayIds.size}
          practicedThisWeek={practicedThisWeekIds.size}
        />
      </div>

      {/* Student list */}
      <div className="relative z-10 px-4">
        <h2 className="font-bold text-white mb-3 text-xs tracking-widest text-brand-muted">כל התלמידים</h2>

        {studentList.length === 0 ? (
          <div className="bg-brand-surface rounded-2xl p-8 text-center border border-brand-border">
            <p className="text-brand-muted">אין תלמידים רשומים עדיין</p>
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

- [ ] **Step 6: Commit**

```bash
git add components/teacher/ app/(teacher)/
git commit -m "feat: dark teacher dashboard — nav, stats, student cards, wave bg"
```

---

## Task 11: Build + Deploy

- [ ] **Step 1: Run build**

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

- [ ] **Step 3: Smoke test**

1. פתח `/login` — טופס כהה, כפתור זהב
2. כנס כתלמיד → `/practice` — header כהה, גלי אקולייזר, כרטיסי סקיל עם איקוני Lucide
3. התחל תרגול → `/practice/exercise` — אזור תווים עם filter, כפתור "גלה תשובה" חדש
4. סיים → `/practice/complete` — trophy כעיגול, XP badge בזהב
5. כנס כמורה → `/dashboard` — header כהה, stats, רשימת תלמידים ללא אימוג'ים

---

## Self-Review

**Spec coverage:**
- ✅ Rubik font — Task 1
- ✅ Dark color tokens (brand-dark, brand-gold, brand-surface, brand-border, brand-muted) — Task 1
- ✅ No emojis anywhere — Tasks 3–10
- ✅ Lucide icons — Tasks 4, 5, 7, 8, 9, 10
- ✅ WaveBackground (medium opacity 0.55, 20 bars, gold gradient) — Task 2
- ✅ WaveBackground on home + dashboard — Tasks 6, 10
- ✅ Music notation filter: `invert(1) brightness(1.8)` — Task 7
- ✅ All auth screens — Task 3
- ✅ All student screens — Tasks 4–9
- ✅ All teacher screens — Task 10

**Placeholder scan:** None found. All code blocks are complete.

**Type consistency:**
- `WaveBackground` — no props, used identically in Tasks 6 and 10 ✅
- `StudentCard` props unchanged (name, level, xp, sessionCount, lastSession) ✅
- `TeacherStats` props unchanged (totalStudents, practicedToday, practicedThisWeek) ✅
- `MusicNotation` props unchanged (notes, label?) ✅
- `RhythmNotation` props unchanged (pattern) ✅
- `NoteAnswer` props unchanged (notes) ✅
- `AchievementBadge` props unchanged (type, locked?) ✅
