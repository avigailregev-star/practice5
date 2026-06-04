"""
Fetches real practice session data from Supabase and maps it to the violin student schema.
Violin-specific scores (bow control, intonation, etc.) are not stored in Supabase,
so they are estimated from the student's level with realistic noise added.
"""
import os
from pathlib import Path

import numpy as np
import pandas as pd
from dotenv import load_dotenv
from supabase import create_client

load_dotenv()

SCORE_COLS = [
    "bow_control_score", "intonation_score", "rhythm_score",
    "sight_reading_score", "scale_accuracy",
]


def fetch_from_supabase(output_path: str = "data/raw_data.csv") -> str:
    url = os.environ.get("SUPABASE_URL")
    key = os.environ.get("SUPABASE_KEY")
    if not url or not key:
        return "שגיאה: מפתחות Supabase לא מוגדרים. אנא הגדירי SUPABASE_URL ו-SUPABASE_KEY בקובץ .env"
    client = create_client(url, key)

    response = client.table("practice_sessions").select("*").execute()
    sessions = response.data
    if not sessions:
        return "No sessions found in Supabase."

    df = pd.DataFrame(sessions)

    result = pd.DataFrame()
    result["student_id"] = df["student_id"]
    result["years_experience"] = 3.0  # not stored in Supabase, use median

    level_col = df.get("difficulty_level", pd.Series([3] * len(df)))
    result["current_level"] = pd.to_numeric(level_col, errors="coerce").fillna(3).clip(1, 5).astype(int)

    if "student_id" in df.columns and "id" in df.columns:
        result["sessions_this_week"] = df.groupby("student_id")["id"].transform("count").clip(0, 7)
    else:
        result["sessions_this_week"] = 3

    duration = pd.to_numeric(df.get("duration_minutes", pd.Series([10] * len(df))), errors="coerce").fillna(10)
    result["weekly_practice_minutes"] = (duration * result["sessions_this_week"]).clip(30, 600).astype(int)

    # Estimate violin-specific scores from level + noise (not in Supabase)
    rng = np.random.default_rng(42)
    n = len(result)
    for col in SCORE_COLS:
        base = result["current_level"] * 14 + 10
        noise = rng.normal(0, 10, n)
        result[col] = (base + noise).clip(0, 100).astype(int)

    # recommended_difficulty: bump up if practicing a lot
    result["recommended_difficulty"] = result["current_level"].values.copy()
    mask = result["sessions_this_week"] > 3
    result.loc[mask, "recommended_difficulty"] = (result.loc[mask, "current_level"] + 1).clip(1, 5)

    Path(output_path).parent.mkdir(parents=True, exist_ok=True)
    result.to_csv(output_path, index=False)
    return f"Fetched {len(result)} sessions from Supabase → {output_path}"


if __name__ == "__main__":
    print(fetch_from_supabase())
