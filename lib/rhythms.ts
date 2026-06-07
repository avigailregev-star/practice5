// lib/rhythms.ts

export type NoteType = "quarter" | "eighth" | "half" | "dotted-quarter" | "rest";
export type DifficultyLevel = 1 | 2 | 3;

export interface Beat {
  type: NoteType;
  symbol: string;     // ♩ ♪ 𝅗𝅥 ♩. 𝄽
  duration: number;   // in quarter-note units: quarter=1, eighth=0.5, half=2, dotted=1.5, rest=1
  tappable: boolean;  // false for rests
}

export interface RhythmPattern {
  id: string;
  level: DifficultyLevel;
  beats: Beat[];
  totalDuration: number; // sum of beat durations in quarter-note units (always 4 for 4/4)
}

export const BPM: Record<DifficultyLevel, number> = {
  1: 60,
  2: 72,
  3: 80,
};

// Beat shorthand constants
const Q: Beat = { type: "quarter",        symbol: "♩",  duration: 1,   tappable: true  };
const E: Beat = { type: "eighth",         symbol: "♪",  duration: 0.5, tappable: true  };
const H: Beat = { type: "half",           symbol: "𝅗𝅥",  duration: 2,   tappable: true  };
const D: Beat = { type: "dotted-quarter", symbol: "♩.", duration: 1.5, tappable: true  };
const R: Beat = { type: "rest",           symbol: "𝄽",  duration: 1,   tappable: false };

export const ALL_PATTERNS: RhythmPattern[] = [
  // Level 1 — half + quarter notes (4 quarter-note units per pattern)
  { id: "l1a", level: 1, beats: [Q, Q, H],         totalDuration: 4 },
  { id: "l1b", level: 1, beats: [H, Q, Q],         totalDuration: 4 },
  { id: "l1c", level: 1, beats: [Q, H, Q],         totalDuration: 4 },
  { id: "l1d", level: 1, beats: [H, H],            totalDuration: 4 },

  // Level 2 — quarter + eighth pairs
  { id: "l2a", level: 2, beats: [E, E, Q, E, E, Q], totalDuration: 4 },
  { id: "l2b", level: 2, beats: [Q, E, E, E, E, Q], totalDuration: 4 },
  { id: "l2c", level: 2, beats: [E, E, E, E, Q, Q], totalDuration: 4 },
  { id: "l2d", level: 2, beats: [Q, Q, E, E, Q],    totalDuration: 4 },

  // Level 3 — + rests + dotted-quarter
  { id: "l3a", level: 3, beats: [E, E, R, D, E],    totalDuration: 4 },
  { id: "l3b", level: 3, beats: [D, E, R, Q],        totalDuration: 4 },
  { id: "l3c", level: 3, beats: [Q, R, E, E, Q],    totalDuration: 4 },
  { id: "l3d", level: 3, beats: [R, D, E, Q],        totalDuration: 4 },
];

/** Patterns available at a given level (cumulative — level 2 includes level 1) */
export function getPatternsForLevel(level: DifficultyLevel): RhythmPattern[] {
  return ALL_PATTERNS.filter((p) => p.level <= level);
}

/** Pick a random pattern, different from the previous one */
export function pickPattern(level: DifficultyLevel, previousId?: string): RhythmPattern {
  const pool = getPatternsForLevel(level).filter((p) => p.id !== previousId);
  const candidates = pool.length > 0 ? pool : getPatternsForLevel(level);
  return candidates[Math.floor(Math.random() * candidates.length)];
}

/** Given a pattern and BPM, return the expected tap time (ms from start) for each beat */
export function getBeatTimestamps(pattern: RhythmPattern, bpm: number): number[] {
  const msPerQuarter = 60000 / bpm;
  const timestamps: number[] = [];
  let cursor = 0;
  for (const beat of pattern.beats) {
    timestamps.push(cursor);
    cursor += beat.duration * msPerQuarter;
  }
  return timestamps;
}
