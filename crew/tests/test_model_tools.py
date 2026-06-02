import sys
import joblib
import pytest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))
from tools.model_tools import train_models, save_best_model, write_evaluation
from tools.data_tools import clean_data, write_contract
from generate_synthetic import generate, save


@pytest.fixture
def prepared(tmp_path):
    df = generate(n=100)
    raw = str(tmp_path / "raw.csv")
    clean = str(tmp_path / "clean.csv")
    outdir = str(tmp_path / "outputs")
    save(df, raw)
    clean_data(raw, clean)
    write_contract(clean, outdir)
    return {"clean": clean, "contract": f"{outdir}/dataset_contract.json", "outdir": outdir}


def test_train_models_returns_both(prepared):
    results = train_models(prepared["clean"], prepared["contract"])
    assert "Decision Tree" in results
    assert "Random Forest" in results


def test_best_model_is_one_of_two(prepared):
    results = train_models(prepared["clean"], prepared["contract"])
    assert results["best"] in ("Decision Tree", "Random Forest")


def test_accuracy_above_zero(prepared):
    results = train_models(prepared["clean"], prepared["contract"])
    for name in ("Decision Tree", "Random Forest"):
        assert results[name]["accuracy"] > 0


def test_save_creates_pkl(prepared):
    results = train_models(prepared["clean"], prepared["contract"])
    save_best_model(results, prepared["outdir"])
    assert Path(prepared["outdir"], "model.pkl").exists()


def test_saved_model_is_loadable(prepared):
    results = train_models(prepared["clean"], prepared["contract"])
    save_best_model(results, prepared["outdir"])
    model = joblib.load(Path(prepared["outdir"], "model.pkl"))
    assert hasattr(model, "predict")


def test_write_evaluation_creates_files(prepared):
    results = train_models(prepared["clean"], prepared["contract"])
    write_evaluation(results, prepared["outdir"])
    assert Path(prepared["outdir"], "model_card.md").exists()
    assert Path(prepared["outdir"], "evaluation_report.md").exists()
