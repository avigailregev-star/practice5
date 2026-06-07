# Pitch Assessment — Design Spec

**Date:** 2026-06-07
**Scope:** practice5 Next.js app — student-facing feature
**Goal:** An adaptive quiz where the student sings or plays a note on their violin. The app listens via microphone, detects pitch in real time, and evaluates whether the correct note was produced.

---

## Overview

A client-only React screen showing a note on a musical staff (rendered by abcjs) with the Hebrew note name displayed above. The microphone listens continuously via Web Audio API. A live pitch meter shows the detected frequency as a needle moving left (flat) / center (in tune) / right (sharp). After 2 seconds of a stable, recognized pitch, the app evaluates the result and advances. Difficulty is adaptive: 3 correct in a row → level up, 2 wrong in a row → level down. Results are saved to the Supabase `assessments` table.

---

## Architecture

```
lib/pitchDetection.ts                    ← autocorrelation algorithm + Hz→note mapping
components/student/PitchMeter.tsx        ← live pitch meter UI (client)
components/student/PitchAssessment.tsx   ← quiz state, adaptive logic, Supabase save (client)
app/(student)/practice/pitch/page.tsx    ← server entry point (auth + profile level)
```

No server round-trips during the quiz. Supabase write happens once at the end.
No external libraries — pitch detection via `AudioContext` + `AnalyserNode` + autocorrelation.

---

## Difficulty Levels

| Level | Notes | Octave range | Description |
|-------|-------|-------------|-------------|
| 1 — Easy | do re mi fa sol la si (C D E F G A B) | 4th octave only | All natural notes, one octave |
| 2 — Medium | + two octaves (3rd and 4th) | C3–B4 | Same 7 notes, wider range |
| 3 — Hard | + sharps/flats (C# D# F# G# A#) | C4–B4 | Chromatic notes added |

Starting level = student's `profiles.level` clamped to 1–3.

Note pool per level:
- Level 1: C4 D4 E4 F4 G4 A4 B4
- Level 2: C3 D3 E3 F3 G3 A3 B3 C4 D4 E4 F4 G4 A4 B4
- Level 3: C4 C#4 D4 D#4 E4 F4 F#4 G4 G#4 A4 A#4 B4

---

## `lib/pitchDetection.ts`

```ts
export interface DetectedNote {
  name: string;          // "C", "D#", etc.
  hebrewName: string;    // "דו", "רה", etc.
  octave: number;        // 3, 4, 5
  frequency: number;     // Hz
  cents: number;         // deviation from ideal: negative = flat, positive = sharp
}

/**
 * Autocorrelation-based pitch detection.
 * Returns fundamental frequency in Hz, or null if no clear pitch found.
 */
export function detectPitch(buffer: Float32Array, sampleRate: number): number | null

/**
 * Maps a frequency (Hz) to the nearest note.
 * Returns null if frequency is outside the supported range (C2–C6).
 */
export function frequencyToNote(hz: number): DetectedNote | null
```

**Autocorrelation algorithm:**
1. Compute RMS of buffer — if below silence threshold (0.01), return null
2. For each lag τ from `sampleRate/maxFreq` to `sampleRate/minFreq`:
   - Compute correlation `r(τ) = Σ x[i] * x[i+τ]`
3. Find lag with maximum correlation → `f = sampleRate / τ`
4. Apply parabolic interpolation for sub-sample accuracy
5. Reject if max correlation < 0.9 (unclear pitch)

**Note mapping:**
- 12-TET: `A4 = 440 Hz`, semitone = `2^(1/12)`
- `noteIndex = round(12 * log2(hz / 440)) + 57`
- `cents = 1200 * log2(hz / idealFrequency)`

**Hebrew note names:**
```ts
const HEBREW_NAMES: Record<string, string> = {
  C: "דו", D: "רה", E: "מי", F: "פה", G: "סול", A: "לה", B: "סי",
  "C#": "דו דיאז", "D#": "רה דיאז", "F#": "פה דיאז",
  "G#": "סול דיאז", "A#": "לה דיאז",
};
```

---

## `components/student/PitchMeter.tsx`

Props:
```ts
interface Props {
  detectedNote: DetectedNote | null;
  targetNote: string;   // e.g. "B4"
  isListening: boolean;
}
```

Renders:
- Horizontal meter bar: needle position driven by `cents` (-50 to +50, clamped)
- Green zone in center (±20 cents)
- Color: needle is green when `|cents| ≤ 20`, amber when 20–40, red when > 40
- Text below: detected note name + deviation label ("מדויק" / "קצת גבוה" / "גבוה מידי" / etc.)
- When `detectedNote` is null: shows "🎤 מאזין..." label

Needle animation: `requestAnimationFrame` smoothing — needle moves toward target with lerp factor 0.3 per frame to avoid jitter.

---

## `components/student/PitchAssessment.tsx`

### State

```ts
{
  currentNote: NoteData;        // note to sing (uses existing NoteData from lib/notes.ts)
  currentLevel: 1 | 2 | 3;
  phase: "listening" | "feedback" | "done";
  detectedNote: DetectedNote | null;
  stableStartTime: number | null; // timestamp (ms) when current stable match began
  correctStreak: number;
  wrongStreak: number;
  totalCorrect: number;
  totalAnswered: number;
  maxLevel: 1 | 2 | 3;
  lastResult: "correct" | "wrong" | null;
  isDone: boolean;
  saving: boolean;
  micError: string | null;      // "DENIED" | "UNSUPPORTED" | null
}
```

### Mic Setup

On mount: call `navigator.mediaDevices.getUserMedia({ audio: true })`.
- If denied → set `micError: "DENIED"` → show error screen (no quiz)
- If unsupported → set `micError: "UNSUPPORTED"` → show error screen

After permission: create `AudioContext` → `MediaStreamSource` → `AnalyserNode` (fftSize: 4096) → start `requestAnimationFrame` loop.

### Detection Loop (`requestAnimationFrame`)

Every frame:
1. `analyser.getFloatTimeDomainData(buffer)`
2. `detectPitch(buffer, sampleRate)` → Hz or null
3. `frequencyToNote(hz)` → DetectedNote or null
4. Update `detectedNote` state (for meter display)
5. If `detectedNote.name` matches target note name (within ±50 cents):
   - If `stableStartTime` is null → set `stableStartTime = Date.now()`
   - If `Date.now() - stableStartTime >= 2000` → evaluate → set phase "feedback"
6. Else: reset `stableStartTime` to null

### Evaluation

- Correct: `detectedNote` matches target note name (octave-insensitive for levels 1–2, octave-sensitive for level 3)
- Adaptive logic (identical to NoteAssessment):
  - 3 correct → level up (max 3), reset correctStreak
  - 2 wrong → level down (min 1), reset wrongStreak
- After 1.5s feedback → next note

### Note Selection

Reuses `getNotesForLevel` and `pickRandomNote` from `lib/notes.ts` — those functions already filter by level and avoid repeating the previous note. Level 3 will need notes with sharps added to `lib/notes.ts`.

### Octave Matching

- Level 1: target is always 4th octave (C4–B4). Correct if student sings the right note name in ANY octave (voice range varies).
- Level 2: target includes 3rd and 4th octave. Correct if right note name in any octave.
- Level 3: target is 4th octave with sharps. Correct if right note name in any octave.

Rationale: octave matching is very hard for beginners and depends heavily on voice range. The quiz tests note name recognition, not exact octave.

---

## UI Flow

```
Mount → getUserMedia → [if error: show error screen]
      → "listening" phase:
          - Show note on staff + Hebrew name
          - PitchMeter updates live
          - After 2s stable → "feedback" phase
      → "feedback" phase (1.5s):
          - Show ✅ / ❌
          - ViolinMascot reacts
      → next note → "listening" phase
      → "סיום מבחן" button → save → result screen
```

---

## Staff Display

Reuses existing `StaffDisplay` component (from NoteAssessment). Note name displayed above the staff in a `<div>`:

```tsx
<div dir="ltr" style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
  <span className="text-4xl font-black text-brand-text">{hebrewName}</span>
  <span className="text-lg text-brand-muted">{noteNameWithOctave}</span>
</div>
```

`dir="ltr"` ensures "סי B4" renders as: [Hebrew name on right] [B4 on left] in RTL layout — correct visual order.

---

## Result Screen

Same thresholds as NoteAssessment (reuses `scoreLabel` from `lib/notes.ts`):
- 90%+ → "מוסיקאי אמיתי! 🎼"
- 70–89% → "ממש טוב! עוד קצת ותגיע לשם 🌟"
- 50–69% → "התחלה טובה! המשך לתרגל 💪"
- <50% → "כל התחלה קשה — יאללה שוב! 🎵"

---

## Error States

| Error | Display |
|-------|---------|
| Mic denied | "המיקרופון חסום — אפשרי גישה בהגדרות הדפדפן 🎤" + back button |
| Mic unsupported | "הדפדפן לא תומך במיקרופון — נסי ב-Chrome" + back button |
| No pitch detected for >5s | Mascot says "לא שומע... נסי לנגן יותר חזק 🎻" |

---

## Supabase

Uses existing `assessments` table:
```ts
{
  student_id: string,
  type: "pitch",
  score: number,          // percentage
  max_level: 1 | 2 | 3,
  total_correct: number,
  total_answered: number,
}
```

---

## Entry Point

New button on student practice page:
```
🎤 בדוק את גובה הצליל שלך
```
Links to `/practice/pitch`.

---

## Non-Goals

- No octave-exact matching for levels 1–2 (voice range varies too much)
- No support for chords or intervals — single notes only
- No recording or saving of audio data
- No teacher view for this feature
- No support for microphone selection (uses default device)
