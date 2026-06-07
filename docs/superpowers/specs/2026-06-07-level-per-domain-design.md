# Level Per Domain — Design Spec

**Date:** 2026-06-07
**Scope:** practice5 Next.js app — student-facing + DB schema
**Goal:** Each of the 3 assessments (notes, rhythm, pitch) determines a separate domain level. The practice page groups the 3 assessment buttons under a teal card that hides once all levels are set.

---

## Overview

Currently `profiles.level` is a single integer shared across all domains. This feature adds separate level fields per domain (`level_notes`, `level_rhythm`, `level_pitch`). Each 6-question assessment writes back the computed level. The practice page shows a teal "calibration" card with 3 buttons — hidden once all 3 domains have been assessed.

---

## DB Schema Change

Add 3 nullable integer columns to the `profiles` table:

```sql
ALTER TABLE profiles
  ADD COLUMN level_notes  INT DEFAULT NULL,
  ADD COLUMN level_rhythm INT DEFAULT NULL,
  ADD COLUMN level_pitch  INT DEFAULT NULL;
```

- `NULL` = not yet assessed
- `1`, `2`, `3` = assessed level for that domain
- Existing `profiles.level` stays unchanged (used for XP bar / general display)

---

## Score → Level Mapping

Applied identically across all 3 assessments after 6 questions:

| Score | Level |
|-------|-------|
| 0–49% | 1 |
| 50–79% | 2 |
| 80–100% | 3 |

---

## Practice Page (`app/(student)/practice/page.tsx`)

### Teal calibration card

Shown when **any** of `level_notes`, `level_rhythm`, `level_pitch` is `NULL`:

```
┌─────────────────────────────────────┐
│  🎯 להתאמת הרמה — לחצי עליי        │  ← teal gradient header
│  ┌─────────────────────────────┐    │
│  │ זיהוי תווים            🎵  │    │
│  ├─────────────────────────────┤    │
│  │ חוש מקצב               🥁  │    │
│  ├─────────────────────────────┤    │
│  │ גובה צליל              🎤  │    │
│  └─────────────────────────────┘    │
└─────────────────────────────────────┘
```

Hidden when all 3 fields are non-null. Only "בדוק את הרמה שלך 🎵" remains.

### Page server query

Fetch the 3 new fields alongside existing profile data:
```ts
.select("name, level, xp, level_notes, level_rhythm, level_pitch")
```

Pass all 3 to the page component; the teal card renders conditionally.

---

## Assessment Starting Level

Each assessment page reads its domain-specific level:

| Page | Field read | Fallback |
|------|-----------|---------|
| `/practice/assess` (notes) | `level_notes` | `profiles.level` |
| `/practice/rhythm` | `level_rhythm` | `1` |
| `/practice/pitch` | `level_pitch` | `1` |

---

## Level Write-Back

Each assessment component writes back after 6 questions complete.

### NoteAssessment (`components/student/NoteAssessment.tsx`)

In `handleFinish`, after saving to `assessments` table, also update `profiles`:
```ts
const domainLevel = score >= 80 ? 3 : score >= 50 ? 2 : 1;
await supabase.from("profiles").update({ level_notes: domainLevel }).eq("id", studentId);
```

### RhythmAssessment (`components/student/RhythmAssessment.tsx`)

Same pattern:
```ts
const domainLevel = score >= 80 ? 3 : score >= 50 ? 2 : 1;
await supabase.from("profiles").update({ level_rhythm: domainLevel }).eq("id", studentId);
```

### PitchAssessment (`components/student/PitchAssessment.tsx`)

Same pattern:
```ts
const domainLevel = score >= 80 ? 3 : score >= 50 ? 2 : 1;
await supabase.from("profiles").update({ level_pitch: domainLevel }).eq("id", studentId);
```

All 3 use `(supabase as any)` cast since the new fields are not yet in generated TS types.

---

## File Changes

| File | Change |
|------|--------|
| Supabase dashboard | Run ALTER TABLE migration |
| `app/(student)/practice/page.tsx` | Fetch 3 new fields; show/hide teal card |
| `app/(student)/practice/assess/page.tsx` | Pass `level_notes` (fallback `profiles.level`) as `initialLevel` |
| `app/(student)/practice/rhythm/page.tsx` | Pass `level_rhythm` (fallback 1) as `initialLevel` |
| `app/(student)/practice/pitch/page.tsx` | Pass `level_pitch` (fallback 1) as `initialLevel` |
| `components/student/NoteAssessment.tsx` | Write `level_notes` on finish |
| `components/student/RhythmAssessment.tsx` | Write `level_rhythm` on finish |
| `components/student/PitchAssessment.tsx` | Write `level_pitch` on finish |

---

## Non-Goals

- No change to `profiles.level` (XP / general level display unchanged)
- No teacher dashboard changes in this spec (separate spec)
- No re-assessment flow changes — student can retake any assessment and the level updates
