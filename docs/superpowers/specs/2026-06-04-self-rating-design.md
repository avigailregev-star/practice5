# Self-Rating After Exercise — Design Spec

**Date:** 2026-06-04
**Scope:** practice5 Next.js app
**Goal:** After each exercise, the student rates how it felt (easy/ok/hard). The teacher sees the average rating per student in the dashboard.

---

## User Flow

1. Student finishes exercise → redirected to `/practice/complete?xp=10&leveled=0&session_id=<uuid>`
2. Complete page shows: trophy, title, XP badge, then **emoji rating row**
3. Student taps one emoji → rating saved to Supabase → "לתרגול הבא" button appears
4. If student skips (closes page) → `self_rating` stays NULL

---

## Rating Values

| Emoji | Label | Value |
|-------|-------|-------|
| 😊 | קל | 1 |
| 😐 | בסדר | 2 |
| 😓 | קשה | 3 |

---

## Supabase Changes

Add column to `practice_sessions`:
```sql
ALTER TABLE practice_sessions
ADD COLUMN self_rating SMALLINT CHECK (self_rating IN (1, 2, 3));
```

Run this in the Supabase SQL editor.

---

## Architecture

```
exercise/page.tsx
  → redirect to /practice/complete?xp=X&leveled=Y&session_id=UUID
  (session_id already exists — just add it to the redirect URL)

complete/page.tsx  (server component, reads searchParams)
  → renders <SelfRatingWidget sessionId={sessionId} />

components/student/SelfRatingWidget.tsx  (client component)
  → shows 3 emoji buttons
  → on click: calls server action rateSession(sessionId, rating)
  → after rating: shows "לתרגול הבא" button

app/actions/rating.ts  (server action)
  → updateSelfRating(sessionId: string, rating: number)
  → supabase.from("practice_sessions").update({ self_rating: rating }).eq("id", sessionId)
```

---

## Files

| File | Change |
|------|--------|
| `app/actions/rating.ts` | New — server action |
| `components/student/SelfRatingWidget.tsx` | New — client component |
| `app/(student)/practice/complete/page.tsx` | Add `session_id` to searchParams, render widget |
| `app/(student)/practice/exercise/page.tsx` | Add `session_id` to redirect URL |
| `components/teacher/StudentCard.tsx` | Add `avgRating` prop + emoji display |
| `app/(teacher)/dashboard/page.tsx` | Fetch avg self_rating per student |

---

## Component Details

### `SelfRatingWidget`

```tsx
"use client";
// Props: sessionId: string
// State: selected: 1|2|3|null, saved: boolean
// Renders:
//   <p>איך הרגשת?</p>
//   3 buttons: 😊 קל | 😐 בסדר | 😓 קשה
//   Selected button gets colored border + bg
//   After click → calls rateSession action → sets saved=true
//   When saved=true → shows <Link href="/practice">לתרגול הבא</Link>
//   Before rating → shows <Link href="/practice" className="text-brand-muted text-sm">דלג</Link>
```

### `StudentCard` addition

Add below the student name:
```
😊 ממוצע: קל      (avgRating < 1.7)
😐 ממוצע: בסדר    (avgRating 1.7–2.3)
😓 ממוצע: קשה     (avgRating > 2.3)
```
Only shown if student has at least one rated session.

### Dashboard data fetch

```typescript
// In dashboard/page.tsx
const { data: ratings } = await supabase
  .from("practice_sessions")
  .select("student_id, self_rating")
  .not("self_rating", "is", null);

// Compute avg per student
const avgRatingMap = new Map<string, number>();
// group by student_id, average self_rating values
```

---

## Non-Goals

- No ability to change rating after submission
- No rating history view
- No notification to teacher when rating is submitted
- No rating required to proceed (skip link always visible)
