// lib/pitchDetection.ts

import { DifficultyLevel } from "@/lib/notes";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface DetectedNote {
  name: string;        // "C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"
  hebrewName: string;  // "דו", "דו דיאז", ...
  octave: number;      // 3, 4, 5, etc.
  frequency: number;   // Hz
  cents: number;       // deviation from ideal: negative = flat, positive = sharp
}

export interface PitchNote {
  hebrewName: string;  // display name in Hebrew
  abcSymbol: string;   // abcjs symbol: "C", "^C", "D", "^D", etc.
  noteName: string;    // matches DetectedNote.name: "C", "C#", etc.
  level: DifficultyLevel;
}

// ── Note name constants ───────────────────────────────────────────────────────

const NOTE_NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

const HEBREW_NAMES: Record<string, string> = {
  C: "דו",
  "C#": "דו דיאז",
  D: "רה",
  "D#": "רה דיאז",
  E: "מי",
  F: "פה",
  "F#": "פה דיאז",
  G: "סול",
  "G#": "סול דיאז",
  A: "לה",
  "A#": "לה דיאז",
  B: "סי",
};

// ── Pitch note pool ───────────────────────────────────────────────────────────

export const PITCH_NOTES: PitchNote[] = [
  // Level 1 — natural notes most common in violin first position
  { hebrewName: "מי",  abcSymbol: "E", noteName: "E", level: 1 },
  { hebrewName: "פה",  abcSymbol: "F", noteName: "F", level: 1 },
  { hebrewName: "סול", abcSymbol: "G", noteName: "G", level: 1 },
  { hebrewName: "לה",  abcSymbol: "A", noteName: "A", level: 1 },
  { hebrewName: "סי",  abcSymbol: "B", noteName: "B", level: 1 },
  // Level 2 — add remaining natural notes
  { hebrewName: "דו",  abcSymbol: "C", noteName: "C", level: 2 },
  { hebrewName: "רה",  abcSymbol: "D", noteName: "D", level: 2 },
  // Level 3 — add sharps
  { hebrewName: "דו דיאז",  abcSymbol: "^C", noteName: "C#", level: 3 },
  { hebrewName: "רה דיאז",  abcSymbol: "^D", noteName: "D#", level: 3 },
  { hebrewName: "פה דיאז",  abcSymbol: "^F", noteName: "F#", level: 3 },
  { hebrewName: "סול דיאז", abcSymbol: "^G", noteName: "G#", level: 3 },
  { hebrewName: "לה דיאז",  abcSymbol: "^A", noteName: "A#", level: 3 },
];

/** Notes available at given level (cumulative) */
export function getPitchNotesForLevel(level: DifficultyLevel): PitchNote[] {
  return PITCH_NOTES.filter((n) => n.level <= level);
}

/** Pick a random pitch note, different from the previous */
export function pickPitchNote(level: DifficultyLevel, previousNoteName?: string): PitchNote {
  const pool = getPitchNotesForLevel(level).filter((n) => n.noteName !== previousNoteName);
  const candidates = pool.length > 0 ? pool : getPitchNotesForLevel(level);
  return candidates[Math.floor(Math.random() * candidates.length)];
}

// ── Pitch detection constants ─────────────────────────────────────────────────
const SILENCE_THRESHOLD = 0.01;     // RMS below this = silence
const MIN_FREQ_HZ = 60;             // lower bound: ~B1
const MAX_FREQ_HZ = 1200;           // upper bound: ~D6
const CLARITY_THRESHOLD = 0.9;      // minimum normalized autocorrelation to accept pitch

// ── Pitch detection ───────────────────────────────────────────────────────────

/**
 * Autocorrelation-based pitch detection.
 * Returns fundamental frequency in Hz, or null if no clear pitch found (silence or noise).
 */
export function detectPitch(buffer: Float32Array, sampleRate: number): number | null {
  if (buffer.length === 0) return null;

  const SIZE = buffer.length;

  // 1. RMS silence check
  let rms = 0;
  for (let i = 0; i < SIZE; i++) rms += buffer[i] * buffer[i];
  if (Math.sqrt(rms / SIZE) < SILENCE_THRESHOLD) return null;

  // 2. Lag search range: MIN_FREQ_HZ – MAX_FREQ_HZ
  const minLag = Math.floor(sampleRate / MAX_FREQ_HZ);
  const maxLag = Math.min(Math.floor(sampleRate / MIN_FREQ_HZ), SIZE - 1);

  // 3. Find lag with maximum autocorrelation
  let bestLag = -1;
  let bestCorr = -Infinity;
  for (let lag = minLag; lag <= maxLag; lag++) {
    let corr = 0;
    for (let i = 0; i < SIZE - lag; i++) {
      corr += buffer[i] * buffer[i + lag];
    }
    if (corr > bestCorr) {
      bestCorr = corr;
      bestLag = lag;
    }
  }
  if (bestLag === -1) return null;

  // 4. Normalize against signal energy (lag=0 correlation)
  let energy = 0;
  for (let i = 0; i < SIZE; i++) energy += buffer[i] * buffer[i];
  if (energy === 0 || bestCorr / energy < CLARITY_THRESHOLD) return null;

  // 5. Parabolic interpolation for sub-sample accuracy
  const prev = _autocorr(buffer, SIZE, Math.max(0, bestLag - 1));
  const curr = bestCorr;
  const next = _autocorr(buffer, SIZE, Math.min(SIZE - 1, bestLag + 1));
  const denom = 2 * curr - prev - next;
  const refined = denom === 0 ? bestLag : bestLag + (next - prev) / (2 * denom);

  return sampleRate / refined;
}

function _autocorr(buf: Float32Array, size: number, lag: number): number {
  let c = 0;
  for (let i = 0; i < size - lag; i++) c += buf[i] * buf[i + lag];
  return c;
}

// ── Frequency → note mapping ──────────────────────────────────────────────────

/**
 * Maps a frequency in Hz to the nearest note in 12-TET (A4 = 440 Hz).
 * Returns null if frequency is outside supported range (60 Hz – 1200 Hz).
 */
export function frequencyToNote(hz: number): DetectedNote | null {
  if (hz < MIN_FREQ_HZ || hz > MAX_FREQ_HZ) return null;

  // MIDI note number: A4 = 440 Hz = MIDI 69
  const midi = 12 * Math.log2(hz / 440) + 69;
  const midiRounded = Math.round(midi);
  const cents = Math.round((midi - midiRounded) * 100);

  const noteIndex = ((midiRounded % 12) + 12) % 12;
  const octave = Math.floor(midiRounded / 12) - 1;
  const name = NOTE_NAMES[noteIndex];

  return {
    name,
    hebrewName: HEBREW_NAMES[name] ?? name,
    octave,
    frequency: hz,
    cents,
  };
}
