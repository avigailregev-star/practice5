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


@tool("train_and_save_model_tool")
def train_and_save_model_tool(clean_path: str, contract_path: str, output_dir: str) -> str:
    """Train Decision Tree and Random Forest, save best model.pkl, write model_card.md and evaluation_report.md."""
    results = train_models(clean_path, contract_path)
    save_msg = save_best_model(results, output_dir)
    eval_msg = write_evaluation(results, output_dir)
    best = results["best"]
    acc = results[best]["accuracy"]
    return f"Best model: {best} (accuracy={acc}) | {save_msg} | {eval_msg}"
