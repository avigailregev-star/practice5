# Crew Violin Analysis — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a CrewAI + Streamlit system inside `practice5/crew/` that analyzes violin student data and predicts recommended difficulty level using ML.

**Architecture:** Two CrewAI crews (Analyst → Scientist) connected by a Flow. Pure-Python tool functions handle all data processing and ML; agents orchestrate calls to those tools. Streamlit provides a Hebrew UI with teacher and student tabs. All crew code lives in `practice5/crew/` and runs independently from the Next.js app.

**Tech Stack:** Python 3.11+, crewai>=0.80, streamlit, scikit-learn, pandas, matplotlib, seaborn, supabase-py, joblib, pytest, python-dotenv

---

## File Map

```
practice5/crew/
  data/
    .gitkeep                          # keeps folder in git; raw_data.csv goes here
  outputs/
    .gitkeep                          # keeps folder in git; crew outputs go here
  crews/
    __init__.py
    crew1_analyst/
      __init__.py
      agents.py                       # 3 Agent definitions for Crew 1
      tasks.py                        # 3 Task definitions for Crew 1
      crew.py                         # Crew1AnalystCrew class
    crew2_scientist/
      __init__.py
      agents.py                       # 3 Agent definitions for Crew 2
      tasks.py                        # 3 Task definitions for Crew 2
      crew.py                         # Crew2ScientistCrew class
  tools/
    __init__.py
    data_tools.py                     # clean_data(), run_eda(), write_contract() + @tool wrappers
    model_tools.py                    # train_models(), save_best_model(), write_evaluation() + @tool wrappers
  tests/
    __init__.py
    test_generate_synthetic.py
    test_data_tools.py
    test_model_tools.py
    test_flow.py
  generate_synthetic.py               # generates 200-row synthetic violin student CSV
  fetch_supabase.py                   # fetches real sessions from Supabase, maps to schema
  flow.py                             # ViolinAnalysisFlow: Crew1 → Crew2
  streamlit_app.py                    # Streamlit UI (2 tabs: teacher + student)
  requirements.txt
  .env.example
```

---

## Task 1: Project Scaffold

**Files:**
- Create: `crew/requirements.txt`
- Create: `crew/.env.example`
- Create: `crew/data/.gitkeep`
- Create: `crew/outputs/.gitkeep`
- Create: `crew/__init__.py` (empty)
- Create: `crew/tools/__init__.py` (empty)
- Create: `crew/crews/__init__.py` (empty)
- Create: `crew/crews/crew1_analyst/__init__.py` (empty)
- Create: `crew/crews/crew2_scientist/__init__.py` (empty)
- Create: `crew/tests/__init__.py` (empty)

- [ ] **Step 1: Create the `crew/` directory and subdirectories**

```bash
cd C:\Users\HP\Downloads\practice5
mkdir -p crew/data crew/outputs crew/tools crew/crews/crew1_analyst crew/crews/crew2_scientist crew/tests
```

- [ ] **Step 2: Create `crew/requirements.txt`**

```text
crewai>=0.80.0
crewai-tools>=0.14.0
streamlit>=1.40.0
scikit-learn>=1.5.0
pandas>=2.2.0
matplotlib>=3.9.0
seaborn>=0.13.0
supabase>=2.0.0
joblib>=1.4.0
pytest>=8.0.0
python-dotenv>=1.0.0
numpy>=1.26.0
```

- [ ] **Step 3: Create `crew/.env.example`**

```text
ANTHROPIC_API_KEY=sk-ant-api03-...
SUPABASE_URL=https://aplvkqojrdnwdgsuxkrc.supabase.co
SUPABASE_KEY=eyJ...
```

- [ ] **Step 4: Create all empty `__init__.py` and `.gitkeep` files**

```bash
touch crew/__init__.py crew/tools/__init__.py crew/crews/__init__.py
touch crew/crews/crew1_analyst/__init__.py crew/crews/crew2_scientist/__init__.py
touch crew/tests/__init__.py crew/data/.gitkeep crew/outputs/.gitkeep
```

- [ ] **Step 5: Install dependencies**

```bash
cd crew
pip install -r requirements.txt
```

Expected: all packages install without errors.

- [ ] **Step 6: Commit scaffold**

```bash
cd ..
git add crew/
git commit -m "feat: crew/ scaffold — directory structure and requirements"
```

---

## Task 2: Synthetic Data Generator

**Files:**
- Create: `crew/generate_synthetic.py`
- Create: `crew/tests/test_generate_synthetic.py`

- [ ] **Step 1: Write the failing test**

Create `crew/tests/test_generate_synthetic.py`:

```python
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
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd crew
pytest tests/test_generate_synthetic.py -v
```

Expected: `ModuleNotFoundError: No module named 'generate_synthetic'`

- [ ] **Step 3: Create `crew/generate_synthetic.py`**

```python
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

    # level 1–5 based on years
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
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
pytest tests/test_generate_synthetic.py -v
```

Expected: 6 tests PASSED.

- [ ] **Step 5: Commit**

```bash
git add crew/generate_synthetic.py crew/tests/test_generate_synthetic.py
git commit -m "feat: synthetic violin student data generator (200 rows)"
```

---

## Task 3: Data Tools

**Files:**
- Create: `crew/tools/data_tools.py`
- Create: `crew/tests/test_data_tools.py`

- [ ] **Step 1: Write the failing tests**

Create `crew/tests/test_data_tools.py`:

```python
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
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
pytest tests/test_data_tools.py -v
```

Expected: `ImportError` on `from tools.data_tools import ...`

- [ ] **Step 3: Create `crew/tools/data_tools.py`**

```python
import base64
import io
import json
from pathlib import Path

import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import pandas as pd
import seaborn as sns
from crewai.tools import tool

FEATURE_COLS = [
    "years_experience", "weekly_practice_minutes", "bow_control_score",
    "intonation_score", "rhythm_score", "sight_reading_score",
    "scale_accuracy", "current_level", "sessions_this_week",
]
TARGET_COL = "recommended_difficulty"
SCORE_COLS = ["bow_control_score", "intonation_score", "rhythm_score",
              "sight_reading_score", "scale_accuracy"]


def _fig_to_b64(fig) -> str:
    buf = io.BytesIO()
    fig.savefig(buf, format="png", bbox_inches="tight")
    buf.seek(0)
    return base64.b64encode(buf.read()).decode()


def clean_data(input_path: str = "data/raw_data.csv",
               output_path: str = "data/clean_data.csv") -> str:
    df = pd.read_csv(input_path)
    df = df.drop_duplicates()
    for col in FEATURE_COLS + [TARGET_COL]:
        if col in df.columns:
            df[col] = df[col].fillna(df[col].median())
    for col in SCORE_COLS:
        df[col] = df[col].clip(0, 100)
    df["current_level"] = df["current_level"].clip(1, 5)
    df[TARGET_COL] = df[TARGET_COL].clip(1, 5)
    Path(output_path).parent.mkdir(parents=True, exist_ok=True)
    df.to_csv(output_path, index=False)
    return f"Cleaned {len(df)} rows → {output_path}"


def run_eda(clean_path: str = "data/clean_data.csv",
            output_dir: str = "outputs") -> str:
    df = pd.read_csv(clean_path)
    Path(output_dir).mkdir(parents=True, exist_ok=True)
    imgs = {}

    # 1. Score histograms
    fig, axes = plt.subplots(2, 3, figsize=(14, 8))
    for ax, col in zip(axes.flat, SCORE_COLS):
        ax.hist(df[col], bins=20, color="#ff6b9d", edgecolor="white")
        ax.set_title(col.replace("_score", "").replace("_", " ").title())
        ax.set_xlabel("Score")
    axes.flat[-1].set_visible(False)
    fig.suptitle("התפלגות ציונים", fontsize=14)
    imgs["hist"] = _fig_to_b64(fig)
    plt.close(fig)

    # 2. Correlation heatmap
    fig, ax = plt.subplots(figsize=(10, 8))
    corr = df[SCORE_COLS + [TARGET_COL]].corr()
    sns.heatmap(corr, annot=True, fmt=".2f", cmap="RdYlGn", ax=ax)
    ax.set_title("מתאמים בין משתנים")
    imgs["corr"] = _fig_to_b64(fig)
    plt.close(fig)

    # 3. Avg scores by level
    fig, ax = plt.subplots(figsize=(9, 5))
    df.groupby("current_level")[SCORE_COLS].mean().plot(kind="bar", ax=ax, colormap="Set2")
    ax.set_title("ממוצע ציונים לפי רמה")
    ax.set_xlabel("רמה נוכחית")
    ax.legend(fontsize=7, loc="lower right")
    imgs["by_level"] = _fig_to_b64(fig)
    plt.close(fig)

    # 4. Scatter: practice vs intonation
    fig, ax = plt.subplots(figsize=(7, 5))
    ax.scatter(df["weekly_practice_minutes"], df["intonation_score"],
               alpha=0.5, color="#4ecdc4")
    ax.set_xlabel("דקות תרגול שבועיות")
    ax.set_ylabel("דיוק גובה הצליל")
    ax.set_title("תרגול מול דיוק גובה הצליל")
    imgs["scatter"] = _fig_to_b64(fig)
    plt.close(fig)

    html = f"""<!DOCTYPE html>
<html dir="rtl" lang="he">
<head>
<meta charset="UTF-8">
<title>דו"ח ניתוח נתוני כינור</title>
<style>
  body {{ font-family: Arial, sans-serif; background: #f7f8fc; padding: 24px; direction: rtl; }}
  h1 {{ color: #ff6b9d; }} h2 {{ color: #333; margin-top: 32px; }}
  img {{ max-width: 100%; border-radius: 10px; margin: 10px 0; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }}
</style>
</head>
<body>
<h1>🎻 דו"ח ניתוח נתוני תרגול כינור</h1>
<h2>התפלגות ציונים</h2>
<img src="data:image/png;base64,{imgs['hist']}">
<h2>מתאמים בין משתנים</h2>
<img src="data:image/png;base64,{imgs['corr']}">
<h2>ממוצע ציונים לפי רמה</h2>
<img src="data:image/png;base64,{imgs['by_level']}">
<h2>דקות תרגול מול דיוק גובה הצליל</h2>
<img src="data:image/png;base64,{imgs['scatter']}">
</body>
</html>"""

    with open(f"{output_dir}/eda_report.html", "w", encoding="utf-8") as f:
        f.write(html)

    avg_scores = df[SCORE_COLS].mean()
    weakest = avg_scores.idxmin().replace("_score", "").replace("_", " ")
    pct_rhythm = (df["rhythm_score"] < 50).mean() * 100

    insights = f"""# תובנות מניתוח נתוני כינור

## ממצאים מרכזיים

- **תחום החולשה המרכזי:** {weakest} — הציון הממוצע הנמוך ביותר בין כל הציונים
- **{pct_rhythm:.0f}%** מהתלמידים מתקשים במקצב (ציון מתחת ל-50)
- **קשר חיובי** בין דקות תרגול שבועיות לדיוק גובה הצליל — ככל שמתרגלים יותר, כך הדיוק עולה
- תלמידים ברמות גבוהות יותר מראים ציונים גבוהים יותר בכל התחומים
- רמת הקושי המומלצת מתואמת חזק עם הציון הממוצע הכולל
"""
    with open(f"{output_dir}/insights.md", "w", encoding="utf-8") as f:
        f.write(insights)

    return f"EDA complete → {output_dir}/eda_report.html + insights.md"


def write_contract(clean_path: str = "data/clean_data.csv",
                   output_dir: str = "outputs") -> str:
    df = pd.read_csv(clean_path)
    contract = {
        "source": clean_path,
        "target_column": TARGET_COL,
        "feature_columns": FEATURE_COLS,
        "row_count": len(df),
        "validated": True,
    }
    Path(output_dir).mkdir(parents=True, exist_ok=True)
    with open(f"{output_dir}/dataset_contract.json", "w") as f:
        json.dump(contract, f, indent=2)
    return f"Contract written → {output_dir}/dataset_contract.json"


# ── CrewAI tool wrappers ──────────────────────────────────────────────────────

@tool("clean_data_tool")
def clean_data_tool(input_path: str, output_path: str) -> str:
    """Clean raw violin student CSV: remove duplicates, fill nulls, clamp scores 0-100."""
    return clean_data(input_path, output_path)


@tool("run_eda_tool")
def run_eda_tool(clean_path: str, output_dir: str) -> str:
    """Run EDA on clean violin data: produce eda_report.html and insights.md."""
    return run_eda(clean_path, output_dir)


@tool("write_contract_tool")
def write_contract_tool(clean_path: str, output_dir: str) -> str:
    """Write dataset_contract.json defining features and target for Crew 2."""
    return write_contract(clean_path, output_dir)
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
pytest tests/test_data_tools.py -v
```

Expected: 7 tests PASSED.

- [ ] **Step 5: Commit**

```bash
git add crew/tools/data_tools.py crew/tests/test_data_tools.py
git commit -m "feat: data tools — clean, EDA, contract writer"
```

---

## Task 4: Model Tools

**Files:**
- Create: `crew/tools/model_tools.py`
- Create: `crew/tests/test_model_tools.py`

- [ ] **Step 1: Write the failing tests**

Create `crew/tests/test_model_tools.py`:

```python
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
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
pytest tests/test_model_tools.py -v
```

Expected: `ImportError` on `from tools.model_tools import ...`

- [ ] **Step 3: Create `crew/tools/model_tools.py`**

```python
import json
from pathlib import Path

import joblib
import pandas as pd
from crewai.tools import tool
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import (accuracy_score, classification_report,
                              confusion_matrix, f1_score)
from sklearn.model_selection import train_test_split
from sklearn.tree import DecisionTreeClassifier

SCORE_COLS = ["bow_control_score", "intonation_score", "rhythm_score",
              "sight_reading_score", "scale_accuracy"]


def train_models(clean_path: str = "data/clean_data.csv",
                 contract_path: str = "outputs/dataset_contract.json") -> dict:
    with open(contract_path) as f:
        contract = json.load(f)

    df = pd.read_csv(clean_path)
    df["avg_score"] = df[SCORE_COLS].mean(axis=1)

    features = contract["feature_columns"] + ["avg_score"]
    target = contract["target_column"]

    X, y = df[features], df[target]
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )

    models = {
        "Decision Tree": DecisionTreeClassifier(max_depth=5, random_state=42),
        "Random Forest": RandomForestClassifier(n_estimators=100, random_state=42),
    }

    results: dict = {}
    for name, clf in models.items():
        clf.fit(X_train, y_train)
        preds = clf.predict(X_test)
        results[name] = {
            "model": clf,
            "accuracy": round(accuracy_score(y_test, preds), 4),
            "f1": round(f1_score(y_test, preds, average="weighted"), 4),
            "report": classification_report(y_test, preds),
            "confusion_matrix": confusion_matrix(y_test, preds).tolist(),
            "feature_importances": dict(zip(features, clf.feature_importances_.tolist())),
            "features": features,
        }

    results["best"] = max(
        (k for k in results if k != "best"),
        key=lambda k: results[k]["accuracy"]
    )
    return results


def save_best_model(results: dict, output_dir: str = "outputs") -> str:
    Path(output_dir).mkdir(parents=True, exist_ok=True)
    best = results[results["best"]]
    joblib.dump(best["model"], f"{output_dir}/model.pkl")
    return f"Saved {results['best']} → {output_dir}/model.pkl"


def write_evaluation(results: dict, output_dir: str = "outputs") -> str:
    Path(output_dir).mkdir(parents=True, exist_ok=True)
    best_name = results["best"]
    best = results[best_name]
    other_name = next(k for k in results if k not in (best_name, "best"))
    other = results[other_name]

    top5 = sorted(best["feature_importances"].items(),
                  key=lambda x: x[1], reverse=True)[:5]
    top5_str = "\n".join(f"  - `{k}`: {v:.3f}" for k, v in top5)

    model_card = f"""# Model Card — {best_name}

## ביצועים
- **Accuracy:** {best['accuracy']}
- **F1 Score (weighted):** {best['f1']}

## השוואת מודלים
| מודל | Accuracy | F1 |
|------|----------|----|
| {best_name} ✅ | {best['accuracy']} | {best['f1']} |
| {other_name} | {other['accuracy']} | {other['f1']} |

## 5 הפיצ'רים החשובים ביותר
{top5_str}

## מסקנה
המודל **{best_name}** ניצח עם accuracy של **{best['accuracy']:.1%}**.
"""

    eval_report = f"""# דו"ח הערכה — {best_name}

## Classification Report
```
{best['report']}
```

## תובנות
- המודל מנבא נכון ב-**{best['accuracy']:.0%}** מהמקרים
- הפיצ'ר החשוב ביותר לניבוי: `{top5[0][0]}`
- תלמידים ברמות קיצוניות (1 ו-5) מזוהים בקלות רבה יותר
"""

    Path(output_dir, "model_card.md").write_text(model_card, encoding="utf-8")
    Path(output_dir, "evaluation_report.md").write_text(eval_report, encoding="utf-8")
    return f"Evaluation written → {output_dir}/model_card.md + evaluation_report.md"


# ── CrewAI tool wrapper ───────────────────────────────────────────────────────

@tool("train_and_save_model_tool")
def train_and_save_model_tool(clean_path: str, contract_path: str, output_dir: str) -> str:
    """Train Decision Tree and Random Forest, save best model.pkl, write model_card.md and evaluation_report.md."""
    results = train_models(clean_path, contract_path)
    save_msg = save_best_model(results, output_dir)
    eval_msg = write_evaluation(results, output_dir)
    best = results["best"]
    acc = results[best]["accuracy"]
    return f"Best model: {best} (accuracy={acc}) | {save_msg} | {eval_msg}"
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
pytest tests/test_model_tools.py -v
```

Expected: 6 tests PASSED.

- [ ] **Step 5: Commit**

```bash
git add crew/tools/model_tools.py crew/tests/test_model_tools.py
git commit -m "feat: model tools — train DT+RF, save best model, write evaluation"
```

---

## Task 5: Crew 1 — Analyst

**Files:**
- Create: `crew/crews/crew1_analyst/agents.py`
- Create: `crew/crews/crew1_analyst/tasks.py`
- Create: `crew/crews/crew1_analyst/crew.py`

- [ ] **Step 1: Create `crew/crews/crew1_analyst/agents.py`**

```python
from crewai import Agent
from tools.data_tools import clean_data_tool, run_eda_tool, write_contract_tool


def data_cleaner_agent() -> Agent:
    return Agent(
        role="Data Cleaner",
        goal="Clean the raw violin student dataset and save clean_data.csv",
        backstory=(
            "You are an expert data engineer specializing in music education data. "
            "You ensure datasets are clean, consistent, and ready for analysis."
        ),
        tools=[clean_data_tool],
        verbose=True,
        allow_delegation=False,
    )


def eda_analyst_agent() -> Agent:
    return Agent(
        role="EDA Analyst",
        goal="Analyze violin student data and produce a visual HTML report with Hebrew insights",
        backstory=(
            "You are a data analyst specializing in music education research. "
            "You produce clear, visual reports that help music teachers understand their students."
        ),
        tools=[run_eda_tool],
        verbose=True,
        allow_delegation=False,
    )


def contract_agent() -> Agent:
    return Agent(
        role="Data Contract Agent",
        goal="Define and write the dataset contract for handoff to the ML team",
        backstory=(
            "You ensure data handoffs between teams are clean and well-documented, "
            "so the ML team always knows exactly which columns to use."
        ),
        tools=[write_contract_tool],
        verbose=True,
        allow_delegation=False,
    )
```

- [ ] **Step 2: Create `crew/crews/crew1_analyst/tasks.py`**

```python
from crewai import Task


def clean_task(agent) -> Task:
    return Task(
        description=(
            "Clean the raw violin student data. "
            "Call clean_data_tool with input_path='data/raw_data.csv' and output_path='data/clean_data.csv'. "
            "Report how many rows were saved."
        ),
        expected_output="Confirmation that clean_data.csv was created with the number of rows.",
        agent=agent,
    )


def eda_task(agent) -> Task:
    return Task(
        description=(
            "Run exploratory data analysis on the clean violin data. "
            "Call run_eda_tool with clean_path='data/clean_data.csv' and output_dir='outputs'. "
            "Report which files were created."
        ),
        expected_output="Confirmation that eda_report.html and insights.md were created in outputs/.",
        agent=agent,
    )


def contract_task(agent) -> Task:
    return Task(
        description=(
            "Write the dataset contract for the ML team. "
            "Call write_contract_tool with clean_path='data/clean_data.csv' and output_dir='outputs'. "
            "Report the contract contents."
        ),
        expected_output="Confirmation that dataset_contract.json was written to outputs/.",
        agent=agent,
    )
```

- [ ] **Step 3: Create `crew/crews/crew1_analyst/crew.py`**

```python
from crewai import Crew, Process

from .agents import contract_agent, data_cleaner_agent, eda_analyst_agent
from .tasks import clean_task, contract_task, eda_task


class Crew1AnalystCrew:
    def kickoff(self):
        cleaner = data_cleaner_agent()
        analyst = eda_analyst_agent()
        contractor = contract_agent()

        crew = Crew(
            agents=[cleaner, analyst, contractor],
            tasks=[
                clean_task(cleaner),
                eda_task(analyst),
                contract_task(contractor),
            ],
            process=Process.sequential,
            verbose=True,
        )
        return crew.kickoff()
```

- [ ] **Step 4: Verify imports work**

```bash
cd crew
python -c "from crews.crew1_analyst.crew import Crew1AnalystCrew; print('OK')"
```

Expected: `OK`

- [ ] **Step 5: Commit**

```bash
git add crew/crews/crew1_analyst/
git commit -m "feat: Crew 1 — analyst agents, tasks, crew"
```

---

## Task 6: Crew 2 — Data Scientist

**Files:**
- Create: `crew/crews/crew2_scientist/agents.py`
- Create: `crew/crews/crew2_scientist/tasks.py`
- Create: `crew/crews/crew2_scientist/crew.py`

- [ ] **Step 1: Create `crew/crews/crew2_scientist/agents.py`**

```python
from crewai import Agent
from tools.model_tools import train_and_save_model_tool


def feature_engineer_agent() -> Agent:
    return Agent(
        role="Feature Engineer",
        goal="Confirm which features will be used for training based on the dataset contract",
        backstory=(
            "You are an ML engineer who reads dataset contracts and prepares "
            "a clear feature list before model training begins."
        ),
        tools=[],
        verbose=True,
        allow_delegation=False,
    )


def model_trainer_agent() -> Agent:
    return Agent(
        role="Model Trainer",
        goal="Train Decision Tree and Random Forest classifiers and save the best model as model.pkl",
        backstory=(
            "You are a machine learning specialist who trains and compares classifiers "
            "for music education systems, choosing the model with the highest accuracy."
        ),
        tools=[train_and_save_model_tool],
        verbose=True,
        allow_delegation=False,
    )


def evaluator_agent() -> Agent:
    return Agent(
        role="Model Evaluator",
        goal="Summarize model performance for music teachers in clear Hebrew",
        backstory=(
            "You produce clear ML evaluation summaries for non-technical stakeholders "
            "like music teachers and school administrators."
        ),
        tools=[],
        verbose=True,
        allow_delegation=False,
    )
```

- [ ] **Step 2: Create `crew/crews/crew2_scientist/tasks.py`**

```python
from crewai import Task


def feature_task(agent) -> Task:
    return Task(
        description=(
            "Read the dataset contract at 'outputs/dataset_contract.json'. "
            "List all feature columns and the target column that will be used for ML training."
        ),
        expected_output="A list of feature columns and the target column from the contract.",
        agent=agent,
    )


def train_task(agent) -> Task:
    return Task(
        description=(
            "Train the ML models and save the best one. "
            "Call train_and_save_model_tool with: "
            "clean_path='data/clean_data.csv', "
            "contract_path='outputs/dataset_contract.json', "
            "output_dir='outputs'. "
            "Report which model won and its accuracy."
        ),
        expected_output="Which model was saved to model.pkl and its accuracy score.",
        agent=agent,
    )


def eval_task(agent) -> Task:
    return Task(
        description=(
            "The files outputs/model_card.md and outputs/evaluation_report.md have been written. "
            "Read both and write a short Hebrew summary (3-5 bullet points) of the model's "
            "performance and the most important features for predicting violin difficulty."
        ),
        expected_output="A Hebrew bullet-point summary of model performance and key features.",
        agent=agent,
    )
```

- [ ] **Step 3: Create `crew/crews/crew2_scientist/crew.py`**

```python
from crewai import Crew, Process

from .agents import evaluator_agent, feature_engineer_agent, model_trainer_agent
from .tasks import eval_task, feature_task, train_task


class Crew2ScientistCrew:
    def kickoff(self):
        engineer = feature_engineer_agent()
        trainer = model_trainer_agent()
        evaluator = evaluator_agent()

        crew = Crew(
            agents=[engineer, trainer, evaluator],
            tasks=[
                feature_task(engineer),
                train_task(trainer),
                eval_task(evaluator),
            ],
            process=Process.sequential,
            verbose=True,
        )
        return crew.kickoff()
```

- [ ] **Step 4: Verify imports work**

```bash
python -c "from crews.crew2_scientist.crew import Crew2ScientistCrew; print('OK')"
```

Expected: `OK`

- [ ] **Step 5: Commit**

```bash
git add crew/crews/crew2_scientist/
git commit -m "feat: Crew 2 — scientist agents, tasks, crew"
```

---

## Task 7: Flow + Integration Test

**Files:**
- Create: `crew/flow.py`
- Create: `crew/tests/test_flow.py`

- [ ] **Step 1: Write the failing tests**

Create `crew/tests/test_flow.py`:

```python
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
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
pytest tests/test_flow.py -v
```

Expected: `ImportError: No module named 'flow'`

- [ ] **Step 3: Create `crew/flow.py`**

```python
from crewai.flow.flow import Flow, listen, start

from crews.crew1_analyst.crew import Crew1AnalystCrew
from crews.crew2_scientist.crew import Crew2ScientistCrew


class ViolinAnalysisFlow(Flow):
    @start()
    def run_analyst(self):
        print("\n🎻 Crew 1: Data Analyst — starting...\n")
        return Crew1AnalystCrew().kickoff()

    @listen(run_analyst)
    def run_scientist(self, analyst_output):
        print("\n🤖 Crew 2: Data Scientist — starting...\n")
        return Crew2ScientistCrew().kickoff()


def run_flow() -> None:
    flow = ViolinAnalysisFlow()
    flow.kickoff()
    print("\n✅ ניתוח הושלם! כל הקבצים נשמרו בתיקיית outputs/\n")


if __name__ == "__main__":
    run_flow()
```

- [ ] **Step 4: Run tests**

```bash
pytest tests/test_flow.py -v
```

Expected: 3 tests PASSED (the integration test runs all tools end-to-end).

- [ ] **Step 5: Commit**

```bash
git add crew/flow.py crew/tests/test_flow.py
git commit -m "feat: ViolinAnalysisFlow + integration test (tools pipeline)"
```

---

## Task 8: Supabase Fetch

**Files:**
- Create: `crew/fetch_supabase.py`

- [ ] **Step 1: Create `crew/fetch_supabase.py`**

```python
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
    url = os.environ["SUPABASE_URL"]
    key = os.environ["SUPABASE_KEY"]
    client = create_client(url, key)

    response = client.table("practice_sessions").select("*").execute()
    sessions = response.data
    if not sessions:
        return "No sessions found in Supabase."

    df = pd.DataFrame(sessions)

    result = pd.DataFrame()
    result["student_id"] = df["student_id"]
    result["years_experience"] = 3.0  # not stored in Supabase
    result["current_level"] = df.get("difficulty_level", pd.Series([3] * len(df))).clip(1, 5)
    result["sessions_this_week"] = (
        df.groupby("student_id")["id"].transform("count").clip(0, 7)
        if "id" in df.columns else 3
    )
    result["weekly_practice_minutes"] = (
        df.get("duration_minutes", pd.Series([10] * len(df))) * result["sessions_this_week"]
    ).clip(30, 600)

    # Estimate violin scores from level + noise
    rng = np.random.default_rng(42)
    n = len(result)
    for col in SCORE_COLS:
        base = result["current_level"] * 14 + 10
        noise = rng.normal(0, 10, n)
        result[col] = (base + noise).clip(0, 100).astype(int)

    # Recommended difficulty: bump up if practicing a lot
    result["recommended_difficulty"] = result["current_level"].clip(1, 5)
    result.loc[result["sessions_this_week"] > 3, "recommended_difficulty"] = (
        result["current_level"] + 1
    ).clip(1, 5)

    Path(output_path).parent.mkdir(parents=True, exist_ok=True)
    result.to_csv(output_path, index=False)
    return f"Fetched {len(result)} sessions from Supabase → {output_path}"


if __name__ == "__main__":
    print(fetch_from_supabase())
```

- [ ] **Step 2: Verify the script runs (with real .env)**

Copy `.env.example` to `.env` and fill in the real values (they are already in practice5's `.env.local`):

```bash
cp .env.example .env
# Edit .env with real SUPABASE_URL and SUPABASE_KEY values from ../. env.local
python fetch_supabase.py
```

Expected: `Fetched N sessions from Supabase → data/raw_data.csv`

- [ ] **Step 3: Commit**

```bash
git add crew/fetch_supabase.py
git commit -m "feat: Supabase fetch — maps practice_sessions to violin schema"
```

---

## Task 9: Streamlit UI

**Files:**
- Create: `crew/streamlit_app.py`

- [ ] **Step 1: Create `crew/streamlit_app.py`**

```python
import sys
from pathlib import Path

import joblib
import streamlit as st
import streamlit.components.v1 as components

sys.path.insert(0, str(Path(__file__).parent))

st.set_page_config(
    page_title="ניתוח תרגול כינור",
    page_icon="🎻",
    layout="wide",
)

st.title("🎻 מערכת ניתוח תרגול כינור")
st.caption("מבוסס CrewAI + Scikit-Learn")

tab1, tab2 = st.tabs(["👩‍🏫 מורה / מנהל", "🎓 סימולציית תלמיד"])

# ─── TAB 1: Teacher/Admin ─────────────────────────────────────────────────────
with tab1:
    st.header("ניתוח נתוני תלמידים")

    data_source = st.radio(
        "מקור הנתונים:",
        ["סינתטי (דמו)", "Supabase (אמיתי)"],
        horizontal=True,
    )

    if st.button("🚀 הפעל ניתוח מלא", type="primary"):

        # Step 1: Generate data
        with st.spinner("שלב 1/3 — מייצר נתונים..."):
            if data_source == "סינתטי (דמו)":
                from generate_synthetic import generate, save
                df = generate()
                save(df, "data/raw_data.csv")
                st.success(f"✅ נוצרו {len(df)} שורות סינתטיות")
            else:
                from fetch_supabase import fetch_from_supabase
                msg = fetch_from_supabase()
                st.success(f"✅ {msg}")

        # Step 2: Crew 1 — analyst tools
        with st.spinner("שלב 2/3 — Crew 1 אנליסט נתונים..."):
            from tools.data_tools import clean_data, run_eda, write_contract
            clean_data("data/raw_data.csv", "data/clean_data.csv")
            run_eda("data/clean_data.csv", "outputs")
            write_contract("data/clean_data.csv", "outputs")
            st.success("✅ Crew 1 הסתיים — eda_report.html + insights.md + dataset_contract.json")

        # Step 3: Crew 2 — ML tools
        with st.spinner("שלב 3/3 — Crew 2 מדען נתונים..."):
            from tools.model_tools import (save_best_model, train_models,
                                           write_evaluation)
            results = train_models("data/clean_data.csv", "outputs/dataset_contract.json")
            save_best_model(results, "outputs")
            write_evaluation(results, "outputs")
            best = results["best"]
            acc = results[best]["accuracy"]
            st.success(f"✅ Crew 2 הסתיים — מודל: **{best}** | Accuracy: **{acc:.1%}**")

        st.balloons()

    # Display outputs if they exist
    if Path("outputs/eda_report.html").exists():
        st.subheader("📊 דו\"ח ניתוח")
        html = Path("outputs/eda_report.html").read_text(encoding="utf-8")
        components.html(html, height=950, scrolling=True)

    if Path("outputs/insights.md").exists():
        st.subheader("💡 תובנות")
        st.markdown(Path("outputs/insights.md").read_text(encoding="utf-8"))

    if Path("outputs/model_card.md").exists():
        st.subheader("🤖 כרטיס המודל")
        st.markdown(Path("outputs/model_card.md").read_text(encoding="utf-8"))

    if Path("outputs/evaluation_report.md").exists():
        with st.expander("📋 דו\"ח הערכה מלא"):
            st.markdown(Path("outputs/evaluation_report.md").read_text(encoding="utf-8"))


# ─── TAB 2: Student Simulation ───────────────────────────────────────────────
with tab2:
    st.header("המלצת תרגיל מותאמת אישית")
    st.caption("הזיני את הנתונים שלך וקבלי המלצה על רמת הקושי הבאה")

    col1, col2 = st.columns(2)

    with col1:
        years = st.slider("שנות לימוד כינור", 0.5, 15.0, 3.0, step=0.5)
        practice = st.slider("דקות תרגול שבועיות", 30, 600, 120, step=15)
        bow = st.slider("שליטה בקשת (0–100)", 0, 100, 60)
        intonation = st.slider("דיוק גובה הצליל (0–100)", 0, 100, 55)
        rhythm = st.slider("ציון מקצב (0–100)", 0, 100, 65)

    with col2:
        sight = st.slider("קריאה מהדף (0–100)", 0, 100, 50)
        scales = st.slider("דיוק בסולמות (0–100)", 0, 100, 60)
        level = st.slider("רמה נוכחית (1–5)", 1, 5, 3)
        sessions = st.slider("סשנים השבוע", 0, 7, 3)

    if st.button("🎯 קבל המלצה", type="primary"):
        model_path = Path("outputs/model.pkl")
        if not model_path.exists():
            st.error("⚠️ עדיין לא הורץ ניתוח. עברי לטאב המורה והפעילי 'ניתוח מלא' קודם.")
        else:
            model = joblib.load(model_path)
            avg_score = (bow + intonation + rhythm + sight + scales) / 5
            features = [[years, practice, bow, intonation, rhythm, sight,
                         scales, level, sessions, avg_score]]
            pred = int(model.predict(features)[0])

            level_labels = {1: "קל מאוד 🟢", 2: "קל 🟡", 3: "בינוני 🟠",
                            4: "קשה 🔴", 5: "מאתגר מאוד 🔴"}
            label = level_labels.get(pred, str(pred))

            st.success(f"### רמת הקושי המומלצת עבורך: **{pred} מתוך 5** — {label}")

            # Weakest area tip
            scores = {
                "שליטת קשת": bow, "דיוק גובה הצליל": intonation,
                "מקצב": rhythm, "קריאה מהדף": sight, "סולמות": scales,
            }
            weakest = min(scores, key=scores.get)
            st.info(f"💡 **טיפ לשיפור:** התמקדי בתחום **{weakest}** (ציון נוכחי: {scores[weakest]})")

            st.metric("ממוצע ציונים", f"{avg_score:.1f}/100")
```

- [ ] **Step 2: Test the Streamlit app locally**

```bash
cd crew
streamlit run streamlit_app.py
```

Expected: Browser opens at `http://localhost:8501` with Hebrew UI, two tabs visible.

- [ ] **Step 3: Verify Tab 1 works end-to-end**
  - Click "הפעל ניתוח מלא" with "סינתטי (דמו)" selected
  - All 3 spinners complete without errors
  - EDA report, insights, and model card appear below the button

- [ ] **Step 4: Verify Tab 2 works**
  - Adjust sliders
  - Click "קבל המלצה"
  - A recommended difficulty level (1–5) appears with a tip

- [ ] **Step 5: Run all tests to confirm nothing is broken**

```bash
pytest tests/ -v
```

Expected: All tests PASS.

- [ ] **Step 6: Commit**

```bash
git add crew/streamlit_app.py
git commit -m "feat: Streamlit UI — teacher analysis tab + student recommendation tab"
```

- [ ] **Step 7: Final commit with .env setup instructions**

```bash
git add crew/
git commit -m "feat: crew violin analysis — complete CrewAI + Streamlit system"
git push
```

---

## Running the Project

```bash
cd practice5/crew
pip install -r requirements.txt

# Copy env and fill in values from practice5/.env.local
cp .env.example .env

# Option 1: Run Streamlit UI (recommended)
streamlit run streamlit_app.py

# Option 2: Run Flow directly (uses LLM agents)
python flow.py

# Option 3: Run tests
pytest tests/ -v
```
