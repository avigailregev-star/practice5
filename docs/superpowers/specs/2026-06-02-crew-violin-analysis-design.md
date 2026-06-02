# Crew Violin Analysis — Design Spec

**Date:** 2026-06-02  
**Scope:** `crew/` directory inside practice5  
**Goal:** CrewAI + Streamlit system that analyzes violin student practice data and recommends next difficulty level using ML.

---

## Architecture

```
practice5/
  crew/
    data/
      raw_data.csv              # synthetic (dev) or from Supabase (demo)
      clean_data.csv            # output of Crew 1
    outputs/
      eda_report.html           # Crew 1 output
      insights.md               # Crew 1 output
      dataset_contract.json     # Crew 1 output
      model.pkl                 # Crew 2 output (best model)
      model_card.md             # Crew 2 output
      evaluation_report.md      # Crew 2 output
    crews/
      crew1_analyst/
        agents.py
        tasks.py
        crew.py
      crew2_scientist/
        agents.py
        tasks.py
        crew.py
    tools/
      data_tools.py             # pandas/matplotlib tools for agents
      model_tools.py            # sklearn tools for agents
    generate_synthetic.py       # generates synthetic violin student data
    fetch_supabase.py           # fetches real data from Supabase
    flow.py                     # CrewAI Flow: Crew1 → Crew2
    streamlit_app.py            # Streamlit UI
    requirements.txt
```

---

## Dataset

**Domain:** Violin students only (no instrument column).  
**Size:** 200 synthetic rows (realistic distributions).  
**Target:** `recommended_difficulty` (1–5, Classification)

| Column | Type | Description |
|--------|------|-------------|
| `student_id` | int | Unique student identifier |
| `years_experience` | float | Years of violin study (0.5–15) |
| `weekly_practice_minutes` | int | Weekly practice time (30–600) |
| `bow_control_score` | int | Bow technique score (0–100) |
| `intonation_score` | int | Pitch accuracy score (0–100) |
| `rhythm_score` | int | Rhythm score (0–100) |
| `sight_reading_score` | int | Sight reading score (0–100) |
| `scale_accuracy` | int | Scale accuracy score (0–100) |
| `current_level` | int | Current level (1–5) |
| `sessions_this_week` | int | Sessions completed this week (0–7) |
| `recommended_difficulty` | int | **Target: next recommended difficulty** (1–5) |

**Synthetic generation logic (`generate_synthetic.py`):**
- `years_experience` drives `current_level` (correlated)
- `weekly_practice_minutes` correlates positively with all scores
- `recommended_difficulty` = `current_level` ± adjustment based on average score vs. threshold
- Add realistic noise (±5–10 points per score)

**Supabase fetch (`fetch_supabase.py`):**
- Reads `practice_sessions` table (student_id, duration_minutes, skill_type, difficulty_level, xp_earned)
- Maps to dataset columns (difficulty_level → current_level, duration → weekly_practice_minutes estimate)
- Fills missing violin-specific scores with medians from synthetic data
- Outputs same CSV schema as synthetic

---

## Crew 1 — Data Analyst

**Input:** `data/raw_data.csv`  
**Agents:**

### Agent 1: Data Cleaner
- Drops duplicates, fills missing values with column medians
- Validates score ranges (0–100), clamps outliers
- Outputs `data/clean_data.csv`

### Agent 2: EDA Analyst
- Generates `outputs/eda_report.html` with:
  - Score distributions (histograms per column)
  - Correlation heatmap (scores vs. recommended_difficulty)
  - Bar chart: avg scores by current_level
  - Scatter: weekly_practice_minutes vs. intonation_score
- Generates `outputs/insights.md` with 3–5 Hebrew text insights (e.g., "80% מהתלמידים ברמה 3 מתקשים בשליטת הקשת")

### Agent 3: Contract Agent
- Outputs `outputs/dataset_contract.json`:
```json
{
  "source": "clean_data.csv",
  "target_column": "recommended_difficulty",
  "feature_columns": ["years_experience", "weekly_practice_minutes", "bow_control_score", "intonation_score", "rhythm_score", "sight_reading_score", "scale_accuracy", "current_level", "sessions_this_week"],
  "row_count": 200,
  "validated": true
}
```

---

## Crew 2 — Data Scientist

**Input:** `data/clean_data.csv` + `outputs/dataset_contract.json`  
**Agents:**

### Agent 1: Feature Engineer
- Reads contract to know which columns to use
- Creates derived feature: `avg_score` = mean of all score columns
- Splits data: 80% train / 20% test
- Saves split arrays to memory for next agent

### Agent 2: Model Trainer
- Trains two classifiers:
  - `DecisionTreeClassifier(max_depth=5, random_state=42)`
  - `RandomForestClassifier(n_estimators=100, random_state=42)`
- Evaluates both on test set (accuracy + F1)
- Saves the **better model** to `outputs/model.pkl`
- Records which model won and both scores

### Agent 3: Evaluator
- Outputs `outputs/model_card.md`:
  - Model name, accuracy, F1 score
  - Feature importances (top 5)
  - Which model won and why
- Outputs `outputs/evaluation_report.md`:
  - Confusion matrix (text table)
  - Per-class precision/recall
  - 2–3 Hebrew insights about model performance

---

## Streamlit UI (`streamlit_app.py`)

**Title:** "🎻 מערכת ניתוח תרגול כינור"  
**Language:** Hebrew throughout

### Tab 1 — מורה / מנהל
- **Data source selector:** סינתטי / Supabase
- **"הפעל ניתוח מלא" button** — runs `flow.py` (Crew1 → Crew2)
- Progress bar while running
- After completion:
  - Embeds `outputs/eda_report.html` via `st.components.v1.html()`
  - Shows `insights.md` content in `st.markdown()`
  - Shows model accuracy from `model_card.md`

### Tab 2 — סימולציית תלמיד
- **Input sliders (Hebrew labels):**
  - שנות לימוד (0.5–15)
  - דקות תרגול שבועיות (30–600)
  - שליטה בקשת (0–100)
  - דיוק גובה הצליל (0–100)
  - ציון מקצב (0–100)
  - קריאה מהדף (0–100)
  - דיוק בסולמות (0–100)
  - רמה נוכחית (1–5)
  - סשנים השבוע (0–7)
- **"קבל המלצה" button** → loads `model.pkl`, predicts, displays:
  - `"רמת הקושי המומלצת עבורך: 3 מתוך 5"`
  - Colored badge (green=easy, yellow=medium, red=hard)
  - Short explanation based on weakest score

---

## Flow (`flow.py`)

```python
@flow
class ViolinAnalysisFlow(Flow):
    @start()
    def run_analyst(self):
        return Crew1AnalystCrew().kickoff()

    @listen(run_analyst)
    def run_scientist(self, analyst_output):
        return Crew2ScientistCrew().kickoff()
```

---

## Tech Stack

| Tool | Version | Purpose |
|------|---------|---------|
| Python | 3.11+ | Runtime |
| crewai | latest | Agent framework |
| streamlit | latest | UI |
| scikit-learn | latest | ML models |
| pandas | latest | Data processing |
| matplotlib / seaborn | latest | Charts in EDA |
| supabase-py | latest | Supabase client |
| joblib | latest | model.pkl save/load |

---

## Non-Goals

- No authentication in Streamlit (single-user tool)
- No deployment of Streamlit (runs locally)
- No real-time Supabase sync (fetch is manual, on button click)
- No LLM-generated insights (agents use Python tools, not free-text AI for the ML part)
