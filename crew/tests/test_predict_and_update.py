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

def test_rating_to_score_none_avg():
    """build_feature_row with None avg_rating should not crash."""
    row = build_feature_row(
        current_level=2,
        sessions_this_week=0,
        weekly_minutes=0.0,
        avg_rating=None,
    )
    assert row["bow_control_score"] == 50.0
    assert row["avg_score"] == 50.0

def test_build_feature_row_keys():
    """All 10 expected feature keys must be present."""
    expected_keys = {
        "years_experience", "weekly_practice_minutes", "bow_control_score",
        "intonation_score", "rhythm_score", "sight_reading_score",
        "scale_accuracy", "current_level", "sessions_this_week", "avg_score",
    }
    row = build_feature_row(current_level=1, sessions_this_week=2, weekly_minutes=30.0, avg_rating=1.5)
    assert set(row.keys()) == expected_keys
