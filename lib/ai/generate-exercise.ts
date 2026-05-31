import Anthropic from "@anthropic-ai/sdk";

export type SkillType = "notes" | "rhythm" | "scales";

export interface Exercise {
  title: string;
  description: string;
  steps: string[];
  tip: string;
  skill_type: SkillType;
  difficulty: number;
}

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const SKILL_CONTEXT: Record<SkillType, string> = {
  notes: "קריאת תווים — זיהוי תווים על פסי התווים, מיקום על הכלי",
  rhythm: "מקצבים — ניקוד מקצבי, דפוסי קצב, ספירה",
  scales: "סולמות — נגינת סולמות, טרמולו, תרגולי אצבעות",
};

export async function generateExercise(
  skillType: SkillType,
  durationMinutes: number,
  difficultyLevel: number
): Promise<Exercise> {
  const prompt = `אתה מורה למוזיקה מנוסה. צור תרגול מוזיקה קצר בעברית.

פרטים:
- תחום: ${SKILL_CONTEXT[skillType]}
- זמן: ${durationMinutes} דקות
- רמה: ${difficultyLevel} מתוך 5 (${difficultyLevel <= 2 ? "מתחיל" : difficultyLevel <= 4 ? "בינוני" : "מתקדם"})

החזר JSON בדיוק בפורמט הזה (ללא טקסט נוסף):
{
  "title": "שם התרגול הקצר",
  "description": "תיאור קצר של מה מתרגלים (משפט אחד)",
  "steps": [
    "שלב 1: הנחיה קצרה",
    "שלב 2: הנחיה קצרה",
    "שלב 3: הנחיה קצרה"
  ],
  "tip": "טיפ קצר ופרקטי"
}

חשוב: התרגול חייב להתאים בדיוק ל-${durationMinutes} דקות. רמה ${difficultyLevel} = ${difficultyLevel <= 2 ? "פשוט מאוד, תנועות בסיסיות" : difficultyLevel <= 4 ? "דורש ריכוז, מספר צעדים" : "מאתגר, דורש מיומנות"}.`;

  const message = await client.messages.create({
    model: "claude-3-5-haiku-20241022",
    max_tokens: 512,
    messages: [{ role: "user", content: prompt }],
  });

  const text = message.content[0].type === "text" ? message.content[0].text : "";

  try {
    const parsed = JSON.parse(text.trim());
    return {
      ...parsed,
      skill_type: skillType,
      difficulty: difficultyLevel,
    };
  } catch {
    return {
      title: `תרגול ${SKILL_CONTEXT[skillType].split(" — ")[0]}`,
      description: `תרגול ${durationMinutes} דקות ברמה ${difficultyLevel}`,
      steps: ["נגן בקצב איטי", "חזור 3 פעמים", "האיץ בהדרגה"],
      tip: "התרכז בדיוק, לא במהירות",
      skill_type: skillType,
      difficulty: difficultyLevel,
    };
  }
}
