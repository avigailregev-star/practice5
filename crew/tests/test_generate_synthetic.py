import sys
from pathlib import Path
import pandas as pd
import pytest

sys.path.insert(0, str(Path(__file__).parent.parent))
from generate_synthetic import generate, save, COLUMNS


def test_generate_returns_200_rows():
    df = generate(n=200)
    assert len(df) == 200


def test_generate_has_correct_columns():
    df = generate()
    assert list(df.columns) == COLUMNS


def test_scores_in_valid_range():
    df = generate()
    for col in ["bow_control_score", "intonation_score", "rhythm_score",
                "sight_reading_score", "scale_accuracy"]:
        assert df[col].between(0, 100).all(), f"{col} out of range"


def test_levels_in_valid_range():
    df = generate()
    assert df["current_level"].between(1, 5).all()
    assert df["recommended_difficulty"].between(1, 5).all()


def test_no_nulls():
    df = generate()
    assert df.isnull().sum().sum() == 0


def test_save_creates_file(tmp_path):
    df = generate(n=10)
    path = str(tmp_path / "test.csv")
    save(df, path)
    loaded = pd.read_csv(path)
    assert len(loaded) == 10
