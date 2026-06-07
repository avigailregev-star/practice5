"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import ViolinMascot from "@/components/shared/ViolinMascot";
import StaffDisplay from "./StaffDisplay";
import PitchMeter from "./PitchMeter";
import {
  detectPitch,
  frequencyToNote,
  DetectedNote,
  PitchNote,
  pickPitchNote,
} from "@/lib/pitchDetection";
import { DifficultyLevel, scoreLabel } from "@/lib/notes";

type Phase = "listening" | "feedback";

function clampLevel(l: number): DifficultyLevel {
  return Math.max(1, Math.min(3, l)) as DifficultyLevel;
}

const LEVEL_LABELS: Record<DifficultyLevel, string> = {
  1: "קל",
  2: "בינוני",
  3: "קשה",
};

interface Props {
  studentId: string;
  initialLevel: DifficultyLevel;
}

export default function PitchAssessment({ studentId, initialLevel }: Props) {
  const startLevel = clampLevel(initialLevel);

  // ── UI state ───────────────────────────────────────────────────────────────
  const [level, setLevel] = useState<DifficultyLevel>(startLevel);
  const [currentNote, setCurrentNote] = useState<PitchNote>(
    () => pickPitchNote(startLevel)
  );
  const [phase, setPhase] = useState<Phase>("listening");
  const [detectedNote, setDetectedNote] = useState<DetectedNote | null>(null);
  const [correctStreak, setCorrectStreak] = useState(0);
  const [totalCorrect, setTotalCorrect] = useState(0);
  const [totalAnswered, setTotalAnswered] = useState(0);
  const [maxLevel, setMaxLevel] = useState<DifficultyLevel>(startLevel);
  const [lastResult, setLastResult] = useState<"correct" | "wrong" | null>(null);
  const [isDone, setIsDone] = useState(false);
  const [saving, setSaving] = useState(false);
  const [micError, setMicError] = useState<"DENIED" | "UNSUPPORTED" | null>(null);
  const [noSoundHint, setNoSoundHint] = useState(false);

  // ── Mutable refs (read inside RAF loop without stale closure) ─────────────
  const rafRef = useRef<number>(0);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const isDoneRef = useRef(false);
  const phaseRef = useRef<Phase>("listening");
  const currentNoteRef = useRef<PitchNote>(currentNote);
  const levelRef = useRef<DifficultyLevel>(startLevel);
  const correctStreakRef = useRef(0);
  const wrongStreakRef = useRef(0);
  const stableStartRef = useRef<number | null>(null);
  const roundStartRef = useRef<number>(Date.now());
  const streamRef = useRef<MediaStream | null>(null);
  const noSoundTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const feedbackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Keep refs in sync with state
  useEffect(() => { phaseRef.current = phase; }, [phase]);
  useEffect(() => { levelRef.current = level; }, [level]);
  useEffect(() => { currentNoteRef.current = currentNote; }, [currentNote]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cancelAnimationFrame(rafRef.current);
      streamRef.current?.getTracks().forEach((t) => t.stop());
      if (noSoundTimerRef.current) clearTimeout(noSoundTimerRef.current);
      if (feedbackTimerRef.current) clearTimeout(feedbackTimerRef.current);
    };
  }, []);

  // ── No-sound hint timer ────────────────────────────────────────────────────
  const resetNoSoundTimer = useCallback(() => {
    if (noSoundTimerRef.current) clearTimeout(noSoundTimerRef.current);
    setNoSoundHint(false);
    noSoundTimerRef.current = setTimeout(() => {
      if (phaseRef.current === "listening") setNoSoundHint(true);
    }, 5000);
  }, []);

  // ── Advance to next note ──────────────────────────────────────────────────
  const advanceToNextNote = useCallback(
    (newLevel: DifficultyLevel, prevNoteName: string) => {
      const next = pickPitchNote(newLevel, prevNoteName);
      setCurrentNote(next);
      currentNoteRef.current = next;
      setDetectedNote(null);
      stableStartRef.current = null;
      roundStartRef.current = Date.now();
      setPhase("listening");
      phaseRef.current = "listening";
      resetNoSoundTimer();
    },
    [resetNoSoundTimer]
  );

  // ── Handle result (called from RAF loop) ─────────────────────────────────
  // Stored in ref so it is always current without restarting the loop
  const handleResultRef = useRef<((isCorrect: boolean) => void) | null>(null);
  handleResultRef.current = (isCorrect: boolean) => {
    if (phaseRef.current !== "listening" || isDoneRef.current) return;

    const prevNoteName = currentNoteRef.current.noteName;
    setTotalAnswered((t) => t + 1);
    if (isCorrect) setTotalCorrect((c) => c + 1);
    setLastResult(isCorrect ? "correct" : "wrong");
    setPhase("feedback");
    phaseRef.current = "feedback";
    stableStartRef.current = null;

    // Adaptive difficulty
    let newLevel = levelRef.current;
    if (isCorrect) {
      const newStreak = correctStreakRef.current + 1;
      correctStreakRef.current = newStreak;
      setCorrectStreak(newStreak);
      wrongStreakRef.current = 0;
      if (newStreak >= 3 && levelRef.current < 3) {
        newLevel = clampLevel(levelRef.current + 1);
        levelRef.current = newLevel;
        setLevel(newLevel);
        setMaxLevel((m) => clampLevel(Math.max(m, newLevel)));
        correctStreakRef.current = 0;
        setCorrectStreak(0);
      }
    } else {
      const newStreak = wrongStreakRef.current + 1;
      wrongStreakRef.current = newStreak;
      correctStreakRef.current = 0;
      setCorrectStreak(0);
      if (newStreak >= 2 && levelRef.current > 1) {
        newLevel = clampLevel(levelRef.current - 1);
        levelRef.current = newLevel;
        setLevel(newLevel);
        wrongStreakRef.current = 0;
      }
    }

    if (noSoundTimerRef.current) clearTimeout(noSoundTimerRef.current);
    setNoSoundHint(false);

    // Advance after 1.5 s feedback
    feedbackTimerRef.current = setTimeout(() => {
      if (!isDoneRef.current) advanceToNextNote(newLevel, prevNoteName);
    }, 1500);
  };

  // ── Mic setup + detection loop ────────────────────────────────────────────
  // Runs once on mount. The RAF loop inside reads mutable values via refs.
  useEffect(() => {
    if (!navigator.mediaDevices?.getUserMedia) {
      setMicError("UNSUPPORTED");
      return;
    }

    let cancelled = false;

    navigator.mediaDevices
      .getUserMedia({ audio: true, video: false })
      .then((stream) => {
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;

        const audioCtx = new AudioContext();
        audioCtxRef.current = audioCtx;
        const analyser = audioCtx.createAnalyser();
        analyser.fftSize = 4096;
        audioCtx.createMediaStreamSource(stream).connect(analyser);

        const buffer = new Float32Array(analyser.fftSize);

        const loop = () => {
          analyser.getFloatTimeDomainData(buffer);
          const hz = detectPitch(buffer, audioCtx.sampleRate);
          const note = hz ? frequencyToNote(hz) : null;

          // Update meter display
          setDetectedNote(note);

          // Evaluation only during listening phase
          if (phaseRef.current === "listening" && !isDoneRef.current) {
            if (note?.name === currentNoteRef.current.noteName) {
              // Correct note — start/continue stable timer
              if (stableStartRef.current === null) {
                stableStartRef.current = Date.now();
              }
              if (Date.now() - stableStartRef.current >= 2000) {
                handleResultRef.current?.(true);
              }
            } else {
              // Wrong note or silence — reset stable timer
              stableStartRef.current = null;
              // Timeout: 6s without correct pitch = wrong
              if (Date.now() - roundStartRef.current > 6000) {
                handleResultRef.current?.(false);
              }
            }
          }

          rafRef.current = requestAnimationFrame(loop);
        };

        rafRef.current = requestAnimationFrame(loop);
        resetNoSoundTimer();
      })
      .catch(() => {
        if (!cancelled) setMicError("DENIED");
      });

    return () => {
      cancelled = true;
      cancelAnimationFrame(rafRef.current);
      streamRef.current?.getTracks().forEach((t) => t.stop());
      if (noSoundTimerRef.current) clearTimeout(noSoundTimerRef.current);
      audioCtxRef.current?.close().catch(() => {});
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Finish handler ────────────────────────────────────────────────────────
  const handleFinish = useCallback(async () => {
    isDoneRef.current = true;
    cancelAnimationFrame(rafRef.current);
    if (feedbackTimerRef.current) clearTimeout(feedbackTimerRef.current);
    if (noSoundTimerRef.current) clearTimeout(noSoundTimerRef.current);
    streamRef.current?.getTracks().forEach((t) => t.stop());

    setSaving(true);
    const score =
      totalAnswered > 0 ? Math.round((totalCorrect / totalAnswered) * 100) : 0;
    const supabase = createClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any).from("assessments").insert({
      student_id: studentId,
      type: "pitch",
      score,
      max_level: maxLevel,
      total_correct: totalCorrect,
      total_answered: totalAnswered,
    });
    if (error) console.error("Failed to save pitch assessment:", error);
    setSaving(false);
    setIsDone(true);
  }, [studentId, totalCorrect, totalAnswered, maxLevel]);

  const score =
    totalAnswered > 0 ? Math.round((totalCorrect / totalAnswered) * 100) : 0;

  // ── Error screen ──────────────────────────────────────────────────────────
  if (micError) {
    return (
      <div className="flex flex-col items-center gap-6 py-12 px-6 text-center">
        <p className="text-5xl">🎤</p>
        <p className="font-bold text-brand-text text-lg leading-relaxed">
          {micError === "DENIED"
            ? "המיקרופון חסום — אפשרי גישה בהגדרות הדפדפן"
            : "הדפדפן לא תומך במיקרופון — נסי ב-Chrome"}
        </p>
        <a
          href="/practice"
          className="bg-brand-teal text-white font-bold py-3 px-8 rounded-2xl"
        >
          חזרה לתרגול
        </a>
      </div>
    );
  }

  // ── Result screen ─────────────────────────────────────────────────────────
  if (isDone) {
    return (
      <div className="flex flex-col items-center gap-6 py-8 px-4">
        <ViolinMascot
          mood={score >= 70 ? "excited" : "encouraging"}
          size={100}
          message={scoreLabel(score)}
        />
        <div className="bg-white rounded-2xl border border-brand-border p-6 w-full text-center shadow-sm">
          <p className="text-4xl font-extrabold text-brand-teal">{score}%</p>
          <p className="text-sm text-brand-muted mt-1">
            {totalCorrect} נכון מתוך {totalAnswered}
          </p>
          <p className="text-sm text-brand-muted">רמה מקסימלית: {maxLevel}</p>
        </div>
        <a
          href="/practice"
          className="w-full bg-brand-teal text-white font-bold py-3 rounded-2xl text-center block"
        >
          חזרה לתרגול
        </a>
      </div>
    );
  }

  // ── Quiz screen ───────────────────────────────────────────────────────────
  const mascotMood =
    lastResult === "correct"
      ? "happy"
      : lastResult === "wrong"
      ? "encouraging"
      : "thinking";

  return (
    <div className="flex flex-col gap-4 px-4 py-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={handleFinish}
          disabled={saving || phase === "feedback"}
          className="text-sm text-brand-muted border border-brand-border rounded-xl px-3 py-1.5 disabled:opacity-40"
        >
          {saving ? "שומר..." : "סיום מבחן"}
        </button>
        <div className="text-center">
          <p className="text-xs text-brand-muted">רמה</p>
          <p className="font-bold text-brand-text">{LEVEL_LABELS[level]}</p>
        </div>
        <div className="text-center">
          <p className="text-xs text-brand-muted">ניקוד</p>
          <p className="font-bold text-brand-teal">
            {totalCorrect}/{totalAnswered}
          </p>
        </div>
      </div>

      {/* Streak dots */}
      <div className="flex justify-center gap-2">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className={`w-3 h-3 rounded-full transition-all ${
              i < correctStreak ? "bg-brand-teal scale-110" : "bg-brand-border"
            }`}
          />
        ))}
      </div>

      {/* Note display */}
      <div className="bg-white rounded-2xl border-2 border-brand-border p-4 shadow-sm">
        <p className="text-center text-xs text-brand-muted mb-2">שיר/נגן את התו:</p>
        {/* Note name — dir="ltr" so Hebrew + letter display in correct RTL visual order */}
        <div
          className="flex items-baseline justify-center gap-2 mb-3"
          dir="ltr"
        >
          <span className="text-lg text-brand-muted">{currentNote.noteName}4</span>
          <span className="text-4xl font-black text-brand-text">
            {currentNote.hebrewName}
          </span>
        </div>
        {/* Musical staff rendered by abcjs */}
        <StaffDisplay abcSymbol={currentNote.abcSymbol} />
      </div>

      {/* Pitch meter (listening) or feedback (result) */}
      {phase === "listening" ? (
        <PitchMeter detectedNote={detectedNote} isListening={true} />
      ) : (
        <div className="flex flex-col items-center gap-3 py-8">
          <p className="text-5xl">{lastResult === "correct" ? "✅" : "❌"}</p>
          <p className="font-bold text-brand-text text-lg">
            {lastResult === "correct" ? "כל הכבוד! 🎵" : "לא מדויק, נסי שוב 💪"}
          </p>
        </div>
      )}

      {/* No-sound hint */}
      {noSoundHint && phase === "listening" && (
        <p className="text-center text-sm text-brand-muted animate-pulse">
          לא שומע... נסי לנגן יותר חזק 🎻
        </p>
      )}

      {/* Mascot */}
      <div className="flex justify-center mt-1">
        <ViolinMascot mood={mascotMood} size={80} />
      </div>
    </div>
  );
}
