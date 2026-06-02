import numpy as np
import pandas as pd
from pathlib import Path

COLUMNS = [
    "student_id", "years_experience", "weekly_practice_minutes",
    "bow_control_score", "intonation_score", "rhythm_score",
    "sight_reading_score", "scale_accuracy", "current_level",
    "sessions_this_week", "recommended_difficulty",
]


def generate(n: int = 200, seed: int = 42) -> pd.DataFrame:
    rng = np.random.default_rng(seed)

    years = rng.uniform(0.5, 15, n)
    practice = (years * 25 + rng.normal(0, 30, n)).clip(30, 600).astype(int)

    def score(base, noise_std: float = 12) -> np.ndarray:
        raw = (base / 15) * 80 + (practice / 600) * 20 + rng.normal(0, noise_std, n)
        return raw.clip(0, 100).astype(int)

    bow = score(years)
    intonation = score(years, noise_std=15)
    rhythm = score(years, noise_std=10)
    sight = score(years, noise_std=18)
    scales = score(years, noise_std=10)

    current_level = np.digitize(years, [0, 2, 4, 7, 11]).clip(1, 5)
    sessions = rng.integers(0, 8, n)

    avg_score = (bow + intonation + rhythm + sight + scales) / 5
    recommended = current_level.copy().astype(int)
    recommended = np.where(avg_score > 70, (current_level + 1).clip(1, 5), recommended)
    recommended = np.where(avg_score < 40, (current_level - 1).clip(1, 5), recommended)

    return pd.DataFrame({
        "student_id": range(1, n + 1),
        "years_experience": years.round(1),
        "weekly_practice_minutes": practice,
        "bow_control_score": bow,
        "intonation_score": intonation,
        "rhythm_score": rhythm,
        "sight_reading_score": sight,
        "scale_accuracy": scales,
        "current_level": current_level,
        "sessions_this_week": sessions,
        "recommended_difficulty": recommended,
    })


def save(df: pd.DataFrame, path: str = "data/raw_data.csv") -> None:
    Path(path).parent.mkdir(parents=True, exist_ok=True)
    df.to_csv(path, index=False)


if __name__ == "__main__":
    df = generate()
    save(df)
    print(f"Generated {len(df)} rows → data/raw_data.csv")
