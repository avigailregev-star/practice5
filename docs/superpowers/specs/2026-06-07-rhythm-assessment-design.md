# Rhythm Assessment — Design Spec

**Date:** 2026-06-07
**Scope:** practice5 Next.js app — student-facing feature
**Goal:** An adaptive, game-like rhythm quiz where the student taps along to a moving ball + sound, assessing their sense of rhythm.

---

## Overview

A client-only React screen where the student sees a rhythm pattern (musical note symbols ♪ ♩ ♩. 𝄽) displayed on a horizontal track. A green ball moves left→right at a fixed BPM, passing each note in order — like reading sheet music. A click sound plays at each beat. The student taps a drum button in sync. Difficulty adapts live: 3 correct in a row → level up, 2 wrong in a row → level down. Results saved to Supabase `assessments` table (type: "rhythm").

---

## Architecture

```
lib/rhythms.ts                           ← pattern data, BPM per level, timing helpers
components/student/RhythmDisplay.tsx     ← animated beat track (ball + note symbols)
components/student/RhythmAssessment.tsx  ← main quiz component (client)
app/(student)/practice/rhythm/page.tsx   ← entry page (server component)
```

No server round-trips during the quiz. Supabase write happens once at the end.
No external libraries — timing via `requestAnimationFrame` + `AudioContext`.

---

## Difficulty Levels

| Level | Note types | BPM | Description |
|-------|-----------|-----|-------------|
| 1 — Easy | 𝅗𝅥 ♩ (half + quarter) | 60 | Slow, simple |
| 2 — Medium | ♩ ♪♪ (quarter + eighth pairs) | 72 | Standard beginner rhythm |
| 3 — Hard | ♩ ♪♪ 𝄽 ♩. (+ rests + dotted) | 80 | Full complexity |

Starting level = student's current `profiles.level` clamped to 1–3.

---

## Rhythm Patterns (`lib/rhythms.ts`)

Each pattern is a list of beats with relative timing (in quarter-note units):

```ts
export type NoteType = "quarter" | "eighth" | "half" | "dotted-quarter" | "rest";

export interface Beat {
  type: NoteType;
  symbol: string;       // ♩ ♪ 𝅗𝅥 ♩. 𝄽
  duration: number;     // in quarter-note units (quarter=1, eighth=0.5, half=2, dotted=1.5)
  tappable: boolean;    // false for rests
}

export interface RhythmPattern {
  id: string;
  level: 1 | 2 | 3;
  beats: Beat[];
  totalDuration: number; // sum of beat durations
}
```

Example patterns (minimum 4 per level):

**Level 1:**
- `[♩ ♩ 𝅗𝅥]` — quarter quarter half
- `[𝅗𝅥 ♩ ♩]` — half quarter quarter

**Level 2:**
- `[♪♪ ♩ ♪♪ ♩]` — ti-ti TA ti-ti TA
- `[♩ ♪♪ ♪♪ ♩]` — TA ti-ti ti-ti TA

**Level 3:**
- `[♪♪ 𝄽 ♩. ♪]` — ti-ti rest dotted-quarter eighth
- `[♩. ♪ 𝄽 ♩ ♩]` — dotted-quarter eighth rest quarter quarter

---

## Interaction Flow

1. Pattern loads → note symbols appear on the track, ball sits at the leftmost position
2. A "3-2-1" countdown animation plays (1 second)
3. Ball begins moving left→right at the pattern's BPM
4. At each beat position: a click sound plays via `AudioContext`
5. Student taps the drum button
6. Each tap is compared against the nearest upcoming beat timestamp (±200ms window):
   - Within window → ✅ hit (green flash on that note symbol)
   - Outside window or missed → ❌ miss (red flash)
   - Rests are skipped — no tap required, no penalty for tapping on a rest
7. When ball reaches the end → pattern complete → score calculated for this round
8. Adaptive logic runs → next pattern at new or same level

---

## Evaluation Logic

**Per pattern score:** `hits / tappable_beats` (rests excluded from denominator)

**Adaptive:**
- 3 correct patterns in a row (≥ 75% hits each) → level up (max 3)
- 2 wrong patterns in a row (< 75% hits) → level down (min 1)
- Streak resets on level change

**Overall score** (shown at end): `total_hits / total_tappable_beats * 100`

---

## RhythmDisplay Component

Props: `pattern: RhythmPattern`, `bpm: number`, `onTap: () => void`, `onComplete: (hits: Beat[]) => void`

Renders:
- Horizontal track (left→right, `direction: ltr` regardless of page RTL)
- Note symbols (♪ ♩ 𝅗𝅥 ♩. 𝄽) spaced proportionally to their duration
- Green ball animating via `requestAnimationFrame`
- Hit/miss visual feedback per note (green ✓ / red ✗ flash)
- Drum button (teal gradient circle with SVG drum)

Sound: `AudioContext` — short oscillator burst (frequency 800Hz, duration 50ms) on each beat.

---

## RhythmAssessment Component State

```ts
{
  currentPattern: RhythmPattern;
  currentLevel: 1 | 2 | 3;
  correctStreak: number;
  wrongStreak: number;
  totalHits: number;
  totalTappable: number;
  patternsAnswered: number;
  maxLevel: 1 | 2 | 3;
  phase: "countdown" | "playing" | "feedback" | "done";
  isDone: boolean;
}
```

---

## Animations

| Trigger | Animation |
|---------|-----------|
| Correct hit | Note symbol flashes green + scales up briefly |
| Miss / wrong | Note symbol flashes red |
| Level up | Confetti (reuse from NoteAssessment) + mascot excited |
| Level down | Mascot encouraging + soft pulse |
| Countdown | "3 2 1" fades in/out (CSS keyframes) |

All animations use Tailwind + existing `@keyframes` from `globals.css` (confettiFall, sparkle, etc.).

---

## Result Screen

After "סיום מבחן":
- Score as encouraging label (same thresholds as note assessment):
  - 90%+ → "מוסיקאי אמיתי! 🎼"
  - 70–89% → "ממש טוב! עוד קצת ותגיע לשם 🌟"
  - 50–69% → "התחלה טובה! המשך לתרגל 💪"
  - <50% → "כל התחלה קשה — יאללה שוב! 🎵"
- ViolinMascot with matching mood
- "חזרה לתרגול" button → `/practice`

---

## Supabase

Uses existing `assessments` table (already created for note assessment):
```ts
{
  student_id: string,
  type: "rhythm",
  score: number,          // percentage
  max_level: 1 | 2 | 3,
  total_correct: number,  // total hits
  total_answered: number, // total tappable beats
}
```

---

## Entry Point

New button on student practice page:
```
🥁 בדוק את חוש המקצב שלך
```
Links to `/practice/rhythm`.

---

## Non-Goals

- No microphone / audio input analysis (separate spec)
- No multiplayer or teacher view
- No time pressure mechanic beyond BPM
- No triplets or compound time signatures
