import sys
import json
import pytest
import pandas as pd
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))
from tools.data_tools import clean_data, run_eda, write_contract
from generate_synthetic import generate, save


@pytest.fixture
def sample_csv(tmp_path):
    df = generate(n=50)
    path = str(tmp_path / "raw.csv")
    save(df, path)
    return path


def test_clean_data_creates_file(sample_csv, tmp_path):
    out = str(tmp_path / "clean.csv")
    result = clean_data(sample_csv, out)
    assert Path(out).exists()
    assert "50" in result


def test_clean_data_no_nulls(sample_csv, tmp_path):
    out = str(tmp_path / "clean.csv")
    clean_data(sample_csv, out)
    df = pd.read_csv(out)
    assert df.isnull().sum().sum() == 0


def test_clean_data_scores_clamped(sample_csv, tmp_path):
    out = str(tmp_path / "clean.csv")
    clean_data(sample_csv, out)
    df = pd.read_csv(out)
    for col in ["bow_control_score", "intonation_score", "rhythm_score",
                "sight_reading_score", "scale_accuracy"]:
        assert df[col].between(0, 100).all(), f"{col} out of range"


def test_run_eda_creates_html(sample_csv, tmp_path):
    clean = str(tmp_path / "clean.csv")
    outdir = str(tmp_path / "outputs")
    clean_data(sample_csv, clean)
    run_eda(clean, outdir)
    assert Path(outdir, "eda_report.html").exists()
    assert Path(outdir, "insights.md").exists()


def test_run_eda_html_has_images(sample_csv, tmp_path):
    clean = str(tmp_path / "clean.csv")
    outdir = str(tmp_path / "outputs")
    clean_data(sample_csv, clean)
    run_eda(clean, outdir)
    html = Path(outdir, "eda_report.html").read_text(encoding="utf-8")
    assert "data:image/png;base64," in html


def test_write_contract_creates_json(sample_csv, tmp_path):
    clean = str(tmp_path / "clean.csv")
    outdir = str(tmp_path / "outputs")
    clean_data(sample_csv, clean)
    write_contract(clean, outdir)
    contract_path = Path(outdir, "dataset_contract.json")
    assert contract_path.exists()
    contract = json.loads(contract_path.read_text())
    assert contract["validated"] is True
    assert contract["target_column"] == "recommended_difficulty"
    assert "bow_control_score" in contract["feature_columns"]
