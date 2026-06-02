import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))


def test_flow_module_imports():
    from flow import ViolinAnalysisFlow, run_flow
    assert ViolinAnalysisFlow is not None
    assert callable(run_flow)


def test_flow_has_correct_methods():
    from flow import ViolinAnalysisFlow
    flow = ViolinAnalysisFlow()
    assert hasattr(flow, "run_analyst")
    assert hasattr(flow, "run_scientist")


def test_tools_pipeline_without_llm(tmp_path):
    """Integration test: run all tool functions directly (no LLM needed)."""
    import os
    os.chdir(tmp_path)
    (tmp_path / "data").mkdir()
    (tmp_path / "outputs").mkdir()

    from generate_synthetic import generate, save
    from tools.data_tools import clean_data, run_eda, write_contract
    from tools.model_tools import train_models, save_best_model, write_evaluation

    df = generate(n=80)
    save(df, "data/raw_data.csv")
    clean_data("data/raw_data.csv", "data/clean_data.csv")
    run_eda("data/clean_data.csv", "outputs")
    write_contract("data/clean_data.csv", "outputs")
    results = train_models("data/clean_data.csv", "outputs/dataset_contract.json")
    save_best_model(results, "outputs")
    write_evaluation(results, "outputs")

    assert Path("data/clean_data.csv").exists()
    assert Path("outputs/eda_report.html").exists()
    assert Path("outputs/insights.md").exists()
    assert Path("outputs/dataset_contract.json").exists()
    assert Path("outputs/model.pkl").exists()
    assert Path("outputs/model_card.md").exists()
    assert Path("outputs/evaluation_report.md").exists()
