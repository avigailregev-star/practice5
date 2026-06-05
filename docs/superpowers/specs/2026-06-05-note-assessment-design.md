# Note Identification Assessment — Design Spec

**Date:** 2026-06-05
**Scope:** practice5 Next.js app — student-facing feature
**Goal:** An adaptive, game-like note-reading quiz that assesses the student's real music theory level.

---

## Overview

A client-only React screen where the student sees a musical note drawn on a treble clef staff (SVG) and picks its name from 4 buttons. Difficulty adapts live: 3 correct in a row → level up, 2 wrong in a row → level down. Results saved to Supabase `assessments` table. The violin mascot (ViolinMascot) accompanies the quiz with mood-based reactions. Mascot style is loose/sketchy — hand-drawn feel, not stiff geometric lines.

---

## Architecture

```
app/(student)/practice/assess/page.tsx   ← entry, reads student profile
components/student/NoteAssessment.tsx    ← main quiz component (client)
components/student/StaffSVG.tsx          ← draws treble clef + note
components/student/NoteChoiceButtons.tsx ← 4 answer buttons
lib/notes.ts                             ← note data, difficulty levels, randomizer
```

No server round-trips during the quiz. Supabase write happens once at the end.

---

## Difficulty Levels

| Level | Notes available | Description |
|-------|----------------|-------------|
| 1 — Easy | Mi, Fa, Sol, La, Si (E4–B4) | Middle of staff |
| 2 — Medium | + Do, Re (C4, D4) | Edges of staff added |
| 3 — Hard | All 7, faster pace | Full staff, slightly shorter display |

Starting level = student's current `profiles.level` clamped to 1–3.

---

## Adaptive Logic

- **3 correct in a row** → level up (max 3), celebration animation + mascot excited
- **2 wrong in a row** → level down (min 1), gentle encouragement + mascot comforting
- Streak resets on any level change
- Quiz runs indefinitely until student taps "סיום"

---

## Note Data (`lib/notes.ts`)

```ts
export type NoteName = "דו" | "רה" | "מי" | "פה" | "סול" | "לה" | "סי";

export interface NoteData {
  name: NoteName;
  staffPosition: number; // 0 = bottom line, 8 = top line (steps of 0.5)
  level: 1 | 2 | 3;
}

export const NOTES: NoteData[] = [
  { name: "דו", staffPosition: 0,   level: 2 }, // C4, just below staff
  { name: "רה", staffPosition: 1,   level: 2 }, // D4, first space
  { name: "מי", staffPosition: 2,   level: 1 }, // E4, first line
  { name: "פה", staffPosition: 3,   level: 1 }, // F4, first space
  { name: "סול",staffPosition: 4,   level: 1 }, // G4, second line
  { name: "לה", staffPosition: 5,   level: 1 }, // A4, second space
  { name: "סי", staffPosition: 6,   level: 1 }, // B4, middle line
];
```

---

## StaffSVG Component

Draws:
- 5 horizontal staff lines
- Treble clef symbol (Unicode 𝄞 or simplified SVG path)
- One filled oval note head at the correct `staffPosition`
- A ledger line below the staff for "דו" (C4 only)
- No other ledger lines

---

## NoteAssessment Component State

```ts
{
  currentNote: NoteData;       // the note being shown
  choices: NoteName[];         // 4 options (includes correct)
  correctStreak: number;       // consecutive correct answers
  wrongStreak: number;         // consecutive wrong answers
  currentLevel: 1 | 2 | 3;    // adaptive difficulty
  totalAnswered: number;
  totalCorrect: number;
  animState: "idle" | "correct" | "wrong" | "levelup" | "leveldown";
  isDone: boolean;
}
```

---

## Animations (CSS)

| Trigger | Animation |
|---------|-----------|
| Correct answer | Note bounces + scales up, sparkle stars scatter (keyframes) |
| Wrong answer | Screen shakes (translateX), note spins and fades |
| Level up | Confetti divs rain down, mascot switches to `excited` |
| Level down | Mascot switches to `encouraging`, soft pulse |
| Question transition | Current note slides left off-screen, new note slides in from right |

All animations use Tailwind + custom `@keyframes` in `globals.css`. No external animation library.

---

## Supabase: `assessments` table

```sql
CREATE TABLE assessments (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id    UUID REFERENCES profiles(id),
  type          TEXT,        -- 'notes' | 'rhythm' | 'audio'
  score         INT,         -- percentage correct
  max_level     SMALLINT,    -- highest level reached
  total_correct INT,
  total_answered INT,
  completed_at  TIMESTAMPTZ DEFAULT now()
);
```

Written once when the student taps "סיום מבחן".

---

## Result Screen

After "סיום":
- Shows score as encouraging label (not a grade):
  - 90%+ → "מוסיקאי אמיתי! 🎼"
  - 70–89% → "ממש טוב! עוד קצת ותגיע לשם 🌟"
  - 50–69% → "התחלה טובה! המשך לתרגל 💪"
  - <50% → "כל התחלה קשה — יאללה שוב! 🎵"
- Mascot reacts with matching mood
- "חזרה לתרגול" button

---

## Entry Point

New button on the student practice page:
```
🎵 בדוק את הרמה שלך
```
Links to `/practice/assess`.

---

## Mascot Style Note

The ViolinMascot SVG will be redrawn with a looser, hand-drawn aesthetic:
- Slightly wobbly lines instead of perfect geometric shapes
- Body curves feel organic, not stiff
- Same character but more playful and sketchier

---

## Non-Goals

- No rhythm test in this spec (separate spec)
- No audio analysis in this spec (separate spec)
- No teacher view of assessment results (future)
- No time pressure mechanic (level 3 is harder by note range only)
