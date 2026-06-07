# Level Per Domain — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add separate domain levels (notes/rhythm/pitch) to profiles, write back after each 6-question assessment, and show a teal calibration card on the practice page that hides once all 3 domains are assessed.

**Architecture:** DB already has `level_notes`, `level_rhythm`, `level_pitch` nullable INT columns on `profiles`. Each assessment's `handleFinish` writes the computed domain level. The practice page fetches all 3 fields and conditionally renders the teal card. Each assessment entry page reads its domain-specific field as starting level.

**Tech Stack:** Next.js 14 App Router, TypeScript, Supabase (client + server), Tailwind CSS

---

## File Summary

| File | Action |
|------|--------|
| `app/(student)/practice/page.tsx` | Modify — fetch 3 new fields, replace 3 standalone buttons with conditional teal card + single assess button |
| `app/(student)/practice/assess/page.tsx` | Modify — read `level_notes` instead of `level` |
| `app/(student)/practice/rhythm/page.tsx` | Modify — read `level_rhythm` instead of `level` |
| `app/(student)/practice/pitch/page.tsx` | Modify — read `level_pitch` instead of `level` |
| `components/student/NoteAssessment.tsx` | Modify — write `level_notes` to profiles on finish |
| `components/student/RhythmAssessment.tsx` | Modify — write `level_rhythm` to profiles on finish |
| `components/student/PitchAssessment.tsx` | Modify — write `level_pitch` to profiles on finish |

---

### Task 1: Practice page — teal calibration card

**Files:**
- Modify: `app/(student)/practice/page.tsx`

- [ ] **Step 1: Update the profile query to fetch domain levels**

Find this line:
```ts
    .select("name, level, xp")
```
Replace with:
```ts
    .select("name, level, xp, level_notes, level_rhythm, level_pitch")
```

And update the type cast from:
```ts
  } as { data: { name: string; level: number; xp: number } | null };
```
To:
```ts
  } as { data: { name: string; level: number; xp: number; level_notes: number | null; level_rhythm: number | null; level_pitch: number | null } | null };
```

- [ ] **Step 2: Replace the 3 standalone assessment buttons with the new layout**

Find and remove this entire block (lines 63–94 in current file):
```tsx
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

        {/* Pitch assessment button */}
        <div className="mx-4 mt-2">
          <a
            href="/practice/pitch"
            className="flex items-center justify-between w-full bg-white border border-brand-border rounded-2xl px-4 py-3 shadow-sm active:scale-95 transition-transform"
          >
            <span className="text-brand-muted text-sm">בדוק את גובה הצליל שלך</span>
            <span className="text-xl">🎤</span>
          </a>
        </div>
```

Replace with:
```tsx
        {/* Assessment button — always visible */}
        <div className="mx-4 mt-3">
          <a
            href="/practice/assess"
            className="flex items-center justify-between w-full bg-white border border-brand-border rounded-2xl px-4 py-3 shadow-sm active:scale-95 transition-transform"
          >
            <span className="text-brand-muted text-sm">בדוק את הרמה שלך</span>
            <span className="text-xl">🎵</span>
          </a>
        </div>

        {/* Teal calibration card — shown until all 3 domain levels are set */}
        {(profile?.level_notes == null || profile?.level_rhythm == null || profile?.level_pitch == null) && (
          <div className="mx-4 mt-2 rounded-2xl overflow-hidden shadow-sm">
            <div className="bg-gradient-to-br from-teal-500 to-cyan-600 px-4 pt-3 pb-3">
              <p className="text-white text-xs font-bold text-center tracking-wide mb-2">
                🎯 להתאמת הרמה — לחצי עליי
              </p>
              <div className="flex flex-col gap-2">
                <a
                  href="/practice/rhythm"
                  className="flex items-center justify-between bg-white/20 hover:bg-white/30 active:scale-95 transition-all rounded-xl px-4 py-2.5"
                >
                  <span className="text-white text-sm">
                    {profile?.level_rhythm != null ? "✓ " : ""}חוש מקצב
                  </span>
                  <span className="text-lg">🥁</span>
                </a>
                <a
                  href="/practice/pitch"
                  className="flex items-center justify-between bg-white/20 hover:bg-white/30 active:scale-95 transition-all rounded-xl px-4 py-2.5"
                >
                  <span className="text-white text-sm">
                    {profile?.level_pitch != null ? "✓ " : ""}גובה צליל
                  </span>
                  <span className="text-lg">🎤</span>
                </a>
              </div>
            </div>
          </div>
        )}
```

- [ ] **Step 3: TypeScript check**

```bash
cd C:\Users\HP\Downloads\practice5
npx tsc --noEmit 2>&1 | head -20
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add "app/(student)/practice/page.tsx"
git commit -m "feat: add teal calibration card, hide once all domain levels set"
```

---

### Task 2: Assessment entry pages — domain-specific starting level

**Files:**
- Modify: `app/(student)/practice/assess/page.tsx`
- Modify: `app/(student)/practice/rhythm/page.tsx`
- Modify: `app/(student)/practice/pitch/page.tsx`

- [ ] **Step 1: Update `assess/page.tsx` to read `level_notes`**

Find:
```ts
  const { data: profile } = await supabase
    .from("profiles")
    .select("level")
    .eq("id", user.id)
    .single() as { data: { level: number } | null };

  const initialLevel = (Math.max(1, Math.min(3, profile?.level ?? 1)) as DifficultyLevel);
```

Replace with:
```ts
  const { data: profile } = await supabase
    .from("profiles")
    .select("level, level_notes")
    .eq("id", user.id)
    .single() as { data: { level: number; level_notes: number | null } | null };

  const initialLevel = Math.max(
    1,
    Math.min(3, profile?.level_notes ?? profile?.level ?? 1)
  ) as DifficultyLevel;
```

- [ ] **Step 2: Update `rhythm/page.tsx` to read `level_rhythm`**

Find:
```ts
  const { data: profile } = (await supabase
    .from("profiles")
    .select("level")
    .eq("id", user.id)
    .single()) as { data: { level: number } | null };

  const initialLevel = Math.max(
    1,
    Math.min(3, profile?.level ?? 1)
  ) as DifficultyLevel;
```

Replace with:
```ts
  const { data: profile } = (await supabase
    .from("profiles")
    .select("level_rhythm")
    .eq("id", user.id)
    .single()) as { data: { level_rhythm: number | null } | null };

  const initialLevel = Math.max(
    1,
    Math.min(3, profile?.level_rhythm ?? 1)
  ) as DifficultyLevel;
```

- [ ] **Step 3: Update `pitch/page.tsx` to read `level_pitch`**

Find:
```ts
  const { data: profile } = (await supabase
    .from("profiles")
    .select("level")
    .eq("id", user.id)
    .single()) as { data: { level: number } | null };

  const initialLevel = Math.max(
    1,
    Math.min(3, profile?.level ?? 1)
  ) as DifficultyLevel;
```

Replace with:
```ts
  const { data: profile } = (await supabase
    .from("profiles")
    .select("level_pitch")
    .eq("id", user.id)
    .single()) as { data: { level_pitch: number | null } | null };

  const initialLevel = Math.max(
    1,
    Math.min(3, profile?.level_pitch ?? 1)
  ) as DifficultyLevel;
```

- [ ] **Step 4: TypeScript check**

```bash
cd C:\Users\HP\Downloads\practice5
npx tsc --noEmit 2>&1 | head -20
```

Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add "app/(student)/practice/assess/page.tsx" "app/(student)/practice/rhythm/page.tsx" "app/(student)/practice/pitch/page.tsx"
git commit -m "feat: assessment pages read domain-specific starting level"
```

---

### Task 3: NoteAssessment — write level_notes on finish

**Files:**
- Modify: `components/student/NoteAssessment.tsx`

- [ ] **Step 1: Add domain level write-back to `handleFinish`**

Find the existing `handleFinish` in `NoteAssessment.tsx`. It currently looks like:

```ts
  const handleFinish = useCallback(async () => {
    if (totalAnswered === 0) { setIsDone(true); return; }
    setSaving(true);
    const score = Math.round((totalCorrect / totalAnswered) * 100);
    const supabase = createClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any).from("assessments").insert({
      student_id: studentId,
      type: "notes",
      score,
      max_level: maxLevel,
      total_correct: totalCorrect,
      total_answered: totalAnswered,
    });
    setSaving(false);
    if (error) {
      console.error("Failed to save assessment:", error);
    }
    setIsDone(true);
```

Add domain level write-back after the `assessments` insert. Replace the `setSaving(false)` line and onwards with:

```ts
    const domainLevel = score >= 80 ? 3 : score >= 50 ? 2 : 1;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any)
      .from("profiles")
      .update({ level_notes: domainLevel })
      .eq("id", studentId);
    setSaving(false);
    if (error) {
      console.error("Failed to save assessment:", error);
    }
    setIsDone(true);
```

- [ ] **Step 2: TypeScript check**

```bash
cd C:\Users\HP\Downloads\practice5
npx tsc --noEmit 2>&1 | head -20
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add components/student/NoteAssessment.tsx
git commit -m "feat: write level_notes to profiles after note assessment"
```

---

### Task 4: RhythmAssessment — write level_rhythm on finish

**Files:**
- Modify: `components/student/RhythmAssessment.tsx`

- [ ] **Step 1: Add domain level write-back to `handleFinish`**

Find `handleFinish` in `RhythmAssessment.tsx`. It currently inserts into `assessments` and then calls `setSaving(false)`. Add the domain level write-back after the insert:

```ts
    const domainLevel = score >= 80 ? 3 : score >= 50 ? 2 : 1;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any)
      .from("profiles")
      .update({ level_rhythm: domainLevel })
      .eq("id", studentId);
```

Insert this block immediately after the `(supabase as any).from("assessments").insert({...})` call and before `setSaving(false)`.

- [ ] **Step 2: TypeScript check**

```bash
cd C:\Users\HP\Downloads\practice5
npx tsc --noEmit 2>&1 | head -20
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add components/student/RhythmAssessment.tsx
git commit -m "feat: write level_rhythm to profiles after rhythm assessment"
```

---

### Task 5: PitchAssessment — write level_pitch on finish

**Files:**
- Modify: `components/student/PitchAssessment.tsx`

- [ ] **Step 1: Add domain level write-back to `handleFinish`**

Find `handleFinish` in `PitchAssessment.tsx`. It currently has:

```ts
    const { error } = await (supabase as any).from("assessments").insert({
      student_id: studentId,
      type: "pitch",
      score,
      max_level: maxLevel,
      total_correct: totalCorrect,
      total_answered: totalAnswered,
    });
    if (error) console.error("Failed to save pitch assessment:", error);
    setSaving(false);
    setIsDone(true);
```

Add domain level write-back after the insert, before `setSaving(false)`:

```ts
    const domainLevel = score >= 80 ? 3 : score >= 50 ? 2 : 1;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any)
      .from("profiles")
      .update({ level_pitch: domainLevel })
      .eq("id", studentId);
```

- [ ] **Step 2: TypeScript check**

```bash
cd C:\Users\HP\Downloads\practice5
npx tsc --noEmit 2>&1 | head -20
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add components/student/PitchAssessment.tsx
git commit -m "feat: write level_pitch to profiles after pitch assessment"
```

---

### Task 6: Push and verify

- [ ] **Step 1: Push to GitHub**

```bash
git push origin main
```

- [ ] **Step 2: Manual test flow**

1. Open `/practice` — confirm teal card is visible (3 domain levels are null)
2. Complete rhythm assessment (6 questions) → result screen → "חזרה לתרגול"
3. Practice page: rhythm button shows "✓ חוש מקצב", teal card still visible (pitch not done yet)
4. Complete pitch assessment → back to practice page
5. Teal card is gone — only "בדוק את הרמה שלך 🎵" remains
6. Re-enter rhythm → starts at the newly assessed level (not level 1 default)
7. Supabase → `profiles` table: `level_rhythm` and `level_pitch` both have values

---

## Notes

- The `assess` page (notes) uses `level_notes ?? profile.level` as fallback so existing students with `level` set aren't reset to 1.
- The teal card shows a ✓ prefix on completed domains so the student can see progress while still needing to complete remaining ones.
- All Supabase calls use `(supabase as any)` cast because the new columns are not in the generated TypeScript types.
