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
const MIN_FREQ_HZ = 60;    // lower bound: ~B1
const MAX_FREQ_HZ = 1200;  // upper bound: ~D6
const SILENCE_DB = -50;    // dB below this = silence in FFT data

// ── Pitch detection via HPS (Harmonic Product Spectrum) ───────────────────────

/**
 * FFT-based pitch detection using Harmonic Product Spectrum.
 * Takes frequency-domain data from AnalyserNode.getFloatFrequencyData() (values in dB).
 * HPS multiplies the spectrum by downsampled copies — the product peaks at the fundamental
 * even when harmonics are louder (works well for voice and violin).
 *
 * @param freqData  Float32Array from analyser.getFloatFrequencyData() — values in dB
 * @param sampleRate  AudioContext.sampleRate (typically 44100 or 48000)
 * @param fftSize  analyser.fftSize (e.g. 4096); frequencyBinCount = fftSize/2
 * @returns fundamental frequency in Hz, or null if silence/no clear pitch
 */
export function detectPitch(
  freqData: Float32Array,
  sampleRate: number,
  fftSize: number
): number | null {
  const binHz = sampleRate / fftSize;
  const minBin = Math.max(1, Math.ceil(MIN_FREQ_HZ / binHz));
  const maxBin = Math.min(freqData.length - 1, Math.floor(MAX_FREQ_HZ / binHz));

  // Silence check: is there ANY meaningful signal in range?
  let maxDb = -Infinity;
  for (let i = minBin; i <= maxBin; i++) {
    if (freqData[i] > maxDb) maxDb = freqData[i];
  }
  if (maxDb < SILENCE_DB) return null;

  // Convert dB → linear magnitude
  const linear = new Float32Array(freqData.length);
  for (let i = 0; i < freqData.length; i++) {
    linear[i] = Math.pow(10, freqData[i] / 20);
  }

  // HPS: multiply spectrum by H downsampled copies (harmonics 2, 3, 4, 5)
  // hps[i] = L[i] * L[2i] * L[3i] * L[4i] * L[5i]
  // The product is largest at the fundamental bin.
  const hps = new Float32Array(maxBin + 1);
  for (let i = minBin; i <= maxBin; i++) {
    const h2 = linear[i * 2] ?? 0;
    const h3 = linear[i * 3] ?? 0;
    const h4 = linear[i * 4] ?? 0;
    const h5 = linear[i * 5] ?? 0;
    hps[i] = linear[i] * h2 * h3 * h4 * h5;
  }

  // Find the peak bin in HPS
  let peakBin = minBin;
  let peakVal = 0;
  for (let i = minBin; i <= maxBin; i++) {
    if (hps[i] > peakVal) {
      peakVal = hps[i];
      peakBin = i;
    }
  }

  if (peakVal === 0) return null;

  // Parabolic interpolation on HPS for sub-bin accuracy
  const prev = peakBin > minBin ? hps[peakBin - 1] : hps[peakBin];
  const curr = hps[peakBin];
  const next = peakBin < maxBin ? hps[peakBin + 1] : hps[peakBin];
  const denom = prev - 2 * curr + next;
  const refinedBin = denom === 0 ? peakBin : peakBin - 0.5 * (next - prev) / denom;

  return refinedBin * binHz;
}

// ── Frequency → note mapping ──────────────────────────────────────────────────

/**
 * Maps a frequency in Hz to the nearest note in 12-TET (A4 = 440 Hz).
 * Returns null if frequency is outside supported range.
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
