// lib/notes.ts

export type NoteName = "דו" | "רה" | "מי" | "פה" | "סול" | "לה" | "סי";
export type DifficultyLevel = 1 | 2 | 3;

export interface NoteData {
  name: NoteName;
  abcSymbol: string;   // used by abcjs: "C" "D" "E" "F" "G" "A" "B"
  level: DifficultyLevel;
}

export const ALL_NOTES: NoteData[] = [
  { name: "דו",  abcSymbol: "C", level: 2 },
  { name: "רה",  abcSymbol: "D", level: 2 },
  { name: "מי",  abcSymbol: "E", level: 1 },
  { name: "פה",  abcSymbol: "F", level: 1 },
  { name: "סול", abcSymbol: "G", level: 1 },
  { name: "לה",  abcSymbol: "A", level: 1 },
  { name: "סי",  abcSymbol: "B", level: 1 },
];

/** Notes available at a given difficulty level (cumulative) */
export function getNotesForLevel(level: DifficultyLevel): NoteData[] {
  return ALL_NOTES.filter((n) => n.level <= level);
}

/** Pick a random note from available notes, different from the previous */
export function pickRandomNote(
  level: DifficultyLevel,
  previousAbcSymbol?: string
): NoteData {
  const pool = getNotesForLevel(level).filter(
    (n) => n.abcSymbol !== previousAbcSymbol
  );
  return pool[Math.floor(Math.random() * pool.length)];
}

/** Generate 4 answer choices: correct + 3 random wrong ones */
export function generateChoices(correct: NoteData): NoteName[] {
  const wrong = ALL_NOTES.filter((n) => n.abcSymbol !== correct.abcSymbol);
  const shuffledWrong = wrong.sort(() => Math.random() - 0.5).slice(0, 3);
  const all = [correct, ...shuffledWrong].sort(() => Math.random() - 0.5);
  return all.map((n) => n.name);
}

/** Map score percentage to encouraging label */
export function scoreLabel(pct: number): string {
  if (pct >= 90) return "מוסיקאי אמיתי! 🎼";
  if (pct >= 70) return "ממש טוב! עוד קצת ותגיע לשם 🌟";
  if (pct >= 50) return "התחלה טובה! המשך לתרגל 💪";
  return "כל התחלה קשה — יאללה שוב! 🎵";
}
