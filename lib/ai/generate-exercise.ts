import Anthropic from "@anthropic-ai/sdk";

export type SkillType = "notes" | "rhythm" | "scales";

export interface Exercise {
  title: string;
  description: string;
  steps: string[];
  tip: string;
  skill_type: SkillType;
  difficulty: number;
  notes_to_show?: string[]; // e.g. ["C4", "D4", "E4"] for note exercises
  rhythm_pattern?: string;  // for rhythm exercises - ABC notation
  scale_notes?: string[]; // e.g. ["C4","D4","E4","F4","G4","A4","B4","C5"] for scales exercises
}

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const FALLBACKS: Record<SkillType, Omit<Exercise, 'skill_type' | 'difficulty'>[]> = {
  notes: [
    {
      title: "זיהוי תווים בסיסיים",
      description: "מה התווים המופיעים על הפסים?",
      steps: ["הסתכל על כל תו — מה שמו?", "נגן כל תו על הכלי שלך", "חזור 3 פעמים עד שזורם"],
      tip: "קרא את שם התו בקול לפני שאתה מנגן אותו",
      notes_to_show: ["C4", "E4", "G4"],
    },
    {
      title: "תווים על קו ובין הקווים",
      description: "זהה היכן נמצא כל תו — על קו או בין קווים?",
      steps: ["הסתכל אם התו יושב על קו או בחלל בין הקווים", "אמר בקול: 'על קו' או 'בין קווים'", "נגן את התווים בסדר"],
      tip: "תווים על קווים: מי-סול-סי-רה-פה. תווים בחללים: פה-לה-דו-מי",
      notes_to_show: ["D4", "F4", "A4"],
    },
    {
      title: "תווים דו-רה-מי",
      description: "תרגל את שלושת התווים הראשונים",
      steps: ["נגן דו (C) — התו הנמוך", "נגן רה (D) — צעד אחד למעלה", "נגן מי (E) — עוד צעד, ואז חזור"],
      tip: "דו-רה-מי הם כמו שלוש מדרגות — עולים בהדרגה",
      notes_to_show: ["C4", "D4", "E4"],
    },
    {
      title: "תווים סול-לה-סי",
      description: "זהה ונגן את התווים בחלק העליון של הפסים",
      steps: ["מצא את סול (G) על הפסים", "מצא את לה (A) ו-סי (B) מעליו", "נגן את שלושתם עולה ויורד"],
      tip: "סול הוא התו שנמצא בדיוק על הקו הסביבי של המפתח",
      notes_to_show: ["G4", "A4", "B4"],
    },
    {
      title: "חמישה תווים בסדר",
      description: "קרא ונגן חמישה תווים ברצף",
      steps: ["זהה כל אחד מהחמישה תווים", "נגן אותם מהנמוך לגבוה", "נגן אותם מהגבוה לנמוך"],
      tip: "קח את זמנך עם כל תו — הדיוק חשוב יותר מהמהירות",
      notes_to_show: ["C4", "D4", "E4", "F4", "G4"],
    },
  ],
  rhythm: [
    {
      title: "דפוס מקצב בסיסי",
      description: "קרא את המקצב והקש אותו",
      steps: ["הסתכל על המקצב — כמה פעימות יש?", "הקש את המקצב על הברך תוך כדי ספירה", "נגן תוך כדי ספירה — 3 חזרות"],
      tip: "שמור על קצב קבוע — עדיף איטי ומדויק",
      rhythm_pattern: "B B B B",
    },
    {
      title: "תמונות רבע ושמינית",
      description: "שלב תמונות של רבע ושמיניות",
      steps: ["ספור 1-2-3-4 בקצב שווה", "הקש תמונת רבע לכל ספירה שלמה", "הקש שתי שמיניות מהירות במקום תמונת רבע אחת"],
      tip: "שמיניות הן כמו 'טי-טי' — שניים בזמן של אחד",
      rhythm_pattern: "B B B/B/ B",
    },
    {
      title: "תמונת חצי ורבע",
      description: "שלב תמונות ארוכות וקצרות",
      steps: ["תמונת חצי — תחזיק שתי פעימות", "תמונת רבע — פעימה אחת", "נגן את הדפוס שלוש פעמים"],
      tip: "תמונת חצי = ספור '1-2', תמונת רבע = ספור '1'",
      rhythm_pattern: "B2 B B",
    },
    {
      title: "מקצב עם הפסקה",
      description: "שים לב לשקטים במקצב",
      steps: ["זהה היכן יש הפסקות (שקטים)", "נגן את התמונות ושמור על השקטים", "חזור 3 פעמים"],
      tip: "שקט הוא גם חלק מהמוזיקה — תחזיק אותו בדיוק כמו תמונה",
      rhythm_pattern: "B B z B",
    },
    {
      title: "מקצב עם תמונת שלם",
      description: "תרגל תמונה ארוכה של ארבע פעימות",
      steps: ["נגן תמונת שלם — ספור עד 4", "נגן אחריה שתי תמונות רבע", "חזור על הדפוס"],
      tip: "תמונת שלם = ספור 1-2-3-4 בלי לעצור",
      rhythm_pattern: "B4 B B",
    },
  ],
  scales: [
    {
      title: "סולם דו מז'ור",
      description: "תרגול עלייה וירידה בסולם דו מז'ור",
      steps: ["נגן עולה: דו-רה-מי-פה-סול-לה-סי-דו", "נגן יורד: דו-סי-לה-סול-פה-מי-רה-דו", "חזור 3 פעמים בקצב שנוח לך"],
      tip: "שים לב לאצבעות — תנועה חלקה בין התווים",
      scale_notes: ["C4","D4","E4","F4","G4","A4","B4","C5"],
    },
    {
      title: "חמש תווים ראשונים של דו מז'ור",
      description: "תרגל את חמשת התווים הראשונים של הסולם",
      steps: ["נגן עולה: דו-רה-מי-פה-סול", "נגן יורד: סול-פה-מי-רה-דו", "חזור 5 פעמים בקצב אחיד"],
      tip: "חמישה תווים הם הבסיס — שלוט בהם לפני שתמשיך",
      scale_notes: ["C4","D4","E4","F4","G4"],
    },
    {
      title: "סולם סול מז'ור",
      description: "תרגול סולם סול עם פה דיאז",
      steps: ["נגן עולה: סול-לה-סי-דו-רה-מי-פה#-סול", "נגן יורד: סול-פה#-מי-רה-דו-סי-לה-סול", "חזור 3 פעמים"],
      tip: "זכור: פה הופך לפה דיאז בסולם סול!",
      scale_notes: ["G4","A4","B4","C5","D5","E5","F#5","G5"],
    },
    {
      title: "תרגול אינטרוולים בסולם",
      description: "קפוץ בין תווים בתוך הסולם",
      steps: ["נגן דו-מי (קפיצת שלישית)", "נגן דו-סול (קפיצת חמישית)", "נגן דו-לה (קפיצת שישית)"],
      tip: "אינטרוולים — מרחקים בין תווים — הם בסיס לקריאת מוזיקה",
      scale_notes: ["C4","E4","G4","A4"],
    },
    {
      title: "סולם רה מז'ור",
      description: "תרגול סולם חדש עם שני דיאזים",
      steps: ["נגן עולה: רה-מי-פה#-סול-לה-סי-דו#-רה", "נגן יורד: רה-דו#-סי-לה-סול-פה#-מי-רה", "חזור 3 פעמים"],
      tip: "בסולם רה: פה ודו הופכים לדיאזים",
      scale_notes: ["D4","E4","F#4","G4","A4","B4","C#5","D5"],
    },
  ],
};

function pickFallback(skillType: SkillType, difficultyLevel: number): Omit<Exercise, 'skill_type' | 'difficulty'> {
  const pool = FALLBACKS[skillType];
  // Use difficulty to prefer certain exercises, with randomness
  const seed = Date.now() % pool.length;
  const difficultyIndex = Math.min(Math.floor((difficultyLevel - 1) / 5 * pool.length), pool.length - 1);
  // Mix difficulty preference with randomness
  const index = (seed + difficultyIndex) % pool.length;
  return pool[index];
}

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
  "tip": "טיפ קצר ופרקטי"${skillType === 'notes' ? `,\n  "notes_to_show": ["C4", "D4", "E4"]` : ''}${skillType === 'rhythm' ? `,\n  "rhythm_pattern": "B B B/B/ B"` : ''}${skillType === 'scales' ? `,\n  "scale_notes": ["C4", "D4", "E4", "F4", "G4", "A4", "B4", "C5"]` : ''}
}

חשוב: התרגול חייב להתאים בדיוק ל-${durationMinutes} דקות. רמה ${difficultyLevel} = ${difficultyLevel <= 2 ? "פשוט מאוד, תנועות בסיסיות" : difficultyLevel <= 4 ? "דורש ריכוז, מספר צעדים" : "מאתגר, דורש מיומנות"}.${skillType === 'notes' ? `\nחשוב מאוד: בשלבים חייב לכלול תווים ספציפיים לנגינה, למשל: "נגן את התו דו (C)" או "זהה ונגן: רה-מי-פה-סול". אל תכתוב שלבים גנריים.\nהוסף גם שדה "notes_to_show" עם 3-5 תווים בסימון מדעי (למשל: ["C4", "D4", "E4", "F4", "G4"]) שיוצגו כתווים אמיתיים על הפסים.` : ''}${skillType === 'rhythm' ? `\nחשוב מאוד: החזר גם שדה "rhythm_pattern" עם דפוס מקצב ב-ABC notation. השתמש ב-B לתו רבע, B2 לתו חצי, B4 לתו שלם, B/ לתו שמינית. לדוגמה: "B B B/B/ B" או "B2 B B/ B/ B". הדפוס צריך להתאים לרמה ${difficultyLevel}.` : ''}${skillType === 'scales' ? `\nחשוב מאוד: החזר גם שדה "scale_notes" עם מערך של תווי הסולם ב-scientific notation (כמו "C4","D4","E4"). כלול 5-8 תווים שמרכיבים את הסולם.` : ''}`;

  let message;
  try {
    message = await client.messages.create({
      model: "claude-3-5-haiku-20241022",
      max_tokens: 512,
      messages: [{ role: "user", content: prompt }],
    });
  } catch (err: unknown) {
    console.error("Anthropic API error:", JSON.stringify(err, null, 2));
    const fallback = pickFallback(skillType, difficultyLevel);
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
    const fallback = pickFallback(skillType, difficultyLevel);
    return {
      ...fallback,
      skill_type: skillType,
      difficulty: difficultyLevel,
    };
  }
}
