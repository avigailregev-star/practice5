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

        # Step 1: Generate / fetch data
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
            from tools.model_tools import save_best_model, train_models, write_evaluation
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

            level_labels = {
                1: "קל מאוד 🟢", 2: "קל 🟡", 3: "בינוני 🟠",
                4: "קשה 🔴", 5: "מאתגר מאוד 🔴",
            }
            label = level_labels.get(pred, str(pred))

            st.success(f"### רמת הקושי המומלצת עבורך: **{pred} מתוך 5** — {label}")

            scores = {
                "שליטת קשת": bow, "דיוק גובה הצליל": intonation,
                "מקצב": rhythm, "קריאה מהדף": sight, "סולמות": scales,
            }
            weakest = min(scores, key=scores.get)
            st.info(f"💡 **טיפ לשיפור:** התמקדי בתחום **{weakest}** (ציון נוכחי: {scores[weakest]})")
            st.metric("ממוצע ציונים", f"{avg_score:.1f}/100")
