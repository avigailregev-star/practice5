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
    """Convert avg self_rating (1–3) to 0–100 score (inverted: 1→75, 2→50, 3→25). None/NaN → 50."""
    if avg_rating is None:
        return 50.0
    try:
        if pd.isna(avg_rating):
            return 50.0
    except (TypeError, ValueError):
        pass
    # rating 1 → 75, rating 2 → 50, rating 3 → 25
    return round((4.0 - float(avg_rating)) * 25.0, 1)


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
    if not MODEL_PATH.exists():
        raise FileNotFoundError(f"model.pkl not found at {MODEL_PATH}. Run full analysis first.")
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
            avg_rating=avg_rating if (avg_rating is not None and not pd.isna(avg_rating)) else None,
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
