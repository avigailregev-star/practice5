# Rhythm Assessment — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build an adaptive, game-like rhythm quiz where a green ball moves left→right across beat symbols while clicks sound, and the student taps a drum button in sync.

**Architecture:** Client-only React quiz. `lib/rhythms.ts` holds all pattern data and BPM config. `RhythmDisplay.tsx` runs the animation loop (`requestAnimationFrame`) and sound (`AudioContext`). `RhythmAssessment.tsx` manages quiz state, adaptive difficulty, and saves to Supabase. Entry via server page at `/practice/rhythm`.

**Tech Stack:** Next.js 14 (App Router), TypeScript, Tailwind CSS, Web Audio API, Supabase

---

## File Summary

| File | Action |
|------|--------|
| `lib/rhythms.ts` | Create |
| `components/student/RhythmDisplay.tsx` | Create |
| `components/student/RhythmAssessment.tsx` | Create |
| `app/(student)/practice/rhythm/page.tsx` | Create |
| `app/(student)/practice/page.tsx` | Modify (add 🥁 button) |

---

### Task 1: Rhythm data and pattern library

**Files:**
- Create: `lib/rhythms.ts`

- [ ] **Step 1: Create `lib/rhythms.ts`**

```typescript
// lib/rhythms.ts

export type NoteType = "quarter" | "eighth" | "half" | "dotted-quarter" | "rest";
export type DifficultyLevel = 1 | 2 | 3;

export interface Beat {
  type: NoteType;
  symbol: string;     // ♩ ♪ 𝅗𝅥 ♩. 𝄽
  duration: number;   // in quarter-note units: quarter=1, eighth=0.5, half=2, dotted=1.5, rest=1
  tappable: boolean;  // false for rests
}

export interface RhythmPattern {
  id: string;
  level: DifficultyLevel;
  beats: Beat[];
  totalDuration: number; // sum of beat durations in quarter-note units (always 4 for 4/4)
}

export const BPM: Record<DifficultyLevel, number> = {
  1: 60,
  2: 72,
  3: 80,
};

// Beat shorthand constants
const Q: Beat = { type: "quarter",        symbol: "♩",  duration: 1,   tappable: true  };
const E: Beat = { type: "eighth",         symbol: "♪",  duration: 0.5, tappable: true  };
const H: Beat = { type: "half",           symbol: "𝅗𝅥",  duration: 2,   tappable: true  };
const D: Beat = { type: "dotted-quarter", symbol: "♩.", duration: 1.5, tappable: true  };
const R: Beat = { type: "rest",           symbol: "𝄽",  duration: 1,   tappable: false };

export const ALL_PATTERNS: RhythmPattern[] = [
  // Level 1 — half + quarter notes (4 quarter-note units per pattern)
  { id: "l1a", level: 1, beats: [Q, Q, H],         totalDuration: 4 },
  { id: "l1b", level: 1, beats: [H, Q, Q],         totalDuration: 4 },
  { id: "l1c", level: 1, beats: [Q, H, Q],         totalDuration: 4 },
  { id: "l1d", level: 1, beats: [H, H],            totalDuration: 4 },

  // Level 2 — quarter + eighth pairs
  { id: "l2a", level: 2, beats: [E, E, Q, E, E, Q], totalDuration: 4 },
  { id: "l2b", level: 2, beats: [Q, E, E, E, E, Q], totalDuration: 4 },
  { id: "l2c", level: 2, beats: [E, E, E, E, Q, Q], totalDuration: 4 },
  { id: "l2d", level: 2, beats: [Q, Q, E, E, Q],    totalDuration: 4 },

  // Level 3 — + rests + dotted-quarter
  { id: "l3a", level: 3, beats: [E, E, R, D, E],    totalDuration: 4 },
  { id: "l3b", level: 3, beats: [D, E, R, Q],        totalDuration: 4 },
  { id: "l3c", level: 3, beats: [Q, R, E, E, Q],    totalDuration: 4 },
  { id: "l3d", level: 3, beats: [R, D, E, Q],        totalDuration: 4 },
];

/** Patterns available at a given level (cumulative — level 2 includes level 1) */
export function getPatternsForLevel(level: DifficultyLevel): RhythmPattern[] {
  return ALL_PATTERNS.filter((p) => p.level <= level);
}

/** Pick a random pattern, different from the previous one */
export function pickPattern(level: DifficultyLevel, previousId?: string): RhythmPattern {
  const pool = getPatternsForLevel(level).filter((p) => p.id !== previousId);
  const candidates = pool.length > 0 ? pool : getPatternsForLevel(level);
  return candidates[Math.floor(Math.random() * candidates.length)];
}

/** Given a pattern and BPM, return the expected tap time (ms from start) for each beat */
export function getBeatTimestamps(pattern: RhythmPattern, bpm: number): number[] {
  const msPerQuarter = 60000 / bpm;
  const timestamps: number[] = [];
  let cursor = 0;
  for (const beat of pattern.beats) {
    timestamps.push(cursor);
    cursor += beat.duration * msPerQuarter;
  }
  return timestamps;
}
```

- [ ] **Step 2: Commit**

```bash
git add lib/rhythms.ts
git commit -m "feat: add rhythm pattern data and difficulty logic"
```

---

### Task 2: RhythmDisplay — animated beat track

**Files:**
- Create: `components/student/RhythmDisplay.tsx`

This component:
- Renders note symbols (♪ ♩ 𝅗𝅥 ♩. 𝄽) spaced proportionally left→right on a track
- Animates a green ball from left to right via `requestAnimationFrame`
- Plays a click sound at each tappable beat via `AudioContext`
- Records student taps via `onPointerDown` on the drum button
- On completion, evaluates which beats were hit (±200ms window) and calls `onComplete`

- [ ] **Step 1: Create `components/student/RhythmDisplay.tsx`**

```typescript
"use client";

import { useEffect, useRef, useCallback } from "react";
import { RhythmPattern, DifficultyLevel, BPM, getBeatTimestamps } from "@/lib/rhythms";

interface Props {
  pattern: RhythmPattern;
  level: DifficultyLevel;
  onComplete: (hits: boolean[]) => void;
}

export default function RhythmDisplay({ pattern, level, onComplete }: Props) {
  const bpm = BPM[level];
  const msPerQuarter = 60000 / bpm;
  const totalMs = pattern.totalDuration * msPerQuarter;
  const beatTimestamps = getBeatTimestamps(pattern, bpm);

  const trackRef = useRef<HTMLDivElement>(null);
  const ballRef = useRef<HTMLDivElement>(null);
  const startTimeRef = useRef<number>(0);
  const rafRef = useRef<number>(0);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const soundedRef = useRef<Set<number>>(new Set());
  const tapTimesRef = useRef<number[]>([]);
  const doneRef = useRef(false);

  const playClick = useCallback(() => {
    try {
      if (!audioCtxRef.current) audioCtxRef.current = new AudioContext();
      const ctx = audioCtxRef.current;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.frequency.value = 900;
      osc.connect(gain);
      gain.connect(ctx.destination);
      gain.gain.setValueAtTime(0.25, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.06);
      osc.start();
      osc.stop(ctx.currentTime + 0.06);
    } catch {}
  }, []);

  const handleTap = useCallback(() => {
    if (!audioCtxRef.current) audioCtxRef.current = new AudioContext();
    if (doneRef.current) return;
    const elapsed = Date.now() - startTimeRef.current;
    if (elapsed >= 0) tapTimesRef.current.push(elapsed);
  }, []);

  useEffect(() => {
    doneRef.current = false;
    soundedRef.current = new Set();
    tapTimesRef.current = [];
    startTimeRef.current = Date.now();

    const animate = () => {
      const elapsed = Date.now() - startTimeRef.current;

      // Move ball
      if (ballRef.current && trackRef.current) {
        const progress = Math.min(elapsed / totalMs, 1);
        const trackWidth = trackRef.current.offsetWidth - 20; // 20 = ball diameter
        ballRef.current.style.transform = `translateX(${progress * trackWidth}px)`;
      }

      // Play clicks at each tappable beat
      beatTimestamps.forEach((t, i) => {
        if (!soundedRef.current.has(i) && elapsed >= t && pattern.beats[i].tappable) {
          soundedRef.current.add(i);
          playClick();
        }
      });

      if (elapsed < totalMs) {
        rafRef.current = requestAnimationFrame(animate);
      } else if (!doneRef.current) {
        doneRef.current = true;
        // Evaluate: each tappable beat is a "hit" if any tap fell within ±200ms
        const hits = pattern.beats.map((beat, i) => {
          if (!beat.tappable) return true; // rests auto-pass
          const expected = beatTimestamps[i];
          return tapTimesRef.current.some((t) => Math.abs(t - expected) <= 200);
        });
        onComplete(hits);
      }
    };

    rafRef.current = requestAnimationFrame(animate);
    return () => {
      cancelAnimationFrame(rafRef.current);
      doneRef.current = true;
    };
  }, [pattern, level]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="flex flex-col gap-5">
      {/* Beat track */}
      <div className="bg-white rounded-2xl border-2 border-brand-border p-5 shadow-sm" dir="ltr">
        {/* Note symbols */}
        <div ref={trackRef} className="relative mb-4" style={{ height: "52px" }}>
          {pattern.beats.map((beat, i) => {
            const leftPct = (beatTimestamps[i] / totalMs) * 100;
            const widthPct = (beat.duration * msPerQuarter / totalMs) * 100;
            const size = beat.duration <= 0.5 ? 32 : beat.duration >= 2 ? 52 : 40;
            return (
              <div
                key={i}
                className="absolute top-0 flex items-center justify-center"
                style={{ left: `${leftPct}%`, width: `${widthPct}%`, height: "52px" }}
              >
                <div
                  className={`flex items-center justify-center rounded-lg text-xl border-2 font-bold select-none ${
                    beat.tappable
                      ? "bg-blue-50 border-blue-200 text-blue-700"
                      : "bg-red-50 border-dashed border-red-200 text-red-400"
                  }`}
                  style={{ width: `${size}px`, height: "40px" }}
                >
                  {beat.symbol}
                </div>
              </div>
            );
          })}
        </div>

        {/* Ball track */}
        <div className="relative h-5 bg-gray-100 rounded-full">
          <div
            ref={ballRef}
            className="absolute top-1/2 -translate-y-1/2 w-5 h-5 rounded-full"
            style={{
              left: 0,
              background: "#22c55e",
              boxShadow: "0 0 10px rgba(34,197,94,0.7)",
            }}
          />
        </div>
      </div>

      {/* Drum button */}
      <div className="flex justify-center">
        <button
          onPointerDown={handleTap}
          className="w-28 h-28 rounded-full flex items-center justify-center active:scale-90 transition-transform select-none"
          style={{
            background: "linear-gradient(135deg, #0d9488, #0891b2)",
            boxShadow: "0 6px 20px rgba(13,148,136,0.4)",
          }}
        >
          <svg width="65" height="65" viewBox="0 0 60 60" fill="none">
            <ellipse cx="30" cy="38" rx="18" ry="8" fill="#7c3aed" opacity="0.9" />
            <rect x="12" y="28" width="36" height="10" rx="2" fill="#6d28d9" />
            <ellipse cx="30" cy="28" rx="18" ry="8" fill="#8b5cf6" />
            <line x1="20" y1="10" x2="28" y2="28" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
            <line x1="40" y1="10" x2="32" y2="28" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
            <circle cx="20" cy="9" r="3" fill="white" />
            <circle cx="40" cy="9" r="3" fill="white" />
          </svg>
        </button>
      </div>

      <p className="text-center text-sm text-brand-muted">הקש כשהכדור מגיע לכל תו 🟢</p>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add components/student/RhythmDisplay.tsx
git commit -m "feat: add RhythmDisplay with animated ball and Web Audio clicks"
```

---

### Task 3: RhythmAssessment — quiz component

**Files:**
- Create: `components/student/RhythmAssessment.tsx`

This component manages all quiz state: countdown, playing, feedback, adaptive difficulty, and the result screen.

- [ ] **Step 1: Create `components/student/RhythmAssessment.tsx`**

```typescript
"use client";

import { useState, useCallback, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import ViolinMascot from "@/components/shared/ViolinMascot";
import RhythmDisplay from "./RhythmDisplay";
import {
  DifficultyLevel,
  RhythmPattern,
  pickPattern,
} from "@/lib/rhythms";
import { scoreLabel } from "@/lib/notes";

type Phase = "countdown" | "playing" | "feedback";

interface Props {
  studentId: string;
  initialLevel: DifficultyLevel;
}

function clampLevel(l: number): DifficultyLevel {
  return Math.max(1, Math.min(3, l)) as DifficultyLevel;
}

const LEVEL_LABELS: Record<DifficultyLevel, string> = {
  1: "קל",
  2: "בינוני",
  3: "קשה",
};

export default function RhythmAssessment({ studentId, initialLevel }: Props) {
  const startLevel = clampLevel(initialLevel);

  const [level, setLevel] = useState<DifficultyLevel>(startLevel);
  const [pattern, setPattern] = useState<RhythmPattern>(() => pickPattern(startLevel));
  const [phase, setPhase] = useState<Phase>("countdown");
  const [countdown, setCountdown] = useState(3);
  const [correctStreak, setCorrectStreak] = useState(0);
  const [wrongStreak, setWrongStreak] = useState(0);
  const [totalHits, setTotalHits] = useState(0);
  const [totalTappable, setTotalTappable] = useState(0);
  const [maxLevel, setMaxLevel] = useState<DifficultyLevel>(startLevel);
  const [lastResult, setLastResult] = useState<"correct" | "wrong" | null>(null);
  const [isDone, setIsDone] = useState(false);
  const [saving, setSaving] = useState(false);

  const runCountdown = useCallback(() => {
    setPhase("countdown");
    setCountdown(3);
    setTimeout(() => setCountdown(2), 1000);
    setTimeout(() => setCountdown(1), 2000);
    setTimeout(() => setPhase("playing"), 3000);
  }, []);

  // Start countdown on mount
  useEffect(() => {
    runCountdown();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleComplete = useCallback(
    (hits: boolean[]) => {
      const tappableIndices = pattern.beats
        .map((b, i) => (b.tappable ? i : -1))
        .filter((i) => i !== -1);
      const tappable = tappableIndices.length;
      const patHits = tappableIndices.filter((i) => hits[i]).length;
      const isCorrect = tappable === 0 || patHits / tappable >= 0.75;

      setTotalHits((h) => h + patHits);
      setTotalTappable((t) => t + tappable);
      setLastResult(isCorrect ? "correct" : "wrong");
      setPhase("feedback");

      let newLevel = level;
      if (isCorrect) {
        const newStreak = correctStreak + 1;
        setCorrectStreak(newStreak);
        setWrongStreak(0);
        if (newStreak >= 3 && level < 3) {
          newLevel = clampLevel(level + 1);
          setLevel(newLevel);
          setMaxLevel((m) => clampLevel(Math.max(m, newLevel)));
          setCorrectStreak(0);
        }
      } else {
        const newWrongStreak = wrongStreak + 1;
        setWrongStreak(newWrongStreak);
        setCorrectStreak(0);
        if (newWrongStreak >= 2 && level > 1) {
          newLevel = clampLevel(level - 1);
          setLevel(newLevel);
          setWrongStreak(0);
        }
      }

      const prevId = pattern.id;
      setTimeout(() => {
        setPattern(pickPattern(newLevel, prevId));
        runCountdown();
      }, 1500);
    },
    [pattern, level, correctStreak, wrongStreak, runCountdown]
  );

  const handleFinish = useCallback(async () => {
    setSaving(true);
    const score =
      totalTappable > 0 ? Math.round((totalHits / totalTappable) * 100) : 0;
    const supabase = createClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any).from("assessments").insert({
      student_id: studentId,
      type: "rhythm",
      score,
      max_level: maxLevel,
      total_correct: totalHits,
      total_answered: totalTappable,
    });
    if (error) console.error("Failed to save rhythm assessment:", error);
    setSaving(false);
    setIsDone(true);
  }, [studentId, totalHits, totalTappable, maxLevel]);

  const score =
    totalTappable > 0 ? Math.round((totalHits / totalTappable) * 100) : 0;

  // ── Result screen ────────────────────────────────────────
  if (isDone) {
    return (
      <div className="flex flex-col items-center gap-6 py-8 px-4">
        <ViolinMascot
          mood={score >= 70 ? "excited" : "encouraging"}
          size={100}
          message={scoreLabel(score)}
        />
        <div className="bg-white rounded-2xl border border-brand-border p-6 w-full text-center shadow-sm">
          <p className="text-4xl font-extrabold text-brand-teal">{score}%</p>
          <p className="text-sm text-brand-muted mt-1">
            {totalHits} הקשות נכונות מתוך {totalTappable}
          </p>
          <p className="text-sm text-brand-muted">רמה מקסימלית: {maxLevel}</p>
        </div>
        <a
          href="/practice"
          className="w-full bg-brand-teal text-white font-bold py-3 rounded-2xl text-center block"
        >
          חזרה לתרגול
        </a>
      </div>
    );
  }

  // ── Quiz screen ──────────────────────────────────────────
  const mascotMood =
    lastResult === "correct" ? "happy"
    : lastResult === "wrong" ? "encouraging"
    : "thinking";

  return (
    <div className="flex flex-col gap-4 px-4 py-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={handleFinish}
          disabled={saving || phase === "playing"}
          className="text-sm text-brand-muted border border-brand-border rounded-xl px-3 py-1.5 disabled:opacity-40"
        >
          {saving ? "שומר..." : "סיום מבחן"}
        </button>
        <div className="text-center">
          <p className="text-xs text-brand-muted">רמה</p>
          <p className="font-bold text-brand-text">{LEVEL_LABELS[level]}</p>
        </div>
        <div className="text-center">
          <p className="text-xs text-brand-muted">ניקוד</p>
          <p className="font-bold text-brand-teal">
            {totalHits}/{totalTappable}
          </p>
        </div>
      </div>

      {/* Streak dots */}
      <div className="flex justify-center gap-2">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className={`w-3 h-3 rounded-full transition-all ${
              i < correctStreak ? "bg-brand-teal scale-110" : "bg-brand-border"
            }`}
          />
        ))}
      </div>

      {/* Countdown */}
      {phase === "countdown" && (
        <div className="flex items-center justify-center h-64">
          <p className="text-7xl font-extrabold text-brand-teal animate-pulse">
            {countdown}
          </p>
        </div>
      )}

      {/* Playing */}
      {phase === "playing" && (
        <RhythmDisplay
          pattern={pattern}
          level={level}
          onComplete={handleComplete}
        />
      )}

      {/* Feedback */}
      {phase === "feedback" && (
        <div className="flex flex-col items-center gap-3 py-10">
          <p className="text-5xl">{lastResult === "correct" ? "✅" : "❌"}</p>
          <p className="font-bold text-brand-text text-lg">
            {lastResult === "correct" ? "כל הכבוד! ⭐" : "נסה שוב 💪"}
          </p>
        </div>
      )}

      {/* Mascot */}
      <div className="flex justify-center mt-2">
        <ViolinMascot mood={mascotMood} size={80} />
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add components/student/RhythmAssessment.tsx
git commit -m "feat: add RhythmAssessment quiz component with adaptive logic"
```

---

### Task 4: Rhythm assessment page + practice page button

**Files:**
- Create: `app/(student)/practice/rhythm/page.tsx`
- Modify: `app/(student)/practice/page.tsx`

- [ ] **Step 1: Create `app/(student)/practice/rhythm/page.tsx`**

```typescript
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import RhythmAssessment from "@/components/student/RhythmAssessment";
import { DifficultyLevel } from "@/lib/rhythms";

export default async function RhythmPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = (await supabase
    .from("profiles")
    .select("level")
    .eq("id", user.id)
    .single()) as { data: { level: number } | null };

  const initialLevel = Math.max(
    1,
    Math.min(3, profile?.level ?? 1)
  ) as DifficultyLevel;

  return (
    <main className="max-w-sm mx-auto bg-brand-bg min-h-screen">
      {/* Header */}
      <div className="bg-gradient-to-br from-brand-orange to-brand-pink px-5 pt-10 pb-5">
        <p className="text-white/70 text-xs tracking-widest font-semibold mb-1">
          PRACTICE5
        </p>
        <div className="flex items-center gap-3">
          <a href="/practice" className="text-white/80 text-sm">
            ← חזרה
          </a>
          <h1 className="text-xl font-extrabold text-white">בדיקת מקצב</h1>
        </div>
      </div>

      <RhythmAssessment studentId={user.id} initialLevel={initialLevel} />
    </main>
  );
}
```

- [ ] **Step 2: Modify `app/(student)/practice/page.tsx`**

Find the existing assessment button block:
```tsx
        {/* Assessment button */}
        <div className="mx-4 mt-3">
          <a
            href="/practice/assess"
```

Add a new rhythm button **after** it (before the Mascot section):
```tsx
        {/* Rhythm assessment button */}
        <div className="mx-4 mt-2">
          <a
            href="/practice/rhythm"
            className="flex items-center justify-between w-full bg-white border border-brand-border rounded-2xl px-4 py-3 shadow-sm active:scale-95 transition-transform"
          >
            <span className="text-brand-muted text-sm">בדוק את חוש המקצב שלך</span>
            <span className="text-xl">🥁</span>
          </a>
        </div>
```

- [ ] **Step 3: Verify TypeScript compiles**

```bash
cd C:\Users\HP\Downloads\practice5
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add "app/(student)/practice/rhythm/page.tsx" "app/(student)/practice/page.tsx"
git commit -m "feat: add rhythm assessment page and drum button on practice page"
```

---

### Task 5: Push and verify

- [ ] **Step 1: Push to GitHub**

```bash
git push origin main
```

- [ ] **Step 2: Verify Vercel build**

Open https://vercel.com/dashboard — wait for green build (~2 min).

- [ ] **Step 3: Manual test flow**

1. Open `https://practice5-opal.vercel.app/practice`
2. Confirm 🥁 "בדוק את חוש המקצב שלך" button is visible
3. Tap it → `/practice/rhythm` opens with orange-pink gradient header
4. Countdown 3→2→1 plays, then beat track appears
5. Green ball moves left→right, click sounds play at each beat symbol
6. Tap the drum button in sync → ball completes → ✅/❌ feedback shows
7. 3 correct patterns → confetti + level up
8. Tap "סיום מבחן" → result screen with score + encouraging label + ViolinMascot
9. Open Supabase → `assessments` table has a new row with `type = "rhythm"`

---

## Notes for the implementer

- **`direction: ltr`** on the beat track div is essential — the page is RTL (Hebrew) but the musical staff always reads left-to-right.
- **`onPointerDown`** (not `onClick`) on the drum button gives faster response — `onClick` fires after pointer-up which adds ~100ms latency.
- **`AudioContext`** must be created inside a user gesture handler (the first tap). The `playClick` function handles this lazily via `audioCtxRef`.
- The `assessments` table already exists in Supabase (created during note assessment). No SQL needed.
- `scoreLabel` is imported from `@/lib/notes` — no need to duplicate it.
