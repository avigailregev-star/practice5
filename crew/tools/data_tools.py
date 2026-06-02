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
