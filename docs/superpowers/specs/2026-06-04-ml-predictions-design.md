# ML Predictions Integration — Design Spec

**Date:** 2026-06-04
**Scope:** practice5 Next.js app + CrewAI crew
**Goal:** Connect the trained ML model to the live app — predict recommended difficulty level per student and display it in the teacher dashboard. Accessible from any computer via Streamlit Cloud.

---

## Architecture

```
Streamlit Cloud (practice5.streamlit.app)
  → teacher clicks "עדכן רמות מומלצות בדשבורד"
  → predict_and_update.py runs:
      - loads crew/outputs/model.pkl
      - fetches student data from Supabase
      - computes features from real session data
      - runs model.predict() per student
      - writes recommended_level → profiles table
      - writes run log → ml_runs table

Vercel (practice5.vercel.app)
  → dashboard/page.tsx reads recommended_level from profiles
  → displays "🤖 Random Forest | Accuracy: 87% | עודכן: 04/06/2026"
  → each StudentCard shows recommended_level from ML
```

---

## Supabase Changes

Run in Supabase SQL editor:

```sql
ALTER TABLE profiles
ADD COLUMN recommended_level SMALLINT;

CREATE TABLE ml_runs (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  predicted_at TIMESTAMPTZ DEFAULT now(),
  model_name  TEXT,
  accuracy    FLOAT,
  students_updated INT
);
```

---

## Feature Mapping

The model was trained on synthetic features. We derive them from real Supabase data:

| Model feature | Derived from Supabase |
|---|---|
| `sessions_this_week` | COUNT of sessions in last 7 days |
| `weekly_practice_minutes` | SUM of duration_minutes in last 7 days |
| `current_level` | profiles.level |
| `years_experience` | default: 1 |
| `bow_control_score` | self_rating avg → inverted score (1→75, 2→50, 3→25) |
| `intonation_score` | same as above |
| `rhythm_score` | same as above |
| `sight_reading_score` | same as above |
| `scale_accuracy` | same as above |
| `avg_score` | mean of the 5 derived scores |

---

## New File: `crew/predict_and_update.py`

```python
import os
import joblib
import pandas as pd
from supabase import create_client
from datetime import datetime, timedelta, timezone
from pathlib import Path

SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_KEY = os.environ.get("SUPABASE_KEY")

MODEL_PATH = Path(__file__).parent / "outputs" / "model.pkl"
MODEL_NAME = "Random Forest"
MODEL_ACCURACY = 0.87  # read from model_card.md or hardcoded

FEATURE_COLS = [
    "years_experience", "weekly_practice_minutes", "bow_control_score",
    "intonation_score", "rhythm_score", "sight_reading_score",
    "scale_accuracy", "current_level", "sessions_this_week", "avg_score",
]

SCORE_COLS = [
    "bow_control_score", "intonation_score", "rhythm_score",
    "sight_reading_score", "scale_accuracy",
]

def rating_to_score(avg_rating: float) -> float:
    """Convert avg self_rating (1-3) to 0-100 score (inverted)."""
    if avg_rating is None:
        return 50.0
    return round((4 - avg_rating) / 3 * 100, 1)

def run_predictions() -> dict:
    supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
    model = joblib.load(MODEL_PATH)

    # Fetch all students
    profiles = supabase.table("profiles").select("id, level").execute().data

    week_ago = (datetime.now(timezone.utc) - timedelta(days=7)).isoformat()

    # Fetch recent sessions
    sessions = supabase.table("practice_sessions") \
        .select("student_id, duration_minutes, self_rating, completed_at") \
        .gte("completed_at", week_ago) \
        .not_("completed_at", "is", None) \
        .execute().data

    sessions_df = pd.DataFrame(sessions) if sessions else pd.DataFrame(
        columns=["student_id", "duration_minutes", "self_rating", "completed_at"]
    )

    rows = []
    for profile in profiles:
        sid = profile["id"]
        level = profile.get("level") or 1
        student_sessions = sessions_df[sessions_df["student_id"] == sid]

        sessions_this_week = len(student_sessions)
        weekly_minutes = student_sessions["duration_minutes"].sum() if sessions_this_week > 0 else 0
        avg_rating = student_sessions["self_rating"].dropna().mean() if sessions_this_week > 0 else None
        score = rating_to_score(avg_rating)

        rows.append({
            "student_id": sid,
            "years_experience": 1,
            "weekly_practice_minutes": float(weekly_minutes),
            "bow_control_score": score,
            "intonation_score": score,
            "rhythm_score": score,
            "sight_reading_score": score,
            "scale_accuracy": score,
            "current_level": float(level),
            "sessions_this_week": float(sessions_this_week),
            "avg_score": score,
        })

    if not rows:
        return {"students_updated": 0}

    df = pd.DataFrame(rows)
    X = df[FEATURE_COLS]
    predictions = model.predict(X)

    updated = 0
    for i, profile in enumerate(profiles):
        pred = int(predictions[i])
        supabase.table("profiles") \
            .update({"recommended_level": pred}) \
            .eq("id", profile["id"]) \
            .execute()
        updated += 1

    # Log the run
    supabase.table("ml_runs").insert({
        "model_name": MODEL_NAME,
        "accuracy": MODEL_ACCURACY,
        "students_updated": updated,
    }).execute()

    return {"students_updated": updated, "model": MODEL_NAME, "accuracy": MODEL_ACCURACY}
```

---

## Streamlit Change: `crew/streamlit_app.py`

Add a new section after the existing analysis button:

```python
st.divider()
st.subheader("🤖 עדכון רמות מומלצות")
st.caption("מריץ את מודל ה-ML על נתוני התלמידים האמיתיים ומעדכן את הדשבורד")

if st.button("עדכן רמות מומלצות בדשבורד", type="primary"):
    with st.spinner("מריץ ניבויים..."):
        from predict_and_update import run_predictions
        result = run_predictions()
    st.success(f"✅ עודכנו {result['students_updated']} תלמידים | מודל: {result['model']} | Accuracy: {result['accuracy']:.0%}")
```

---

## Dashboard Change: `app/(teacher)/dashboard/page.tsx`

### Read recommended_level from profiles

```typescript
const { data: profilesWithLevel } = await supabase
  .from("profiles")
  .select("id, recommended_level");

const recommendedLevelMap = new Map(
  (profilesWithLevel ?? []).map(p => [p.id, p.recommended_level])
);
```

### Read last ML run

```typescript
const { data: lastRun } = await supabase
  .from("ml_runs")
  .select("model_name, accuracy, predicted_at, students_updated")
  .order("predicted_at", { ascending: false })
  .limit(1)
  .single();
```

### ML info banner (shown at top of dashboard)

```tsx
{lastRun && (
  <div className="bg-purple-50 border border-purple-200 rounded-lg px-4 py-2 text-sm text-purple-800 flex gap-4">
    <span>🤖 מודל: {lastRun.model_name}</span>
    <span>דיוק: {Math.round(lastRun.accuracy * 100)}%</span>
    <span>עודכן: {new Date(lastRun.predicted_at).toLocaleDateString("he-IL")}</span>
    <span>{lastRun.students_updated} תלמידים</span>
  </div>
)}
```

### Pass recommended_level to StudentCard

Replace the current computed `recommendedLevel` logic with:
```typescript
recommendedLevel={recommendedLevelMap.get(student.id) ?? student.level}
```

---

## Streamlit Cloud Deployment

1. Push `model.pkl` to git (add to git if currently gitignored)
2. Go to [share.streamlit.io](https://share.streamlit.io)
3. Connect GitHub repo → select `crew/streamlit_app.py`
4. Add secrets: `SUPABASE_URL`, `SUPABASE_KEY`, `ANTHROPIC_API_KEY`
5. Deploy → get public URL

---

## Non-Goals

- No automatic scheduled predictions (manual button only)
- No per-skill breakdown from ML (only recommended_level)
- No model retraining from the dashboard
