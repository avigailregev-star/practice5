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

const FALLBACKS: Record<SkillType, Omit<Exercise, 'skill_type' | 'difficulty'>> = {
  notes: {
    title: "זיהוי תווים בסיסיים",
    description: "תרגול קריאת תווים על פסי התווים",
    steps: [
      "נגן את התו דו (C) — מצא אותו על הכלי שלך",
      "נגן את הסדרה: דו-רה-מי-פה-סול (C-D-E-F-G) לאט",
      "חזור 3 פעמים — עולה וגם יורד",
    ],
    tip: "קרא את שם התו בקול לפני שאתה מנגן אותו",
  },
  rhythm: {
    title: "דפוס מקצב בסיסי",
    description: "תרגול ספירה וניגון מקצב",
    steps: [
      "ספור בקול: 1-2-3-4 בקצב איטי (♩♩♩♩)",
      "הקש את המקצב על הברך תוך כדי ספירה",
      "נגן תוך כדי ספירה — 3 חזרות",
    ],
    tip: "שמור על קצב קבוע — עדיף איטי ומדויק מאשר מהיר ולא מדויק",
  },
  scales: {
    title: "סולם דו מז'ור",
    description: "תרגול עלייה וירידה בסולם דו מז'ור",
    steps: [
      "נגן עולה: דו-רה-מי-פה-סול-לה-סי-דו (C-D-E-F-G-A-B-C)",
      "נגן יורד: דו-סי-לה-סול-פה-מי-רה-דו",
      "חזור 3 פעמים בקצב שנוח לך",
    ],
    tip: "שים לב לאצבעות — תנועה חלקה בין התווים",
  },
};

const SKILL_CONTEXT: Record<SkillType, string> = {
  notes: "קריאת תווים — זיהוי תווים על פסי התווים. חייב לכלול תווים ספציפיים: דו (C), רה (D), מי (E), פה (F), סול (G), לה (A), סי (B)",
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

חשוב: התרגול חייב להתאים בדיוק ל-${durationMinutes} דקות. רמה ${difficultyLevel} = ${difficultyLevel <= 2 ? "פשוט מאוד, תנועות בסיסיות" : difficultyLevel <= 4 ? "דורש ריכוז, מספר צעדים" : "מאתגר, דורש מיומנות"}.${skillType === 'notes' ? `\nחשוב מאוד: בשלבים חייב לכלול תווים ספציפיים לנגינה, למשל: "נגן את התו דו (C)" או "זהה ונגן: רה-מי-פה-סול". אל תכתוב שלבים גנריים.` : ''}`;

  let message;
  try {
    message = await client.messages.create({
      model: "claude-3-5-haiku-20241022",
      max_tokens: 512,
      messages: [{ role: "user", content: prompt }],
    });
  } catch (err: unknown) {
    console.error("Anthropic API error:", JSON.stringify(err, null, 2));
    console.error("API key length:", process.env.ANTHROPIC_API_KEY?.length);
    console.error("API key starts with:", process.env.ANTHROPIC_API_KEY?.substring(0, 15));
    const fallback = FALLBACKS[skillType];
    return {
      ...fallback,
      skill_type: skillType,
      difficulty: difficultyLevel,
    };
  }

  const text = message.content[0].type === "text" ? message.content[0].text : "";

  try {
    const parsed = JSON.parse(text.trim());
    return {
      ...parsed,
      skill_type: skillType,
      difficulty: difficultyLevel,
    };
  } catch {
    const fallback = FALLBACKS[skillType];
    return {
      ...fallback,
      skill_type: skillType,
      difficulty: difficultyLevel,
    };
  }
}
