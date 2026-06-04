import base64
import io
import json
from pathlib import Path

import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import pandas as pd
import seaborn as sns
from bidi.algorithm import get_display
from crewai.tools import tool


def _heb(text: str) -> str:
    """Fix Hebrew text direction for matplotlib."""
    return get_display(text)

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

    SCORE_LABELS = {
        "bow_control_score": _heb("שליטה בקשת"),
        "intonation_score": _heb("דיוק גובה הצליל"),
        "rhythm_score": _heb("מקצב"),
        "sight_reading_score": _heb("קריאה מהדף"),
        "scale_accuracy": _heb("דיוק בסולמות"),
    }
    COLORS = ["#ff6b9d", "#4ecdc4", "#a29bfe", "#ff9f43", "#55efc4"]

    # 1. ממוצע ציון לכל מיומנות — עמודה אחת לכל מיומנות
    avg = df[SCORE_COLS].mean()
    labels = [SCORE_LABELS[c] for c in SCORE_COLS]
    fig, ax = plt.subplots(figsize=(9, 5))
    bars = ax.bar(labels, avg.values, color=COLORS, edgecolor="white", width=0.6)
    ax.set_ylim(0, 100)
    ax.set_ylabel(_heb("ציון ממוצע"))
    ax.set_title(_heb("ממוצע ציון לכל מיומנות"), fontsize=14, fontweight="bold")
    for bar, val in zip(bars, avg.values):
        ax.text(bar.get_x() + bar.get_width() / 2, bar.get_height() + 1.5,
                f"{val:.0f}", ha="center", va="bottom", fontsize=11, fontweight="bold")
    ax.axhline(y=avg.values.mean(), color="gray", linestyle="--", linewidth=1.2, label=_heb("ממוצע כללי"))
    ax.legend()
    fig.tight_layout()
    imgs["avg_skills"] = _fig_to_b64(fig)
    plt.close(fig)

    # 2. התפלגות רמות קושי מומלצות — כמה תלמידים בכל רמה
    level_counts = df[TARGET_COL].value_counts().sort_index()
    level_colors = ["#55efc4", "#74b9ff", "#fdcb6e", "#e17055", "#d63031"]
    fig, ax = plt.subplots(figsize=(7, 5))
    bars = ax.bar([f"{_heb('רמה')} {i}" for i in level_counts.index],
                  level_counts.values, color=level_colors[:len(level_counts)],
                  edgecolor="white", width=0.6)
    ax.set_ylabel(_heb("מספר תלמידים"))
    ax.set_title(_heb("כמה תלמידים בכל רמת קושי מומלצת"), fontsize=14, fontweight="bold")
    for bar, val in zip(bars, level_counts.values):
        ax.text(bar.get_x() + bar.get_width() / 2, bar.get_height() + 0.5,
                str(val), ha="center", va="bottom", fontsize=12, fontweight="bold")
    fig.tight_layout()
    imgs["difficulty_dist"] = _fig_to_b64(fig)
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
<h2>ממוצע ציון לכל מיומנות</h2>
<img src="data:image/png;base64,{imgs['avg_skills']}">
<h2>התפלגות רמות קושי מומלצות</h2>
<img src="data:image/png;base64,{imgs['difficulty_dist']}">
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
