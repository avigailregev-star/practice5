"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import ViolinMascot from "@/components/shared/ViolinMascot";
import RhythmDisplay from "./RhythmDisplay";
import {
  DifficultyLevel,
  RhythmPattern,
  pickPattern,
} from "@/lib/rhythms";
import { scoreLabel } from "@/lib/notes";

type Phase = "preview" | "countdown" | "playing" | "feedback";

interface Props {
  studentId: string;
  initialLevel: DifficultyLevel;
}

function clampLevel(l: number): DifficultyLevel {
  return Math.max(1, Math.min(3, l)) as DifficultyLevel;
}

const LEVEL_LABELS: Record<DifficultyLevel, string> = {
  1: "קל",
  2: "בינוני",
  3: "קשה",
};

export default function RhythmAssessment({ studentId, initialLevel }: Props) {
  const startLevel = clampLevel(initialLevel);

  const [level, setLevel] = useState<DifficultyLevel>(startLevel);
  const [pattern, setPattern] = useState<RhythmPattern>(() => pickPattern(startLevel));
  const [phase, setPhase] = useState<Phase>("preview");
  const [countdown, setCountdown] = useState(3);
  const [correctStreak, setCorrectStreak] = useState(0);
  const [wrongStreak, setWrongStreak] = useState(0);
  const [totalHits, setTotalHits] = useState(0);
  const [totalTappable, setTotalTappable] = useState(0);
  const [maxLevel, setMaxLevel] = useState<DifficultyLevel>(startLevel);
  const [lastResult, setLastResult] = useState<"correct" | "wrong" | null>(null);
  const [isDone, setIsDone] = useState(false);
  const [saving, setSaving] = useState(false);

  // Track all pending timers so we can clear them on unmount or on re-sequence
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const isDoneRef = useRef(false);

  const clearAllTimers = useCallback(() => {
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];
  }, []);

  // Cleanup all timers on unmount
  useEffect(() => {
    return () => {
      clearAllTimers();
    };
  }, [clearAllTimers]);

  const runCountdown = useCallback(() => {
    clearAllTimers();
    setPhase("preview");
    timersRef.current.push(setTimeout(() => {
      if (!isDoneRef.current) {
        setPhase("countdown");
        setCountdown(3);
        timersRef.current.push(setTimeout(() => { if (!isDoneRef.current) setCountdown(2); }, 1000));
        timersRef.current.push(setTimeout(() => { if (!isDoneRef.current) setCountdown(1); }, 2000));
        timersRef.current.push(setTimeout(() => { if (!isDoneRef.current) setPhase("playing"); }, 3000));
      }
    }, 2500));
  }, [clearAllTimers]);

  // Start countdown on mount
  useEffect(() => {
    runCountdown();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleComplete = useCallback(
    (hits: boolean[]) => {
      if (isDoneRef.current) return;
      const tappableIndices = pattern.beats
        .map((b, i) => (b.tappable ? i : -1))
        .filter((i) => i !== -1);
      const tappable = tappableIndices.length;
      const patHits = tappableIndices.filter((i) => hits[i]).length;
      const isCorrect = tappable === 0 || patHits / tappable >= 0.75;

      setTotalHits((h) => h + patHits);
      setTotalTappable((t) => t + tappable);
      setLastResult(isCorrect ? "correct" : "wrong");
      setPhase("feedback");

      let newLevel = level;
      if (isCorrect) {
        const newStreak = correctStreak + 1;
        setCorrectStreak(newStreak);
        setWrongStreak(0);
        if (newStreak >= 3 && level < 3) {
          newLevel = clampLevel(level + 1);
          setLevel(newLevel);
          setMaxLevel((m) => clampLevel(Math.max(m, newLevel)));
          setCorrectStreak(0);
        }
      } else {
        const newWrongStreak = wrongStreak + 1;
        setWrongStreak(newWrongStreak);
        setCorrectStreak(0);
        if (newWrongStreak >= 2 && level > 1) {
          newLevel = clampLevel(level - 1);
          setLevel(newLevel);
          setWrongStreak(0);
        }
      }

      const prevId = pattern.id;
      const t = setTimeout(() => {
        if (!isDoneRef.current) {
          setPattern(pickPattern(newLevel, prevId));
          runCountdown();
        }
      }, 1500);
      timersRef.current.push(t);
    },
    [pattern, level, correctStreak, wrongStreak, runCountdown]
  );

  const handleFinish = useCallback(async () => {
    // Cancel any pending timers to prevent state updates after finish
    clearAllTimers();
    isDoneRef.current = true;
    setSaving(true);
    const score =
      totalTappable > 0 ? Math.round((totalHits / totalTappable) * 100) : 0;
    const supabase = createClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any).from("assessments").insert({
      student_id: studentId,
      type: "rhythm",
      score,
      max_level: maxLevel,
      total_correct: totalHits,
      total_answered: totalTappable,
    });
    if (error) console.error("Failed to save rhythm assessment:", error);
    setSaving(false);
    setIsDone(true);
  }, [studentId, totalHits, totalTappable, maxLevel, clearAllTimers]);

  const score =
    totalTappable > 0 ? Math.round((totalHits / totalTappable) * 100) : 0;

  // ── Result screen ────────────────────────────────────────
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
            {totalHits} הקשות נכונות מתוך {totalTappable}
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

  // ── Quiz screen ──────────────────────────────────────────
  const mascotMood =
    lastResult === "correct" ? "happy"
    : lastResult === "wrong" ? "encouraging"
    : "thinking";

  return (
    <div className="flex flex-col gap-4 px-4 py-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={handleFinish}
          disabled={saving || phase === "playing" || phase === "feedback"}
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
            {totalHits}/{totalTappable}
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

      {/* Beat track — shown during preview, countdown, and playing */}
      {(phase === "preview" || phase === "countdown" || phase === "playing") && (
        <div className="relative">
          <RhythmDisplay
            pattern={pattern}
            level={level}
            onComplete={handleComplete}
            preview={phase !== "playing"}
          />
          {/* Countdown overlay */}
          {phase === "countdown" && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none" style={{ zIndex: 10 }}>
              <div className="bg-white/80 rounded-2xl px-8 py-4 shadow-lg backdrop-blur-sm">
                <p className="text-7xl font-extrabold text-brand-teal leading-none">{countdown}</p>
              </div>
            </div>
          )}
          {/* Preview label */}
          {phase === "preview" && (
            <div className="absolute inset-x-0 bottom-16 flex justify-center pointer-events-none">
              <p className="text-sm font-semibold text-brand-teal bg-white/90 px-3 py-1 rounded-full shadow">
                הסתכלי על תבנית המקצב 👀
              </p>
            </div>
          )}
        </div>
      )}

      {/* Feedback */}
      {phase === "feedback" && (
        <div className="flex flex-col items-center gap-3 py-10">
          <p className="text-5xl">{lastResult === "correct" ? "✅" : "❌"}</p>
          <p className="font-bold text-brand-text text-lg">
            {lastResult === "correct" ? "כל הכבוד! ⭐" : "נסה שוב 💪"}
          </p>
        </div>
      )}

      {/* Mascot */}
      <div className="flex justify-center mt-2">
        <ViolinMascot mood={mascotMood} size={80} />
      </div>
    </div>
  );
}
