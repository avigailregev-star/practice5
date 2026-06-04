# ML Predictions Integration — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Connect the trained Decision Tree model (accuracy 97.5%) to the live app — predict recommended difficulty level per student from real Supabase data, display it in the teacher dashboard, and deploy Streamlit to the cloud so predictions can be triggered from any browser.

**Architecture:** A new `crew/predict_and_update.py` script loads `model.pkl`, fetches student session data from Supabase, derives model features from real data, writes `recommended_level` per student back to Supabase, and logs the run to `ml_runs`. A button in Streamlit triggers this script. The Next.js dashboard reads `recommended_level` from Supabase and shows an ML info banner.

**Tech Stack:** Python + joblib + supabase-py, Next.js server component, Supabase PostgreSQL, Streamlit Cloud

---

## File Structure

| File | Change |
|------|--------|
| `crew/predict_and_update.py` | NEW — prediction script |
| `crew/streamlit_app.py` | ADD — prediction button section |
| `crew/outputs/model.pkl` | Commit to git (currently untracked) |
| `app/(teacher)/dashboard/page.tsx` | ADD — read recommended_level + ml_runs |
| `components/teacher/StudentCard.tsx` | ADD — recommendedLevel prop + badge |

---

### Task 1: Supabase Schema Changes

**Files:**
- Run SQL in Supabase SQL editor (no code file)

- [ ] **Step 1: Add `recommended_level` to profiles**

Go to your Supabase project → SQL editor → run:

```sql
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS recommended_level SMALLINT;
```

Expected: "Success. No rows returned"

- [ ] **Step 2: Create `ml_runs` table**

```sql
CREATE TABLE IF NOT EXISTS ml_runs (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  predicted_at     TIMESTAMPTZ DEFAULT now(),
  model_name       TEXT,
  accuracy         FLOAT,
  students_updated INT
);
```

Expected: "Success. No rows returned"

- [ ] **Step 3: Verify**

```sql
SELECT column_name FROM information_schema.columns
WHERE table_name = 'profiles' AND column_name = 'recommended_level';

SELECT table_name FROM information_schema.tables
WHERE table_name = 'ml_runs';
```

Expected: both return 1 row each.

---

### Task 2: Create `crew/predict_and_update.py`

**Files:**
- Create: `crew/predict_and_update.py`
- Test: `crew/tests/test_predict_and_update.py`

Context:
- Model features (in order): `years_experience, weekly_practice_minutes, bow_control_score, intonation_score, rhythm_score, sight_reading_score, scale_accuracy, current_level, sessions_this_week, avg_score`
- Model is Decision Tree, accuracy 97.5%, saved at `crew/outputs/model.pkl`
- `self_rating` values: 1=easy→score 75, 2=ok→score 50, 3=hard→score 25, None→score 50

- [ ] **Step 1: Write the failing test**

Create `crew/tests/test_predict_and_update.py`:

```python
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent.parent))

from predict_and_update import rating_to_score, build_feature_row

def test_rating_to_score_easy():
    assert rating_to_score(1.0) == 75.0

def test_rating_to_score_ok():
    assert rating_to_score(2.0) == 50.0

def test_rating_to_score_hard():
    assert rating_to_score(3.0) == 25.0

def test_rating_to_score_none():
    assert rating_to_score(None) == 50.0

def test_build_feature_row_basic():
    row = build_feature_row(
        current_level=3,
        sessions_this_week=4,
        weekly_minutes=60.0,
        avg_rating=2.0,
    )
    assert row["current_level"] == 3.0
    assert row["sessions_this_week"] == 4.0
    assert row["weekly_practice_minutes"] == 60.0
    assert row["bow_control_score"] == 50.0
    assert row["avg_score"] == 50.0
    assert len(row) == 10  # all 10 features present
```

- [ ] **Step 2: Run test to confirm it fails**

```bash
cd C:\Users\HP\Downloads\practice5\crew
python -m pytest tests/test_predict_and_update.py -v
```

Expected: `ModuleNotFoundError: No module named 'predict_and_update'`

- [ ] **Step 3: Create `crew/predict_and_update.py`**

```python
import os
from datetime import datetime, timedelta, timezone
from pathlib import Path

import joblib
import pandas as pd

MODEL_PATH = Path(__file__).parent / "outputs" / "model.pkl"
MODEL_NAME = "Decision Tree"
MODEL_ACCURACY = 0.975

FEATURE_COLS = [
    "years_experience", "weekly_practice_minutes", "bow_control_score",
    "intonation_score", "rhythm_score", "sight_reading_score",
    "scale_accuracy", "current_level", "sessions_this_week", "avg_score",
]


def rating_to_score(avg_rating) -> float:
    """Convert avg self_rating (1–3) to 0–100 score (inverted). None → 50."""
    if avg_rating is None:
        return 50.0
    return round((4.0 - float(avg_rating)) / 3.0 * 100.0, 1)


def build_feature_row(
    current_level: int,
    sessions_this_week: int,
    weekly_minutes: float,
    avg_rating,
) -> dict:
    """Build one feature dict for model.predict()."""
    score = rating_to_score(avg_rating)
    return {
        "years_experience": 1.0,
        "weekly_practice_minutes": float(weekly_minutes),
        "bow_control_score": score,
        "intonation_score": score,
        "rhythm_score": score,
        "sight_reading_score": score,
        "scale_accuracy": score,
        "current_level": float(current_level),
        "sessions_this_week": float(sessions_this_week),
        "avg_score": score,
    }


def run_predictions() -> dict:
    """Load model, fetch Supabase data, predict, write back. Returns summary dict."""
    from supabase import create_client

    url = os.environ.get("SUPABASE_URL")
    key = os.environ.get("SUPABASE_KEY")
    if not url or not key:
        raise RuntimeError("SUPABASE_URL / SUPABASE_KEY not set in environment")

    supabase = create_client(url, key)
    model = joblib.load(MODEL_PATH)

    # Fetch all student profiles
    profiles_resp = supabase.table("profiles") \
        .select("id, level") \
        .eq("role", "student") \
        .execute()
    profiles = profiles_resp.data or []

    # Fetch sessions from last 7 days
    week_ago = (datetime.now(timezone.utc) - timedelta(days=7)).isoformat()
    sessions_resp = supabase.table("practice_sessions") \
        .select("student_id, duration_minutes, self_rating") \
        .gte("completed_at", week_ago) \
        .not_("completed_at", "is", None) \
        .execute()
    sessions = sessions_resp.data or []

    sessions_df = pd.DataFrame(sessions) if sessions else pd.DataFrame(
        columns=["student_id", "duration_minutes", "self_rating"]
    )

    # Build feature rows
    rows = []
    student_ids = []
    for p in profiles:
        sid = p["id"]
        level = p.get("level") or 1
        student_sessions = sessions_df[sessions_df["student_id"] == sid]
        n = len(student_sessions)
        weekly_min = float(student_sessions["duration_minutes"].sum()) if n > 0 else 0.0
        avg_rating = student_sessions["self_rating"].dropna().mean() if n > 0 else None

        rows.append(build_feature_row(
            current_level=level,
            sessions_this_week=n,
            weekly_minutes=weekly_min,
            avg_rating=avg_rating if not pd.isna(avg_rating) else None,
        ))
        student_ids.append(sid)

    if not rows:
        return {"students_updated": 0, "model": MODEL_NAME, "accuracy": MODEL_ACCURACY}

    X = pd.DataFrame(rows)[FEATURE_COLS]
    predictions = model.predict(X)

    updated = 0
    for sid, pred in zip(student_ids, predictions):
        supabase.table("profiles") \
            .update({"recommended_level": int(pred)}) \
            .eq("id", sid) \
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

- [ ] **Step 4: Run tests**

```bash
cd C:\Users\HP\Downloads\practice5\crew
python -m pytest tests/test_predict_and_update.py -v
```

Expected:
```
test_rating_to_score_easy PASSED
test_rating_to_score_ok PASSED
test_rating_to_score_hard PASSED
test_rating_to_score_none PASSED
test_build_feature_row_basic PASSED
5 passed
```

- [ ] **Step 5: Commit**

```bash
cd C:\Users\HP\Downloads\practice5
git add crew/predict_and_update.py crew/tests/test_predict_and_update.py crew/outputs/model.pkl
git commit -m "feat: add ML prediction script + commit model.pkl"
```

---

### Task 3: Add Prediction Button to Streamlit

**Files:**
- Modify: `crew/streamlit_app.py` (after line 86, before the display outputs section)

- [ ] **Step 1: Add the prediction section**

In `crew/streamlit_app.py`, find this line:
```python
    st.balloons()
```

Add the following **immediately after** `st.balloons()` and **before** the `# Display outputs if they exist` comment:

```python
    st.divider()
    st.subheader("🤖 עדכון רמות מומלצות בדשבורד")
    st.caption("מריץ את מודל ה-ML על נתוני התלמידים האמיתיים ומעדכן את דשבורד המורה")
    if st.button("עדכן רמות מומלצות", key="predict_after_train"):
        with st.spinner("מריץ ניבויים..."):
            from predict_and_update import run_predictions
            result = run_predictions()
        st.success(
            f"✅ עודכנו {result['students_updated']} תלמידים | "
            f"מודל: {result['model']} | "
            f"Accuracy: {result['accuracy']:.1%}"
        )
```

Also add a **standalone section** at the bottom of `tab1`, after all the `if Path(...).exists()` blocks:

```python
    st.divider()
    st.subheader("🤖 עדכון רמות מומלצות בדשבורד")
    st.caption("ניתן לעדכן את הרמות המומלצות גם ללא הרצת ניתוח מחדש, אם המודל כבר קיים")
    if st.button("עדכן רמות מומלצות", key="predict_standalone"):
        model_path = Path("outputs/model.pkl")
        if not model_path.exists():
            st.error("⚠️ קובץ model.pkl לא נמצא. הפעילי ניתוח מלא קודם.")
        else:
            with st.spinner("מריץ ניבויים..."):
                from predict_and_update import run_predictions
                result = run_predictions()
            st.success(
                f"✅ עודכנו {result['students_updated']} תלמידים | "
                f"מודל: {result['model']} | "
                f"Accuracy: {result['accuracy']:.1%}"
            )
```

- [ ] **Step 2: Test manually**

```bash
cd C:\Users\HP\Downloads\practice5\crew
streamlit run streamlit_app.py --browser.gatherUsageStats false
```

Navigate to tab "מורה / מנהל", scroll to bottom, click "עדכן רמות מומלצות".
Expected: success message with number of students updated.

- [ ] **Step 3: Verify in Supabase**

In Supabase → Table Editor → `profiles`:
- Check that `recommended_level` is now filled for student rows.

In `ml_runs`:
- Check that a new row was inserted with `model_name`, `accuracy`, `students_updated`.

- [ ] **Step 4: Commit**

```bash
cd C:\Users\HP\Downloads\practice5
git add crew/streamlit_app.py
git commit -m "feat: add ML prediction button to Streamlit"
```

---

### Task 4: Update Teacher Dashboard

**Files:**
- Modify: `app/(teacher)/dashboard/page.tsx`
- Modify: `components/teacher/StudentCard.tsx`

#### Part A — StudentCard gets `recommendedLevel` prop

- [ ] **Step 1: Add `recommendedLevel` to StudentCard props**

In `components/teacher/StudentCard.tsx`, find:

```typescript
interface StudentCardProps {
  name: string;
  level: number;
  xp: number;
  sessionCount: number;
  lastSession: LastSession | null;
  avgRating?: number;
  sessions?: Session[];
}
```

Replace with:

```typescript
interface StudentCardProps {
  name: string;
  level: number;
  xp: number;
  sessionCount: number;
  lastSession: LastSession | null;
  avgRating?: number;
  sessions?: Session[];
  recommendedLevel?: number | null;
}
```

- [ ] **Step 2: Add destructuring + badge display**

Find:
```typescript
export default function StudentCard({
  name,
  level,
  xp,
  sessionCount,
  lastSession,
  avgRating,
  sessions = [],
}: StudentCardProps) {
```

Replace with:
```typescript
export default function StudentCard({
  name,
  level,
  xp,
  sessionCount,
  lastSession,
  avgRating,
  sessions = [],
  recommendedLevel,
}: StudentCardProps) {
```

- [ ] **Step 3: Find where avgRating badge is rendered and add recommendedLevel badge**

Find the JSX section where `badge` is rendered (search for `badge.emoji`). Add after it:

```tsx
{recommendedLevel != null && (
  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${
    recommendedLevel > level
      ? "bg-green-50 text-green-700 border-green-300"
      : recommendedLevel < level
      ? "bg-orange-50 text-orange-700 border-orange-300"
      : "bg-gray-100 text-gray-500 border-gray-200"
  }`}>
    {recommendedLevel > level ? "⬆️" : recommendedLevel < level ? "⬇️" : "🟰"} רמה מומלצת: {recommendedLevel}
  </span>
)}
```

#### Part B — Dashboard reads from Supabase

- [ ] **Step 4: Add data fetches to `dashboard/page.tsx`**

Find the line:
```typescript
  const studentList = students ?? [];
```

Add after it:

```typescript
  // Fetch recommended_level from ML predictions
  const { data: profilesWithML } = await supabase
    .from("profiles")
    .select("id, recommended_level")
    .eq("role", "student") as {
      data: { id: string; recommended_level: number | null }[] | null;
    };

  const recommendedLevelMap = new Map<string, number | null>(
    (profilesWithML ?? []).map(p => [p.id, p.recommended_level])
  );

  // Fetch last ML run for info banner
  const { data: lastMLRun } = await supabase
    .from("ml_runs")
    .select("model_name, accuracy, predicted_at, students_updated")
    .order("predicted_at", { ascending: false })
    .limit(1)
    .maybeSingle() as {
      data: {
        model_name: string;
        accuracy: number;
        predicted_at: string;
        students_updated: number;
      } | null;
    };
```

- [ ] **Step 5: Add ML info banner to JSX**

Find:
```tsx
      {/* Stats */}
      <div className="mt-4">
```

Add **before** it:

```tsx
      {/* ML Info Banner */}
      {lastMLRun && (
        <div className="mx-4 mt-3 bg-purple-50 border border-purple-200 rounded-xl px-4 py-2.5 flex flex-wrap gap-x-4 gap-y-1 text-xs text-purple-800">
          <span className="font-semibold">🤖 מודל ML</span>
          <span>{lastMLRun.model_name}</span>
          <span>דיוק: {Math.round(lastMLRun.accuracy * 100)}%</span>
          <span>עודכן: {new Date(lastMLRun.predicted_at).toLocaleDateString("he-IL")}</span>
          <span>{lastMLRun.students_updated} תלמידים</span>
        </div>
      )}
```

- [ ] **Step 6: Pass `recommendedLevel` to StudentCard**

Find:
```tsx
              <StudentCard
                key={student.id}
                name={student.name}
                level={student.level}
                xp={student.xp}
                sessionCount={sessionCountMap.get(student.id) ?? 0}
                lastSession={lastSessionMap.get(student.id) ?? null}
                avgRating={ratingMap.get(student.id)}
                sessions={sessionHistoryMap.get(student.id) ?? []}
              />
```

Replace with:
```tsx
              <StudentCard
                key={student.id}
                name={student.name}
                level={student.level}
                xp={student.xp}
                sessionCount={sessionCountMap.get(student.id) ?? 0}
                lastSession={lastSessionMap.get(student.id) ?? null}
                avgRating={ratingMap.get(student.id)}
                sessions={sessionHistoryMap.get(student.id) ?? []}
                recommendedLevel={recommendedLevelMap.get(student.id) ?? null}
              />
```

- [ ] **Step 7: Build and verify**

```bash
cd C:\Users\HP\Downloads\practice5
npm run build
```

Expected: no TypeScript errors, build succeeds.

- [ ] **Step 8: Commit**

```bash
git add components/teacher/StudentCard.tsx app/(teacher)/dashboard/page.tsx
git commit -m "feat: show ML recommended_level in teacher dashboard"
```

---

### Task 5: Deploy Streamlit to Streamlit Cloud

**Files:**
- Create: `crew/requirements-streamlit.txt` (if needed)
- No code changes

- [ ] **Step 1: Make sure model.pkl is committed**

```bash
cd C:\Users\HP\Downloads\practice5
git status crew/outputs/model.pkl
```

Expected: `nothing to commit` (already committed in Task 2).

- [ ] **Step 2: Go to Streamlit Cloud**

Open browser → [https://share.streamlit.io](https://share.streamlit.io)
Sign in with your GitHub account.

- [ ] **Step 3: Create new app**

Click "New app" →
- Repository: your GitHub repo
- Branch: `main`
- Main file path: `crew/streamlit_app.py`
- Click "Advanced settings"

- [ ] **Step 4: Add secrets**

In "Secrets" section, paste:

```toml
SUPABASE_URL = "your-supabase-url"
SUPABASE_KEY = "your-supabase-anon-key"
ANTHROPIC_API_KEY = "your-anthropic-key"
```

Click "Save" → "Deploy".

- [ ] **Step 5: Wait for deployment**

Streamlit Cloud will install dependencies and start the app (2–5 minutes).
Expected: green "Running" status + public URL like `https://practice5-crew.streamlit.app`

- [ ] **Step 6: Test from a different browser / incognito**

Open the Streamlit URL in incognito mode.
Click "עדכן רמות מומלצות".
Expected: success message.

Open the Next.js dashboard → verify ML banner appears + recommended levels updated.

- [ ] **Step 7: Push final state**

```bash
cd C:\Users\HP\Downloads\practice5
git push origin main
```

---

## Done ✅

After all 5 tasks:
- `recommend_level` in each StudentCard comes from the real ML model
- ML info banner shows model name, accuracy, last update date
- Predictions can be triggered from any computer via the Streamlit Cloud URL
- All code is in git, all secrets are in Streamlit Cloud settings
