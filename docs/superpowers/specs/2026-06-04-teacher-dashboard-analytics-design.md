# Teacher Dashboard Analytics — Design Spec

**Date:** 2026-06-04
**Scope:** practice5 Next.js app — teacher dashboard + crew Streamlit integration
**Goal:** Add violin analysis charts and per-student level recommendations to the teacher dashboard.

---

## Architecture

```
crew/streamlit_app.py  →  saves  →  practice5/public/crew-analysis.json
                                          ↓
                          app/(teacher)/dashboard/page.tsx reads JSON
                                          ↓
                          ViolinAnalysisSection component (2 charts)
                          StudentCard gets "רמה מומלצת" badge
```

---

## Data Flow

### 1. Streamlit saves JSON

When the teacher clicks "הפעל ניתוח מלא" in Streamlit, after the analysis completes, the app saves:

**`practice5/public/crew-analysis.json`**
```json
{
  "generated_at": "2026-06-04T12:00:00",
  "avg_scores": {
    "bow_control_score": 62,
    "intonation_score": 55,
    "rhythm_score": 68,
    "sight_reading_score": 49,
    "scale_accuracy": 71
  },
  "difficulty_distribution": {
    "1": 18,
    "2": 44,
    "3": 79,
    "4": 41,
    "5": 18
  }
}
```

The path is relative to `practice5/` — Streamlit resolves it as `../public/crew-analysis.json` from the `crew/` directory.

### 2. Next.js reads JSON

`app/(teacher)/dashboard/page.tsx` reads the JSON file at build/request time using `fs.readFileSync`. If the file does not exist, the analytics section is hidden gracefully.

### 3. Per-student recommendation

Calculated in `dashboard/page.tsx` from existing Supabase data — no ML model required:

```
sessions_this_week = count of sessions in last 7 days for this student
if sessions_this_week >= 5 AND level < 5 → recommended = level + 1
if sessions_this_week <= 1 AND level > 1 → recommended = level - 1
else                                      → recommended = level
```

Badge color: green (recommended > current), gray (same), orange (recommended < current).

---

## Components

### New: `ViolinAnalysisSection`

**File:** `components/teacher/ViolinAnalysisSection.tsx`

**Props:**
```typescript
interface ViolinAnalysisData {
  generated_at: string;
  avg_scores: Record<string, number>;
  difficulty_distribution: Record<string, number>;
}

interface Props {
  data: ViolinAnalysisData;
}
```

**Renders:**
- Section title: "📊 ניתוח כינור"
- Subtitle: timestamp of last analysis ("עודכן: 04/06/2026 12:00")
- Chart 1: BarChart — avg score per skill (Hebrew labels, brand colors)
- Chart 2: BarChart — count per recommended difficulty level (1–5)

**Library:** `recharts` (add to package.json)

**Hebrew skill labels:**
```
bow_control_score   → שליטה בקשת
intonation_score    → דיוק גובה הצליל
rhythm_score        → מקצב
sight_reading_score → קריאה מהדף
scale_accuracy      → דיוק בסולמות
```

### Modified: `StudentCard`

**File:** `components/teacher/StudentCard.tsx`

Add `recommendedLevel: number` prop.

Add badge below student name:
```
רמה מומלצת: 3
```
- Green if recommendedLevel > level
- Gray if equal
- Orange if recommendedLevel < level

### Modified: `dashboard/page.tsx`

- Read `public/crew-analysis.json` with `fs.readFileSync` (server component)
- Compute `recommendedLevel` per student using session count
- Pass `data` to `<ViolinAnalysisSection>`
- Pass `recommendedLevel` to each `<StudentCard>`

---

## Streamlit change

**File:** `crew/streamlit_app.py`

After `run_eda` and `train_and_save` complete, add:

```python
import json, datetime, pathlib

results = {
    "generated_at": datetime.datetime.now().isoformat(),
    "avg_scores": { col: float(df[col].mean()) for col in SCORE_COLS },
    "difficulty_distribution": df["recommended_difficulty"].value_counts().sort_index().to_dict(),
}
out_path = pathlib.Path(__file__).parent.parent / "public" / "crew-analysis.json"
out_path.parent.mkdir(parents=True, exist_ok=True)
with open(out_path, "w") as f:
    json.dump(results, f, indent=2)
st.success("✅ תוצאות נשמרו לדשבורד המורה")
```

---

## Non-Goals

- No real-time sync — JSON is updated only when Streamlit analysis runs
- No per-student violin scores (not in Supabase)
- No model.pkl inference in Next.js
- No authentication changes

---

## Tech Stack

| Tool | Purpose |
|------|---------|
| recharts | Bar charts in Next.js |
| fs (Node built-in) | Read crew-analysis.json on server |
| Streamlit (existing) | Generates the JSON |
