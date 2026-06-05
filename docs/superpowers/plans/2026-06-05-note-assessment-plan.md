# Note Identification Assessment — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build an adaptive, game-like note-reading quiz that assesses the student's real music theory level and saves results to Supabase.

**Architecture:** Client-only React quiz using abcjs (already in project) to render a single note on a treble clef staff. Student picks the note name from 4 buttons. Difficulty adapts based on correct/wrong streaks. Score saved once to Supabase `assessments` table on exit.

**Tech Stack:** Next.js 14 (App Router), TypeScript, abcjs, Tailwind CSS, Supabase

---

## Pre-Task: Supabase SQL (manual — run in Supabase SQL editor)

```sql
CREATE TABLE assessments (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id     UUID REFERENCES profiles(id) ON DELETE CASCADE,
  type           TEXT NOT NULL,
  score          INT NOT NULL,
  max_level      SMALLINT NOT NULL,
  total_correct  INT NOT NULL,
  total_answered INT NOT NULL,
  completed_at   TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE assessments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students can insert own assessments"
ON assessments FOR INSERT
WITH CHECK (auth.uid() = student_id);

CREATE POLICY "Students can read own assessments"
ON assessments FOR SELECT
USING (auth.uid() = student_id);
```

---

### Task 1: Note data and difficulty logic

**Files:**
- Create: `lib/notes.ts`

- [ ] **Step 1: Create the file**

```typescript
// lib/notes.ts

export type NoteName = "דו" | "רה" | "מי" | "פה" | "סול" | "לה" | "סי";
export type DifficultyLevel = 1 | 2 | 3;

export interface NoteData {
  name: NoteName;
  abcSymbol: string;   // used by abcjs: "C" "D" "E" "F" "G" "A" "B"
  level: DifficultyLevel;
}

export const ALL_NOTES: NoteData[] = [
  { name: "דו",  abcSymbol: "C", level: 2 },
  { name: "רה",  abcSymbol: "D", level: 2 },
  { name: "מי",  abcSymbol: "E", level: 1 },
  { name: "פה",  abcSymbol: "F", level: 1 },
  { name: "סול", abcSymbol: "G", level: 1 },
  { name: "לה",  abcSymbol: "A", level: 1 },
  { name: "סי",  abcSymbol: "B", level: 1 },
];

/** Notes available at a given difficulty level (cumulative) */
export function getNotesForLevel(level: DifficultyLevel): NoteData[] {
  return ALL_NOTES.filter((n) => n.level <= level);
}

/** Pick a random note from available notes, different from the previous */
export function pickRandomNote(
  level: DifficultyLevel,
  previousAbcSymbol?: string
): NoteData {
  const pool = getNotesForLevel(level).filter(
    (n) => n.abcSymbol !== previousAbcSymbol
  );
  return pool[Math.floor(Math.random() * pool.length)];
}

/** Generate 4 answer choices: correct + 3 random wrong ones */
export function generateChoices(correct: NoteData): NoteName[] {
  const wrong = ALL_NOTES.filter((n) => n.abcSymbol !== correct.abcSymbol);
  const shuffledWrong = wrong.sort(() => Math.random() - 0.5).slice(0, 3);
  const all = [correct, ...shuffledWrong].sort(() => Math.random() - 0.5);
  return all.map((n) => n.name);
}

/** Map score percentage to encouraging label */
export function scoreLabel(pct: number): string {
  if (pct >= 90) return "מוסיקאי אמיתי! 🎼";
  if (pct >= 70) return "ממש טוב! עוד קצת ותגיע לשם 🌟";
  if (pct >= 50) return "התחלה טובה! המשך לתרגל 💪";
  return "כל התחלה קשה — יאללה שוב! 🎵";
}
```

- [ ] **Step 2: Commit**

```bash
git add lib/notes.ts
git commit -m "feat: add note data and difficulty logic"
```

---

### Task 2: CSS animations

**Files:**
- Modify: `app/globals.css`

- [ ] **Step 1: Add keyframes at the end of globals.css**

```css
/* ── Note Assessment Animations ─────────────────────────── */
@keyframes noteBounce {
  0%   { transform: scale(1); }
  40%  { transform: scale(1.35) translateY(-6px); }
  70%  { transform: scale(0.92); }
  100% { transform: scale(1); }
}

@keyframes noteShake {
  0%, 100% { transform: translateX(0) rotate(0deg); }
  20%      { transform: translateX(-8px) rotate(-6deg); }
  40%      { transform: translateX(8px) rotate(6deg); }
  60%      { transform: translateX(-6px) rotate(-3deg); }
  80%      { transform: translateX(6px) rotate(3deg); }
}

@keyframes noteSpin {
  0%   { transform: rotate(0deg) scale(1); opacity: 1; }
  100% { transform: rotate(180deg) scale(0.3); opacity: 0; }
}

@keyframes slideInRight {
  from { transform: translateX(80px); opacity: 0; }
  to   { transform: translateX(0); opacity: 1; }
}

@keyframes slideOutLeft {
  from { transform: translateX(0); opacity: 1; }
  to   { transform: translateX(-80px); opacity: 0; }
}

@keyframes sparkle {
  0%   { transform: scale(0) rotate(0deg); opacity: 1; }
  60%  { transform: scale(1.2) rotate(180deg); opacity: 1; }
  100% { transform: scale(0) rotate(360deg); opacity: 0; }
}

@keyframes confettiFall {
  0%   { transform: translateY(-20px) rotate(0deg); opacity: 1; }
  100% { transform: translateY(120px) rotate(720deg); opacity: 0; }
}

@keyframes screenShake {
  0%, 100% { transform: translateX(0); }
  25%      { transform: translateX(-6px); }
  75%      { transform: translateX(6px); }
}

.anim-note-bounce  { animation: noteBounce 0.5s ease; }
.anim-note-shake   { animation: noteShake 0.5s ease; }
.anim-note-spin    { animation: noteSpin 0.4s ease forwards; }
.anim-slide-in     { animation: slideInRight 0.35s ease; }
.anim-slide-out    { animation: slideOutLeft 0.3s ease forwards; }
.anim-screen-shake { animation: screenShake 0.4s ease; }
```

- [ ] **Step 2: Commit**

```bash
git add app/globals.css
git commit -m "feat: add note assessment CSS animations"
```

---

### Task 3: StaffDisplay component

**Files:**
- Create: `components/student/StaffDisplay.tsx`

Context: The project already uses `abcjs` in `components/student/MusicNotation.tsx`. StaffDisplay renders ONE note on a treble clef staff using the same library.

- [ ] **Step 1: Create StaffDisplay.tsx**

```typescript
"use client";

import { useEffect, useRef } from "react";

interface StaffDisplayProps {
  abcSymbol: string; // "C" | "D" | "E" | "F" | "G" | "A" | "B"
  animClass?: string;
}

export default function StaffDisplay({ abcSymbol, animClass = "" }: StaffDisplayProps) {
  const divRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!divRef.current) return;
    // Single note in treble clef, middle octave
    const abcString = `X:1\nT:\nM:4/4\nL:1/1\nK:C treble\n|${abcSymbol}4|`;

    import("abcjs").then((abcjs) => {
      abcjs.renderAbc(divRef.current!, abcString, {
        responsive: "resize",
        staffwidth: 220,
        scale: 2.2,
        paddingtop: 20,
        paddingbottom: 20,
        paddingleft: 30,
        paddingright: 30,
        add_classes: true,
      });
    });
  }, [abcSymbol]);

  return (
    <div className={`bg-white rounded-2xl border-2 border-brand-border shadow-sm overflow-hidden ${animClass}`}>
      <div ref={divRef} className="w-full" />
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add components/student/StaffDisplay.tsx
git commit -m "feat: add StaffDisplay component for single note rendering"
```

---

### Task 4: NoteAssessment component

**Files:**
- Create: `components/student/NoteAssessment.tsx`

This is the main quiz component. It manages all state, renders StaffDisplay + buttons + mascot, handles answer logic, shows result screen.

- [ ] **Step 1: Create NoteAssessment.tsx**

```typescript
"use client";

import { useState, useCallback, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import StaffDisplay from "./StaffDisplay";
import ViolinMascot from "@/components/shared/ViolinMascot";
import {
  ALL_NOTES,
  DifficultyLevel,
  NoteData,
  NoteName,
  generateChoices,
  getNotesForLevel,
  pickRandomNote,
  scoreLabel,
} from "@/lib/notes";

type AnimState = "idle" | "correct" | "wrong" | "levelup" | "leveldown";

interface Props {
  studentId: string;
  initialLevel: DifficultyLevel;
}

function Confetti() {
  const pieces = Array.from({ length: 18 }, (_, i) => i);
  const colors = ["#ff6b9d", "#4ecdc4", "#a29bfe", "#ff9f43", "#51cf66"];
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {pieces.map((i) => (
        <div
          key={i}
          className="absolute w-2.5 h-2.5 rounded-sm"
          style={{
            left: `${10 + (i * 5) % 85}%`,
            top: "-10px",
            backgroundColor: colors[i % colors.length],
            animation: `confettiFall ${0.8 + (i % 4) * 0.15}s ease ${(i % 5) * 0.08}s forwards`,
          }}
        />
      ))}
    </div>
  );
}

function Sparkles() {
  const stars = ["✨", "⭐", "🌟", "💫"];
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {stars.map((s, i) => (
        <div
          key={i}
          className="absolute text-xl"
          style={{
            left: `${20 + i * 18}%`,
            top: `${15 + (i % 2) * 25}%`,
            animation: `sparkle 0.7s ease ${i * 0.1}s forwards`,
          }}
        >
          {s}
        </div>
      ))}
    </div>
  );
}

export default function NoteAssessment({ studentId, initialLevel }: Props) {
  const clampLevel = (l: number): DifficultyLevel =>
    (Math.max(1, Math.min(3, l)) as DifficultyLevel);

  const [level, setLevel] = useState<DifficultyLevel>(clampLevel(initialLevel));
  const [currentNote, setCurrentNote] = useState<NoteData>(() =>
    pickRandomNote(clampLevel(initialLevel))
  );
  const [choices, setChoices] = useState<NoteName[]>(() =>
    generateChoices(pickRandomNote(clampLevel(initialLevel)))
  );
  const [correctStreak, setCorrectStreak] = useState(0);
  const [wrongStreak, setWrongStreak] = useState(0);
  const [totalCorrect, setTotalCorrect] = useState(0);
  const [totalAnswered, setTotalAnswered] = useState(0);
  const [maxLevel, setMaxLevel] = useState<DifficultyLevel>(clampLevel(initialLevel));
  const [animState, setAnimState] = useState<AnimState>("idle");
  const [isDone, setIsDone] = useState(false);
  const [saving, setSaving] = useState(false);
  const [noteAnimClass, setNoteAnimClass] = useState("anim-slide-in");

  // Reset choices when note changes
  const nextQuestion = useCallback((newLevel: DifficultyLevel, prevSymbol: string) => {
    setNoteAnimClass("anim-slide-out");
    setTimeout(() => {
      const note = pickRandomNote(newLevel, prevSymbol);
      setCurrentNote(note);
      setChoices(generateChoices(note));
      setNoteAnimClass("anim-slide-in");
    }, 300);
  }, []);

  const handleAnswer = useCallback(
    (chosen: NoteName) => {
      if (animState !== "idle") return;

      const isCorrect = chosen === currentNote.name;
      const newAnswered = totalAnswered + 1;
      const newCorrect = isCorrect ? totalCorrect + 1 : totalCorrect;
      setTotalAnswered(newAnswered);
      setTotalCorrect(newCorrect);

      if (isCorrect) {
        const newStreak = correctStreak + 1;
        setCorrectStreak(newStreak);
        setWrongStreak(0);

        if (newStreak >= 3 && level < 3) {
          // Level up!
          const newLevel = clampLevel(level + 1);
          setLevel(newLevel);
          setMaxLevel((prev) => clampLevel(Math.max(prev, newLevel)));
          setCorrectStreak(0);
          setAnimState("levelup");
          setTimeout(() => {
            setAnimState("idle");
            nextQuestion(newLevel, currentNote.abcSymbol);
          }, 1800);
        } else {
          setAnimState("correct");
          setTimeout(() => {
            setAnimState("idle");
            nextQuestion(level, currentNote.abcSymbol);
          }, 700);
        }
      } else {
        const newWrongStreak = wrongStreak + 1;
        setWrongStreak(newWrongStreak);
        setCorrectStreak(0);

        if (newWrongStreak >= 2 && level > 1) {
          // Level down
          const newLevel = clampLevel(level - 1);
          setLevel(newLevel);
          setWrongStreak(0);
          setAnimState("leveldown");
          setTimeout(() => {
            setAnimState("idle");
            nextQuestion(newLevel, currentNote.abcSymbol);
          }, 1500);
        } else {
          setAnimState("wrong");
          setTimeout(() => {
            setAnimState("idle");
            nextQuestion(level, currentNote.abcSymbol);
          }, 700);
        }
      }
    },
    [animState, currentNote, correctStreak, wrongStreak, level, totalAnswered, totalCorrect, nextQuestion]
  );

  const handleFinish = useCallback(async () => {
    if (totalAnswered === 0) { setIsDone(true); return; }
    setSaving(true);
    const score = Math.round((totalCorrect / totalAnswered) * 100);
    const supabase = createClient();
    await supabase.from("assessments").insert({
      student_id: studentId,
      type: "notes",
      score,
      max_level: maxLevel,
      total_correct: totalCorrect,
      total_answered: totalAnswered,
    });
    setSaving(false);
    setIsDone(true);
  }, [studentId, totalAnswered, totalCorrect, maxLevel]);

  const score = totalAnswered > 0 ? Math.round((totalCorrect / totalAnswered) * 100) : 0;

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
            {totalCorrect} נכונות מתוך {totalAnswered}
          </p>
          <p className="text-sm text-brand-muted">רמה מקסימלית שהגעת: {maxLevel}</p>
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
    animState === "levelup" ? "excited"
    : animState === "leveldown" ? "encouraging"
    : animState === "correct" ? "happy"
    : "thinking";

  const mascotMessage =
    animState === "levelup" ? "וואו! עלית רמה! 🎉"
    : animState === "leveldown" ? "בסדר, ננסה שוב 💪"
    : animState === "correct" ? "כל הכבוד! ⭐"
    : animState === "wrong" ? "כמעט... נסה שוב!"
    : undefined;

  const levelLabels: Record<DifficultyLevel, string> = {
    1: "קל",
    2: "בינוני",
    3: "קשה",
  };

  return (
    <div
      className={`flex flex-col gap-4 px-4 py-4 relative ${
        animState === "wrong" ? "anim-screen-shake" : ""
      }`}
    >
      {animState === "levelup" && <Confetti />}
      {animState === "correct" && <Sparkles />}

      {/* Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={handleFinish}
          disabled={saving}
          className="text-sm text-brand-muted border border-brand-border rounded-xl px-3 py-1.5"
        >
          {saving ? "שומר..." : "סיום מבחן"}
        </button>
        <div className="text-center">
          <p className="text-xs text-brand-muted">רמה</p>
          <p className="font-bold text-brand-text">{levelLabels[level]}</p>
        </div>
        <div className="text-center">
          <p className="text-xs text-brand-muted">ניקוד</p>
          <p className="font-bold text-brand-teal">{totalCorrect}/{totalAnswered}</p>
        </div>
      </div>

      {/* Streak indicator */}
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

      {/* Staff */}
      <StaffDisplay
        abcSymbol={currentNote.abcSymbol}
        animClass={noteAnimClass}
      />

      {/* Question */}
      <p className="text-center font-semibold text-brand-text">
        איזה תו זה?
      </p>

      {/* Answer buttons */}
      <div className="grid grid-cols-2 gap-3">
        {choices.map((name) => {
          const isCorrect = name === currentNote.name;
          const showResult = animState === "correct" || animState === "wrong";
          return (
            <button
              key={name}
              onClick={() => handleAnswer(name)}
              disabled={animState !== "idle"}
              className={`py-4 rounded-2xl font-bold text-lg transition-all border-2 ${
                showResult && isCorrect
                  ? "bg-green-100 border-green-400 text-green-700 anim-note-bounce"
                  : showResult && !isCorrect
                  ? "bg-red-50 border-red-300 text-red-400 opacity-60"
                  : "bg-white border-brand-border text-brand-text active:scale-95"
              }`}
            >
              {name}
            </button>
          );
        })}
      </div>

      {/* Mascot */}
      <div className="flex justify-center mt-2">
        <ViolinMascot mood={mascotMood} size={80} message={mascotMessage} />
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add components/student/NoteAssessment.tsx
git commit -m "feat: add NoteAssessment quiz component"
```

---

### Task 5: Assessment page

**Files:**
- Create: `app/(student)/practice/assess/page.tsx`

- [ ] **Step 1: Create the page**

```typescript
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import NoteAssessment from "@/components/student/NoteAssessment";
import { DifficultyLevel } from "@/lib/notes";

export default async function AssessPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("level")
    .eq("id", user.id)
    .single() as { data: { level: number } | null };

  const initialLevel = (Math.max(1, Math.min(3, profile?.level ?? 1)) as DifficultyLevel);

  return (
    <main className="max-w-sm mx-auto bg-brand-bg min-h-screen">
      {/* Header */}
      <div className="bg-gradient-to-br from-brand-teal to-brand-purple px-5 pt-10 pb-5">
        <p className="text-white/70 text-xs tracking-widest font-semibold mb-1">PRACTICE5</p>
        <div className="flex items-center gap-3">
          <a href="/practice" className="text-white/80 text-sm">← חזרה</a>
          <h1 className="text-xl font-extrabold text-white">בדיקת רמה — תווים</h1>
        </div>
      </div>

      <NoteAssessment studentId={user.id} initialLevel={initialLevel} />
    </main>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add app/"(student)"/practice/assess/page.tsx
git commit -m "feat: add note assessment entry page"
```

---

### Task 6: Add "בדוק את הרמה" button to practice page

**Files:**
- Modify: `app/(student)/practice/page.tsx`

- [ ] **Step 1: Add the button after the WeeklyProgress section**

Find this block in the file:
```typescript
      {/* Body */}
      <div className="bg-brand-bg">
        {/* Weekly */}
        <div className="mx-4 mt-4 rounded-2xl p-4 bg-brand-card border border-brand-border">
          <p className="text-xs font-semibold text-brand-muted tracking-widest mb-3">השבוע</p>
          <WeeklyProgress practicedDays={practicedDays} />
        </div>
```

Add after the WeeklyProgress div, before Mascot:

```typescript
        {/* Assessment button */}
        <div className="mx-4 mt-3">
          <a
            href="/practice/assess"
            className="flex items-center justify-between w-full bg-white border border-brand-border rounded-2xl px-4 py-3 shadow-sm active:scale-95 transition-transform"
          >
            <span className="text-brand-muted text-sm">בדוק את הרמה שלך</span>
            <span className="text-xl">🎵</span>
          </a>
        </div>
```

- [ ] **Step 2: Commit**

```bash
git add app/"(student)"/practice/page.tsx
git commit -m "feat: add level assessment button to practice page"
```

---

### Task 7: Redraw ViolinMascot with loose/sketchy style

**Files:**
- Modify: `components/shared/ViolinMascot.tsx`

Replace the SVG body paths with slightly wobbly, organic-feeling equivalents. The key change: replace `<ellipse>` body parts with `<path>` that use cubic bezier curves, giving a hand-drawn look.

- [ ] **Step 1: Replace the SVG in ViolinMascot.tsx**

Find the SVG block (starting with `<svg width={size}`) and replace it with:

```tsx
      <svg
        width={size}
        height={size * 1.4}
        viewBox="0 0 120 168"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ filter: "drop-shadow(0px 4px 8px rgba(0,0,0,0.13))" }}
      >
        {/* ── Body — wobbly organic paths ── */}
        {/* Upper bout */}
        <path d="M34 52 C32 38 38 26 60 26 C82 26 88 38 86 52 C88 62 82 70 74 72 L46 72 C38 70 32 62 34 52 Z"
          fill="#C8860A" stroke="#7A4A00" strokeWidth="2.2" strokeLinejoin="round" />

        {/* Waist */}
        <path d="M46 72 C40 78 40 86 46 92 L74 92 C80 86 80 78 74 72 Z"
          fill="#B8770A" stroke="#7A4A00" strokeWidth="2.2" />

        {/* Lower bout */}
        <path d="M26 112 C24 94 38 90 46 92 L74 92 C82 90 96 94 94 112 C96 130 80 140 60 140 C40 140 24 130 26 112 Z"
          fill="#C8860A" stroke="#7A4A00" strokeWidth="2.2" strokeLinejoin="round" />

        {/* C-bouts */}
        <path d="M46 76 Q37 84 46 90" stroke="#7A4A00" strokeWidth="1.8" fill="none" strokeLinecap="round" />
        <path d="M74 76 Q83 84 74 90" stroke="#7A4A00" strokeWidth="1.8" fill="none" strokeLinecap="round" />

        {/* Wood grain */}
        <path d="M50 40 Q60 35 70 40" stroke="#A06608" strokeWidth="1.2" fill="none" strokeLinecap="round" opacity="0.5" />
        <path d="M48 108 Q60 103 72 108" stroke="#A06608" strokeWidth="1.2" fill="none" strokeLinecap="round" opacity="0.5" />
        <path d="M44 120 Q60 114 76 120" stroke="#A06608" strokeWidth="1" fill="none" strokeLinecap="round" opacity="0.4" />

        {/* F-holes */}
        <path d="M52 103 Q50 108 52 114 Q53 117 52 121" stroke="#7A4A00" strokeWidth="1.8" strokeLinecap="round" fill="none" />
        <path d="M68 103 Q70 108 68 114 Q67 117 68 121" stroke="#7A4A00" strokeWidth="1.8" strokeLinecap="round" fill="none" />
        <circle cx="52" cy="102" r="2" fill="#7A4A00" />
        <circle cx="52" cy="122" r="2" fill="#7A4A00" />
        <circle cx="68" cy="102" r="2" fill="#7A4A00" />
        <circle cx="68" cy="122" r="2" fill="#7A4A00" />

        {/* Strings */}
        <line x1="57" y1="28" x2="57" y2="140" stroke="#D4C5A0" strokeWidth="0.9" opacity="0.7" />
        <line x1="60" y1="28" x2="60" y2="140" stroke="#D4C5A0" strokeWidth="0.9" opacity="0.7" />
        <line x1="63" y1="28" x2="63" y2="140" stroke="#D4C5A0" strokeWidth="0.9" opacity="0.7" />

        {/* Bridge */}
        <path d="M54 107 Q60 104 66 107 L66 111 Q60 114 54 111 Z" fill="#8B6914" stroke="#5C3D00" strokeWidth="1" />

        {/* Neck — slightly wonky */}
        <path d="M53 22 Q52 40 54 72 L66 72 Q68 40 67 22 Z"
          fill="#B8770A" stroke="#7A4A00" strokeWidth="2" />

        {/* Scroll */}
        <path d="M52 20 Q54 10 60 9 Q66 10 68 20 Q66 24 60 24 Q54 24 52 20 Z"
          fill="#C8860A" stroke="#7A4A00" strokeWidth="2" />
        <path d="M56 19 Q58 14 60 13 Q62 14 64 19 Q62 22 60 22 Q58 22 56 19 Z"
          fill="#A06608" stroke="#7A4A00" strokeWidth="1.5" />

        {/* Pegs */}
        <line x1="50" y1="26" x2="54" y2="32" stroke="#5C3D00" strokeWidth="2.5" strokeLinecap="round" />
        <line x1="70" y1="26" x2="66" y2="32" stroke="#5C3D00" strokeWidth="2.5" strokeLinecap="round" />
        <line x1="49" y1="33" x2="54" y2="38" stroke="#5C3D00" strokeWidth="2.5" strokeLinecap="round" />
        <line x1="71" y1="33" x2="66" y2="38" stroke="#5C3D00" strokeWidth="2.5" strokeLinecap="round" />

        {/* ── FACE ── */}
        {/* Eye whites — slightly uneven for charm */}
        <path d="M42 53 Q44 47 50 47 Q56 47 57 53 Q57 60 50 60 Q43 60 42 53 Z"
          fill="white" stroke="#7A4A00" strokeWidth="1.5" />
        <path d="M63 53 Q64 47 70 47 Q76 47 78 53 Q78 60 70 60 Q63 60 63 53 Z"
          fill="white" stroke="#7A4A00" strokeWidth="1.5" />

        {/* Pupils */}
        <circle cx={mood === "thinking" ? 48 : 51} cy="54" r="3.5" fill="#1a1a1a" />
        <circle cx={mood === "thinking" ? 68 : 71} cy="54" r="3.5" fill="#1a1a1a" />

        {/* Eye shine */}
        <circle cx={mood === "thinking" ? 49 : 52} cy="52.5" r="1.3" fill="white" />
        <circle cx={mood === "thinking" ? 69 : 72} cy="52.5" r="1.3" fill="white" />

        {/* Eyebrows — expressive */}
        {mood === "excited" && (
          <>
            <path d="M43 46 Q50 42 57 45" stroke="#5C3D00" strokeWidth="2.2" strokeLinecap="round" fill="none" />
            <path d="M63 45 Q70 42 77 46" stroke="#5C3D00" strokeWidth="2.2" strokeLinecap="round" fill="none" />
          </>
        )}
        {mood === "thinking" && (
          <>
            <path d="M43 47 Q50 45 57 48" stroke="#5C3D00" strokeWidth="2.2" strokeLinecap="round" fill="none" />
            <path d="M63 45 Q70 48 77 46" stroke="#5C3D00" strokeWidth="2.2" strokeLinecap="round" fill="none" />
          </>
        )}
        {(mood === "happy" || mood === "encouraging") && (
          <>
            <path d="M43 48 Q50 44 57 47" stroke="#5C3D00" strokeWidth="2.2" strokeLinecap="round" fill="none" />
            <path d="M63 47 Q70 44 77 48" stroke="#5C3D00" strokeWidth="2.2" strokeLinecap="round" fill="none" />
          </>
        )}

        {/* Cheeks */}
        <ellipse cx="43" cy="62" rx="5" ry="3.5" fill="#FF8C8C" opacity="0.45" />
        <ellipse cx="77" cy="62" rx="5" ry="3.5" fill="#FF8C8C" opacity="0.45" />

        {/* Mouth */}
        {(mood === "happy" || mood === "encouraging") && (
          <path d="M52 67 Q60 74 68 67" stroke="#5C3D00" strokeWidth="2.2" strokeLinecap="round" fill="none" />
        )}
        {mood === "excited" && (
          <>
            <path d="M51 66 Q60 76 69 66" stroke="#5C3D00" strokeWidth="2.2" strokeLinecap="round" fill="none" />
            <path d="M54 68 Q60 74 66 68 Q60 76 54 68 Z" fill="#FF6B6B" />
          </>
        )}
        {mood === "thinking" && (
          <path d="M53 68 Q60 66 67 70" stroke="#5C3D00" strokeWidth="2.2" strokeLinecap="round" fill="none" />
        )}

        {/* Arms — loose squiggly */}
        <path d="M32 88 C22 82 20 72 27 67 C30 63 36 64 36 64"
          stroke="#C8860A" strokeWidth="6" strokeLinecap="round" fill="none" />
        <path d="M32 88 C22 82 20 72 27 67 C30 63 36 64 36 64"
          stroke="#7A4A00" strokeWidth="2" strokeLinecap="round" fill="none" />

        <path d="M88 88 C98 82 100 72 93 67 C90 63 84 64 84 64"
          stroke="#C8860A" strokeWidth="6" strokeLinecap="round" fill="none" />
        <path d="M88 88 C98 82 100 72 93 67 C90 63 84 64 84 64"
          stroke="#7A4A00" strokeWidth="2" strokeLinecap="round" fill="none" />

        {/* Legs */}
        <path d="M50 138 C46 150 42 155 38 157" stroke="#C8860A" strokeWidth="6" strokeLinecap="round" fill="none" />
        <path d="M38 157 C34 159 32 156 34 154" stroke="#C8860A" strokeWidth="5" strokeLinecap="round" fill="none" />
        <path d="M50 138 C46 150 42 155 38 157 C34 159 32 156 34 154" stroke="#7A4A00" strokeWidth="2" strokeLinecap="round" fill="none" />

        <path d="M70 138 C74 150 78 155 82 157" stroke="#C8860A" strokeWidth="6" strokeLinecap="round" fill="none" />
        <path d="M82 157 C86 159 88 156 86 154" stroke="#C8860A" strokeWidth="5" strokeLinecap="round" fill="none" />
        <path d="M70 138 C74 150 78 155 82 157 C86 159 88 156 86 154" stroke="#7A4A00" strokeWidth="2" strokeLinecap="round" fill="none" />

        {/* Music notes floating */}
        {mood === "excited" && (
          <text x="90" y="38" fontSize="18" fill="#FF6B6B" opacity="0.9">♪</text>
        )}
        {mood === "happy" && (
          <text x="88" y="40" fontSize="16" fill="#F59E0B" opacity="0.9">♩</text>
        )}
      </svg>
```

- [ ] **Step 2: Commit**

```bash
git add components/shared/ViolinMascot.tsx
git commit -m "feat: redraw ViolinMascot with loose hand-drawn style"
```

---

### Task 8: Push to GitHub and verify build

- [ ] **Step 1: Push all commits**

```bash
git push origin main
```

- [ ] **Step 2: Open Vercel dashboard and confirm build passes**

Navigate to: https://vercel.com/dashboard
Expected: green build within ~2 minutes.

- [ ] **Step 3: Test the full flow**

1. Open the student app at `https://practice5-opal.vercel.app/practice`
2. Confirm "🎵 בדוק את הרמה שלך" button is visible
3. Tap the button → `/practice/assess` loads
4. Staff shows a note, 4 buttons appear
5. Answer correctly 3x → confetti + level up
6. Answer wrong 2x → mascot encourages + level down
7. Tap "סיום מבחן" → result screen shows score + label
8. Open Supabase Table Editor → `assessments` table has 1 new row

---

## File Summary

| File | Action |
|------|--------|
| `lib/notes.ts` | Create |
| `app/globals.css` | Modify (append animations) |
| `components/student/StaffDisplay.tsx` | Create |
| `components/student/NoteAssessment.tsx` | Create |
| `app/(student)/practice/assess/page.tsx` | Create |
| `app/(student)/practice/page.tsx` | Modify (add button) |
| `components/shared/ViolinMascot.tsx` | Modify (redraw SVG) |
| Supabase `assessments` table | Manual SQL |
